// The checks that must hold after every generation. Used by the engine test (ft.js) and by the behaviour panel.
module.exports = function (S) {
function check(sim, P, m, gen, viol) {
  const p = sim.pop, n = sim.n, N = sim.nc;
  if (sim.R.length !== N || sim.C.length !== N || sim.span.length !== N || sim.ST.length !== N * N || sim.comm.length !== N) viol.push('gen ' + gen + ': tables for communities are the wrong length');
  const slot = {};
  for (let i = 0; i < n; i++) if (!p.dead[i]) slot[p.id[i]] = i;
  const bad = msg => { if (viol.length < 40) viol.push('gen ' + gen + ': ' + msg); viol.count = (viol.count || 0) + 1; };
  for (const q in m) if (typeof m[q] === 'number' && !isFinite(m[q])) bad('metric ' + q + ' is not a finite number');
  let alive = 0, pw = 0; const ids = new Set(), aliveId = new Set();
  const G = sim.geo;
  for (let i = 0; i < n; i++) {
    if (p.dead[i]) { if (p.al[i] >= 0) bad('a dead agent is still in an alliance'); continue; }
    alive++; pw += p.pw[i]; if (p.pid2[i] < -1) bad('an AI carries a mark for its second parent: ' + p.pid2[i]);   // -1 marks a child its second parent abandoned
    if (ids.has(p.id[i])) bad('two living agents share an id'); ids.add(p.id[i]); aliveId.add(String(p.id[i]));
    if (!(p.pw[i] >= 0) || !isFinite(p.pw[i])) bad('power not finite or negative');
    if (!(p.w[i] >= 0.0499) || !isFinite(p.w[i])) bad('holdings below the floor or not finite: ' + p.w[i]);
    if (p.cm[i] < 0 || p.cm[i] >= N) bad('community out of range');
    if (!(p.px[i] >= 0 && p.px[i] <= 1 && p.py[i] >= 0 && p.py[i] <= 1)) bad('position off the map');
    if (G) { const g = G.G, c = Math.min(g - 1, Math.floor(p.py[i] * g)) * g + Math.min(g - 1, Math.floor(p.px[i] * g)); if (!G.land[c]) bad('an agent lives in the sea'); }
    for (const d of ['r', 'f', 'g', 'qr', 'qf', 'qg', 'qk', 'qv', 'fs']) if (!(p[d][i] >= 0 && p[d][i] <= (d === 'qk' && sim.lifeStack ? 4.0001 : 1))) bad(d + ' out of range: ' + p[d][i]);   // children wanted has no ceiling of three from the forty fourth simulation on
    if (!(p.kc[i] > 0 && p.kc[i] <= 1.0001)) bad('child cost multiplier out of range: ' + p.kc[i]);
    if (p.lv[i] !== 0 && !(p.lv[i] > 0 && p.lv[i] <= 1.0001)) bad('leaving multiplier out of range: ' + p.lv[i]);
    if (p.age[i] < 0 || p.age[i] > 6) bad('age out of range: ' + p.age[i]);
    if (p.age[i] === 0) {                                          // a child: no dealings, and parents who were adults and not both head starts
      if (p.dec[i] > 0 || p.che[i] > 0 || p.sa[i] > 0 || p.ka[i] > 0 || p.nv[i] > 0) bad('a child took part in adult dealings');
      const a = slot[p.pid[i]], b = p.pid2[i] > 0 ? slot[p.pid2[i]] : undefined;
      if (a !== undefined && p.age[a] < 2) bad('a child has a parent who was not yet an adult for a generation: age ' + p.age[a]);
      if (b !== undefined && p.age[b] < 2) bad('a child has a second parent who was not yet an adult for a generation: age ' + p.age[b]);
      if (a !== undefined && b !== undefined && a !== b && p.hs[a] === 1 && p.hs[b] === 1) bad('a child has two parents with a head start');
      // someone with a head start cannot have a child alone. Where adults with no AI were living when it was born, one of them may have been the other parent
      if (a !== undefined && p.hs[a] === 1 && p.pid2[i] === 0 && !(sim.oth && (sim.__othGen === gen - 1 ? sim.__othAdults > 0 : sim.othStart > 0))) bad('someone with a head start had a child alone');
    }
    if (p.al[i] >= 0 && !sim.alliances[p.al[i]]) bad('member of an alliance that does not exist');
    if (!(p.iv[i] >= 0.2499) || !isFinite(p.iv[i])) bad('invention multiplier below a quarter or not finite: ' + p.iv[i]);   // inventions that turned out worse can take power, down to a quarter
    if (!isFinite(p.i0[i] + p.i1[i] + p.i2[i])) bad('what inventions add is not finite');
    if (p.iv[i] > 1.0001 + Math.max(0, p.i0[i]) + Math.max(0, p.i1[i]) + Math.max(0, p.i2[i])) bad('inventions count for more than was ever invented');
    if (!(p.sq[i] === 0 || p.sq[i] === 1) || !isFinite(p.mv[i])) bad('sea travel not known or unknown, or getting about not finite');
    for (let l = 0; l < S.LEVERS.length; l++) if (!(Math.abs(p['b' + l][i]) <= 1.0001)) bad('a remembered push outside -1 to 1: ' + p['b' + l][i]);
  }
  if (m.pop !== alive) bad('population reported ' + m.pop + ' but ' + alive + ' are alive');
  if (alive > 0 && Math.abs(pw - 1) > 1e-3) bad('power sums to ' + pw.toFixed(5));
  if (sim.n < alive || m.slots !== sim.n) bad('board size wrong');
  for (let q = 0; q < N * N; q++) if (!(sim.ST[q] >= -1.0001 && sim.ST[q] <= 1.0001)) bad('standing between communities out of range: ' + sim.ST[q]);
  for (const a in sim.AS) for (const b in sim.AS[a]) if (!(sim.AS[a][b] >= -1.0001 && sim.AS[a][b] <= 1.0001)) bad('standing between alliances out of range');
  let relN = 0, knowN = 0;
  for (const a in sim.rel) { if (!aliveId.has(a)) bad('regard kept for someone dead'); for (const b in sim.rel[a]) { relN++; const x = sim.rel[a][b]; if (!(x >= -1.0001 && x <= 1.0001)) bad('personal regard out of range'); if (!aliveId.has(b)) bad('regard kept toward someone dead'); } }
  let swN = 0;
  for (const a in sim.sway) { if (!aliveId.has(a)) bad('influence kept for someone dead'); let tot = 0; for (const b in sim.sway[a]) { swN++; const x = sim.sway[a][b]; tot += x; if (!(x >= 0 && x <= 1.0001)) bad('influence out of range: ' + x); if (!aliveId.has(b)) bad('influence kept over someone dead'); } if (Math.abs(tot - (sim.swT[a] || 0)) > 1e-3) bad('influence held does not add up'); }
  for (const a in sim.know) { if (!aliveId.has(a)) bad('acquaintance kept for someone dead'); for (const b in sim.know[a].ai) { knowN++; if (!aliveId.has(b)) bad('acquaintance with someone dead'); } for (const b in sim.know[a].al) if (!sim.alliances[b]) bad('knows an alliance that is gone'); }
  let rich = 0;
  for (const st of sim.sites) { rich += st.rich; if (!(st.type === 0 || st.type === 1 || st.type === 2)) bad('a resource place has no kind'); if (!(st.top >= st.rich - 1e-6)) bad('a place holds more than the most it has ever held'); if (!(st.rich > 0) || !isFinite(st.rich)) bad('a resource place has no richness'); if (st.claim.length !== N) bad('a place has holds for the wrong number of communities'); for (let c = 0; c < N; c++) if (!(st.claim[c] >= 0) || !isFinite(st.claim[c])) bad('a hold on land is negative or not finite'); }
  if (alive > 0) {
    const reach = S.reach(sim, p); let rs = reach.oth || 0; for (let c = 0; c < N; c++) rs += reach.all[c];
    let rt = reach.tO ? reach.tO[0] + reach.tO[1] + reach.tO[2] : 0; for (let k = 0; k < 3; k++) for (let c = 0; c < N; c++) rt += reach.t[k][c];
    if (Math.abs(rt - rs) > 1e-3 * rich) bad('land by kind does not add up to all the land');
    if (Math.abs(rs - rich) > 1e-3 * rich) bad('land shared out (' + rs.toFixed(3) + ') does not add up to the land there is (' + rich.toFixed(3) + ')');
    const K = S.carry(sim, p, P); let ks = 0; for (let c = 0; c < N; c++) ks += K[c];
    if (Math.abs(ks - m.carry) > 1e-3 * Math.max(1, ks)) bad('what the land feeds does not match the report');
    if (ks + (m.othFeed || 0) > S.DOT_MAX * 1.001) bad('the land feeds more dots than the page limit');
  }
  for (let c = 0; c < N; c++) {
    for (const L of S.LEVERS) { if (L.norm) { const x = sim.C[c][L.norm]; if (!(x >= 0 && x <= 1)) bad('community norm out of range'); } else { const x = sim.R[c][L.id]; if (!(x >= -1e-6 && x <= L.max + 1e-6)) bad('community rule ' + L.id + ' out of range: ' + x); } }
    if (!(sim.span[c] >= 1 && sim.span[c] <= 4)) bad('length of life out of range');
  }
  for (const d of ['r', 'f', 'g']) if (!(sim.E[d] >= 0 && sim.E[d] <= 1)) bad('norm out of range');
  for (const v of sim.inventions) { if (v.age > S.INV_LIFE + 1) bad('an invention outlived its time'); for (const h in v.h) if (!aliveId.has(h)) bad('an invention is held by someone dead'); }
  if (sim.lifeStack) {                                             // the rules added with the forty fourth simulation
    if (sim.lifeStack.length !== N) bad('inventions that lengthen life are kept for the wrong number of communities');
    for (let c = 0; c < N; c++) {
      if (!(sim.lifeStack[c] >= 0) || !isFinite(sim.lifeStack[c])) bad('inventions that lengthen life in use: negative or not finite');
      if (sim.lifeStack[c] > sim.stack[c] + 1e-4) bad('more inventions that lengthen life in use than inventions in use: ' + sim.lifeStack[c] + ' against ' + sim.stack[c]);
      const k = sim.comm[c];
      if (k && k.n) {
        if (!(k.childDie > 0 && k.childDie <= 0.4501)) bad('share of children who die young out of range: ' + k.childDie);
        if (!(k.pool >= 1 && k.pool <= 2.2001)) bad('community bonus out of range: ' + k.pool);
        if (c === 0 && k.pool !== 1) bad('people with no community have a community bonus');
      }
    }
    if (!(m.kidsDied >= 0 && m.kidsDied <= 1)) bad('share of children who died young out of range: ' + m.kidsDied);
    if (!(m.rough >= 0.9999 && m.rough <= 5.0001)) bad('what the ground added to trips is out of range: ' + m.rough);
    if ((!G || !G.terr) && Math.abs(m.rough - 1) > 1e-9) bad('a map with no terrain made trips dearer');
    if (G && G.terr && gen === 1) for (let q = 0; q < G.G * G.G; q++) { if (!(G.terr[q] >= 1 && G.terr[q] <= 5.0001)) { bad('terrain cost out of range'); break; } if (!G.land[q] && G.terr[q] !== 1) { bad('the sea has a terrain cost'); break; } }
  }
  if (sim.oth) {                                                   // the people with no AI, added with the forty fifth simulation
    const O = sim.oth; let kids = 0;
    if (!(O.n >= 0) || O.x.length !== O.n || O.y.length !== O.n || O.age.length !== O.n) bad('the people with no AI are kept in lists of the wrong length');
    for (let i = 0; i < O.n; i++) {
      if (!(O.x[i] >= 0 && O.x[i] <= 1 && O.y[i] >= 0 && O.y[i] <= 1)) bad('someone with no AI is off the map');
      if (G) { const g = G.G, c = Math.min(g - 1, Math.floor(O.y[i] * g)) * g + Math.min(g - 1, Math.floor(O.x[i] * g)); if (!G.land[c]) bad('someone with no AI lives in the sea'); }
      if (!(O.age[i] >= 0 && O.age[i] <= S.OTH_SPAN)) bad('age of someone with no AI out of range: ' + O.age[i]);
      if (O.age[i] === 0) kids++;
    }
    if (m.others !== O.n) bad('people with no AI reported ' + m.others + ' but there are ' + O.n);
    if (m.othKids !== kids) bad('children with no AI reported ' + m.othKids + ' but there are ' + kids);
    if (sim.__oth !== undefined && sim.__othGen === gen - 1) {    // nobody appears or disappears unaccounted for
      const want = sim.__oth - m.othOld + m.othBorn - m.othStarved - m.othKidsDead;
      if (want !== O.n) bad('people with no AI do not add up: ' + sim.__oth + ' less ' + m.othOld + ' old, plus ' + m.othBorn + ' born, less ' + m.othStarved + ' starved and ' + m.othKidsDead + ' children, leaves ' + want + ', not ' + O.n);
      if (m.othBorn > sim.__othAdults * Math.ceil(S.OTH_BIRTHS)) bad('more children with no AI than their parents could have: ' + m.othBorn);
      if (m.othBorn + m.othUnborn > sim.__othAdults * Math.ceil(S.OTH_BIRTHS)) bad('the people with no AI had more children than each is allowed');
    }
    sim.__oth = O.n; sim.__othGen = gen; sim.__othAdults = O.n - kids;
    for (const q of ['half', 'halfBorn', 'loneBorn']) if (q in m) bad('the report counts children of an AI and someone with no AI apart: ' + q);
    if (!(m.othLand >= 0 && m.othLand <= 1.0001)) bad('share of the land held by people with no AI out of range: ' + m.othLand);
    if (!(m.othFeed >= 0) || !isFinite(m.othFeed)) bad('what the land of the people with no AI feeds is negative or not finite');
    if (O.n === 0 && (m.othFeed !== 0 || m.othKids !== 0)) bad('nobody with no AI is left but something is still reported for them');
    if (sim.othStart === 0 && (O.n !== 0 || m.othLand !== 0 || m.othBorn !== 0 || m.othFeed !== 0)) bad('a world that started with nobody without AI has some trace of them');
    if (O.n > 0 && m.othKidsDead > 0 && sim.othKids0 === 0) bad('children with no AI died where there were none');
  }
  return { relN: relN, knowN: knowN, alive: alive };
}

  return check;
};
