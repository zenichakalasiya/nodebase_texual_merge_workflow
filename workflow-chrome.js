/* App chrome — the product frame around the canvas.

   · application bar (row 1): panel toggle, logo, Ask AI, quick actions, avatar
   · page bar (row 2):  Workflows / <name> · state pill   (Simple|Node view centred)
                        · Simple|Node view switch          — left
                        Enabled · Save As Draft · Publish · history · ⋮ — right
   · a floating toolbar centred at the bottom of the canvas: guide, shortcuts,
     zoom, undo / redo / reset

   Zoom and history are live — they drive the canvas transform and the snapshot
   history that workflow-app.js exposes on window.WFApp. */
(function(){
  const $ = (s, r=document) => r.querySelector(s);

  /* ---------------------------------------------------------- icons */
  const P = {
    panel:    '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M9 4v16"/><path d="M14.5 9.5 17 12l-2.5 2.5"/>',
    sparkle:  '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z"/>',
    plus:     '<path d="M12 5v14M5 12h14"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    bell:     '<path d="M18 9a6 6 0 1 0-12 0c0 4.5-1.5 6-1.5 6h15S18 13.5 18 9Z"/><path d="M10.3 19a2 2 0 0 0 3.4 0"/>',
    history:  '<path d="M3 12a9 9 0 1 0 2.6-6.4"/><path d="M3 4v5h5"/><path d="M12 8v4.5l3 1.8"/>',
    gear:     '<circle cx="12" cy="12" r="3"/><path d="M19.4 14.2a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a2 2 0 1 1-4 0V20a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H10a1.6 1.6 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V10a1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4H20a1.6 1.6 0 0 0-1.5 1Z"/>',
    keyboard: '<rect x="2" y="6" width="20" height="12" rx="2.5"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h12"/>',
    info:     '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    chevL:    '<path d="M15 6l-6 6 6 6"/>',
    chevR:    '<path d="M9 6l6 6-6 6"/>',
    chevRR:   '<path d="M7 6l6 6-6 6M13 6l6 6-6 6"/>',
    chevD:    '<path d="M6 9l6 6 6-6"/>',
    pencil:   '<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7.5 18.5 3 20l1.5-4.5 12-12Z"/>',
    dots:     '<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
    lines:    '<path d="M4 7h16M4 12h11M4 17h7"/>',
    simple:   '<path d="M4 7h16M4 12h16M4 17h10"/>',
    nodes:    '<rect x="3" y="4" width="7" height="5" rx="1.5"/><rect x="14" y="15" width="7" height="5" rx="1.5"/><rect x="3" y="15" width="7" height="5" rx="1.5"/><path d="M6.5 9v3.5h11V15M6.5 12.5V15"/>',
    search:   '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
    home:     '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9.8 20v-6h4.4v6"/>',
    ai:       '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8.5 15.5l2.6-7 2.6 7M9.4 13.4h3.4M16.5 8.5v7"/>',
    users:    '<circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6"/>',
    org:      '<path d="M4 20V9l6-3v14M14 20V11l6-2.5V20M3 20h18"/><path d="M7 11h.01M7 14h.01M17 13h.01M17 16h.01"/>',
    channels: '<circle cx="12" cy="12" r="2.4"/><path d="M12 3v3.6M12 17.4V21M3 12h3.6M17.4 12H21M5.6 5.6l2.6 2.6M15.8 15.8l2.6 2.6M18.4 5.6l-2.6 2.6M8.2 15.8l-2.6 2.6"/>',
    survey:   '<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8.5 9.5l1.7 1.7 3.4-3.4M8.5 16h7"/>',
    request:  '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M7 10h4M7 14h7"/>',
    catalog:  '<path d="M12 3.5 20 7.5v9L12 20.5 4 16.5v-9L12 3.5Z"/><path d="M4 7.5l8 4 8-4M12 11.5v9"/>',
    problem:  '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v5M12 16h.01"/>',
    change:   '<path d="M4 8h12l-2.5-2.5M20 16H8l2.5 2.5"/>',
    release:  '<path d="M12 3.5v11"/><path d="M8.5 7 12 3.5 15.5 7"/><rect x="4" y="14.5" width="16" height="6" rx="2"/>',
    knowledge:'<path d="M12 4.2v15.6"/><path d="M12 4.2c-1.7-1.1-4-1.5-6.5-1.2v14c2.5-.3 4.8.1 6.5 1.2 1.7-1.1 4-1.5 6.5-1.2V3c-2.5-.3-4.8.1-6.5 1.2Z"/>',
    task:     '<path d="M4 7.5 6 9.5 9.5 6M4 16.5 6 18.5 9.5 15M13 8h7M13 17h7"/>',
    cmdb:     '<ellipse cx="12" cy="6" rx="7.5" ry="3"/><path d="M4.5 6v12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6"/><path d="M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"/>',
    discovery:'<rect x="3" y="4" width="18" height="12" rx="2.5"/><path d="M8 20h8M12 16v4"/><path d="M8 10h2l1.5-2.5L13 12l1-2h2"/>',
    patch:    '<path d="M12 3.5 20 7v6c0 4-3.4 6.8-8 7.9C7.4 19.8 4 17 4 13V7l8-3.5Z"/><path d="M9.2 12.2l2 2 3.6-4"/>',
    asset:    '<rect x="2.5" y="6" width="19" height="11" rx="2.5"/><path d="M8 21h8M12 17v4"/>',
    zoomIn:   '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6M11 8.2v5.6M8.2 11h5.6"/>',
    zoomOut:  '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6M8.2 11h5.6"/>',
    fit:      '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
    undo:     '<path d="M4 8h10a5.5 5.5 0 0 1 0 11H8"/><path d="M7.5 4.5 4 8l3.5 3.5"/>',
    redo:     '<path d="M20 8H10a5.5 5.5 0 0 0 0 11h6"/><path d="M16.5 4.5 20 8l-3.5 3.5"/>',
    reset:    '<path d="M20.5 12a8.5 8.5 0 1 1-2.5-6"/><path d="M21 4v5h-5"/>',
    bulb:     '<path d="M9.2 17h5.6M10 20.5h4"/><path d="M12 3a6 6 0 0 1 3.6 10.8c-.5.4-.8 1-.8 1.6H9.2c0-.6-.3-1.2-.8-1.6A6 6 0 0 1 12 3Z"/>',
    command:  '<path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6Z"/>',
    hand:     '<path d="M9 11V4.6a1.6 1.6 0 1 1 3.2 0V11m0-.6V3.6a1.6 1.6 0 1 1 3.2 0V11m0-.4V5.6a1.6 1.6 0 1 1 3.2 0V14a6.5 6.5 0 0 1-6.5 6.5h-.8a6 6 0 0 1-4.6-2.2L3.7 14a1.7 1.7 0 0 1 2.6-2.1L9 14.6"/>',
    cursor:   '<path d="M5.5 3.2 19 11.4l-6.2 1.5-2.6 5.9L5.5 3.2Z"/>',
  };
  const svg = (k, cls) => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor"`
    + ` stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k]}</svg>`;

  /* ---------------------------------------------------------- logo */
  function logoSVG(){
    const COLORS = ['#13307d','#174fa8','#1d76c9','#219dd4','#28bccb','#33cfa8','#4bd97f','#74e05e','#9ae24d'];
    const X0 = 38, X1 = 99, BASE = 22, RISE = 16;         // the dot arc rides above the wordmark
    const dots = COLORS.map((c, i) => {
      const t = i / (COLORS.length - 1);
      const x = X0 + t * (X1 - X0), y = BASE - RISE * Math.sin(Math.PI * t);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${c}"/>`;
    }).join('');
    return `<svg class="logo" viewBox="0 0 150 46" role="img" aria-label="Motadata">${dots}`
      + `<text x="2" y="42" font-family="Poppins, 'Segoe UI', sans-serif" font-size="25" font-weight="600" fill="#0d2440" letter-spacing="-0.4">motadata</text></svg>`;
  }

  /* ---------------------------------------------------------- left navigation */
  const NAV = [
    { id:'overview', label:'Overview', icon:'home' },
    { section:'Intelligent Automation' },
    { id:'automation', label:'Automation', icon:'gear', sub:true },
    { id:'ai', label:'AI', icon:'ai', sub:true },
    { section:'Platform Configuration' },
    { id:'users', label:'Users', icon:'users', sub:true },
    { id:'org', label:'Organization', icon:'org', sub:true },
    { id:'channels', label:'Support Channels', icon:'channels', sub:true },
    { id:'survey', label:'User Survey', icon:'survey', sub:true },
    { section:'Service Desk' },
    { id:'request', label:'Request Management', icon:'request', sub:true },
    { id:'catalog', label:'Service Catalog', icon:'catalog' },
    { id:'problem', label:'Problem Management', icon:'problem', sub:true },
    { id:'change', label:'Change Management', icon:'change', sub:true },
    { id:'release', label:'Release Management', icon:'release', sub:true },
    { id:'knowledge', label:'Knowledge Management', icon:'knowledge', sub:true },
    { id:'task', label:'Task Management', icon:'task', sub:true },
    { section:'IT Operations' },
    { id:'cmdb', label:'CMDB', icon:'cmdb', sub:true },
    { id:'discovery', label:'Discovery And Agents', icon:'discovery', sub:true },
    { id:'patch', label:'Patch Management', icon:'patch', sub:true },
    { id:'assets', label:'Asset Management', icon:'asset', sub:true },
  ];
  function navListHTML(q){
    const needle = (q || '').trim().toLowerCase();
    const kept = NAV.filter(i => i.section || !needle || i.label.toLowerCase().includes(needle));
    const rows = kept.filter((i, n) => {
      if(!i.section) return true;
      const next = kept[n+1];
      return !!next && !next.section;                   // drop a heading with nothing under it
    });
    if(!rows.length) return `<div class="nav-empty">No matches</div>`;
    return rows.map(i => i.section
      ? `<div class="nav-section">${i.section}</div>`
      : `<button class="nav-item" type="button" data-nav="${i.id}">`
        + svg(i.icon) + `<span>${i.label}</span>` + (i.sub ? svg('chevR', 'nav-chev') : '') + `</button>`
    ).join('');
  }

  /* ---------------------------------------------------------- build the DOM */
  function build(){
    const app = $('.app');

    const appbar = document.createElement('header');
    appbar.className = 'appbar';
    appbar.innerHTML =
      `<div class="appbar-logo"><button class="cbtn bordered" id="navToggle" data-tip="Toggle navigation" aria-label="Toggle navigation">${svg('panel')}</button>${logoSVG()}</div>`
      + `<div class="appbar-spacer"></div>`
      + `<div class="appbar-right">`
        + `<button class="ask-ai" id="askAi">${svg('sparkle')}Ask AI</button>`
        + `<button class="btn-dark-sq" data-soon="Create" data-tip="Create" aria-label="Create">${svg('plus')}</button>`
        + ['calendar','bell','history','gear','keyboard','info'].map(k =>
            `<button class="cbtn" data-soon="${k}" data-tip="${k[0].toUpperCase() + k.slice(1)}" aria-label="${k}">${svg(k)}</button>`).join('')
        + `<button class="avatar" data-soon="Account" data-tip="Account">ZE</button>`
      + `</div>`;

    const pagebar = document.createElement('header');
    pagebar.className = 'pagebar';
    pagebar.innerHTML =
      `<div class="pagebar-left">`
        + `<button class="cbtn sm bordered" id="goBack" data-tip="Back" aria-label="Back">${svg('chevL')}</button>`
        + `<button class="crumb-link" id="crumbRoot">Workflows</button>`
        + `<span class="crumb-sep">/</span>`
        + `<span class="page-title" id="pageTitle" title="Click to rename">Untitled rule</span>`
        + `<span class="state-pill draft" id="statePill">Draft</span>`
      + `</div>`
      /* Simple | Node — centred on the bar, independent of the breadcrumb and actions */
      + `<div class="viewswitch" id="viewSwitch">`
        + `<button class="vs-btn" type="button" data-view="simple">${svg('simple')}Simple view</button>`
        + `<button class="vs-btn active" type="button" data-view="node">${svg('nodes')}Node view</button>`
      + `</div>`
      + `<div class="pagebar-right">`
        + `<div class="enable-row"><span>Enabled</span>`
          + `<button class="switch on" id="enableSw" role="switch" aria-checked="true"><span>ON</span><i></i></button></div>`
        + `<div class="split">`
          + `<button class="btn-blue" id="publishFlow">Publish</button>`
          + `<button class="split-caret" id="publishOpts" data-tip="Save options" aria-label="Save options">${svg('chevD')}</button>`
        + `</div>`
        + `<button class="cbtn bordered" data-soon="Version history" data-tip="Version history" aria-label="Version history">${svg('history')}</button>`
        + `<button class="cbtn bordered" id="moreMenu" data-tip="More" aria-label="More">${svg('dots')}</button>`
      + `</div>`;

    app.insertBefore(pagebar, app.firstChild);
    app.insertBefore(appbar, app.firstChild);

    const hot = document.createElement('div');
    hot.className = 'nav-hot';

    const nav = document.createElement('aside');
    nav.className = 'navflyout';
    nav.innerHTML =
      `<div class="nav-logo"><button class="cbtn bordered" id="navToggle2" aria-label="Close navigation">${svg('panel')}</button>${logoSVG()}</div>`
      + `<button class="nav-back" id="navBack">${svg('chevL')}Back to app</button>`
      + `<label class="nav-search">${svg('search')}<input type="text" id="navSearch" placeholder="Setup Approval"></label>`
      + `<div class="nav-list" id="navList">${navListHTML('')}</div>`;

    const handle = document.createElement('button');
    handle.className = 'edge-handle';
    handle.id = 'edgeHandle';
    handle.setAttribute('aria-label', 'Open navigation');
    handle.innerHTML = svg('chevRR');

    /* one floating toolbar, centred under the canvas */
    const bar = document.createElement('div');
    bar.className = 'bottombar';
    bar.innerHTML =
      `<div class="bbar">`
        + `<button class="cbtn" id="guideBtn" data-tip="Guide">${svg('bulb')}</button>`
        + `<button class="cbtn" id="shortcutsBtn" data-tip="Keyboard shortcuts&nbsp;&nbsp;?">${svg('command')}</button>`
      + `</div>`
      + `<div class="bbar">`
        + `<button class="zoom-pill" id="zoomMenu" data-tip="Zoom">${svg('zoomIn')}<span id="zoomLevel">100%</span>${svg('chevD', 'zp-chev')}</button>`
      + `</div>`
      + `<div class="bbar">`
        + `<button class="cbtn tool" id="toolPan" data-tip="Hand&nbsp;&nbsp;drag to move the canvas">${svg('hand')}</button>`
        + `<button class="cbtn tool active" id="toolSelect" data-tip="Select&nbsp;&nbsp;drag nodes">${svg('cursor')}</button>`
      + `</div>`
      + `<div class="bbar">`
        + `<button class="cbtn" id="doUndo" data-tip="Undo&nbsp;&nbsp;Ctrl+Z">${svg('undo')}</button>`
        + `<button class="cbtn" id="doRedo" data-tip="Redo&nbsp;&nbsp;Ctrl+Shift+Z">${svg('redo')}</button>`
        + `<button class="bbar-text" id="doReset">${svg('reset')}Reset</button>`
      + `</div>`;

    document.body.append(hot, nav, handle, bar);
    return { nav, hot, handle };
  }

  /* ---------------------------------------------------------- tooltips
     Lives on <body> so no overflow:hidden ancestor can clip it, and sits above
     the drawer. Prefers the space above the button, flipping below near the top.
     */
  const tip = document.createElement('div');
  tip.className = 'wf-tip';
  let tipFor = null;
  function placeTip(){
    if(!tipFor) return;
    const r = tipFor.getBoundingClientRect(), t = tip.getBoundingClientRect();
    let top = r.top - t.height - 8, below = false;
    if(top < 6){ top = r.bottom + 8; below = true; }
    let left = r.left + r.width / 2 - t.width / 2;
    left = Math.min(Math.max(left, 6), window.innerWidth - t.width - 6);
    tip.style.left = Math.round(left) + 'px';
    tip.style.top = Math.round(top) + 'px';
    tip.classList.toggle('below', below);
  }
  function hideTip(){ tipFor = null; tip.classList.remove('show'); }
  function initTips(){
    document.body.appendChild(tip);
    document.addEventListener('mouseover', e => {
      const t = e.target.closest('[data-tip]');
      if(t === tipFor) return;
      if(!t || t.hasAttribute('data-tipoff')){ hideTip(); return; }
      tipFor = t;
      tip.innerHTML = t.dataset.tip;
      tip.classList.add('show');
      placeTip();
    });
    document.addEventListener('mouseout', e => {
      if(tipFor && !tipFor.contains(e.relatedTarget)) hideTip();
    });
    document.addEventListener('mousedown', hideTip);
    window.addEventListener('scroll', hideTip, true);
  }

  /* ---------------------------------------------------------- small float card */
  let card = null;
  function closeCard(){
    if(!card) return;
    document.querySelectorAll('[data-tipoff]').forEach(e => e.removeAttribute('data-tipoff'));
    card.remove(); card = null;
  }
  function floatCard(anchor, html){
    const wasMine = card && card.dataset.owner === anchor.id;
    closeCard();
    if(wasMine) return;                                  // second click closes
    anchor.setAttribute('data-tipoff', '');              // its tooltip would sit on top of the card
    card = document.createElement('div');
    card.className = 'floatcard';
    card.dataset.owner = anchor.id;
    card.innerHTML = html;
    document.body.appendChild(card);
    const r = anchor.getBoundingClientRect(), c = card.getBoundingClientRect();
    card.style.left = Math.round(Math.min(Math.max(12, r.left + r.width / 2 - c.width / 2), window.innerWidth - c.width - 12)) + 'px';
    card.style.top = Math.round(r.top - c.height - 10) + 'px';
    setTimeout(() => document.addEventListener('mousedown', function off(e){
      if(card && !card.contains(e.target)){ closeCard(); document.removeEventListener('mousedown', off); }
    }), 0);
  }
  const GUIDE = `<div class="fc-title">Building a workflow</div><ol class="fc-list">`
    + `<li>Click the <b>Trigger</b> node to pick what starts the workflow.</li>`
    + `<li>Fill its configuration in the right drawer — everything saves as you type.</li>`
    + `<li>Use a <b>+</b> on the canvas, or <b>Next Node Selection</b> in the drawer, to add the next step.</li>`
    + `<li>A node left with empty required fields turns red — click it to see what is missing.</li></ol>`;
  const SHORTCUTS = `<div class="fc-title">Keyboard shortcuts</div><dl class="fc-keys">`
    + [['Ctrl + Z','Undo'],['Ctrl + Shift + Z','Redo'],['↑ ↓','Move through a menu'],
       ['Enter','Choose the highlighted row'],['Esc','Close the menu'],['?','This panel']]
      .map(([k, v]) => `<dt><kbd>${k}</kbd></dt><dd>${v}</dd>`).join('') + `</dl>`;

  /* ---------------------------------------------------------- behaviour */
  function wire(parts){
    const { nav, hot, handle } = parts;
    const app = window.WFApp;
    const toast = app.toast;

    /* --- navigation: hover to peek, toggle to pin --- */
    let pinned = false, closeT = null, openT = null;
    const open = () => { clearTimeout(closeT); closeT = null; nav.classList.add('open'); };
    const close = () => { clearTimeout(openT); openT = null; if(!pinned) nav.classList.remove('open'); };
    const peek = () => { clearTimeout(openT); openT = setTimeout(open, 110); };
    hot.addEventListener('mouseenter', peek);
    hot.addEventListener('mouseleave', () => clearTimeout(openT));
    /* The panel slides out from under a stationary cursor, so it may never get a
       mouseenter — and with no enter, mouseleave never fires either and the panel
       hangs open. Track the pointer against its box at the document level. */
    document.addEventListener('mousemove', e => {
      if(pinned || !nav.classList.contains('open')) return;
      const r = nav.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if(inside){ clearTimeout(closeT); closeT = null; }
      else if(closeT == null) closeT = setTimeout(() => { closeT = null; close(); }, 220);
    });
    const toggle = () => { pinned = !nav.classList.contains('open') ? true : !pinned; if(pinned) open(); else nav.classList.remove('open'); };
    $('#navToggle').addEventListener('click', toggle);
    $('#navToggle2').addEventListener('click', () => { pinned = false; nav.classList.remove('open'); });
    handle.addEventListener('click', () => { pinned = true; open(); });
    handle.addEventListener('mouseenter', peek);        // the handle covers the hot strip
    handle.addEventListener('mouseleave', () => clearTimeout(openT));
    $('#navBack').addEventListener('click', () => { pinned = false; nav.classList.remove('open'); });
    document.addEventListener('mousedown', e => {
      if(pinned && !nav.contains(e.target) && !e.target.closest('#navToggle') && !e.target.closest('#edgeHandle')){
        pinned = false; nav.classList.remove('open');
      }
    });
    $('#navSearch').addEventListener('input', e => { $('#navList').innerHTML = navListHTML(e.target.value); });
    $('#navList').addEventListener('click', e => {
      const b = e.target.closest('[data-nav]'); if(!b) return;
      toast(b.querySelector('span').textContent + ' is not part of this prototype');
    });

    /* --- page bar --- */
    let flowName = 'Untitled rule', flowDesc = '';

    /* Click the workflow name → a small card under it with the name and a
       description. It opens plain; a Save button appears only once something has
       actually been edited, and nothing reaches the top bar until it is pressed.
       Closing the card any other way drops the unsaved edits. */
    let infoCard = null;
    const closeInfo = () => {
      if(!infoCard) return;
      infoCard.remove(); infoCard = null;
      document.removeEventListener('mousedown', offInfo, true);
      document.removeEventListener('keydown', escInfo, true);
    };
    const offInfo = e => { if(infoCard && !infoCard.contains(e.target) && !$('#pageTitle').contains(e.target)) closeInfo(); };
    const escInfo = e => { if(e.key === 'Escape'){ e.stopPropagation(); closeInfo(); } };
    $('#pageTitle').title = 'Edit name and description';
    $('#pageTitle').addEventListener('click', () => {
      if(infoCard){ closeInfo(); return; }
      infoCard = document.createElement('div');
      infoCard.className = 'floatcard flowinfo';
      const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
      infoCard.innerHTML = '<label class="fi-label" for="flowNameIn">Workflow name</label>'
        + '<input class="fi-input" id="flowNameIn" type="text" placeholder="Untitled rule" value="' + esc(flowName) + '">'
        + '<label class="fi-label" for="flowDescIn">Description</label>'
        + '<textarea class="fc-area" id="flowDescIn" placeholder="What does this workflow do?">' + esc(flowDesc) + '</textarea>'
        + '<div class="fi-foot" id="flowFoot" hidden><button type="button" class="btn-blue sm" id="flowSave">Save</button></div>';
      document.body.appendChild(infoCard);
      const r = $('#pageTitle').getBoundingClientRect();
      infoCard.style.left = Math.round(Math.max(12, Math.min(r.left - 8, window.innerWidth - infoCard.offsetWidth - 12))) + 'px';
      infoCard.style.top = Math.round(r.bottom + 10) + 'px';
      const nameIn = $('#flowNameIn'), descIn = $('#flowDescIn'), foot = $('#flowFoot');
      const startName = nameIn.value, startDesc = descIn.value;
      const dirty = () => { foot.hidden = nameIn.value === startName && descIn.value === startDesc; };
      const save = () => {
        flowName = nameIn.value.trim() || 'Untitled rule'; flowDesc = descIn.value;
        $('#pageTitle').textContent = flowName;
        document.title = flowName + ' — Workflow';
        closeInfo(); toast('Workflow details saved');
      };
      nameIn.addEventListener('input', dirty);
      descIn.addEventListener('input', dirty);
      nameIn.addEventListener('keydown', ev => { if(ev.key === 'Enter'){ ev.preventDefault(); descIn.focus(); } });
      $('#flowSave').addEventListener('click', save);
      nameIn.focus(); nameIn.select();
      document.addEventListener('mousedown', offInfo, true);
      document.addEventListener('keydown', escInfo, true);
    });
    $('#crumbRoot').addEventListener('click', () => toast('Workflow list is not part of this prototype'));

    $('#viewSwitch').addEventListener('click', e => {
      const b = e.target.closest('[data-view]'); if(!b || b.classList.contains('active')) return;
      if(b.dataset.view === 'simple'){ toast('Simple view is not built in this prototype'); return; }
      $('#viewSwitch').querySelectorAll('.vs-btn').forEach(x => x.classList.toggle('active', x === b));
    });

    const sw = $('#enableSw');
    sw.addEventListener('click', () => {
      const on = !sw.classList.contains('on');
      sw.classList.toggle('on', on);
      sw.setAttribute('aria-checked', String(on));
      sw.querySelector('span').textContent = on ? 'ON' : 'OFF';
      toast('Workflow ' + (on ? 'enabled' : 'disabled'));
    });

    const pill = $('#statePill');
    $('#goBack').addEventListener('click', () => toast('Back to the workflow list — not part of this prototype'));
    const publish = () => { pill.className = 'state-pill live'; pill.textContent = 'Published'; };
    const saveOnly = () => { pill.className = 'state-pill draft'; pill.textContent = 'Draft'; };
    $('#publishFlow').addEventListener('click', () => { publish(); toast('Workflow published'); });
    $('#publishOpts').addEventListener('click', () => {
      WFPop.open({
        anchor: $('#publishOpts'), noSearch:true, menu:true, width:264, align:'end',
        title: 'Save options',
        items: [
          { id:'pub',  label:'Save & publish', sub:'Save changes and make it live' },
          { id:'save', label:'Save only',      sub:'Save changes without publishing' },
        ],
        onPick(i){
          if(i.id === 'pub'){ publish(); toast('Saved and published'); }
          else { saveOnly(); toast('Saved without publishing'); }
        }
      });
    });

    $('#moreMenu').addEventListener('click', () => {
      WFPop.open({
        anchor: $('#moreMenu'), noSearch:true, menu:true, width:212, align:'end',
        items: [
          { id:'dup', label:'Duplicate workflow', icon:'copy' },
          { id:'del', label:'Delete workflow', icon:'delete', danger:true },
        ],
        onPick(i){
          if(i.id === 'dup'){ toast('Workflow duplicated'); return; }
          app.confirm({
            title: 'Delete this workflow?', confirmLabel: 'Delete workflow',
            body: 'Every step will be removed, including the trigger and all its settings. You can undo this right after.',
            onConfirm(){ app.resetFlow(); syncHistory(); toast('Workflow deleted — undo to bring it back'); }
          });
        }
      });
    });

    $('#askAi').addEventListener('click', () => toast('Ask AI is not part of this prototype'));
    document.querySelectorAll('[data-soon]').forEach(b =>
      b.addEventListener('click', () => toast(b.dataset.soon + ' is not part of this prototype')));

    /* --- guide / shortcuts --- */
    $('#guideBtn').addEventListener('click', () => floatCard($('#guideBtn'), GUIDE));
    $('#shortcutsBtn').addEventListener('click', () => floatCard($('#shortcutsBtn'), SHORTCUTS));

    /* --- zoom --- */
    const STEPS = [25, 50, 75, 100, 125, 150, 200];
    let zoom = 100;
    const applyZoom = () => {
      app.setZoom(zoom / 100);
      $('#zoomLevel').textContent = zoom + '%';
    };
    /* snap to the next step above/below wherever the wheel left us */
    const step = dir => {
      const next = dir > 0
        ? STEPS.find(s => s > zoom + 0.5)
        : STEPS.filter(s => s < zoom - 0.5).pop();
      if(next == null) return;
      zoom = next; applyZoom();
    };
    /* ctrl + wheel zooms on the canvas — keep the readout honest */
    app.onZoom(pct => {
      zoom = pct;
      $('#zoomLevel').textContent = pct + '%';
    });
    const fitToView = () => {
      zoom = Math.max(STEPS[0], Math.min(100, Math.round(app.fitScale() * 100)));
      applyZoom(); app.scrollToStart();
    };
    $('#zoomMenu').addEventListener('click', () => {
      WFPop.open({
        anchor: $('#zoomMenu'), noSearch:true, menu:true, width:224, align:'start',
        items: [
          { id:'in',   label:'Zoom in',        icon:'n-plus',     tag:'Ctrl +' },
          { id:'out',  label:'Zoom out',       icon:'n-act-more', tag:'Ctrl −' },
          { id:'50',   label:'Zoom to 50%' },
          { id:'100',  label:'Zoom to 100%',   tag:'Ctrl 0' },
          { id:'200',  label:'Zoom to 200%' },
          { divider:true },
          { id:'fit',  label:'Fit to view' },
        ],
        onPick(i){
          if(i.id === 'in') return step(1);
          if(i.id === 'out') return step(-1);
          if(i.id === 'fit') return fitToView();
          zoom = +i.id; applyZoom();
        }
      });
    });
    applyZoom();

    /* ---- hand vs select tool ---- */
    const setTool = t => {
      app.setTool(t);
      $('#toolPan').classList.toggle('active', t === 'pan');
      $('#toolSelect').classList.toggle('active', t === 'select');
    };
    $('#toolPan').addEventListener('click', () => setTool('pan'));
    $('#toolSelect').addEventListener('click', () => setTool('select'));

    /* --- history --- */
    const syncHistory = () => {
      $('#doUndo').disabled = !app.canUndo();
      $('#doRedo').disabled = !app.canRedo();
    };
    $('#doUndo').addEventListener('click', () => { app.undo(); syncHistory(); });
    $('#doRedo').addEventListener('click', () => { app.redo(); syncHistory(); });
    $('#doReset').addEventListener('click', () => app.confirm({
      title: 'Reset the whole workflow?', confirmLabel: 'Reset workflow',
      body: 'Every step will be removed, including the trigger and all its settings. You can undo this right after.',
      onConfirm(){ app.resetFlow(); syncHistory(); toast('Workflow reset — undo to bring it back'); }
    }));
    app.onHistory(syncHistory);
    syncHistory();

    document.addEventListener('keydown', e => {
      if(e.target.matches('input,textarea,select')) return;
      if(e.key === '?'){ e.preventDefault(); floatCard($('#shortcutsBtn'), SHORTCUTS); return; }
      if(!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if(k === 'z' && !e.shiftKey){ e.preventDefault(); app.undo(); syncHistory(); }
      else if((k === 'z' && e.shiftKey) || k === 'y'){ e.preventDefault(); app.redo(); syncHistory(); }
    });
  }

  function start(){
    if(!window.WFApp){ setTimeout(start, 20); return; }   // chrome loads before the app boots
    wire(build());
    initTips();
  }
  document.addEventListener('DOMContentLoaded', start);
})();
