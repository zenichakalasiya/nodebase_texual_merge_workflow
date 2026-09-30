/* App chrome — the product frame around the canvas.

   · application bar (row 1): panel toggle, logo, Ask AI, quick actions, avatar
   · page bar (row 2):  Workflows / <name> · state pill   (Simple|Node view centred)
                        · Simple|Node view switch          — left
                        Enabled · Save As Draft · Publish · history · ⋮ — right
   · a floating toolbar centred at the bottom of the canvas, in priority order:
       guide/shortcuts (rare) · view (zoom −/%/+/fit + direction, high-frequency,
       minimap floats above this group when zoomed out/in far or content
       overflows the viewport) · canvas mode (hand/select/note, high-frequency) ·
       history (undo/redo/reset, high-frequency, Reset isolated last)

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
    close:    '<path d="M6 6l12 12M18 6 6 18"/>',
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
    note:     '<path d="M6 4h9l5 5v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/><path d="M14.5 4.2V9a1 1 0 0 0 1 1h4.3"/><path d="M8.5 13h7M8.5 16.5h4.5"/>',
    /* node-reference icons — one per row of the Guide card */
    bolt:     '<path d="M13 3 5 13.5h5.5L10 21l8-10.5h-5.5L13 3Z"/>',
    play2:    '<path d="M7 4.5v15l13-7.5-13-7.5Z"/>',
    layers:   '<path d="M12 3.5 20.5 8 12 12.5 3.5 8 12 3.5Z"/><path d="M3.5 12.5 12 17l8.5-4.5"/><path d="M3.5 16.5 12 21l8.5-4.5"/>',
    hourglass:'<path d="M6.5 3h11M6.5 21h11M7.5 3c0 4.2 3 5.4 4.5 6.5-1.5 1.1-4.5 2.3-4.5 6.5M16.5 3c0 4.2-3 5.4-4.5 6.5 1.5 1.1 4.5 2.3 4.5 6.5"/>',
    diamond:  '<path d="M12 3.5 20.5 12 12 20.5 3.5 12 12 3.5Z"/>',
    loop:     '<path d="M17 2.5l4 4-4 4"/><path d="M3 12.5v-2a4 4 0 0 1 4-4h14"/><path d="M7 21.5l-4-4 4-4"/><path d="M21 11.5v2a4 4 0 0 1-4 4H3"/>',
    /* fork/split glyph — one trunk forking into two arrows. Used for the
       Guide card's "Split path" row (the layout-direction switch this icon
       was originally built for is gone; the builder is horizontal-only now). */
    forkH:    '<path d="M2 12h3.5c2.8 0 2.8-5 6-5H17"/><path d="M14 3.5 19 7l-5 3.5"/><path d="M2 12h3.5c2.8 0 2.8 5 6 5H17"/><path d="M14 20.5 19 17l-5-3.5"/>',
    /* Run History — a bulleted log/list, distinct from Version History's
       circular clock-with-arrow so the two never get confused at a glance
       even sitting right next to each other. (A thin pulse-trace was tried
       first and read as noise at 16px — too close to Version History's own
       curved shape once shrunk down.) */
    activity: '<circle cx="4" cy="6" r="1.4" fill="currentColor" stroke="none"/><path d="M9 6h11"/><circle cx="4" cy="12" r="1.4" fill="currentColor" stroke="none"/><path d="M9 12h11"/><circle cx="4" cy="18" r="1.4" fill="currentColor" stroke="none"/><path d="M9 18h11"/>',
    eye:      '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    restore:  '<path d="M3 12a9 9 0 1 0 2.6-6.4"/><path d="M3 4v5h5"/>',
  };
  const svg = (k, cls) => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor"`
    + ` stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k]}</svg>`;
  /* a tooltip's data-tip, with its keyboard shortcut set as its own small
     badges (matching the Shortcuts card's own <kbd> styling) instead of
     buried in the label as plain text */
  const tipKeys = (label, ...keys) => label + keys.map(k => `<kbd>${k}</kbd>`).join('');

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
        + `<span class="page-title" id="pageTitle" title="Click to rename">Untitled rule</span>`
        + `<span class="state-pill draft" id="statePill">Draft</span>`
      + `</div>`
      /* Simple | Node — centred on the bar, independent of the breadcrumb and actions */
      + `<div class="viewswitch" id="viewSwitch">`
        + `<button class="vs-btn" type="button" data-view="simple">${svg('simple')}Linear</button>`
        + `<button class="vs-btn active" type="button" data-view="node">${svg('nodes')}Node</button>`
      + `</div>`
      + `<div class="pagebar-right">`
        + `<div class="enable-row"><span>Enabled</span>`
          + `<button class="switch on" id="enableSw" role="switch" aria-checked="true"><span>ON</span><i></i></button></div>`
        + `<button class="btn-outline" id="runHistBtn" data-tip="Run history&nbsp;&nbsp;read-only while open" hidden>${svg('activity')}Run history<span class="run-badge" id="runBadge" hidden></span></button>`
        + `<div class="split">`
          + `<button class="btn-blue" id="publishFlow">Publish</button>`
          + `<button class="split-caret" id="publishOpts" data-tip="Save options" aria-label="Save options">${svg('chevD')}</button>`
        + `</div>`
        + `<span class="pagebar-sep"></span>`
        + `<button class="cbtn bordered" id="versionHistBtn" data-tip="Version history" aria-label="Version history">${svg('history')}</button>`
        + `<span class="pagebar-sep"></span>`
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

    /* One floating toolbar, centred under the canvas — a single card, same
       overall footprint throughout. The view controls (zoom, fit) lead now,
       then Guide + Shortcuts (still one continuous group, no divider
       between them — both are "how do I use this" affordances; Note used
       to share this group too but is hidden for now), then Undo/Redo/Reset
       — each group told apart by a divider only, never separate floating
       pills. The layout-direction switch that used to sit here is gone —
       this workflow builder is horizontal-only now, so there's nothing to
       switch, and zoom moved into the room that freed up. */
    const bar = document.createElement('div');
    bar.className = 'bottombar';
    bar.innerHTML =
      `<div class="bbar view-bbar" id="viewGroup">`
        + `<div class="minimap" id="minimap" hidden><svg id="minimapSvg" viewBox="0 0 120 78"></svg></div>`
        + `<button class="cbtn" id="zoomOutBtn" data-tip="Zoom out">${svg('zoomOut')}</button>`
        + `<button class="zoom-label" id="zoomMenu" data-tip="Zoom presets"><span id="zoomLevel">100%</span></button>`
        + `<button class="cbtn" id="zoomInBtn" data-tip="Zoom in">${svg('zoomIn')}</button>`
        + `<span class="bbar-sep"></span>`
        + `<button class="cbtn" id="fitBtn" data-tip="Fit to screen">${svg('fit')}</button>`
      + `</div>`
      + `<span class="bbar-sep"></span>`
      + `<div class="bbar">`
        + `<button class="cbtn" id="guideBtn" data-tip="Guide">${svg('bulb')}</button>`
        + `<button class="cbtn" id="shortcutsBtn" data-tip="${tipKeys('Keyboard shortcuts', '?')}">${svg('command')}</button>`
        + `<button class="cbtn tool" id="toolNote" data-tip="Note&nbsp;&nbsp;click the canvas to place one" hidden>${svg('note')}</button>`
      + `</div>`
      + `<span class="bbar-sep"></span>`
      + `<div class="bbar">`
        + `<button class="cbtn" id="doUndo" data-tip="${tipKeys('Undo', '⌘/Ctrl', 'Z')}">${svg('undo')}</button>`
        + `<button class="cbtn" id="doRedo" data-tip="${tipKeys('Redo', '⌘/Ctrl', '⇧', 'Z')}">${svg('redo')}</button>`
        + `<button class="bbar-text" id="doReset" data-tip="${tipKeys('Reset', '⇧', 'R')}">${svg('reset')}Reset</button>`
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

  /* ---------------------------------------------------------- Guide /
     Shortcuts content — now built straight into the right-hand sidebar
     (see #guideCfg/#shortcutsCfg in workflow-canvas.html) instead of an
     instant floatcard popup; the old floatCard()/closeCard() machinery and
     its dark-adjacent CSS are gone entirely, since nothing else used them. */
  /* one row per node this product has a concept for — Trigger and the two
     that actually build (Condition, Split path) work today; the rest are
     catalogued the same way the node picker catalogues them, so the guide
     never claims more than the app can do. */
  const NODE_REF = [
    { group:'Start', rows:[
      { icon:'bolt', tone:'util', title:'Trigger', desc:'The event that starts your workflow.' },
    ] },
    { group:'Steps', rows:[
      { icon:'play2', tone:'do', title:'Action', desc:'The work your workflow actually does.' },
      { icon:'layers', tone:'util', title:'Get', desc:'Pulls in records so later steps can use them.' },
      { icon:'hourglass', tone:'util', title:'Wait', desc:'Pauses the workflow before moving on.' },
    ] },
    { group:'Flow', rows:[
      { icon:'diamond', tone:'if', title:'Condition', desc:'A yes or no check that decides which steps run.' },
      { icon:'forkH', tone:'split', title:'Split path', desc:'Runs several paths at once, each with its own check.' },
      { icon:'loop', tone:'util', title:'Loop', desc:'Repeats the same steps for every item in a list.' },
    ] },
  ];
  const GUIDE = `<div class="fc-noderef">` + NODE_REF.map(g => `<div class="fc-nr-group">${g.group}</div>`
      + g.rows.map(r => `<div class="fc-nr-row"><span class="fc-nr-ico tone-${r.tone}">${svg(r.icon)}</span>`
        + `<span class="fc-nr-text"><b>${r.title}</b><span>${r.desc}</span></span>`
        + `<span class="fc-nr-chev">${svg('chevR')}</span></div>`).join('')).join('')
    + `</div>`
    + `<button class="fc-walkthrough" type="button" id="fcWalkthrough">Walkthrough</button>`;
  /* every row here is a shortcut that actually works — see the keydown
     handler below and Undo/Redo/Reset's own tooltips, which carry the same
     badges so the two places never drift out of sync. Description on the
     left, key badge(s) right-aligned — a shortcuts list reads left→right as
     "what it does ⋯⋯ the keys", not the other way round. */
  const SHORTCUTS = `<dl class="fc-keys">`
    + [[['⌘/Ctrl','Z'],'Undo'],[['⌘/Ctrl','⇧','Z'],'Redo'],[['⇧','R'],'Reset the whole workflow'],
       [['Delete'],'Delete the selected node'],[['↑','↓'],'Move through a menu'],
       [['Enter'],'Choose the highlighted row'],[['Esc'],'Close a menu, popover, or confirm dialog'],[['?'],'This panel']]
      .map(([keys, v]) => `<dt>${v}</dt><dd>${keys.map(k => `<kbd>${k}</kbd>`).join('')}</dd>`).join('') + `</dl>`;

  /* ---------------------------------------------------------- behaviour */
  function wire(parts){
    const { nav, hot, handle } = parts;
    const app = window.WFApp;
    const toast = app.toast;

    /* Simple/Node view stays visually centred on the page bar — but "centred"
       is computed from the LEFT and RIGHT zones' actual rendered widths, not
       assumed via CSS 50%. Left grows with a longer workflow name; right
       grows every time a new action earns a permanent header slot (Run
       history is the one that lives there now). Recomputed whenever
       either can plausibly have changed, so the switch slides toward
       whichever side has room instead of ever being covered by it. */
    const GAP = 16;
    function positionViewSwitch(){
      const bar = $('.pagebar'), left = $('.pagebar-left'), right = $('.pagebar-right'), vs = $('#viewSwitch');
      if(!bar || !left || !right || !vs) return;
      const barW = bar.getBoundingClientRect().width;
      const leftW = left.getBoundingClientRect().width, rightW = right.getBoundingClientRect().width;
      const vsW = vs.getBoundingClientRect().width;
      const trueCenter = (barW - vsW) / 2;
      const safeLeft = Math.max(leftW + GAP, Math.min(trueCenter, barW - rightW - GAP - vsW));
      vs.style.left = Math.round(safeLeft) + 'px';
      /* only the horizontal position is ours to set — top:50%/translateY(-50%)
         (in CSS) still does the vertical centring; overwriting the whole
         transform here (an earlier bug) cancelled that Y-offset and pushed
         the switch half its own height downward, clipping it against the bar */
    }
    let posT;
    window.addEventListener('resize', () => { clearTimeout(posT); posT = setTimeout(positionViewSwitch, 100); });

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

    /* Flow Details — workflow name + description now live in the same
       right-hand sidebar every node's config uses, not a one-off floating
       card. Live-write like every other drawer (no Save button); the ONE
       thing that makes this drawer different is that BOTH fields are
       mandatory, checked specifically when Publish is pressed — same
       error-only-after-you've-moved-on convention as a node's own fields
       (`fdChecked` mirrors a node's `checked`), just gated on a deliberate
       action instead of losing focus. */
    let fdChecked = false;
    function fdMissing(){
      const miss = [];
      if(!flowName.trim()) miss.push('name');
      if(!flowDesc.trim()) miss.push('description');
      return miss;
    }
    function syncFlowDetailsValidity(){
      const miss = fdChecked ? fdMissing() : [];
      $('#fdNameBox').classList.toggle('invalid', miss.includes('name'));
      $('#fdDescBox').classList.toggle('invalid', miss.includes('description'));
      const alert = $('#fdAlert');
      alert.classList.toggle('hidden', !miss.length);
      if(!miss.length) return;
      const names = miss.map(m => m === 'name' ? 'Workflow Name' : 'Description');
      alert.innerHTML = `<img src="assets/n-warning-red.svg" alt="">`
        + `<div class="cfg-alert-text"><b>${names.length} required field${names.length > 1 ? 's are' : ' is'} still empty.</b> `
        + `Fill in ${names.join(', ')} before publishing.</div>`;
    }
    function openFlowDetails(){
      $('#fdName').value = flowName;
      $('#fdDesc').value = flowDesc;
      app.openFlowDetails();
      syncFlowDetailsValidity();
    }
    $('#pageTitle').title = 'Edit name and description';
    $('#pageTitle').addEventListener('click', openFlowDetails);
    $('#fdClose').addEventListener('click', () => app.closeFlowDetails());
    $('#fdName').addEventListener('input', e => {
      flowName = e.target.value;
      $('#pageTitle').textContent = flowName.trim() || 'Untitled rule';
      document.title = (flowName.trim() || 'Untitled rule') + ' — Workflow';
      syncFlowDetailsValidity();
      positionViewSwitch();            // the name's new length may have changed the left zone's width
    });
    $('#fdDesc').addEventListener('input', e => { flowDesc = e.target.value; syncFlowDetailsValidity(); });
    /* Publish (both the main button and "Save & publish") is blocked until
       both fields are filled — opens this same drawer instead of publishing,
       so there's one honest place to fix it rather than a second modal. */
    function requireFlowDetails(){
      if(!fdMissing().length) return true;
      fdChecked = true;
      openFlowDetails();
      toast('Add a workflow name and description before publishing');
      return false;
    }

    $('#viewSwitch').addEventListener('click', e => {
      const b = e.target.closest('[data-view]'); if(!b || b.classList.contains('active')) return;
      if(b.dataset.view === 'simple'){ toast('Linear view is not built in this prototype'); return; }
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

    /* ---------------------------------------------------------------------
       Version history + Run history. This prototype has no backend, so both
       are simulated locally — a version snapshot is captured on every
       Publish (never on a plain edit, since there's no Save step to hang it
       off), and a handful of plausible run rows are seeded alongside it so
       the panel isn't permanently empty in a demo. Run history itself is
       real in structure (paginated list, status per row) even though the
       runs themselves are mocked — see CLAUDE.md for why. */
    const AUTHOR = 'Zeni Chakalasiya';                    // matches the "ZE" avatar already in the top bar
    let versions = [], versionSeq = 0;                    // newest first
    let runs = [], runSeq = 0;                            // newest first
    let everPublished = false;
    const RUN_TRIGGERS = ['Incident #4521 created', 'Incident #4498 priority updated', 'Service Request #1187 created', 'Incident #4512 status changed'];
    const fmtDate = ts => new Date(ts).toLocaleString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' });
    const timeAgo = ts => {
      const s = Math.round((Date.now() - ts) / 1000);
      if(s < 60) return 'just now';
      if(s < 3600) return Math.round(s / 60) + 'm ago';
      if(s < 86400) return Math.round(s / 3600) + 'h ago';
      return Math.round(s / 86400) + 'd ago';
    };
    function updateRunBadge(){
      const badge = $('#runBadge'), recent = runs.slice(0, 10);
      const bad = recent.some(r => r.status === 'error') ? 'err' : recent.some(r => r.status === 'warning') ? 'warn' : null;
      badge.hidden = !bad;
      badge.className = 'run-badge' + (bad ? ' ' + bad : '');
    }
    function addMockRuns(n){
      const statuses = ['success','success','success','warning','error'];
      for(let i = 0; i < n; i++){
        runSeq++;
        runs.unshift({
          n: runSeq,
          trigger: RUN_TRIGGERS[Math.floor(Math.random() * RUN_TRIGGERS.length)],
          ts: Date.now() - Math.floor(Math.random() * 3 * 86400000),
          duration: (0.4 + Math.random() * 2.2).toFixed(1) + 's',
          status: statuses[Math.floor(Math.random() * statuses.length)],
        });
      }
      runs.sort((a, b) => b.ts - a.ts);
      updateRunBadge();
    }

    /* Version History replaces the drawer instead of opening a modal, same
       mechanism as Run History right below: app.openVersionHistory() swaps
       the drawer's content and puts the canvas into read-only mode; this
       function only builds the row markup. Restore still runs through
       app.confirm() as a deliberate, explicit action — the read-only lock
       only blocks direct canvas manipulation (drag, +, Undo/Redo/Reset), not
       a panel's own buttons. */
    function versionHistoryRowsHtml(){
      if(!versions.length) return `<div class="wfm-empty">No versions yet — publish your workflow to create the first one.</div>`;
      return versions.map(v => `<div class="vh-row">`
        + `<div class="vh-row-top"><span class="vh-title">Version v${v.n}</span>${v.published ? '<span class="state-pill live">Published</span>' : ''}</div>`
        + `<div class="vh-meta">${v.author} · ${fmtDate(v.ts)}</div>`
        + `<div class="vh-actions">`
          + `<button class="vh-act" type="button" data-a="view" data-i="${v.n}">${svg('eye')}View</button>`
          + `<button class="vh-act" type="button" data-a="restore" data-i="${v.n}">${svg('restore')}Restore</button>`
        + `</div>`
      + `</div>`).join('');
    }
    $('#vhList').addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if(!b) return;
      const v = versions.find(x => x.n === +b.dataset.i); if(!v) return;
      if(b.dataset.a === 'view') toast('Viewing Version v' + v.n + ' — read-only preview is not part of this prototype');
      else app.confirm({
        title: 'Restore Version v' + v.n + '?',
        body: 'This replaces the current draft with this version’s configuration. You can undo this right after.',
        confirmLabel: 'Restore version',
        onConfirm(){ toast('Restored Version v' + v.n); }
      });
    });
    /* Run History replaces the drawer instead of opening a modal (per
       explicit decision — see CLAUDE.md): app.openRunHistory() swaps the
       drawer's content and puts the canvas into read-only mode; this
       function only builds the row markup, the same shape the old modal
       used, just handed to a different container. No pagination here —
       the sidebar is a scroll list, matching every other drawer panel. */
    function runHistoryRowsHtml(){
      if(!runs.length) return `<div class="wfm-empty">${everPublished ? 'No runs yet — this workflow hasn’t been triggered.' : 'No runs yet — publish your workflow to start collecting run history.'}</div>`;
      return runs.map(r => `<div class="rh-row">`
        + `<span class="rh-dot ${r.status}"></span>`
        + `<div class="rh-main"><span class="rh-title">Run #${r.n}</span><span class="rh-meta">${r.trigger} · ${timeAgo(r.ts)} · ${r.duration}</span></div>`
        + `<span class="rh-status ${r.status}">${r.status[0].toUpperCase() + r.status.slice(1)}</span>`
        + `<button class="rh-view" type="button" data-a="detail">View details</button>`
      + `</div>`).join('');
    }
    $('#versionHistBtn').addEventListener('click', () => app.openVersionHistory(versionHistoryRowsHtml()));
    $('#runHistBtn').addEventListener('click', () => app.openRunHistory(runHistoryRowsHtml()));
    $('#rhList').addEventListener('click', e => {
      if(e.target.closest('[data-a="detail"]')) toast('Run detail view is not part of this prototype');
    });
    /* #rhClose/#vhClose's own clicks are wired in workflow-app.js, right
       alongside the other drawers' close buttons — they own the
       drawer/read-only mechanics */

    const publish = () => {
      pill.className = 'state-pill live'; pill.textContent = 'Published';
      const firstTime = !everPublished; everPublished = true;
      versions.forEach(v => v.published = false);
      versionSeq++;
      versions.unshift({ n: versionSeq, author: AUTHOR, ts: Date.now(), published: true });
      addMockRuns(firstTime ? 4 : 1);
      positionViewSwitch();            // "Draft" → "Published" changes the pill's width
    };
    const saveOnly = () => { pill.className = 'state-pill draft'; pill.textContent = 'Draft'; positionViewSwitch(); };
    $('#publishFlow').addEventListener('click', () => { if(!requireFlowDetails()) return; publish(); toast('Workflow published'); });
    $('#publishOpts').addEventListener('click', () => {
      WFPop.open({
        anchor: $('#publishOpts'), noSearch:true, menu:true, width:264, align:'end',
        title: 'Save options',
        items: [
          { id:'pub',  label:'Save & Publish',  sub:'Save changes and make it live' },
          { id:'save', label:'Save as draft',   sub:'Save changes without publishing' },
        ],
        onPick(i){
          if(i.id === 'pub'){ if(!requireFlowDetails()) return; publish(); toast('Saved and published'); }
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
    function openGuide(){ $('#guideBody').innerHTML = GUIDE; app.openGuide(); }
    function openShortcuts(){ $('#shortcutsBody').innerHTML = SHORTCUTS; app.openShortcuts(); }
    /* blocked during read-only (Run/Version History open) — otherwise
       closing Guide/Shortcuts afterward would leave readOnly stuck true
       with nothing on screen able to clear it, since only Run/Version
       History's own close button resets that flag */
    $('#guideBtn').addEventListener('click', () => { if(!app.isReadOnly()) openGuide(); });
    $('#shortcutsBtn').addEventListener('click', () => { if(!app.isReadOnly()) openShortcuts(); });
    $('#guideClose').addEventListener('click', () => app.closeGuide());
    $('#shortcutsClose').addEventListener('click', () => app.closeShortcuts());
    document.addEventListener('click', e => {
      if(e.target.closest('#fcWalkthrough')) toast('Walkthrough is not designed yet');
    });

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
    $('#zoomOutBtn').addEventListener('click', () => step(-1));
    $('#zoomInBtn').addEventListener('click', () => step(1));
    $('#fitBtn').addEventListener('click', fitToView);
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

    /* ---- canvas mode: Note is the only one left to toggle — dragging a node
       always moves it and dragging empty canvas always pans it now (see the
       matching change in workflow-app.js), the way every other canvas tool's
       default cursor already behaves, so there's no Hand/Select mode to pick
       between any more. Note is still one-shot: placing a note hands control
       back on its own (app.onToolChange below), so the app can drop the
       highlight without a second click here. ---- */
    const setTool = t => { app.setTool(t); $('#toolNote').classList.toggle('active', t === 'note'); };
    $('#toolNote').addEventListener('click', () => setTool('note'));
    app.onToolChange(setTool);

    /* ---- minimap: only surfaces below 50% zoom or above 150% zoom, or
       when the flow's own reach beyond the visible canvas means some of it
       is genuinely out of sight at a normal zoom — not a permanent fixture.
       Two distinct gestures, same as a map app: a click on the background
       eases the main view over to that point; a drag that starts ON the
       viewport rectangle instead tracks the pointer 1:1, live, with no
       easing — dragging IS panning, so it can't lag behind the hand. */
    const MM_W = 120, MM_H = 78, MM_PAD = 6;
    const TYPE_FILL = { trigger:'#a9c3de', ifelse:'#f5c99a', branch:'#f5c99a', lane:'#f2b96b', note:'#e8cf6e' };
    let mm = null;                                        // last draw's world→minimap mapping, for click/drag
    let lastView = null;                                  // latest onViewChange payload, read at gesture start
    const minimapEl = $('#minimap'), minimapSvg = $('#minimapSvg');
    function drawMinimap(view){
      const rects = app.overviewRects();
      if(!rects.length){ mm = null; return; }
      let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
      rects.forEach(r => { minX=Math.min(minX,r.x); minY=Math.min(minY,r.y); maxX=Math.max(maxX,r.x+r.w); maxY=Math.max(maxY,r.y+r.h); });
      const w = Math.max(1, maxX-minX), h = Math.max(1, maxY-minY);
      const scale = Math.min((MM_W-MM_PAD*2)/w, (MM_H-MM_PAD*2)/h);
      const ox = MM_PAD + ((MM_W-MM_PAD*2)-w*scale)/2 - minX*scale;
      const oy = MM_PAD + ((MM_H-MM_PAD*2)-h*scale)/2 - minY*scale;
      mm = { minX, minY, scale, ox, oy };
      /* a faint dot grid behind the nodes, echoing the real canvas's own —
         purely decorative texture so the map never reads as a blank card */
      let out = `<defs><pattern id="mmDots" width="7" height="7" patternUnits="userSpaceOnUse">`
        + `<circle cx="1" cy="1" r="0.55" fill="#d8e0ea"/></pattern></defs>`
        + `<rect x="0" y="0" width="${MM_W}" height="${MM_H}" fill="url(#mmDots)"/>`;
      out += rects.map(r =>
        `<rect x="${(r.x*scale+ox).toFixed(1)}" y="${(r.y*scale+oy).toFixed(1)}" width="${Math.max(1.4,r.w*scale).toFixed(1)}" height="${Math.max(1.4,r.h*scale).toFixed(1)}" rx="1" fill="${TYPE_FILL[r.type]||'#c7d0dc'}"/>`
      ).join('');
      const cs = app.canvasSize();
      const vx = -view.panX/view.zoom, vy = -view.panY/view.zoom, vw = cs.w/view.zoom, vh = cs.h/view.zoom;
      out += `<rect class="mm-view" x="${(vx*scale+ox).toFixed(1)}" y="${(vy*scale+oy).toFixed(1)}" width="${(vw*scale).toFixed(1)}" height="${(vh*scale).toFixed(1)}" rx="2"/>`;
      minimapSvg.innerHTML = out;
    }
    app.onViewChange(view => {
      lastView = view;
      const cs = app.canvasSize();
      let show = false;
      if(view.content && cs.w && cs.h){
        const cw = (view.content.maxX - view.content.minX) * view.zoom;
        const ch = (view.content.maxY - view.content.minY) * view.zoom;
        show = view.zoom < .5 || view.zoom > 1.5 || cw > cs.w * 1.15 || ch > cs.h * 1.15;
      }
      minimapEl.hidden = !show;
      if(show) drawMinimap(view);
    });

    /* click-to-recenter: eases the world point under the click to the centre
       of the main viewport. A fresh click cancels whatever ease is still
       running so clicks never queue up or fight each other. */
    let mmEase = null;
    function mmEaseTo(wx, wy){
      if(!lastView) return;
      if(mmEase) cancelAnimationFrame(mmEase.raf);
      const cs = app.canvasSize(), zoom = lastView.zoom;
      const wx0 = (cs.w / 2 - lastView.panX) / zoom, wy0 = (cs.h / 2 - lastView.panY) / zoom;
      const dur = 260, t0 = performance.now();
      const ease = t => 1 - Math.pow(1 - t, 3);                       // ease-out cubic
      const step = now => {
        const t = Math.min(1, (now - t0) / dur), e = ease(t);
        app.panTo(wx0 + (wx - wx0) * e, wy0 + (wy - wy0) * e);
        mmEase = t < 1 ? { raf: requestAnimationFrame(step) } : null;
      };
      mmEase = { raf: requestAnimationFrame(step) };
    }

    /* drag-to-pan: mousedown ON the rectangle itself only. Tracked as a
       pointer-delta from the rectangle's own start position (not "point
       under cursor", which would jump the rectangle under the pointer on
       the very first pixel of movement) and clamped so the rectangle can
       never be dragged past the minimap's own padded edges. */
    let mmDrag = null;
    function mmDragStart(e){
      if(!mm || !lastView) return;
      if(mmEase){ cancelAnimationFrame(mmEase.raf); mmEase = null; }
      const cs = app.canvasSize(), zoom = lastView.zoom;
      const vw = cs.w / zoom, vh = cs.h / zoom;
      const centerWx = (cs.w / 2 - lastView.panX) / zoom, centerWy = (cs.h / 2 - lastView.panY) / zoom;
      const rectPxW = vw * mm.scale, rectPxH = vh * mm.scale;
      const loX = (MM_PAD - mm.ox) / mm.scale + vw / 2, hiX = (MM_W - MM_PAD - rectPxW - mm.ox) / mm.scale + vw / 2;
      const loY = (MM_PAD - mm.oy) / mm.scale + vh / 2, hiY = (MM_H - MM_PAD - rectPxH - mm.oy) / mm.scale + vh / 2;
      mmDrag = {
        startX: e.clientX, startY: e.clientY, centerWx, centerWy, scale: mm.scale,
        clampX: [Math.min(loX, hiX), Math.max(loX, hiX)], clampY: [Math.min(loY, hiY), Math.max(loY, hiY)]
      };
      minimapEl.classList.add('dragging');
      e.preventDefault(); e.stopPropagation();
    }
    function mmDragMove(e){
      if(!mmDrag) return;
      const r = minimapSvg.getBoundingClientRect();
      const dMmX = (e.clientX - mmDrag.startX) * (MM_W / r.width), dMmY = (e.clientY - mmDrag.startY) * (MM_H / r.height);
      const wx = mmDrag.centerWx + dMmX / mmDrag.scale, wy = mmDrag.centerWy + dMmY / mmDrag.scale;
      app.panTo(
        Math.min(mmDrag.clampX[1], Math.max(mmDrag.clampX[0], wx)),
        Math.min(mmDrag.clampY[1], Math.max(mmDrag.clampY[0], wy))
      );
    }
    function mmDragEnd(){
      if(!mmDrag) return;
      mmDrag = null;
      minimapEl.classList.remove('dragging');
    }
    minimapEl.addEventListener('mousedown', e => {
      if(e.target.classList.contains('mm-view')){ mmDragStart(e); return; }
      if(!mm) return;
      const r = minimapSvg.getBoundingClientRect();
      const px = (e.clientX - r.left) * (MM_W / r.width), py = (e.clientY - r.top) * (MM_H / r.height);
      mmEaseTo((px - mm.ox) / mm.scale, (py - mm.oy) / mm.scale);
      e.preventDefault();
    });
    window.addEventListener('mousemove', mmDragMove);
    window.addEventListener('mouseup', mmDragEnd);

    /* --- history --- */
    const syncHistory = () => {
      $('#doUndo').disabled = !app.canUndo();
      $('#doRedo').disabled = !app.canRedo();
    };
    $('#doUndo').addEventListener('click', () => { if(app.isReadOnly()) return; app.undo(); syncHistory(); });
    $('#doRedo').addEventListener('click', () => { if(app.isReadOnly()) return; app.redo(); syncHistory(); });
    $('#doReset').addEventListener('click', () => {
      if(app.isReadOnly()) return;
      app.confirm({
        title: 'Reset the whole workflow?', confirmLabel: 'Reset workflow',
        body: 'Every step will be removed, including the trigger and all its settings. You can undo this right after.',
        onConfirm(){ app.resetFlow(); syncHistory(); toast('Workflow reset — undo to bring it back'); }
      });
    });
    app.onHistory(syncHistory);
    syncHistory();

    document.addEventListener('keydown', e => {
      if(e.target.matches('input,textarea,select')) return;
      if(e.key === '?'){ e.preventDefault(); if(!app.isReadOnly()) openShortcuts(); return; }
      if(e.key === 'Escape'){
        if(app.isReadOnly()) app.closeRunHistory();   // Esc leaves Run History same as any other panel
        return;
      }
      if(app.isReadOnly()) return;                          // nothing below this line edits anything
      /* Backspace already means "go back a level" inside an open picker
         (workflow-popover.js) — only read it as "delete" when nothing's open */
      if((e.key === 'Delete' || e.key === 'Backspace') && !window.WFPop.isOpen()){ app.deleteSelected(); return; }
      const k = e.key.toLowerCase();
      if(e.shiftKey && !(e.ctrlKey || e.metaKey) && k === 'r'){ e.preventDefault(); $('#doReset').click(); return; }
      if(!(e.ctrlKey || e.metaKey)) return;
      if(k === 'z' && !e.shiftKey){ e.preventDefault(); app.undo(); syncHistory(); }
      else if((k === 'z' && e.shiftKey) || k === 'y'){ e.preventDefault(); app.redo(); syncHistory(); }
    });

    positionViewSwitch();
  }

  function start(){
    if(!window.WFApp){ setTimeout(start, 20); return; }   // chrome loads before the app boots
    wire(build());
    initTips();
  }
  document.addEventListener('DOMContentLoaded', start);
})();
