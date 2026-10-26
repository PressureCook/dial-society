// One Rapa Nui run for the analysis: every numeric metric every generation, plus a few counts read off the board.
const fs = require('fs');
const S = require('./v54.js'), check = require('./ftcheck.js')(S);
const seed = +process.argv[2], G = +process.argv[3], mode = process.argv[4], out = process.argv[5];
const P = Object.assign({}, S.DEFAULTS); P.self = true;
const sim = S.createSim(seed, S.SLOT_START, P, mode, 'rapanui'); const viol = []; const rows = []; const t0 = Date.now();
const num = m => { const o = {}; for (const k in m) if (typeof m[k] === 'number' && isFinite(m[k])) o[k] = m[k]; return o; };
const extra = () => { const p = sim.pop; let n = 0, sq = 0, mv = 0, mvU = 0, mvD = 0, kn = 0, iv = 0, w = 0, qn = 0, qe = 0, low = 0; const tk = [0, 0, 0, 0, 0], cs = {};
  for (let i = 0; i < sim.n; i++) if (!p.dead[i]) { n++; sq += p.sq[i] ? 1 : 0; mv += p.mv[i]; if (p.mv[i] > 0.05) mvU++; if (p.mv[i] < -0.05) mvD++; kn += (sim.knowR[p.id[i]] || []).length; iv += p.iv[i]; w += p.w[i]; qn += p.qn[i]; qe += p.qe[i]; tk[p.tk[i] | 0]++; cs[p.cm[i]] = (cs[p.cm[i]] || 0) + 1; }
  const sizes = Object.entries(cs).filter(([c]) => c !== '0').map(([, v]) => v).sort((a, b) => b - a);
  return { n, seaKnow: sq / Math.max(1, n), mvAvg: mv / Math.max(1, n), mvUp: mvU / Math.max(1, n), mvDown: mvD / Math.max(1, n), knowAvg: kn / Math.max(1, n), ivAvg: iv / Math.max(1, n), wSum: w, qn: qn / Math.max(1, n), qe: qe / Math.max(1, n),
    tk: tk.map(x => x / Math.max(1, n)), noComm: (cs[0] || 0) / Math.max(1, n), biggest: sizes[0] || 0, second: sizes[1] || 0, nComm: sizes.length, sites: sim.sites.length, made: sim.made || 0, deaths: sim.deaths || 0, executed: sim.executed || 0 }; };
rows.push(Object.assign({ g: 0 }, num(sim.history[0]), extra()));
for (let g = 1; g <= G; g++) { const m = S.stepSim(sim, P); check(sim, P, m, g, viol); rows.push(Object.assign({ g }, num(m), extra())); if (m.pop === 0) break; }
fs.writeFileSync(out, JSON.stringify({ seed, mode, G, secs: Math.round((Date.now() - t0) / 1000), viol: viol.length, violSample: viol.slice(0, 5), rows }));
console.log(seed, mode, 'done', rows.length - 1, 'gens', viol.length, 'violations', Math.round((Date.now() - t0) / 1000) + 's');
