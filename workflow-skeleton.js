/* Loading skeleton, version 2 — "step by step" (user 2026-11-05).
   Picked with the top bar's Skeleton switch (html.skel-v2). Version 1 (the whole
   skeleton at once) needs no script and is left exactly as it was.

   The flow builds itself one node at a time, the way an admin adds steps:
   the connector draws in blue to the next node, that node fades in, the line
   settles to grey, and the next one follows. Once complete it holds, fades out
   and starts again. Node view goes left → right, Linear view top → bottom. */
(function(){
  'use strict';
  const root = document.documentElement;
  const STEP_L = 160, HOLD = 1000, FADE = 350;   // fast + smooth (user 2026-11-05: was 650 / 420)
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  const shown = el => !!el && el.getClientRects().length > 0;

  /* Node view: the order the canvas would be built in */
  function nodePlan(){
    const f = document.querySelector('.nskel .ns-flow'); if(!f) return null;
    const N = [...f.querySelectorAll('.ns-node')], P = [...f.querySelectorAll('.ns-lines .base')],
          plus = [...f.querySelectorAll('.ns-plus')], tags = [...f.querySelectorAll('.ns-tag')],
          dots = [...f.querySelectorAll('.ns-lines .dot')];
    if(N.length < 5 || P.length < 6) return null;
    P.forEach(p => p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 2 + 'px'));
    const at = (p, end) => { const q = p.getPointAtLength(end ? p.getTotalLength() : 0);
      return dots.filter(d => Math.abs(q.x - d.cx.baseVal.value) < 1 && Math.abs(q.y - d.cy.baseVal.value) < 1); };
    /* user 2026-11-05: one smooth, unbroken build — each line draws at the same speed, the node it leads to appears
       the moment the line arrives, and the next line sets off straight after (no "stop – go") */
    return { box:f, all:[...N, ...P, ...plus, ...tags, ...dots], first:[N[0]], segs:[
      /* each line: what appears as it passes (mid) and what it lands on (then) */
      [{ l:P[0], mid:[plus[0]], then:[N[1]] }],                               // trigger → IF / Else
      [{ l:P[1], mid:[tags[0]], then:[N[2]] }, { l:P[2], mid:[tags[1]], then:[N[3]] }],   // its two paths → two actions
      [{ l:P[3], mid:[plus[1]], then:[N[4]] }, { l:P[5], mid:[plus[2]], then:[] }],
      [{ l:P[4], mid:[], then:[plus[3]] }] ], at };
  }
  /* Linear view: every row, step card and Add step pill, top to bottom */
  function linearPlan(){
    const c = document.querySelector('.lskel .ls-col:not(.ls-one)'); if(!c) return null;
    return { box:c, all:[...c.querySelectorAll('.ls-row,.ls-card,.ls-add')] };
  }

  function reset(plans){
    plans.forEach(p => {
      p.box.classList.add('sk-reset');
      p.box.classList.remove('skel-fade', 'is-drawing');
      p.all.forEach(el => el.classList.remove('is-on', 'is-live'));
      p.box.style.removeProperty('--rv');
    });
    plans.forEach(p => void p.box.offsetWidth);
    plans.forEach(p => p.box.classList.remove('sk-reset'));
  }

  const SPEED = 0.6;                                                       // px per ms — the blue line's pace
  function runNode(p, done){
    p.first.forEach(el => el.classList.add('is-on'));
    const go = k => {   // one smooth pass; lines in the same step draw side by side
      const seg = p.segs[k]; if(!seg){ done(); return; }
      let dur = 0;
      seg.forEach(({ l, mid, then }) => { const ms = Math.max(160, Math.round(l.getTotalLength() / SPEED)); dur = Math.max(dur, ms);
        l.style.setProperty('--dur', ms + 'ms'); l.classList.add('is-on', 'is-live'); p.at(l, false).forEach(d => d.classList.add('is-on'));
        later(() => mid.forEach(el => el && el.classList.add('is-on')), Math.round(ms * 0.35));
        later(() => { l.classList.remove('is-live');                         // blue eases to grey
          p.at(l, true).forEach(d => d.classList.add('is-on')); then.forEach(el => el && el.classList.add('is-on')); }, ms); });
      later(() => go(k + 1), dur + 110);                                    // the next line leaves as the node lands
    };
    later(() => go(0), 260);
  }
  function showLinear(p, i){
    const c = p.box, it = p.all[i], cr = c.getBoundingClientRect(), r = it.getBoundingClientRect();
    const top = r.top - cr.top + 6, bottom = r.bottom - cr.top + 6;          // +6: the item is still lifted 6px
    let tx = 10, ty = top + r.height / 2;
    const mk = it.classList.contains('ls-row') ? it.querySelector('.ls-mk i') : null;
    if(mk){ const m = mk.getBoundingClientRect(); tx = m.left + m.width / 2 - cr.left; ty = m.top + m.height / 2 - cr.top + 6; }
    else { const prev = p.all.slice(0, i).reverse().find(e => e.classList.contains('ls-row') && e.querySelector('.ls-mk i'));
      if(prev){ const m = prev.querySelector('.ls-mk i').getBoundingClientRect(); tx = m.left + m.width / 2 - cr.left; } }
    c.style.setProperty('--rv', Math.ceil(bottom + 4) + 'px');
    c.style.setProperty('--tx', tx + 'px'); c.style.setProperty('--ty', ty + 'px');
    c.classList.add('is-drawing');
    it.classList.add('is-on');
  }

  function cycle(){
    clear();
    if(!root.classList.contains('skel-v2')) return;
    const n = nodePlan(), l = linearPlan(), plans = [n, l].filter(Boolean);
    reset(plans);
    if(reduce){ plans.forEach(p => p.all.forEach(el => el.classList.add('is-on'))); if(l) l.box.style.setProperty('--rv', '100%'); return; }
    const nOn = n && shown(n.box), lOn = l && shown(l.box);
    if(!nOn && !lOn){ later(cycle, 600); return; }                         // nothing on screen yet: check again shortly
    /* each step is scheduled only once the one before it has run, so a busy page (the Linear builder compiling)
       slows the build down instead of dumping several steps at once */
    let left = (nOn ? 1 : 0) + (lOn ? 1 : 0);
    const finished = () => { if(--left) return;
      later(() => { if(n) n.all.forEach(el => el.classList.remove('is-live')); if(l) l.box.classList.remove('is-drawing'); }, 200);
      later(() => { plans.forEach(p => p.box.classList.add('skel-fade')); later(cycle, FADE); }, HOLD); };
    const run = (count, show, gap) => { const go = i => { if(i >= count){ finished(); return; } show(i); later(() => go(i + 1), gap); }; later(() => go(0), 120); };
    if(nOn) runNode(n, finished);
    if(lOn) run(l.all.length, i => showLinear(l, i), STEP_L);
  }

  function stop(){
    clear();
    const plans = [nodePlan(), linearPlan()].filter(Boolean);
    reset(plans);
    plans.forEach(p => { p.box.style.removeProperty('--tx'); p.box.style.removeProperty('--ty'); });
  }

  /* set(v): '1' = whole skeleton (as before) · '2' = step by step */
  window.SkelV2 = {
    set(v){ root.classList.toggle('skel-v2', v === '2'); root.classList.toggle('skel-v3', v === '3'); root.classList.toggle('skel-v4', v === '4');
      if(v === '2') cycle(); else stop(); },   // 3 · New workflow and 4 · Loader are CSS only
    restart(){ if(root.classList.contains('skel-v2')) cycle(); }
  };
})();
