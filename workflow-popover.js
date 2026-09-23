/* Anchored picker popover — the textual workflow builder's menu, on the node canvas.

   WFPop.open({
     anchor,                  element (or {x,y,width,height}) the menu hangs under
     title,                   header text
     back,                    fn → renders a ‹ back button
     wide,                    340px instead of 264px
     tabs:[{id,label}],       optional segmented tabs
     tab,                     active tab id
     searchPlaceholder,
     items: fn(tabId) → [{header}|{id,label,icon,iconCls,tag,keywords,help}],
     selected,                id of the already-picked item (check mark)
     helpEyebrow,             uppercase label above the help title
     footer:{label,icon,onClick},
     onPick(item),            return true to keep the menu open
     onClose(reason)          'pick' | 'dismiss'
   })

   The menu follows its anchor every frame, flips/clamps inside the viewport, and
   closes itself if the anchor is removed from the DOM. */
(function(){
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const GAP = 8, EDGE = 12, HELP_GAP = 14, HELP_W = 244;
  /* the app chrome sits above the canvas — never let a menu slide under it */
  function topInset(){
    const c = document.querySelector('.canvas');
    return (c ? c.getBoundingClientRect().top : 0) + EDGE;
  }

  let cur = null;   // the one open menu

  function rectOf(a){
    if(typeof a === 'function') a = a();     // live lookup: the canvas re-renders under us
    if(!a) return null;
    if(typeof a.getBoundingClientRect === 'function'){
      if(!a.isConnected) return null;
      const r = a.getBoundingClientRect();
      return (r.width || r.height) ? r : null;
    }
    return { left:a.x, top:a.y, right:a.x + (a.width||0), bottom:a.y + (a.height||0), width:a.width||0, height:a.height||0 };
  }

  /* visible rows for the current tab + query, with empty group headers dropped */
  function visibleItems(){
    const q = cur.q.trim().toLowerCase();
    /* the query is handed to items() as well, so a menu with drill-downs can
       flatten its sub-levels into the results while the user is searching */
    const src = (typeof cur.opts.items === 'function' ? cur.opts.items(cur.tab, q) : cur.opts.items) || [];
    const kept = src.filter(i => {
      if(i.header || i.divider) return true;
      if(i.chips) return !q;                    // the shortcut pills are a browse affordance only
      if(!q) return true;
      return ((i.label||'') + ' ' + (i.sub||'') + ' ' + (i.keywords||'') + ' ' + ((i.help && i.help.body) || '')).toLowerCase().includes(q);
    });
    return kept.filter((i, idx) => {
      if(!i.header && !i.divider) return true;
      const next = kept[idx+1];
      return !!next && !next.header && !next.divider;   // a heading or rule with nothing under it → drop
    });
  }

  /* An item row. With `sub` it renders the rich two-line shape of the textual
     builder's "What happens next" menu: a tinted icon tile, the node's name, a
     one-line description, the role tag on the right, then the chevron. */
  function itemHTML(i, idx, isActive, isChosen){
    /* the icon SVGs carry their own fill, so tint them through a mask */
    const ico = i.icon
      ? `<span class="wfpop-ico${i.tone ? ' tone-' + i.tone : ''}"><i style="--m:url(assets/${i.icon}.svg)"></i></span>`
      : '';
    const text = `<span class="wfpop-text"><span class="wfpop-label">${esc(i.label)}</span>`
      + (i.sub ? `<span class="wfpop-sub">${esc(i.sub)}</span>` : '') + `</span>`;
    const tag = i.tag ? `<span class="wfpop-tag">${esc(i.tag)}</span>` : '';
    const chev = i.chevron ? `<svg class="wfpop-chev" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>` : '';
    const check = isChosen ? `<svg class="wfpop-check" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12l5 5 9-11" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>` : '';
    const cls = ['wfpop-item', i.sub ? 'rich' : '', i.soon ? 'soon' : '', i.danger ? 'danger' : '',
      isActive ? 'active' : '', isChosen ? 'chosen' : ''].filter(Boolean).join(' ');
    return `<button class="${cls}" data-idx="${idx}" type="button">` + ico + text + tag + chev + check + `</button>`;
  }

  /* horizontal shortcut pills under the search ("Quick · Notify · Create · …") */
  function chipsHTML(i, idx){
    return `<div class="wfpop-chips">`
      + (i.label ? `<span class="wfpop-chips-label">${esc(i.label)}</span>` : '')
      + i.chips.map((c, n) => `<button class="wfpop-chip" type="button" data-chip="${idx}:${n}">`
          + (c.icon ? `<i style="--m:url(assets/${c.icon}.svg)"></i>` : '') + esc(c.label) + `</button>`).join('')
      + `</div>`;
  }

  function renderList(){
    const rows = visibleItems();
    cur.rows = rows;
    cur.pick = rows.map((i, n) => (i.header || i.chips || i.divider) ? -1 : n).filter(n => n >= 0);   // selectable row indices
    if(cur.active >= cur.pick.length) cur.active = cur.pick.length ? cur.pick.length - 1 : 0;
    if(cur.active < 0) cur.active = 0;

    let html = '';
    if(!rows.length) html = `<div class="wfpop-empty">No matches</div>`;
    rows.forEach((i, n) => {
      if(i.divider){ html += `<div class="wfpop-divider"></div>`; return; }
      if(i.header){ html += `<div class="wfpop-group">${esc(i.header)}</div>`; return; }
      if(i.chips){ html += chipsHTML(i, n); return; }
      const slot = cur.pick.indexOf(n);
      html += itemHTML(i, n, slot === cur.active, cur.opts.selected != null && i.id === cur.opts.selected);
    });
    cur.listEl.innerHTML = html;
    scrollActiveIntoView();
    renderHelp();
  }

  function activeItem(){
    if(!cur.pick || !cur.pick.length) return null;
    return cur.rows[cur.pick[Math.min(cur.active, cur.pick.length - 1)]] || null;
  }
  function activeEl(){ return cur.listEl.querySelector('.wfpop-item.active'); }

  function scrollActiveIntoView(){
    const el = activeEl(); if(!el) return;
    const l = cur.listEl, top = el.offsetTop, bot = top + el.offsetHeight;
    if(top < l.scrollTop) l.scrollTop = top - 4;
    else if(bot > l.scrollTop + l.clientHeight) l.scrollTop = bot - l.clientHeight + 4;
  }

  function setActive(slot, viaMouse){
    if(slot === cur.active) return;
    cur.active = slot;
    cur.listEl.querySelectorAll('.wfpop-item').forEach((el, n) => el.classList.toggle('active', n === slot));
    if(!viaMouse) scrollActiveIntoView();
    renderHelp();
  }

  /* ---- contextual help bubble ---- */
  function renderHelp(){
    const it = activeItem();
    const help = (it && it.help) || cur.opts.help || null;
    if(!help){ if(cur.helpEl){ cur.helpEl.remove(); cur.helpEl = null; } return; }
    if(!cur.helpEl){
      cur.helpEl = document.createElement('div');
      cur.helpEl.className = 'wfpop-help right';
      cur.layer.appendChild(cur.helpEl);
    }
    const eb = help.eyebrow || cur.opts.helpEyebrow;
    const eyebrow = eb ? `<div class="wfpop-eyebrow">${esc(eb)}</div>` : '';
    const more = help.more || cur.opts.helpMore;
    cur.helpEl.innerHTML = `<div class="wfpop-help-card">${eyebrow}`
      + `<div class="wfpop-help-title">${esc(help.title)}</div>`
      + (help.body ? `<div class="wfpop-help-body">${esc(help.body)}</div>` : '')
      + (help.eg ? `<div class="wfpop-help-eg">${esc(help.eg)}</div>` : '')
      + (more ? `<a class="wfpop-help-more" href="${esc(more)}" target="_blank" rel="noopener">View more</a>` : '')
      + `</div>`;
    placeHelp();
  }

  function placeHelp(){
    if(!cur.helpEl) return;
    const p = cur.popEl.getBoundingClientRect();
    let left = p.right + HELP_GAP, side = 'right';
    if(left + HELP_W > window.innerWidth - EDGE){ left = Math.max(EDGE, p.left - HELP_W - HELP_GAP); side = 'left'; }
    const row = activeEl();
    const r = row ? row.getBoundingClientRect() : null;
    let cy = r ? r.top + r.height / 2 : p.top + 28;
    // Keep the caret inside the list's visible box. Without this, scrolling the
    // list carries the highlighted row (and the bubble with it) clean out of the
    // menu — the bubble must stay beside the rows, never float off above them.
    const lr = cur.listEl.getBoundingClientRect();
    cy = Math.min(Math.max(cy, lr.top + 12), lr.bottom - 12);
    cur.helpEl.className = 'wfpop-help ' + side;
    cur.helpEl.style.left = Math.round(left) + 'px';
    cur.helpEl.style.top = Math.round(Math.min(Math.max(cy, topInset() + 48), window.innerHeight - 60)) + 'px';
  }

  /* A wheel-scroll slides new rows under a stationary cursor without firing
     mousemove — so re-read which row the pointer is on. Resolved by nearest row
     centre rather than a hit test, because the cursor often lands on a group
     header or the gap between rows, where a hit test finds nothing and would
     leave the previous (now scrolled-away) row highlighted. */
  function syncActiveToCursor(){
    const m = cur.mouse; if(!m) return;
    const lr = cur.listEl.getBoundingClientRect();
    if(m.x < lr.left || m.x > lr.right || m.y < lr.top || m.y > lr.bottom) return;
    let best = -1, bestD = Infinity;
    cur.listEl.querySelectorAll('.wfpop-item').forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - m.y);
      if(d < bestD){ bestD = d; best = i; }
    });
    if(best >= 0) setActive(best, true);
  }

  /* ---- placement: centred under the anchor, flipped / clamped to the viewport ---- */
  function place(){
    const r = rectOf(cur.opts.anchor);
    if(!r){                                  // anchor gone (canvas re-render) → close
      if(cur.anchorMissFrames++ > 30) close('dismiss');
      return;
    }
    cur.anchorMissFrames = 0;
    if(cur.listEl.scrollTop !== cur.lastScroll){ cur.lastScroll = cur.listEl.scrollTop; syncActiveToCursor(); }
    const w = cur.popEl.offsetWidth, h = cur.popEl.offsetHeight;
    const minTop = topInset();
    const al = cur.opts.align;
    let left, top;
    if(cur.opts.side === 'right'){
      /* Beside a horizontal connector: the menu opens off the end of the line,
         with the anchor meeting it near the top — flipping to the left only when
         there is no room on the right. */
      left = r.right + GAP;
      if(left + w > window.innerWidth - EDGE) left = r.left - GAP - w;
      top = r.top + r.height / 2 - 34;
    } else {
      left = al === 'end' ? r.right - w : al === 'start' ? r.left : r.left + r.width / 2 - w / 2;
      top = r.bottom + GAP;
      if(top + h > window.innerHeight - EDGE){
        const above = r.top - GAP - h;
        top = above >= minTop ? above : Math.max(minTop, window.innerHeight - EDGE - h);
      }
    }
    top = Math.min(Math.max(top, minTop), Math.max(minTop, window.innerHeight - EDGE - h));
    left = Math.min(Math.max(left, EDGE), Math.max(EDGE, window.innerWidth - EDGE - w));
    if(cur.lastL !== left || cur.lastT !== top){
      cur.lastL = left; cur.lastT = top;
      cur.popEl.style.left = Math.round(left) + 'px';
      cur.popEl.style.top = Math.round(top) + 'px';
    }
    placeHelp();
  }

  /* ---- events ---- */
  function onKey(e){
    if(!cur) return;
    if(e.key === 'Escape'){ e.preventDefault(); close('dismiss'); return; }
    if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      e.preventDefault();
      if(!cur.pick.length) return;
      const d = e.key === 'ArrowDown' ? 1 : -1;
      setActive((cur.active + d + cur.pick.length) % cur.pick.length);
      return;
    }
    if(e.key === 'Enter'){ e.preventDefault(); const it = activeItem(); if(it) pick(it); return; }
    if(e.key === 'Backspace' && cur.q === '' && cur.opts.back){ e.preventDefault(); cur.opts.back(); }
  }

  function pick(item){
    const keepOpen = cur.opts.onPick && cur.opts.onPick(item) === true;
    if(!keepOpen) close('pick');
    else { cur.q = ''; if(cur.searchEl) cur.searchEl.value = ''; cur.active = 0; renderList(); }
  }

  function close(reason){
    if(!cur) return;
    const c = cur; cur = null;
    cancelAnimationFrame(c.raf);
    document.removeEventListener('keydown', onKey, true);
    c.popEl.classList.add('closing');
    if(c.helpEl) c.helpEl.remove();
    setTimeout(() => c.layer.remove(), 100);
    if(c.opts.onClose) c.opts.onClose(reason || 'dismiss');
  }

  function open(opts){
    if(cur) close('dismiss');

    const layer = document.createElement('div');
    layer.className = 'wfpop-layer';
    const pop = document.createElement('div');
    pop.className = 'wfpop' + (opts.wide ? ' wide' : '') + (opts.menu ? ' menu' : '');
    if(opts.width) pop.style.width = opts.width + 'px';
    pop.style.visibility = 'hidden';
    layer.appendChild(pop);

    /* inline, not <img> — these two need to recolour with the popover's own
       dark palette, and a referenced .svg's baked fill can't be reached by CSS */
    const backSVG = `<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M2.64645 4.64645C2.84171 4.45118 3.15829 4.45118 3.35355 4.64645L6 7.29289L8.64645 4.64645C8.84171 4.45118 9.15829 4.45118 9.35355 4.64645C9.54882 4.84171 9.54882 5.15829 9.35355 5.35355L6.35355 8.35355C6.15829 8.54882 5.84171 8.54882 5.64645 8.35355L2.64645 5.35355C2.45118 5.15829 2.45118 4.84171 2.64645 4.64645Z"/></svg>`;
    const searchSVG = `<svg viewBox="0 0 10.5 10.5" fill="currentColor" fill-rule="evenodd" aria-hidden="true"><path d="M1.16667 4.66667C1.16667 2.73642 2.73642 1.16667 4.66667 1.16667C6.59692 1.16667 8.16667 2.73642 8.16667 4.66667C8.16667 6.59692 6.59692 8.16667 4.66667 8.16667C2.73642 8.16667 1.16667 6.59692 1.16667 4.66667M10.3291 9.50425L8.34867 7.52325C8.96292 6.73342 9.33333 5.7435 9.33333 4.66667C9.33333 2.09358 7.23975 0 4.66667 0C2.09358 0 0 2.09358 0 4.66667C0 7.23975 2.09358 9.33333 4.66667 9.33333C5.7435 9.33333 6.73342 8.96292 7.52325 8.34867L9.50425 10.3291C9.618 10.4428 9.76733 10.5 9.91667 10.5C10.066 10.5 10.2153 10.4428 10.3291 10.3291C10.5572 10.101 10.5572 9.73233 10.3291 9.50425"/></svg>`;
    const head = (opts.title || opts.back)
      ? `<div class="wfpop-head">`
        + (opts.back ? `<button class="wfpop-back" type="button" aria-label="Back">${backSVG}</button>` : '')
        + `<span class="wfpop-title">${esc(opts.title || '')}</span></div>`
      : '';
    const tabs = (opts.tabs && opts.tabs.length)
      ? `<div class="wfpop-tabs">` + opts.tabs.map(t =>
          `<button class="wfpop-tab${t.id === (opts.tab || opts.tabs[0].id) ? ' active' : ''}" type="button" data-tab="${esc(t.id)}">${esc(t.label)}</button>`).join('') + `</div>`
      : '';
    const search = opts.noSearch ? '' :
      `<label class="wfpop-search">${searchSVG}`
      + `<input type="text" placeholder="${esc(opts.searchPlaceholder || 'Search')}"></label>`;
    const foot = opts.footer
      ? `<div class="wfpop-foot"><button class="wfpop-item" type="button" data-foot="1">`
        + (opts.footer.icon ? `<span class="wfpop-ico blue"><img src="assets/${opts.footer.icon}.svg" alt=""></span>` : '')
        + `<span class="wfpop-label">${esc(opts.footer.label)}</span></button></div>`
      : '';
    pop.innerHTML = head + tabs + search + `<div class="wfpop-list"></div>` + foot;

    document.body.appendChild(layer);

    cur = {
      opts, layer, popEl:pop,
      listEl: pop.querySelector('.wfpop-list'),
      searchEl: pop.querySelector('.wfpop-search input'),
      helpEl: null, q:'', tab: opts.tab || (opts.tabs && opts.tabs[0].id) || null,
      active: 0, rows: [], pick: [], raf: 0, anchorMissFrames: 0, lastL: null, lastT: null,
      mouse: null, lastScroll: 0
    };

    renderList();
    place();
    pop.style.visibility = '';

    /* The layer lingers for the close animation, so every one of these handlers
       can still fire after `cur` is gone. */
    layer.addEventListener('mousedown', e => { if(cur && !pop.contains(e.target)) close('dismiss'); });

    /* rows */
    cur.listEl.addEventListener('click', e => {
      if(!cur) return;
      const chip = e.target.closest('.wfpop-chip');
      if(chip){
        const [r, n] = chip.dataset.chip.split(':').map(Number);
        const c = cur.rows[r] && cur.rows[r].chips[n];
        if(c) pick(c);
        return;
      }
      const b = e.target.closest('.wfpop-item'); if(!b) return;
      const it = cur.rows[+b.dataset.idx]; if(it) pick(it);
    });
    cur.listEl.addEventListener('mousemove', e => {
      if(!cur) return;
      cur.mouse = { x:e.clientX, y:e.clientY };
      const b = e.target.closest('.wfpop-item'); if(!b) return;
      const slot = [...cur.listEl.querySelectorAll('.wfpop-item')].indexOf(b);
      if(slot >= 0) setActive(slot, true);
    });
    cur.listEl.addEventListener('mouseleave', () => { if(cur) cur.mouse = null; });
    cur.listEl.addEventListener('scroll', () => { if(cur) syncActiveToCursor(); }, { passive:true });

    if(cur.searchEl){
      cur.searchEl.addEventListener('input', e => { cur.q = e.target.value; cur.active = 0; renderList(); });
      setTimeout(() => cur.searchEl.focus({ preventScroll:true }), 0);
    }
    const backBtn = pop.querySelector('.wfpop-back');
    if(backBtn) backBtn.addEventListener('click', () => opts.back && opts.back());

    pop.querySelectorAll('.wfpop-tab').forEach(b => b.addEventListener('click', () => {
      if(cur.tab === b.dataset.tab) return;
      cur.tab = b.dataset.tab; cur.active = 0;
      pop.querySelectorAll('.wfpop-tab').forEach(x => x.classList.toggle('active', x === b));
      if(cur.opts.onTab) cur.opts.onTab(cur.tab);
      renderList(); place();
    }));

    const footBtn = pop.querySelector('[data-foot]');
    if(footBtn) footBtn.addEventListener('click', () => { const f = opts.footer.onClick; close('pick'); if(f) f(); });

    document.addEventListener('keydown', onKey, true);
    const loop = () => { if(!cur) return; place(); cur.raf = requestAnimationFrame(loop); };
    cur.raf = requestAnimationFrame(loop);
    return { close };
  }

  window.WFPop = { open, close, isOpen: () => !!cur };
})();
