// Runs a batch of societies side by side, as many at once as the computer has cores to spare, and keeps status.json up to date.
// Started detached by the connector, so it carries on if Claude or the connector closes.
const fs = require('fs'), path = require('path'), os = require('os'), { spawn } = require('child_process');
const dir = process.argv[2], plan = JSON.parse(fs.readFileSync(path.join(dir, 'plan.json'), 'utf8'));
const workers = Math.max(1, Math.min(plan.workers || os.cpus().length - 1, plan.runs.length));
const status = { label: plan.label, total: plan.runs.length, workers, started: new Date().toISOString(), ended: null, pid: process.pid, done: [], failed: [], running: {}, queued: plan.runs.map(r => r.name) };
const write = () => fs.writeFileSync(path.join(dir, 'status.json'), JSON.stringify(status, null, 1));
const queue = plan.runs.slice(); let live = 0;
function next() {
  if (!queue.length) { if (!live) { status.ended = new Date().toISOString(); write(); process.exit(0); } return; }
  const r = queue.shift(); live++;
  status.queued = queue.map(x => x.name); status.running[r.name] = { gen: 0, of: r.gens };
  const spec = Object.assign({}, r, { out: path.join(dir, r.name + '.json'), progress: path.join(dir, r.name + '.progress') });
  const ch = spawn(process.execPath, ['--max-old-space-size=2048', path.join(__dirname, 'runner.js'), JSON.stringify(spec)], { stdio: ['ignore', 'ignore', 'pipe'] });
  let err = ''; ch.stderr.on('data', d => { err += d; });
  ch.on('exit', code => {
    live--; delete status.running[r.name];
    if (code === 0) status.done.push(r.name); else status.failed.push({ name: r.name, code, error: err.slice(-800) });
    try { fs.unlinkSync(spec.progress); } catch (e) {}
    write(); next();
  });
  write();
}
setInterval(() => {
  for (const name in status.running) { try { const p = JSON.parse(fs.readFileSync(path.join(dir, name + '.progress'), 'utf8')); status.running[name] = { gen: p.gen, of: p.of, pop: p.pop, violations: p.violations }; } catch (e) {} }
  write();
}, 2000).unref();
process.on('SIGTERM', () => { status.ended = 'stopped ' + new Date().toISOString(); write(); process.exit(0); });
for (let k = 0; k < workers; k++) next();
