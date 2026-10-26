// One society, run to the end, every rule checked every generation.
// node runner.js <json spec>   spec: { seed, gens, mode, geo, params, out, progress }
const fs = require('fs'), path = require('path');
const spec = JSON.parse(process.argv[2]);
const S = require(path.join(__dirname, 'engine', 'core.js')), check = require(path.join(__dirname, 'engine', 'checks.js'))(S);
const P = Object.assign({}, S.DEFAULTS, spec.params || {}); P.self = true;
const geo = spec.geo === 'square' ? undefined : (spec.geo || 'rapanui');
const sim = S.createSim(spec.seed, S.SLOT_START, P, spec.mode || 'none', geo);
const viol = [], rows = [], t0 = Date.now();
const num = m => { const o = {}; for (const k in m) if (typeof m[k] === 'number' && isFinite(m[k])) o[k] = m[k]; return o; };
function extra() {
  const p = sim.pop; let n = 0, sq = 0, mv = 0, kn = 0, qn = 0, qe = 0; const tk = [0, 0, 0, 0, 0, 0], cs = {};
  for (let i = 0; i < sim.n; i++) if (!p.dead[i]) { n++; sq += p.sq[i] ? 1 : 0; mv += p.mv[i]; kn += ((sim.knowR || {})[p.id[i]] || []).length; qn += p.qn[i]; qe += p.qe[i]; tk[p.tk[i] | 0]++; cs[p.cm[i]] = (cs[p.cm[i]] || 0) + 1; }
  const sizes = Object.entries(cs).filter(([c]) => c !== '0').map(([, v]) => v).sort((a, b) => b - a), d = Math.max(1, n);
  return { alive: n, seaKnow: sq / d, moveAvg: mv / d, knowAvg: kn / d, investChoice: qn / d, actOnFeeling: qe / d, chooseLife: tk[0] / d, chooseWeapon: tk[1] / d, chooseEither: tk[2] / d, chooseSea: tk[3] / d, chooseNone: tk[4] / d, chooseReach: tk[5] / d,
    noCommunity: (cs[0] || 0) / d, biggestComm: sizes[0] || 0, secondComm: sizes[1] || 0, nComm: sizes.length, sites: sim.sites.length, madeNow: sim.made || 0 };
}
function save(done) {
  fs.writeFileSync(spec.out, JSON.stringify({ spec, done, gensRun: rows.length - 1, secs: Math.round((Date.now() - t0) / 1000), violations: viol.length, violationSample: viol.slice(0, 10), rows }));
}
rows.push(Object.assign(num(sim.history[0]), extra()));
for (let g = 1; g <= spec.gens; g++) {
  const m = S.stepSim(sim, P); check(sim, P, m, g, viol);
  rows.push(Object.assign(num(m), extra()));
  fs.writeFileSync(spec.progress, JSON.stringify({ gen: g, of: spec.gens, pop: m.pop, violations: viol.length }));
  if (g % 25 === 0) save(false);                                  // a long run keeps what it has so far
  if (m.pop === 0) break;
}
save(true);
