#!/usr/bin/env node
// Dial Society connector: lets Claude run and read the simulation on this computer.
// A small MCP server over stdio with no dependencies. The Claude desktop app starts it; see README.md.
const fs = require('fs'), path = require('path'), os = require('os'), { spawn } = require('child_process');
const HOME = __dirname, BATCHES = path.join(HOME, 'batches'), PAGE = path.join(HOME, 'Dial Society.html');
fs.mkdirSync(BATCHES, { recursive: true });

const DEFAULT_KEYS = ['pop', 'nComm', 'biggestComm', 'others', 'killed', 'cheat', 'span', 'tech', 'starved', 'kidsDied', 'liveDied', 'Er', 'Ef', 'Eg', 'seaKnow', 'knowAvg', 'actOnFeeling', 'investChoice', 'barterSway', 'barterInv', 'prodSpent'];
const GENS = [0, 1, 3, 5, 10, 15, 20, 30, 40, 50, 75, 100, 150, 200, 300];

function batchDirs() { return fs.readdirSync(BATCHES).filter(d => fs.existsSync(path.join(BATCHES, d, 'plan.json'))).sort(); }
function readJSON(f) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return null; } }
function alive(pid) { try { process.kill(pid, 0); return true; } catch (e) { return false; } }
function resolveBatch(b) { const all = batchDirs(); if (!all.length) throw new Error('No batches yet. Start one with start_batch.'); if (!b) return all[all.length - 1]; const hit = all.filter(d => d === b || d.includes(b)); if (!hit.length) throw new Error('No batch matches "' + b + '". Batches: ' + all.join(', ')); return hit[hit.length - 1]; }
function runsOf(b) { const d = path.join(BATCHES, b); return fs.readdirSync(d).filter(f => f.endsWith('.json') && f !== 'plan.json' && f !== 'status.json').map(f => readJSON(path.join(d, f))).filter(Boolean); }
const med = v => { const s = v.slice().sort((a, b) => a - b), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const fmt = x => Math.abs(x) >= 20 ? String(Math.round(x)) : (+x).toFixed(3);

const tools = {
  start_batch: {
    description: 'Start a batch of Dial Society runs on this computer, as many at once as it has cores to spare. Runs carry on in the background even if Claude closes. Returns the batch id at once; use batch_status to follow it.',
    inputSchema: { type: 'object', properties: {
      label: { type: 'string', description: 'Short name for the batch' },
      seeds: { type: 'array', items: { type: 'integer' }, description: 'Seeds to run. Or give count instead.' },
      count: { type: 'integer', description: 'Number of runs, with seeds 1..count plus first_seed' },
      first_seed: { type: 'integer' },
      gens: { type: 'integer', description: 'Generations per run (default 50)' },
      mode: { type: 'string', description: "'none' (the page's start, no norms) or 'norms'" },
      modes: { type: 'array', items: { type: 'string' }, description: 'Run every seed under each of these modes' },
      geo: { type: 'string', description: "'rapanui' (default), 'world', 'africa', 'europe' or 'square'" },
      params: { type: 'object', description: 'Settings to override, as on the page (e.g. {"supply":0.8,"others":0})' },
      workers: { type: 'integer', description: 'How many runs at once (default: cores minus one)' } } },
    run(a) {
      const seeds = a.seeds && a.seeds.length ? a.seeds : Array.from({ length: a.count || 8 }, (_, k) => (a.first_seed || 1000) + k);
      const modes = a.modes && a.modes.length ? a.modes : [a.mode || 'none'], gens = a.gens || 50, geo = a.geo || 'rapanui';
      const id = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15) + '-' + (a.label || geo + '-' + modes.join('+')).replace(/[^a-zA-Z0-9+_-]/g, '_').slice(0, 40);
      const dir = path.join(BATCHES, id); fs.mkdirSync(dir, { recursive: true });
      const runs = []; for (const m of modes) for (const s of seeds) runs.push({ name: m + '_' + s, seed: s, gens, mode: m, geo, params: a.params || {} });
      fs.writeFileSync(path.join(dir, 'plan.json'), JSON.stringify({ label: a.label || '', runs, workers: a.workers }, null, 1));
      const ch = spawn(process.execPath, [path.join(HOME, 'batch.js'), dir], { detached: true, stdio: 'ignore' }); ch.unref();
      const w = Math.min(a.workers || os.cpus().length - 1, runs.length);
      return `Started batch ${id}: ${runs.length} runs of ${gens} generations on ${geo} (${modes.join(', ')}), ${w} at a time on ${os.cpus().length} cores. Results go to ${dir}.`;
    } },
  batch_status: {
    description: 'Progress of a batch (the latest if none is named): which runs are done, which are running and at what generation, and any failures or broken rules.',
    inputSchema: { type: 'object', properties: { batch: { type: 'string' } } },
    run(a) {
      const b = resolveBatch(a.batch), st = readJSON(path.join(BATCHES, b, 'status.json'));
      if (!st) return `Batch ${b} has not started writing status yet.`;
      const running = Object.entries(st.running).map(([n, r]) => `${n} gen ${r.gen}/${r.of}${r.violations ? ' (' + r.violations + ' broken rules)' : ''}`);
      const viol = runsOf(b).filter(r => r.violations).map(r => `${r.spec.mode}_${r.spec.seed}: ${r.violations} broken rules, e.g. ${r.violationSample[0]}`);
      return [`Batch ${b}: ${st.done.length} of ${st.total} done, ${st.failed.length} failed, ${st.workers} at a time.` + (st.ended ? ' Finished ' + st.ended + '.' : alive(st.pid) ? ' Still running.' : ' The batch process is no longer running.'),
        running.length ? 'Running: ' + running.join('; ') : '', st.queued.length ? 'Waiting: ' + st.queued.length : '',
        st.failed.length ? 'Failed: ' + st.failed.map(f => f.name + ': ' + f.error.split('\n').slice(-3).join(' ')).join(' | ') : '', viol.join('\n')].filter(Boolean).join('\n');
    } },
  list_batches: {
    description: 'List the batches run on this computer, newest last.',
    inputSchema: { type: 'object', properties: {} },
    run() { const all = batchDirs(); if (!all.length) return 'No batches yet.'; return all.map(b => { const st = readJSON(path.join(BATCHES, b, 'status.json')) || {}; const p = readJSON(path.join(BATCHES, b, 'plan.json')); return `${b}: ${(st.done || []).length}/${p.runs.length} done, ${p.runs[0].gens} gens, ${p.runs[0].geo}, ${[...new Set(p.runs.map(r => r.mode))].join('+')}${st.ended ? '' : ' (running)'}`; }).join('\n'); } },
  summarize: {
    description: 'Summarize one or more batches: for each mode, the median and range across runs of each metric at chosen generations, plus each run\'s end state averaged over its last 10 generations. Works on finished runs and on runs still going (up to where they are).',
    inputSchema: { type: 'object', properties: { batches: { type: 'array', items: { type: 'string' }, description: 'Batch ids or parts of them; the latest if empty' }, keys: { type: 'array', items: { type: 'string' } }, gens: { type: 'array', items: { type: 'integer' } }, end_keys: { type: 'array', items: { type: 'string' } } } },
    run(a) {
      const bs = (a.batches && a.batches.length ? a.batches : [null]).map(resolveBatch), keys = a.keys && a.keys.length ? a.keys : DEFAULT_KEYS;
      const runs = [].concat(...bs.map(runsOf)); if (!runs.length) return 'No finished or saved runs yet in ' + bs.join(', ');
      const out = [], groups = {};
      for (const r of runs) (groups[r.spec.mode + ' on ' + r.spec.geo] = groups[r.spec.mode + ' on ' + r.spec.geo] || []).push(r);
      for (const [gname, R] of Object.entries(groups)) {
        const maxG = Math.max(...R.map(r => r.rows.length - 1)), gens = (a.gens && a.gens.length ? a.gens : GENS).filter(g => g <= maxG);
        out.push(`== ${gname}: ${R.length} runs, generations run ${[...new Set(R.map(r => r.rows.length - 1))].join('/')}, broken rules ${R.reduce((s, r) => s + r.violations, 0)}`);
        for (const k of keys) {
          const cells = gens.map(g => { const v = R.filter(r => g < r.rows.length && typeof r.rows[g][k] === 'number').map(r => r.rows[g][k]); return v.length ? `g${g} ${fmt(med(v))} [${fmt(Math.min(...v))}..${fmt(Math.max(...v))}]` : null; }).filter(Boolean);
          if (cells.length) out.push(k.padEnd(13) + cells.join('  '));
        }
        const ek = a.end_keys && a.end_keys.length ? a.end_keys : ['pop', 'nComm', 'killed', 'cheat', 'span', 'tech', 'Er', 'Ef', 'Eg'];
        out.push('end state per run (mean of the last 10 generations): seed ' + ek.join(' '));
        for (const r of R) { const L = r.rows.slice(-10); out.push(String(r.spec.seed).padEnd(8) + ek.map(k => fmt(L.reduce((s, x) => s + (x[k] || 0), 0) / L.length)).join(' ')); }
      }
      return out.join('\n');
    } },
  run_series: {
    description: 'The generation by generation values of chosen metrics for one run in a batch.',
    inputSchema: { type: 'object', properties: { batch: { type: 'string' }, run: { type: 'string', description: "Run name like 'none_1001', or just the seed" }, keys: { type: 'array', items: { type: 'string' } }, every: { type: 'integer' } }, required: ['run'] },
    run(a) {
      const b = resolveBatch(a.batch), R = runsOf(b), r = R.find(x => x.spec.mode + '_' + x.spec.seed === a.run || String(x.spec.seed) === String(a.run));
      if (!r) return 'No saved run "' + a.run + '" in ' + b + '. Runs: ' + R.map(x => x.spec.mode + '_' + x.spec.seed).join(', ');
      const keys = a.keys && a.keys.length ? a.keys : ['pop', 'nComm', 'killed', 'cheat', 'span', 'tech'], ev = a.every || 1;
      return 'gen ' + keys.join(' ') + '\n' + r.rows.map((x, g) => g % ev ? null : g + ' ' + keys.map(k => typeof x[k] === 'number' ? fmt(x[k]) : '-').join(' ')).filter(Boolean).join('\n');
    } },
  metric_names: {
    description: 'List every metric recorded each generation, with the settings the engine uses by default and the maps it knows.',
    inputSchema: { type: 'object', properties: {} },
    run() {
      const S = require(path.join(HOME, 'engine', 'core.js')); let keys = [];
      for (const b of batchDirs().reverse()) { const R = runsOf(b); if (R.length) { keys = Object.keys(R[0].rows[0]); break; } }
      return 'Default settings: ' + JSON.stringify(S.DEFAULTS) + '\nMaps: ' + Object.keys(S.GEO).join(', ') + ', square\nModes: none, norms\nMetrics: ' + (keys.length ? keys.join(', ') : '(run a batch first to list them)');
    } },
  stop_batch: {
    description: 'Stop a running batch. Runs already finished are kept; the ones running are cut off and keep what they saved.',
    inputSchema: { type: 'object', properties: { batch: { type: 'string' } } },
    run(a) { const b = resolveBatch(a.batch), st = readJSON(path.join(BATCHES, b, 'status.json')); if (!st || !alive(st.pid)) return 'Batch ' + b + ' is not running.'; try { process.kill(-st.pid, 'SIGTERM'); } catch (e) { process.kill(st.pid, 'SIGTERM'); } return 'Stopped batch ' + b + '.'; } },
  open_page: {
    description: 'Open the Dial Society page on this computer, to watch a society play out.',
    inputSchema: { type: 'object', properties: {} },
    run() { const c = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open'; spawn(c, [PAGE], { detached: true, stdio: 'ignore' }).unref(); return 'Opened ' + PAGE; } },
};

// ---- the MCP protocol, newline-delimited JSON-RPC over stdin and stdout
function send(o) { process.stdout.write(JSON.stringify(o) + '\n'); }
function handle(msg) {
  const { id, method, params } = msg;
  if (method === 'initialize') return send({ jsonrpc: '2.0', id, result: { protocolVersion: (params && params.protocolVersion) || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'dial-society', version: '1.0.0' } } });
  if (method === 'ping') return send({ jsonrpc: '2.0', id, result: {} });
  if (method === 'tools/list') return send({ jsonrpc: '2.0', id, result: { tools: Object.entries(tools).map(([name, t]) => ({ name, description: t.description, inputSchema: t.inputSchema })) } });
  if (method === 'tools/call') {
    const t = tools[params && params.name];
    if (!t) return send({ jsonrpc: '2.0', id, error: { code: -32602, message: 'Unknown tool ' + (params && params.name) } });
    try { return send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: String(t.run(params.arguments || {})) }] } }); }
    catch (e) { return send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: 'Error: ' + e.message }], isError: true } }); }
  }
  if (id !== undefined) send({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found: ' + method } });
}
let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => { buf += d; let k; while ((k = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, k).trim(); buf = buf.slice(k + 1); if (line) { try { handle(JSON.parse(line)); } catch (e) { send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); } } } });
