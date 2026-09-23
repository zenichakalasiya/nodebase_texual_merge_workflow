/* Workflow builder — node canvas + anchored picker popover + config drawer.

   The flow (merged from the textual builder):
     trigger node on canvas  →  click it            →  TRIGGER TYPE popover (Event | Periodic)
                             →  pick a type         →  drawer opens with the trigger's config
                             →  config is complete  →  "Next Node Selection" appears in the drawer
                             →  click a "+" (canvas or drawer)
                                                    →  drawer slides shut, NODE popover opens on the "+"
                             →  pick a node         →  node lands on canvas, drawer opens on its config

   There is no Save button: every keystroke writes straight to the model. A node
   whose required fields are still blank when you move on flips to the error state. */
(function(){
  const $ = (s, r=document) => r.querySelector(s);
  const world = $('#world'), edgesSvg = $('#edges'), dock = $('#dock'), canvasEl = $('#canvas');
  const panels = { trigger: $('#triggerCfg'), branch: $('#branchCfg'), lane: $('#laneCfg'), cond: $('#conditionCfg') };

  /* ---------------------------------------------------------- catalogs */
  const MODULES = ['Request','Incident','Problem','Change','Release','Task','Hardware Asset','Software Asset','User'];
  const ATTRS = ['Status is Changed','Department is Changed','Incident is Changed','Priority is Updated','Assignee is Added','Category is Changed','Impact is Changed'];
  const WEEKDAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const TYPE_LABEL = { trigger:'Trigger', branch:'Branch', lane:'Branch path', cond:'Condition' };

  /* Trigger types — the textual builder's two groups (Record events | Time
     based), shown as one flat list, group headers only — no tab switcher.
     Same rows, same help copy either way. */
  const TRIGGER_ITEMS = {
    event: [
      { header:'Record events' },
      { id:'created', label:'When a record is created', icon:'n-plus', tone:'util', keywords:'create new add raise log open',
        help:{ title:'Record created', body:'Runs the moment a new record of the chosen module is created.', eg:'Like — a new Incident is logged, or a Service Request is raised.' } },
      { id:'changed', label:'When a record is updated', icon:'refresh-ccw', tone:'util', keywords:'update change modify edit field value attribute',
        help:{ title:'Record updated', body:'Runs when a record changes — optionally only when a specific attribute moves from one value to another.', eg:'Like — status goes from Open to Resolved.' } },
      { id:'archived', label:'When a record is archived', icon:'n-act-delete', tone:'util', keywords:'archive delete remove retire close',
        help:{ title:'Record archived', body:'Runs when a record is archived (soft-deleted / moved out of active use).', eg:'Like — an old asset is retired.' } },
    ],
    periodic: [
      { header:'Time based' },
      { id:'once', label:'Once', icon:'n-trig-blue', tone:'util', keywords:'once one time single run date schedule specific',
        help:{ title:'Once', body:'Runs one time, at a specific date and time.', eg:'Like — a one-off cleanup on the 31st at 9am.' } },
      { id:'hourly', label:'Hourly', icon:'repeat', tone:'util', keywords:'hourly every hour periodic recurring repeat',
        help:{ title:'Hourly', body:'Runs every hour, around the clock.', eg:'Like — re-check open tickets each hour.' } },
      { id:'daily', label:'Daily', icon:'repeat', tone:'util', keywords:'daily every day periodic recurring repeat',
        help:{ title:'Daily', body:'Runs once a day, at a time you set.', eg:'Like — every day at 9am.' } },
      { id:'weekly', label:'Weekly', icon:'repeat', tone:'util', keywords:'weekly every week periodic recurring repeat monday',
        help:{ title:'Weekly', body:'Runs once a week, on a day and time you set.', eg:'Like — every Monday at 9am.' } },
      { id:'monthly', label:'Monthly', icon:'repeat', tone:'util', keywords:'monthly every month periodic recurring repeat',
        help:{ title:'Monthly', body:'Runs once a month, on a day and time you set.', eg:'Like — the 1st of every month.' } },
    ]
  };
  const TRIG_LABEL = id => {
    for(const t of ['event','periodic']){ const f = TRIGGER_ITEMS[t].find(i => i.id === id); if(f) return f.label; }
    return 'Trigger';
  };
  const trigTab = id => TRIGGER_ITEMS.event.some(i => i.id === id) ? 'event' : 'periodic';
  const isEventTrig = id => trigTab(id) === 'event';
  /* the picker's own flat view — used only while searching, so a query can
     still reach a recurring type that the top level below keeps collapsed */
  const TRIGGER_FLAT = TRIGGER_ITEMS.event.concat(TRIGGER_ITEMS.periodic);
  /* Time based, collapsed: the top level offers just "Once" and one drill row
     for everything that repeats — its four concrete schedules (same items,
     same help copy) sit one level down, reached by picking that row. */
  const TRIGGER_RECUR = TRIGGER_ITEMS.periodic.slice(2);          // hourly, daily, weekly, monthly
  const TRIGGER_EVERY = { id:'recur', label:'Every time period', icon:'repeat', tone:'util', chevron:true,
    keywords:'hourly daily weekly monthly recurring repeat schedule periodic',
    help:{ title:'Every time period', body:'Runs on a repeating schedule — hourly, daily, weekly, or monthly, whichever you pick next.' } };
  const TRIGGER_TOP = TRIGGER_ITEMS.event.concat([TRIGGER_ITEMS.periodic[0], TRIGGER_ITEMS.periodic[1], TRIGGER_EVERY]);

  /* Schedule shapes per periodic trigger type. Every field listed is required. */
  const SCHED = {
    once:    { label:'Run On', fields:[{ k:'date', type:'date', lab:'Date' }, { k:'time', type:'time', lab:'Time' }] },
    hourly:  { label:'Repeat', fields:[{ k:'every', type:'number', lab:'Every (hours)', ph:'1', min:1 }, { k:'minute', type:'number', lab:'At minute', ph:'0', min:0, max:59 }] },
    daily:   { label:'Repeat', fields:[{ k:'time', type:'time', lab:'At time' }] },
    weekly:  { label:'Repeat', fields:[{ k:'day', type:'select', lab:'On day', opts:WEEKDAYS }, { k:'time', type:'time', lab:'At time' }] },
    monthly: { label:'Repeat', fields:[{ k:'dom', type:'number', lab:'Day of month', ph:'1', min:1, max:31 }, { k:'time', type:'time', lab:'At time' }] },
  };

  /* Node picker — the textual builder's "What happens next" menu, with this
     product's nodes: tinted icon tile, node name, a one-line description, and
     the role tag on the right. `soon` = designed but not built yet. */
  const DOC = 'https://docs.motadata.com/serviceops-docs/admin-section/automation/workflow/#purpose-audience-and-scope';
  const NODE_CATALOG = [
    { label:'Quick', chips:[
      { id:'q-notify', label:'Notify', icon:'n-trig-blue' },
      { id:'q-create', label:'Create', icon:'n-plus' },
      { id:'q-update', label:'Update', icon:'refresh-ccw' },
    ] },
    { header:'Required' },
    { id:'action', label:'Add action', tag:'do', tone:'do', icon:'play', chevron:true,
      keywords:'action do create update assign close archive record notify send',
      sub:'Do something automatically — assign, notify, update…',
      help:{ eyebrow:'Action', title:'Add action', body:'Do something automatically to the record — assign it, update a field, or send a notification.', more:DOC } },
    { header:'Flow control' },
    { id:'ifelse', label:'Add condition', tag:'if', tone:'if', icon:'split', chevron:true,
      keywords:'if else condition true false split check branch inline add condition',
      sub:'Continue only when a check is true',
      help:{ eyebrow:'Condition', title:'Add condition', body:'Add a check on the flow — a single gate (Inline) that continues only when it passes, or several paths at once (Branching).', eg:'Like — priority is High goes to the escalation path.', more:DOC } },
    { id:'merge', label:'Merge paths', tag:'merge', tone:'util', icon:'split2', chevron:true, soon:true,
      keywords:'merge join combine converge',
      sub:'Bring split paths back into one flow',
      help:{ eyebrow:'Merge', title:'Merge paths', body:'Waits for the paths of a split to finish, then carries on down one shared flow.', more:DOC } },
    { header:'Timing & data' },
    { id:'wait', label:'Add wait', tag:'wait', tone:'util', icon:'refresh-ccw', chevron:true, soon:true,
      keywords:'wait pause delay sleep until time date add wait',
      sub:'Pause for a time, a date, or a condition',
      help:{ title:'Add wait', body:'Holds the workflow here — for a fixed duration, until a date arrives, or until a condition becomes true.', more:DOC } },
    { id:'loop', label:'Loop over records', tag:'loop', tone:'util', icon:'loop-repeat', chevron:true, soon:true,
      keywords:'loop repeat each iterate for every list',
      sub:'Repeat the steps below for each item',
      help:{ eyebrow:'Loop', title:'Loop over records', body:'Runs everything below it once per item — each linked asset, approver, or child ticket.', more:DOC } },
  ];

  /* Second level for every row that shows a chevron: pick the kind of step, then
     its specific shape, then the config panel opens. Mirrors the textual
     builder, where "Add action" / "Add condition" drill before they commit. */
  const SUBMENUS = {
    ifelse: [
      { header:'Condition type' },
      { id:'cond-inline', make:'cond', label:'Inline condition', tag:'if', tone:'if', icon:'split',
        sub:'Continue only when a check passes',
        help:{ eyebrow:'Condition', title:'Inline', body:'A single check that gates the steps after it — they run only when it passes. Adjacent conditions stack into an AND/OR group.', more:DOC } },
      { id:'cond-branch', make:'branch', label:'Branching', tag:'split', tone:'split', icon:'branch',
        sub:'Branch into separate paths, each with its own check',
        help:{ eyebrow:'Branch', title:'Branching', body:'More than two outcomes: each path carries its own check, with a Default for anything that matches none.', more:DOC } },
    ],
    /* generic, module-agnostic actions — which record/module they act on is
       chosen inside the node once it's built; the picker only chooses the verb */
    action: [
      { header:'Record management' },
      { id:'act-create', label:'Create record', tag:'do', tone:'do', icon:'n-plus', soon:true,
        sub:'Create a new record in a module',
        help:{ eyebrow:'Action', title:'Create record', body:'Creates a new record in the module you choose, with the fields you set.', more:DOC } },
      { id:'act-update', label:'Update record', tag:'do', tone:'do', icon:'refresh-ccw', soon:true,
        sub:'Change fields on an existing record',
        help:{ eyebrow:'Action', title:'Update record', body:'Changes one or more fields on a record already in the system.', more:DOC } },
      { id:'act-assign', label:'Assign record', tag:'do', tone:'do', icon:'branch', soon:true,
        sub:'Hand it to a technician or group',
        help:{ eyebrow:'Action', title:'Assign record', body:'Assigns the record to a technician, a group, or by a rule.', more:DOC } },
      { id:'act-close', label:'Close record', tag:'do', tone:'do', icon:'n-act-delete', soon:true,
        sub:'Resolve and close it out',
        help:{ eyebrow:'Action', title:'Close record', body:'Marks the record resolved and closes it out.', more:DOC } },
      { id:'act-archive', label:'Archive record', tag:'do', tone:'do', icon:'n-act-delete', soon:true,
        sub:'Move it out of active use',
        help:{ eyebrow:'Action', title:'Archive record', body:'Archives the record — soft-deletes it out of active use.', more:DOC } },
      { id:'act-link', label:'Link & add', tag:'do', tone:'do', icon:'split2', chevron:true, soon:true,
        sub:'Link records or add a child item',
        help:{ eyebrow:'Action', title:'Link & add', body:'Links this record to another, or adds a child item under it.', more:DOC } },
      { header:'Communicate' },
      { id:'act-notify', label:'Send notification', tag:'notify', tone:'util', icon:'branch', soon:true,
        sub:'Send an email, SMS, or in-app alert',
        help:{ eyebrow:'Communicate', title:'Send notification', body:'Tells someone what happened — by email, SMS, or an in-app alert.', more:DOC } },
    ],
  };
  /* while searching, the sub-levels fold into the results so a leaf is reachable
     without drilling — each parent becomes the heading for its own children */
  const FLAT_CATALOG = NODE_CATALOG.reduce((out, i) => {
    if(i.chips) return out;
    if(SUBMENUS[i.id]) return out.concat([{ header:i.label }], SUBMENUS[i.id].filter(c => !c.header));
    return out.concat([i]);
  }, []);
  const IMPLEMENTED = { cond:1, branch:1 };

  /* ---------------------------------------------------------- state */
  const nodes = {};           // id -> node
  let seq = 0, rootId = null, selId = null;
  let picking = null;         // { parentId, slot } while the node popover is open
  const els = {};             // key -> element
  const born = new Set();     // keys already animated in
  let content = null;         // world-space bounds of the whole diagram

  function mk(type, extra){
    const id = 'n' + (++seq);
    nodes[id] = Object.assign({ id, type, slots:{}, parent:null, title:'', desc:'', checked:false, source:'' }, extra);
    return nodes[id];
  }
  function newTrigger(){ return mk('trigger', { trigType:null, module:'', attrs:[''], sched:{} }); }
  /* A Branch node is a trigger-style card that FANS OUT sideways into lanes. Each
     lane is a real node of its own (type 'lane'): an "if" lane carries a name and
     conditions, the single "else" lane is the Default. Whatever runs after a lane
     hangs off that lane's own `next` slot — never off the Branch card itself.
     `lanes` is ordered: every "if" lane, then the Default (if it exists). A dotted
     "pending" line always ends the row; its "+" asks Or if / Or else. */
  function newBranch(){
    const b = mk('branch', { title:'Branch', lanes:[] });
    addLane(b, 'if');                              // Branch 1 — mandatory, solid line
    return b;
  }
  /* Inline Condition — a single check gating what comes after it. One card,
     no branching: title, source node, grouped conditions, next step — the
     same shape as Trigger, just with a condition instead of an event. */
  function newCondition(){ return mk('cond', { title:'Condition', groups:[newGroup()] }); }
  let brSeq = 0;                                    // kept for history snapshots
  const FIELDS = ['Category','Priority','Status','Department','Assignee','Impact','Urgency'];
  const OPS = ['is','is not','contains','is one of'];
  /* A branch's condition is one or more GROUPS; each group holds one or more
     conditions. `join` on a condition/group is how it links to the one before it
     (And / Or) — the first of each ignores it. */
  const newCond = () => ({ field:'', op:'', value:'', fx:false, join:'and', open:true });
  const newGroup = () => ({ join:'and', conds:[newCond()] });
  function ifLanes(b){ return b.lanes.map(id => nodes[id]).filter(l => l.kind === 'if'); }
  function defaultLane(b){ return b.lanes.map(id => nodes[id]).find(l => l.kind === 'else'); }
  function addLane(b, kind){
    const lane = mk('lane', { kind, parent:b.id, title: kind === 'else' ? 'Default' : 'Branch ' + (ifLanes(b).length + 1),
                              groups: kind === 'else' ? [] : [newGroup()] });
    /* "if" lanes slot in before the Default so the Default always stays last */
    if(kind === 'if'){
      const at = defaultLane(b) ? b.lanes.indexOf(defaultLane(b).id) : b.lanes.length;
      b.lanes.splice(at, 0, lane.id);
    } else b.lanes.push(lane.id);
    b.slots[lane.id] = lane.id;
    return lane;
  }
  const condDone = c => !!(c.field && c.op && String(c.value).trim());
  function condSummary(l){
    if(l.kind === 'else') return 'Runs when no other branch matches';
    /* "If Category is Networking and Priority is High" — several groups read as
       "(…) or (…)", so the grouping survives in the one-line description */
    const parts = [];
    l.groups.forEach(g => {
      const done = g.conds.filter(condDone);
      if(!done.length) return;
      parts.push({ join:g.join, text:done.map((c, i) => (i ? ' ' + c.join + ' ' : '') + c.field + ' ' + c.op + ' ' + c.value).join('') });
    });
    if(!parts.length) return '';
    const many = parts.length > 1;
    return 'If ' + parts.map((p, i) => (i ? ' ' + p.join + ' ' : '') + (many ? '(' + p.text + ')' : p.text)).join('');
  }

  /* Every node hanging off a Trigger / branch path's single output: the first one
     (slots.next), then any parallel siblings. They all run at the same time. */
  const kidsOf = n => (n.slots.next ? [n.slots.next] : []).concat(n.parallel || []);
  const canParallel = n => n.type === 'trigger' || n.type === 'lane' || n.type === 'cond';

  /* ports = output connection points of a node, in top→bottom order */
  function portsOf(n){
    if(n.type === 'trigger' || n.type === 'lane' || n.type === 'cond') return [{ key:'next', label:'', cls:'' }];
    return [];          // a Branch card has no ports of its own — its lanes do
  }
  /* every port, including the ones the collapsed card hides — used by the drawer */
  function allPortsOf(n){ return portsOf(n); }

  /* ---------------------------------------------------------- validation */
  function missingOf(n){
    const miss = [];
    if(n.type === 'trigger'){
      if(!n.trigType) return ['type'];
      if(!n.title.trim()) miss.push('title');
      if(isEventTrig(n.trigType)){
        if(!n.module) miss.push('module');
        if(n.trigType === 'changed' && !n.attrs.some(a => a)) miss.push('attrs');
      } else {
        SCHED[n.trigType].fields.forEach(f => { if(!String(n.sched[f.k] || '').trim()) miss.push('sched:' + f.k); });
      }
    } else if(n.type === 'lane'){
      if(n.kind === 'if'){
        if(!n.title.trim()) miss.push('title');
        if(!n.groups.some(g => g.conds.some(condDone))) miss.push('conds');
      }
    } else {
      if(!n.title.trim()) miss.push('title');
      if(!n.source) miss.push('source');
      if(n.type === 'cond' && !n.groups.some(g => g.conds.some(condDone))) miss.push('conds');
    }
    return miss;
  }
  const isComplete = n => missingOf(n).length === 0;
  /* Configured, but with loose ends the user probably meant to fill → amber, not red.
     Trigger: a blank extra attribute row. Flow node: an output path that leads
     nowhere, so that side of the split does nothing. */
  function isLoose(n){
    if(n.type === 'trigger'){
      return isEventTrig(n.trigType) && n.attrs.length > 1 && n.attrs.some(a => !a);
    }
    if(n.type === 'branch') return false;          // its lanes carry the loose ends, not the card
    return allPortsOf(n).some(p => !n.slots[p.key]);
  }
  function stateOf(n){
    if(n.type === 'trigger' && !n.trigType) return 'empty';
    if(!isComplete(n)) return n.checked ? 'error' : 'draft';
    /* like the error state, a warning only appears once the user has moved on —
       never while they are still filling the node in */
    return (n.checked && isLoose(n)) ? 'warning' : 'ok';
  }
  /* called when the user moves on from a node — that's the moment an unfinished
     node earns its red state (the user never sees an error while still typing). */
  function markChecked(id){ const n = nodes[id]; if(n) n.checked = true; }

  /* ---------------------------------------------------------- rendering */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const img = (n, alt='') => `<img src="assets/${n}.svg" alt="${alt}">`;

  /* `float` lifts the badge out of the card flow, so it hangs above the card's
     top-right corner exactly like the trigger's does inside its pill row —
     and without changing the card's height as the state changes. */
  function badgeHTML(st, float){
    const f = float ? ' float' : '';
    if(st === 'error') return `<span class="badge err${f}">${img('n-warning-red')}</span>`;
    if(st === 'warning') return `<span class="badge warn${f}">${img('n-warning-amber')}</span>`;
    return '';
  }
  const actsHTML = `<div class="acts">
      <button class="act" data-act="repeat" aria-label="Replace">${img('n-act-repeat')}</button>
      <button class="act" data-act="delete" aria-label="Delete">${img('n-act-delete')}</button>
      <button class="act" data-act="more" aria-label="More">${img('n-act-more')}</button></div>`;

  /* the card's second line — what the name line does NOT already say */
  /* Second line of every card: the description, editable right on the canvas.
     Typing must NOT re-render — that would rebuild the card and drop focus — so
     the model is updated live and the repaint waits for blur. */
  const descLine = n => `<input class="card-bot" data-desc="${n.id}" value="${esc(n.desc)}" placeholder="Add a description..." spellcheck="false">`;

  function triggerSummary(n){
    if(isEventTrig(n.trigType)){
      const list = n.attrs.filter(Boolean);
      if(n.trigType === 'changed' && list.length) return list;
      return [n.module ? 'Module: ' + n.module : 'No module selected'];
    }
    const parts = SCHED[n.trigType].fields.map(f => n.sched[f.k]).filter(Boolean);
    return [parts.length ? parts.join(' · ') : 'No schedule set'];
  }

  /* When a periodic trigger will next fire, from the schedule the user set — or
     null while the schedule is still incomplete. */
  function nextRun(n){
    const s = n.sched || {}, now = new Date();
    const hm = t => { const m = /^(\d{1,2}):(\d{2})/.exec(t || ''); return m ? [+m[1], +m[2]] : null; };
    const at = (d, t) => { d.setHours(t[0], t[1], 0, 0); return d; };
    let d = null;
    if(n.trigType === 'once'){
      const t = hm(s.time), p = String(s.date || '').split('-').map(Number);
      if(t && p.length === 3 && p[0]) d = new Date(p[0], p[1] - 1, p[2], t[0], t[1]);
    } else if(n.trigType === 'hourly'){
      const min = s.minute === '' || s.minute == null ? NaN : +s.minute;
      if(!isNaN(min) && +s.every >= 1){
        d = new Date(now); d.setMinutes(min, 0, 0);
        if(d <= now) d.setHours(d.getHours() + 1);
      }
    } else if(n.trigType === 'daily'){
      const t = hm(s.time);
      if(t){ d = at(new Date(now), t); if(d <= now) d.setDate(d.getDate() + 1); }
    } else if(n.trigType === 'weekly'){
      const t = hm(s.time), wd = WEEKDAYS.indexOf(s.day);            // Monday-first list
      if(t && wd >= 0){
        d = at(new Date(now), t);
        const want = (wd + 1) % 7;                                    // JS: Sunday = 0
        d.setDate(d.getDate() + ((want - d.getDay() + 7) % 7));
        if(d <= now) d.setDate(d.getDate() + 7);
      }
    } else if(n.trigType === 'monthly'){
      const t = hm(s.time), dom = +s.dom;
      if(t && dom >= 1 && dom <= 31){
        const mk1 = (y, m) => at(new Date(y, m, Math.min(dom, new Date(y, m + 1, 0).getDate())), t);
        d = mk1(now.getFullYear(), now.getMonth());
        if(d <= now) d = mk1(now.getFullYear(), now.getMonth() + 1);
      }
    }
    return d;
  }
  const fmtRun = d => d.toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })
    + ', ' + d.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' });

  function triggerHTML(n, st){
    const empty = st === 'empty';
    const periodic = !empty && !isEventTrig(n.trigType);
    const pill = `<div class="pill-row"><span class="pill">${periodic ? 'Periodic workflow' : 'Trigger'}</span>${badgeHTML(st)}</div>`;
    const name = empty ? 'Add a trigger' : (n.title || TRIG_LABEL(n.trigType));
    const icoCls = empty ? 'ico lg' : 'ico blue';
    const icoImg = empty ? img('n-trig-grey-lg') : img(periodic ? 'calendar-clock' : 'n-trig-blue');
    let bottom;
    if(empty){
      bottom = descLine(n);
    } else if(periodic){
      const d = nextRun(n);
      bottom = `<div class="next-run"><span class="nr-label">Next execution time</span>`
        + `<div class="nr-val${d ? '' : ' ph'}">${d ? esc(fmtRun(d)) : 'Set the schedule to see it'}</div></div>` + descLine(n);
    } else {
      const lines = triggerSummary(n);
      bottom = lines.length > 1
        ? `<div class="multi">` + lines.slice(0,3).map((a,i) => `<div class="mrow"><span class="mnum">${i+1}</span>${esc(a)}</div>`).join('')
          + (lines.length > 3 ? `<div class="mmore">+${lines.length-3} more</div>` : '') + `</div>`
        : descLine(n);
    }
    return `${pill}<div class="card"><div class="card-top"><div class="card-l"><div class="${icoCls}">${icoImg}</div><span class="nm ${empty?'':'set'}">${esc(name)}</span></div>${actsHTML}</div>${bottom}</div>`;
  }

  /* The Branch card wears the same clothes as the trigger: a small tag above, then
     icon + title + a description line. The branches themselves are NOT drawn
     inside it any more — they fan out below as lanes. */
  function branchHTML(n, st){
    const pill = `<div class="pill-row"><span class="pill">Branch</span>${badgeHTML(st)}</div>`;
    return `${pill}<div class="card"><div class="card-top"><div class="card-l"><div class="ico major rot">${img('n-split')}</div><span class="nm ${n.title?'set':''}">${esc(n.title || 'Branch')}</span></div>${actsHTML}</div>${descLine(n)}</div>`;
  }

  /* Inline Condition — one card, read-only description showing the check
     itself once it's set ("If Priority is High"), same as a lane's card. */
  function condNodeHTML(n, st){
    const sum = condSummary(n);
    const pill = `<div class="pill-row"><span class="pill">Condition</span>${badgeHTML(st)}</div>`;
    return `${pill}<div class="card"><div class="card-top"><div class="card-l"><div class="ico major flip">${img('n-split')}</div><span class="nm ${n.title?'set':''}">${esc(n.title || 'Condition')}</span></div>${actsHTML}</div>`
      + `<div class="card-bot ro ${sum ? 'set' : ''}">${esc(sum || 'Set up the condition')}</div></div>`;
  }

  /* A lane card: its name, and — once filled — its conditions as the description.
     Read-only on the canvas; the conditions are edited in the drawer. */
  function laneHTML(n, st){
    const sum = condSummary(n);
    const isFirst = ifLanes(nodes[n.parent])[0] === n;               // Branch 1 is mandatory
    const del = isFirst ? '' : `<div class="acts"><button class="act" data-act="delete" aria-label="Delete branch">${img('n-act-delete')}</button></div>`;
    const line = n.kind === 'else' ? sum : (sum || 'Set up conditions');
    return `${badgeHTML(st, true)}<div class="card"><div class="card-top"><div class="card-l"><div class="ico major rot">${img('n-split')}</div><span class="nm ${n.title?'set':''}">${esc(n.title || 'Add name...')}</span></div>${del}</div>`
      + `<div class="card-bot ro ${sum || n.kind === 'else' ? 'set' : ''}">${esc(line)}</div></div>`;
  }

  /* Ports whose visible row is hidden (collapsed branches) still need a y —
     fall back to the toggle row / last visible port. */
  function portDy(el, key){
    const t = el.querySelector(`[data-port="${key}"]`);
    if(!t) return null;
    const dot = t.querySelector('.port') || t;
    let y = 0, e = dot;
    while(e && e !== el){ y += e.offsetTop; e = e.offsetParent; }
    return y + dot.offsetHeight / 2;
  }

  function getEl(key){
    let el = els[key];
    if(!el){
      el = document.createElement('div');
      el.dataset.key = key;
      el.style.left = '0px'; el.style.top = '0px';
      els[key] = el;
      world.appendChild(el);
    }
    return el;
  }

  function nodeClass(n, st){
    let c = 'nd ' + (n.type === 'trigger' || n.type === 'branch' ? 'trig ' : '') + n.type;
    if(n.id === selId) c += ' selected';
    if(st && st !== 'empty' && st !== 'draft') c += ' ' + st;
    if(st === 'empty') c += ' empty';
    return c;
  }

  /* Full repaint: rebuild every card, then lay the diagram out. */
  function render(){
    const seen = new Set();
    const list = [];
    (function walk(id){
      const n = nodes[id];
      list.push({ key:id, n });
      portsOf(n).forEach(p => { const cid = n.slots[p.key]; if(cid) walk(cid); });
      if(n.type === 'branch') n.lanes.forEach(walk);
      (n.parallel || []).forEach(walk);
    })(rootId);

    // 1. inner HTML + class
    const HTML = { trigger:triggerHTML, branch:branchHTML, lane:laneHTML, cond:condNodeHTML };
    list.forEach(item => {
      seen.add(item.key);
      const el = getEl(item.key), n = item.n, st = stateOf(n);
      el.className = nodeClass(n, st);
      el.innerHTML = HTML[n.type](n, st);
    });
    Object.keys(els).forEach(k => { if(!seen.has(k)){ els[k].remove(); delete els[k]; born.delete(k); } });
    relayout();
  }

  /* Positions + edges only. A drag runs this on every frame — rebuilding all the
     card markup at 60fps would stutter, and the markup has not changed anyway. */
  let lastPos = {};                                        // world-space {x,y} of every node, from the last relayout
  function relayout(){
    // 2. layout
    const pos = {}; const edges = []; let maxX = 0, maxY = 0, minX = Infinity, minY = Infinity;
    function place(key, x, y){
      pos[key] = { x, y };
      const el = els[key]; const h = el.offsetHeight;
      maxX = Math.max(maxX, x + 250); maxY = Math.max(maxY, y + h);
      minX = Math.min(minX, x); minY = Math.min(minY, y - 30);   // -30 leaves room for the state badge
      return { h };
    }
    /* How far a node's subtree reaches to either side of its own centre-line,
       along the CROSS axis (the axis a fan spreads on — X in vertical mode, Y
       in horizontal). A Branch fans its lanes across this axis, so it needs
       this to know how much room each lane's own subtree claims.

       AXIS ABSTRACTION: this whole geometry pass thinks in "how far along the
       chain" (main) and "how far off to the side" (cross), never x/y directly.
       mSize/cHalf read a card's real size; P() is the ONE place that turns
       (main,cross) into a real screen point — vertical maps main→y, cross→x;
       horizontal maps main→x, cross→y. Cards themselves never rotate: only
       where they land on the canvas changes. */
    const LANE_GAP = 56, LANE_DY = 118, BUS_DY = 52, CARD_W = 250;
    const horiz = axis === 'h';
    const mSize = k => horiz ? CARD_W : els[k].offsetHeight;
    const cHalf = k => horiz ? els[k].offsetHeight / 2 : CARD_W / 2;
    const P   = (main, cross) => horiz ? { x:main, y:cross } : { x:cross, y:main };
    const mOf = pt => horiz ? pt.x : pt.y;
    const cOf = pt => horiz ? pt.y : pt.x;
    function ext(key){
      const n = nodes[key];
      const own = cHalf(key);
      if(canParallel(n) && kidsOf(n).length === 1 && showPar(n)){
        /* the slot sits beside the child's CARD; the child's own fan starts lower, so it need not clear that */
        const e = ext(kidsOf(n)[0]), slotHalf = horiz ? 22 : 125;
        return { l:Math.max(own, e.l), r:Math.max(e.r, own + LANE_GAP + slotHalf * 2) };
      }
      if((n.type === 'trigger' || n.type === 'lane') && !chainFans(n)){
        const c = n.slots.next, e = c ? ext(c) : { l:own, r:own };
        return { l:Math.max(own, e.l), r:Math.max(own, e.r) };
      }
      const w = laneWidths(n);                            // branch + if/else: outputs fan out below
      return { l:Math.max(own, w.total / 2), r:Math.max(own, w.total / 2) };
    }
    /* the row of outputs: a Branch's lanes then its dotted "pending" slot; an IF/Else's
       Is True / Is False (each holding whatever node was added there, or nothing yet) */
    /* a trigger / branch path fans out only once there is more than one thing to
       draw: parallel kids, or one kid plus the dashed slot offered while selected */
    const showPar = n => canParallel(n) && n.slots.next && selId === n.id;
    function chainFans(n){ return kidsOf(n).length > 1 || !!showPar(n); }
    function laneItems(n){
      if(canParallel(n)) return kidsOf(n).map(id => ({ id })).concat(showPar(n) ? [{ par:true }] : []);
      return n.lanes.map(id => ({ id })).concat([{ pending:true }]);
    }
    function laneWidths(n){
      const items = laneItems(n); let cur = 0;
      const slotHalf = horiz ? 22 : 125;
      const cs = items.map(it => {
        const e = it.id ? ext(it.id) : { l:slotHalf, r:slotHalf };
        const c = cur + e.l; cur += e.l + e.r + LANE_GAP; return c;
      });
      const total = cur - LANE_GAP;
      return { items, centres:cs, total };
    }
    function layout(key, x, y){
      /* a node's manual drag offset shifts it AND everything hanging off it,
         because its children are laid out from its own coordinates */
      const o = nodes[key].off;
      if(o){ x += o.x; y += o.y; }
      const { h } = place(key, x, y);
      const n = nodes[key];
      const main = mSize(key), myMain = mOf({ x, y }), myCross = cOf({ x, y });
      let bottom = myMain + main;                           // farthest reach along the primary axis so far
      if(canParallel(n) && kidsOf(n).length === 1 && showPar(n)){
        /* one node so far: it stays in line, and the dashed slot waits beside it */
        const kid = kidsOf(n)[0], rowMain = myMain + main + LANE_DY, slotHalf = horiz ? 22 : 125;
        const kidPt = P(rowMain, myCross);
        const slotPt = P(rowMain, myCross + cHalf(key) + LANE_GAP + slotHalf);
        bottom = Math.max(bottom, layout(kid, kidPt.x, kidPt.y));
        edges.push({ kind:'pfan', from:key, to:kid, cx:kidPt.x, y:kidPt.y });
        edges.push({ kind:'ppar', from:key, cx:slotPt.x, y:slotPt.y });
        minX = Math.min(minX, slotPt.x - 125); maxX = Math.max(maxX, slotPt.x + 125);
        minY = Math.min(minY, slotPt.y - 30); maxY = Math.max(maxY, slotPt.y + 44);
        bottom = Math.max(bottom, rowMain + 44);
        return bottom;
      }
      if(canParallel(n) && chainFans(n)){
        /* parallel nodes: one line splits, the nodes sit side by side under it.
           myCross is this card's own top-left edge, not its centre — the row
           must centre on the card's MIDDLE, so its own half-width goes in first. */
        const w = laneWidths(n), rowMain = myMain + main + LANE_DY, mid = myCross + cHalf(key);
        w.items.forEach((it, i) => {
          const cross = mid - w.total / 2 + w.centres[i], pt = P(rowMain, cross);
          if(it.id){
            /* pt is this item's CENTRE-line; a real card's own top-left corner
               is that centre minus half ITS OWN cross-size — 125 always in
               vertical mode, but the child's real height in horizontal mode */
            const cardPt = P(rowMain, cross - cHalf(it.id));
            bottom = Math.max(bottom, layout(it.id, cardPt.x, cardPt.y));
            edges.push({ kind:'pfan', from:key, to:it.id, cx:cardPt.x, y:cardPt.y });
          } else {
            edges.push({ kind:'ppar', from:key, cx:pt.x, y:pt.y });
            minX = Math.min(minX, pt.x - 125); maxX = Math.max(maxX, pt.x + 125);
            minY = Math.min(minY, pt.y - 30); maxY = Math.max(maxY, pt.y + 44);
            bottom = Math.max(bottom, rowMain + 44);
          }
        });
        return bottom;
      }
      if(n.type === 'trigger' || n.type === 'lane' || n.type === 'cond'){
        const c = n.slots.next;
        if(c){
          const pt = P(myMain + main + 64, myCross);
          bottom = layout(c, pt.x, pt.y);
          edges.push({ kind:'trig', from:key, to:c });
        }
        return bottom;
      }
      if(n.type === 'branch'){
        /* lanes fan out across the cross axis, centred on the card. myCross is
           this card's own top-left edge, not its centre — the row must centre
           on the card's MIDDLE, so its own half-width goes in first (otherwise
           the row drifts a whole half-card toward the top-left corner, robbing
           the pending slot of the room its elbow needs to bend cleanly). */
        const w = laneWidths(n), rowMain = myMain + main + LANE_DY, mid = myCross + cHalf(key);
        w.items.forEach((it, i) => {
          const cross = mid - w.total / 2 + w.centres[i], pt = P(rowMain, cross);
          if(it.pending){
            edges.push({ kind:'pending', from:key, cx:pt.x, y:pt.y });
            minX = Math.min(minX, pt.x - 125); maxX = Math.max(maxX, pt.x + 125); minY = Math.min(minY, pt.y - 30); maxY = Math.max(maxY, pt.y + 70);
            bottom = Math.max(bottom, rowMain + 70);
          } else {
            const cardPt = P(rowMain, cross - cHalf(it.id));    // centre → this card's own top-left corner
            bottom = Math.max(bottom, layout(it.id, cardPt.x, cardPt.y));
            edges.push({ kind:'lane', from:key, to:it.id, cx:cardPt.x, y:cardPt.y });
          }
        });
        return bottom;
      }
      // legacy fallback — no current node type reaches this (portsOf() is empty
      // or handled above for trigger/lane/branch); left vertical-only
      let cursor = y;
      portsOf(n).forEach(p => {
        const cid = n.slots[p.key];
        let dy = portDy(els[key], p.key);
        if(dy == null) dy = h - 20;
        if(!cid){ edges.push({ kind:'plus', from:key, slot:p.key, port:p, dy }); return; }
        const cy = Math.max(y + dy - 24, cursor);
        const cb = layout(cid, x + 250 + 240 + Math.max(0, ext(cid).l - 125), cy);
        cursor = cb + 20; bottom = Math.max(bottom, cb);
        edges.push({ kind:'port', from:key, to:cid, port:p, dy });
      });
      return bottom;
    }
    /* The flow starts near one edge of the canvas and grows across it: from the
       left in horizontal mode, from the top in vertical. Centred on the STAGE,
       not the visible canvas, so opening the config drawer slides the panel in
       without shifting the whole diagram. */
    const stageEl = document.querySelector('.stage') || canvasEl;
    const rootH = els[rootId] ? els[rootId].offsetHeight : 94;
    const startPt = horiz
      ? { x:110, y:Math.max(80, Math.round((stageEl.clientHeight - rootH) / 2)) }
      : { x:Math.max(120, Math.round((stageEl.clientWidth - 250) / 2)), y:110 };
    layout(rootId, startPt.x, startPt.y);

    // 3. apply positions (new nodes get the entrance animation)
    Object.keys(pos).forEach(k => {
      const el = els[k];
      el.style.left = pos[k].x + 'px'; el.style.top = pos[k].y + 'px';
      if(!born.has(k)){ born.add(k); if(k !== rootId){ el.classList.add('enter'); setTimeout(() => el.classList.remove('enter'), 600); } }
    });

    // 4. edges + the "+" buttons that open the node popover
    world.querySelectorAll('.elabel,.t-dot,.t-plus,.edge-hot,.par-slot').forEach(e => e.remove());
    let svg = '';

    /* Hover controls on a LIVE connection: insert a step, or drop this step and
       everything after it. They lay themselves out along the line — stacked for a
       vertical connector, side by side for a horizontal one. */
    function edgeControls(pid, slot, childId, x, y, ctlAxis, ekey){
      const on = picking && picking.parentId === pid && picking.slot === slot;
      const hot = document.createElement('div');
      hot.className = 'edge-hot ' + ctlAxis + (on ? ' open' : '');
      hot.dataset.pid = pid; hot.dataset.slot = slot;
      hot.style.left = x + 'px'; hot.style.top = y + 'px';
      hot.innerHTML = `<div class="edge-ctl ${ctlAxis}">`
        + `<button class="ec" data-a="ins" data-tip="Insert a step here">${img('n-plus')}</button>`
        + `<button class="ec del" data-a="del" data-tip="Remove this step and the ones after it">${img('n-act-delete')}</button>`
        + `</div>`;
      hot.addEventListener('click', ev => {
        ev.stopPropagation();
        const b = ev.target.closest('[data-a]'); if(!b) return;
        if(b.dataset.a === 'ins') openNodePicker(pid, slot, { insert:true });
        else removeNode(childId);
      });
      const line = () => edgesSvg.querySelector(`[data-ekey="${ekey}"]`);
      hot.addEventListener('mouseenter', () => { const l = line(); if(l) l.classList.add('hot'); });
      hot.addEventListener('mouseleave', () => { const l = line(); if(l) l.classList.remove('hot'); });
      world.appendChild(hot);
    }
    /* point on the cubic used for the port edges */
    function bez(t, p0, p1, p2, p3){
      const u = 1 - t;
      return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3;
    }

    function plusBtn(pid, slot, x, y, label){
      const b = document.createElement('button');
      b.className = 't-plus' + (picking && picking.parentId === pid && picking.slot === slot ? ' on' : '');
      b.setAttribute('aria-label', 'Add node' + (label ? ' to ' + label : ''));
      b.dataset.pid = pid; b.dataset.slot = slot;
      b.innerHTML = img('n-plus');
      b.style.left = x + 'px'; b.style.top = y + 'px';
      b.addEventListener('click', ev => { ev.stopPropagation(); slot === 'pending' ? openBranchType(pid) : openNodePicker(pid, slot); });
      world.appendChild(b);
      return b;
    }
    /* One rounded elbow shape, in either axis: straight along the primary axis
       to a shared "bus" position, a jog across the cross axis, then straight
       the rest of the way in. Vertical mode: down, across, down. Horizontal
       mode: across, down/up, across. `end` adds the arrowhead — only on a
       line that actually ENTERS a node. Built entirely from real (x,y) points
       via P(), so every original pixel constant keeps its old meaning. */
    function elbow(x0, y0, x1, y1, busPos, dashed, end){
      const r = 12, mk = end ? ' marker-end="url(#wf-arrow)"' : '';
      const m0 = mOf({ x:x0, y:y0 }), c0 = cOf({ x:x0, y:y0 }), m1 = mOf({ x:x1, y:y1 }), c1 = cOf({ x:x1, y:y1 });
      const s = (c1 - c0) > 0 ? 1 : -1;
      let d;
      if(Math.abs(c1 - c0) < 2){
        d = `M${x0} ${y0} L${x1} ${y1}`;
      } else if(m1 - m0 < BUS_DY + 34){
        /* the node was dragged back beside/before its parent: a smooth curve keeps
           the link intact where a square elbow would fold back on itself */
        const c = Math.max(40, Math.abs(m1 - m0) / 2), p1 = P(m0 + c, c0), p2 = P(m1 - c, c1);
        d = `M${x0} ${y0} C${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${x1} ${y1}`;
      } else {
        const b0 = P(busPos - r, c0), bQ0 = P(busPos, c0), b1 = P(busPos, c0 + s * r);
        const b2 = P(busPos, c1 - s * r), bQ1 = P(busPos, c1), b3 = P(busPos + r, c1);
        d = `M${x0} ${y0} L${b0.x} ${b0.y} Q${bQ0.x} ${bQ0.y} ${b1.x} ${b1.y} L${b2.x} ${b2.y} Q${bQ1.x} ${bQ1.y} ${b3.x} ${b3.y} L${x1} ${y1}`;
      }
      return `<path class="edge${dashed ? ' dashed' : ''}" d="${d}"${mk}/>`;
    }
    /* where a line should land on a node: the centre of the card's LEADING
       edge — its top in vertical mode, its left side in horizontal — not the
       top of its wrapper (which starts at the state tag above the card) */
    const entry = key => {
      const c = els[key].querySelector('.card'), top = c ? c.offsetTop : 0, ch = c ? c.offsetHeight : els[key].offsetHeight;
      return horiz ? { x:pos[key].x, y:pos[key].y + top + ch / 2 } : { x:pos[key].x + 125, y:pos[key].y + top };
    };
    /* where a line LEAVES a node: the centre of its trailing edge — bottom in
       vertical mode, right side in horizontal — of the whole wrapper (pill tag
       included), matching what `entry()` reads on the receiving end */
    const exitPt = key => {
      const p = pos[key], h = els[key].offsetHeight;
      return horiz ? { x:p.x + CARD_W, y:p.y + h / 2 } : { x:p.x + 125, y:p.y + h };
    };
    Object.keys(nodes).forEach(id => {
      const n = nodes[id]; if(n.type !== 'branch' || !pos[id]) return;
      const from = exitPt(id), start = P(mOf(from) + 6, cOf(from)), busPos = mOf(from) + BUS_DY;
      const dot = document.createElement('div'); dot.className = 't-dot';
      dot.style.left = (from.x - 5) + 'px'; dot.style.top = (from.y - 4) + 'px'; world.appendChild(dot);
      edges.filter(e => ['lane', 'pending'].includes(e.kind) && e.from === id).forEach(e => {
        const open = e.kind === 'pending';                                // no node at the end of this line yet
        /* a line that ends in a node follows THAT node wherever it has been dragged */
        const to = open ? null : entry(e.to);
        const openTarget = P(mOf({ x:e.cx, y:e.y }) + 10, cOf({ x:e.cx, y:e.y }));
        svg += open ? elbow(start.x, start.y, openTarget.x, openTarget.y, busPos, true, false)
                    : elbow(start.x, start.y, to.x, to.y, busPos, false, true);
        if(e.kind !== 'pending') return;
        /* the dotted slot: a pill naming what it would become, then the "+" */
        const lab = document.createElement('div');
        lab.className = 'elabel'; lab.textContent = 'Branch ' + (ifLanes(n).length + 1);
        lab.style.left = e.cx + 'px'; lab.style.top = (e.y + 14) + 'px'; world.appendChild(lab);
        svg += `<path class="edge dashed" d="M${e.cx} ${e.y + 24} V${e.y + 48}"/>`;
        plusBtn(id, 'pending', e.cx - 10, e.y + 48, 'a new branch');
      });
    });
    Object.keys(nodes).forEach(id => {
      const n = nodes[id]; if((n.type !== 'trigger' && n.type !== 'lane' && n.type !== 'cond') || !pos[id]) return;
      const from = exitPt(id), start = P(mOf(from) + 6, cOf(from));
      const dot = document.createElement('div'); dot.className = 't-dot';
      dot.style.left = (from.x - 5) + 'px'; dot.style.top = (from.y - 4) + 'px'; world.appendChild(dot);
      const fan = edges.filter(e => (e.kind === 'pfan' || e.kind === 'ppar') && e.from === id);
      if(fan.length){
        /* the split: one trunk, a "Parallel" tag on it, an elbow to each node */
        const busPos = mOf(from) + BUS_DY;
        fan.forEach(e => {
          if(e.kind === 'pfan'){ const to = entry(e.to); svg += elbow(start.x, start.y, to.x, to.y, busPos, false, true); return; }
          svg += elbow(start.x, start.y, e.cx, e.y, busPos, false, false);
          const slot = document.createElement('button');
          slot.type = 'button'; slot.className = 'par-slot' + (picking && picking.parentId === id && picking.slot === 'par' ? ' on' : '');
          slot.dataset.pid = id; slot.dataset.slot = 'par';
          slot.innerHTML = img('plus-square') + '<span>Add parallel node</span>';
          /* a fixed 250×~40 box that never rotates: centre it on the CROSS
             coordinate (its own width in vertical mode, its own height in
             horizontal), flush against the MAIN coordinate on the other axis */
          { const lt = horiz ? { x:e.cx, y:e.y - 20 } : { x:e.cx - 125, y:e.y };
            slot.style.left = lt.x + 'px'; slot.style.top = lt.y + 'px'; }
          slot.addEventListener('click', ev => { ev.stopPropagation(); openNodePicker(id, 'par'); });
          world.appendChild(slot);
        });
        const tagPt = P(mOf(from) + 26, cOf(from));
        const tag = document.createElement('div');
        tag.className = 'elabel par'; tag.textContent = 'Parallel';
        tag.style.left = tagPt.x + 'px'; tag.style.top = tagPt.y + 'px'; world.appendChild(tag);
        return;
      }
      if(n.slots.next){
        const kid = n.slots.next, ekey = id + ':next', to = entry(kid);
        if(Math.abs(cOf(to) - cOf(from)) < 2){
          svg += `<path class="edge" data-ekey="${ekey}" d="M${start.x} ${start.y} L${to.x} ${to.y}" marker-end="url(#wf-arrow)"/>`;
        } else {                                       // dragged off-line: keep the link, curve it
          const c = Math.max(40, Math.abs(mOf(to) - mOf(start)) / 2);
          const p1 = P(mOf(start) + c, cOf(start)), p2 = P(mOf(to) - c, cOf(to));
          svg += `<path class="edge" data-ekey="${ekey}" d="M${start.x} ${start.y} C${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${to.x} ${to.y}" marker-end="url(#wf-arrow)"/>`;
        }
        const midPt = P((mOf(start) + mOf(to)) / 2, (cOf(start) + cOf(to)) / 2);
        edgeControls(id, 'next', kid, midPt.x, midPt.y, horiz ? 'h' : 'v', ekey);
      } else {
        const stubEnd = P(mOf(start) + 32, cOf(start));
        svg += `<path class="edge" d="M${start.x} ${start.y} L${stubEnd.x} ${stubEnd.y}"/>`;
        const btnPt = horiz ? { x:stubEnd.x, y:stubEnd.y - 10 } : { x:stubEnd.x - 10, y:stubEnd.y };
        plusBtn(id, 'next', btnPt.x, btnPt.y, '');
      }
    });
    edges.filter(e => e.kind === 'port').forEach(e => {
      const a = pos[e.from], c = pos[e.to];
      const sx = a.x + 251, sy = a.y + e.dy, tx = c.x, ty = c.y + 24;
      const ekey = e.from + ':' + e.port.key;
      svg += `<path class="edge" data-ekey="${ekey}" d="M${sx} ${sy} C${sx+48} ${sy}, ${tx-48} ${ty}, ${tx} ${ty}"/>`;
      const lab = document.createElement('div');
      lab.className = 'elabel ' + (e.port.cls || '');
      lab.textContent = e.port.label;
      /* The label sits at the curve's midpoint. The controls ride further along
         the same curve — far enough past the label's measured right edge that the
         two never touch, whatever the label says. */
      lab.style.left = ((sx + tx) / 2) + 'px'; lab.style.top = ((sy + ty) / 2) + 'px';
      world.appendChild(lab);
      const want = (sx + tx) / 2 + lab.offsetWidth / 2 + 32;
      let t = .8;
      for(let s = .5; s <= .92; s += .01){
        if(bez(s, sx, sx + 48, tx - 48, tx) >= want){ t = s; break; }
      }
      edgeControls(e.from, e.port.key, e.to,
        bez(t, sx, sx + 48, tx - 48, tx), bez(t, sy, sy, ty, ty), 'h', ekey);   // horizontal line → side-by-side icons
    });
    edges.filter(e => e.kind === 'plus').forEach(e => {
      const a = pos[e.from];
      const sx = a.x + 251, sy = a.y + e.dy;
      const lab = document.createElement('div');
      lab.className = 'elabel ' + (e.port.cls || ''); lab.style.transform = 'translateY(-50%)';
      lab.textContent = e.port.label; lab.style.left = (sx + 12) + 'px'; lab.style.top = sy + 'px';
      world.appendChild(lab);
      const px = sx + 12 + lab.offsetWidth + 14;
      svg += `<path class="edge" d="M${sx+4} ${sy} L${px} ${sy}"/>`;
      plusBtn(e.from, e.slot, px, sy - 10, e.port.label);
      maxX = Math.max(maxX, px - 76);
    });
    edgesSvg.setAttribute('width', maxX + 200); edgesSvg.setAttribute('height', maxY + 200);
    edgesSvg.innerHTML = '<defs><marker id="wf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto">'
      + '<path d="M1 1.5 L9 5 L1 8.5 z" fill="#a5bad0"/></marker></defs>' + svg;
    world.style.width = (maxX + 200) + 'px'; world.style.height = (maxY + 200) + 'px';
    content = { minX, minY, maxX, maxY };      // what "fit to screen" and centring work from
    lastPos = pos;
    /* anchored notes ride along with whatever node they're pinned to — same
       fixed offset, recomputed against that node's fresh position, so a note
       never drifts away from what it's annotating, whether the node moved
       because it was dragged or because the layout direction just flipped */
    Object.keys(stickies).forEach(id => {
      const s = stickies[id]; if(!s.anchor) return;
      if(!nodes[s.anchor] || !lastPos[s.anchor]){ s.anchor = null; return; }   // its node is gone — stop tracking it
      s.x = Math.round(lastPos[s.anchor].x + s.ax);
      s.y = Math.round(lastPos[s.anchor].y + s.ay);
      renderSticky(id);
    });
    applyView();
    pushHistory();               // every mutation funnels through render()
  }

  /* ---------------------------------------------------------- drawer */
  function showPanel(name){
    Object.entries(panels).forEach(([k, p]) => p.classList.toggle('hidden', k !== name));
  }
  /* body.dock-open lets the fixed chrome (the centred toolbar) re-centre itself
     over the canvas rather than the whole window */
  function openDrawer(name){ showPanel(name); dock.classList.remove('closed'); document.body.classList.add('dock-open'); }
  function closeDrawer(){ dock.classList.add('closed'); document.body.classList.remove('dock-open'); }
  const drawerOpen = () => !dock.classList.contains('closed');

  function toast(msg){
    let t = $('.toast'); if(!t){ t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1800);
  }

  /* A confirmation dialog for anything that destroys work. Cancel is focused, so a
     stray Enter never deletes; Esc and a click on the backdrop both cancel. */
  function confirmDialog(o){
    document.querySelectorAll('.wf-modal-back').forEach(e => e.remove());
    const back = document.createElement('div');
    back.className = 'wf-modal-back';
    back.innerHTML = '<div class="wf-modal" role="alertdialog" aria-modal="true" aria-labelledby="wfModalT">'
      + '<div class="wf-modal-ico">' + img('n-warning-red') + '</div>'
      + '<h3 id="wfModalT">' + esc(o.title) + '</h3><p>' + esc(o.body) + '</p>'
      + '<div class="wf-modal-btns"><button type="button" class="wf-btn" data-r="cancel">Cancel</button>'
      + '<button type="button" class="wf-btn danger" data-r="ok">' + esc(o.confirmLabel || 'Delete') + '</button></div></div>';
    document.body.appendChild(back);
    const close = () => { document.removeEventListener('keydown', onKey, true); back.classList.remove('in'); setTimeout(() => back.remove(), 160); };
    const onKey = e => { if(e.key === 'Escape'){ e.stopPropagation(); close(); } };
    document.addEventListener('keydown', onKey, true);
    back.addEventListener('mousedown', e => { if(e.target === back) close(); });
    back.querySelector('[data-r=cancel]').addEventListener('click', close);
    back.querySelector('[data-r=ok]').addEventListener('click', () => { close(); o.onConfirm(); });
    requestAnimationFrame(() => { back.classList.add('in'); back.querySelector('[data-r=cancel]').focus(); });
  }
  /* how many steps hang below a node — what deleting it would take with it */
  function stepsBelow(id){
    const n = nodes[id]; let c = 0;
    Object.values(n.slots).concat(n.parallel || []).forEach(k => { if(nodes[k] && nodes[k].type !== 'lane') c += 1 + stepsBelow(k); else if(nodes[k]) c += stepsBelow(k); });
    return c;
  }

  function selectNode(id){
    const prev = selId;
    if(prev && prev !== id) markChecked(prev);
    selId = id;
    const n = nodes[id];
    if(n.type === 'trigger'){
      if(!n.trigType){ render(); openTriggerPicker(); return; }
      openTrigger(n);
    }
    else if(n.type === 'lane') openLane(n);
    else if(n.type === 'cond') openCondition(n);
    else openBranch(n);
    render();
  }

  function deselect(){
    if(selId) markChecked(selId);
    selId = null; closeDrawer(); render();
  }

  /* ---------------------------------------------------------- popovers */
  /* The anchors are looked up live: the canvas re-renders while a popover is
     open, so a captured element node would go stale after one frame. */
  const nodeAnchor = id => () => els[id];
  const plusAnchor = (pid, slot) => () => world.querySelector(`.t-plus[data-pid="${pid}"][data-slot="${slot}"],.par-slot[data-pid="${pid}"][data-slot="${slot}"]`) || els[pid];
  const insertAnchor = (pid, slot) => () => world.querySelector(`.edge-hot[data-pid="${pid}"][data-slot="${slot}"] .ec[data-a="ins"]`) || els[pid];

  function openTriggerPicker(){
    const n = nodes[rootId];
    closeDrawer();
    /* two levels: the top offers "Every time period" as one row; picking it
       drills to its four concrete schedules. Mirrors openNodePicker's own
       drill pattern — `navigating` stops the level-swap from reading as a
       cancel, `back` returns to the top without losing the trigger's state. */
    let navigating = false;
    function commit(item){
      const changedShape = n.trigType && trigTab(item.id) !== trigTab(n.trigType);
      const wasDefault = !n.title.trim() || (n.trigType && n.title === TRIG_LABEL(n.trigType));
      n.trigType = item.id;
      if(wasDefault) n.title = TRIG_LABEL(item.id);
      if(changedShape){ n.module = ''; n.attrs = ['']; n.sched = {}; }
      if(!isEventTrig(item.id)) n.sched = n.sched || {};
      n.checked = false;
      selId = rootId;
      render();
      openTrigger(n);
    }
    function onClosed(reason){
      if(reason === 'pick' || navigating) return;
      render();
      if(nodes[rootId].trigType && selId) selectNode(selId);        // cancelled → put the drawer back
    }
    function openRecur(){
      navigating = true;
      WFPop.open({
        anchor: nodeAnchor(rootId), title:'Every time period', back: () => openTop(),
        wide: true, searchPlaceholder: 'Search an event or module — e.g. Incident',
        items: () => TRIGGER_RECUR,
        selected: n.trigType,
        helpEyebrow: 'Trigger',
        onPick: commit,
        onClose: onClosed
      });
      navigating = false;
    }
    function openTop(){
      navigating = true;
      WFPop.open({
        anchor: nodeAnchor(rootId), title: 'Trigger',
        wide: true, searchPlaceholder: 'Search an event or module — e.g. Incident',
        items: (tab, q) => q ? TRIGGER_FLAT : TRIGGER_TOP,
        selected: TRIGGER_RECUR.some(i => i.id === n.trigType) ? 'recur' : n.trigType,
        helpEyebrow: 'Trigger',
        help: { title:'Trigger', body:'Pick the event that fires this workflow — everything else runs after it.' },
        footer: { label:'Generate with AI', icon:'sparkle', onClick: () => toast('Generate with AI is not designed yet') },
        onPick(item){
          if(item.id === 'recur'){ openRecur(); return true; }      // drill in rather than commit
          commit(item);
        },
        onClose: onClosed
      });
      navigating = false;
    }
    openTop();
  }

  /* opts.insert = the slot already holds a node; the pick goes BETWEEN the two
     and the existing subtree hangs off the new node's first output */
  function openNodePicker(parentId, slot, opts){
    const insert = !!(opts && opts.insert) && !!nodes[parentId].slots[slot];
    if(selId) markChecked(selId);
    picking = { parentId, slot };
    render();
    const btn = world.querySelector(`.t-plus[data-pid="${parentId}"][data-slot="${slot}"],.par-slot[data-pid="${parentId}"][data-slot="${slot}"]`);
    /* clear room for the menu AND its help bubble on whichever side it opens */
    const toSide = false;                              // every connector runs downward now
    if(btn) panIntoView(btn, toSide ? { left:170, right:650, top:150, bottom:210 }
                                    : { left:170, right:170, top:140, bottom:200 });
    const restore = selId;
    const port = allPortsOf(nodes[parentId]).find(p => p.key === slot);
    closeDrawer();                                   // the drawer always steps aside for the picker
    const rootTitle = slot === 'par' ? 'Add a parallel node' : insert ? 'Insert a step here'
      : port && port.label ? 'What happens on “' + port.label + '”' : 'What happens next';
    /* Levels replace each other in place. WFPop.open closes whatever is open
       first, which would otherwise read as "cancelled" and put the drawer back —
       so drilling is flagged and the close handler sits it out. */
    let navigating = false;

    function openLevel(items, title, back){
      navigating = true;
      WFPop.open({
      anchor: insert ? insertAnchor(parentId, slot) : plusAnchor(parentId, slot),
      /* follow the connector: the trigger's line runs down, so the menu drops
         below it; a port's line runs right, so the menu opens off its end */
      side: 'bottom',
      title,
      back,
      wide: true,
      searchPlaceholder: 'Search actions, conditions, or modules…',
      items: (tab, q) => (q && !back) ? FLAT_CATALOG : items,
      helpEyebrow: 'Node',
      help: { title:'Node Selection', body:'Pick the step that runs next in your workflow.', more:DOC },
      onPick(item){
        const kids = SUBMENUS[item.id];
        if(kids){                                    // drill in rather than commit
          openLevel(kids, item.label, () => openLevel(NODE_CATALOG, rootTitle, null));
          return true;
        }
        const make = item.make;
        if(!make || !IMPLEMENTED[make]){ toast(item.label + ' is not designed yet'); return true; }
        picking = null;
        const node = make === 'cond' ? newCondition() : newBranch();
        node.parent = parentId;
        /* Source Node is left for the user to choose. Pre-selecting it — now
           that the title arrives pre-filled too — would make a brand-new node
           count as fully configured, and nothing would ever flag as incomplete. */
        if(insert){                                  // push the existing subtree down
          const old = nodes[parentId].slots[slot];
          /* a Branch has no output of its own: the old subtree hangs off Branch 1 */
          const host = node.type === 'branch' ? nodes[node.lanes[0]] : node;
          host.slots[portsOf(host)[0].key] = old;
          nodes[old].parent = host.id;
          nodes[old].source = TYPE_LABEL[node.type];
        }
        if(slot === 'par'){ const p = nodes[parentId]; p.parallel = (p.parallel || []).concat(node.id); }   // runs alongside the others
        else nodes[parentId].slots[slot] = node.id;
        selId = node.id;
        render();
        selectNode(node.id);
      },
      onClose(reason){
        if(reason === 'pick' || navigating) return;               // drilling is not cancelling
        picking = null; render();
        if(restore && nodes[restore]) selectNode(restore);        // cancelled → drawer comes back
      }
      });
      navigating = false;
    }
    openLevel(NODE_CATALOG, rootTitle, null);
  }


  /* The dotted "+" at the end of a Branch's row: is the new path another
     condition (Or if) or the catch-all Default (Or else)? Either way a new lane
     appears and its drawer opens. The drawer steps aside for the menu first. */
  function openBranchType(bid){
    const b = nodes[bid];
    if(selId) markChecked(selId);
    picking = { parentId:bid, slot:'pending' };
    render();
    const btn = world.querySelector(`.t-plus[data-pid="${bid}"][data-slot="pending"]`);
    if(btn) panIntoView(btn, { left:170, right:170, top:150, bottom:230 });
    const restore = selId, hasDefault = !!defaultLane(b);
    closeDrawer();
    WFPop.open({
      anchor: plusAnchor(bid, 'pending'),
      side: 'bottom', menu: true, noSearch: true, width: 264, title: 'Add branch',
      items: [
        { id:'if', label:'Or if', sub:'another condition path' },
        { id:'else', label:'Or else', sub: hasDefault ? 'already added' : 'runs when nothing else matches', soon: hasDefault },
      ],
      onPick(item){
        if(item.id === 'else' && hasDefault) return true;           // greyed: stays open
        picking = null;
        const lane = addLane(b, item.id);
        selId = lane.id; render(); selectNode(lane.id);
      },
      onClose(reason){
        if(reason === 'pick') return;
        picking = null; render();
        if(restore && nodes[restore]) selectNode(restore);           // cancelled → drawer comes back
      }
    });
  }

  /* Glide the canvas so a node sits in the clear part of the view — used when the
     drawer, not the canvas, moved the selection (rows, prev/next, back arrow). */
  function focusNode(id){
    const el = els[id]; if(!el) return;
    world.classList.add('glide');
    panIntoView(el, { left:120, right:470, top:140, bottom:150 });
    setTimeout(() => world.classList.remove('glide'), 450);
  }

  /* The ⋮ menu, shared by a node's card and its drawer header. */
  function openNodeMenu(n, anchor){
    const items = n.type === 'trigger'
      ? [{ id:'type', label:'Change trigger type', icon:'repeat' },
         { id:'clear', label:'Clear trigger', icon:'delete', danger:true }]
      : [{ id:'replace', label:'Replace node', icon:'repeat' },
         { id:'delete', label:'Delete node', icon:'delete', danger:true }];
    WFPop.open({
      anchor, noSearch:true, menu:true, width:212, align:'end',
      items,
      /* Deferred by a tick: picking closes this menu, and that close would
         otherwise land on whatever menu the action had just opened. */
      onPick(i){
        setTimeout(() => {
          if(i.id === 'type'){ selId = rootId; openTriggerPicker(); return; }
          if(i.id === 'clear'){ selId = rootId; $('#trClear').click(); return; }
          if(i.id === 'replace') replaceNode(n.id); else removeNode(n.id);
        }, 0);
      }
    });
  }

  /* ---------------------------------------------------------- shared drawer bits */
  /* Names the still-empty required fields, so an error node opens onto a drawer
     that says what to fill rather than just a red outline. */
  const MISS_LABEL = { type:'Trigger Type', title:'Title', module:'Select Module', attrs:'Select Attribute', source:'Select Source Node', conds:'a complete condition (field, operator and value)' };
  function missLabel(n, m){
    if(m.indexOf('sched:') === 0){
      const f = SCHED[n.trigType].fields.find(x => x.k === m.slice(6));
      return f ? f.lab : 'Schedule';
    }
    if(m === 'title' && n.type === 'trigger') return 'Trigger Name';
    if(m === 'title' && n.type === 'lane') return 'Name';
    return MISS_LABEL[m] || m;
  }
  function renderAlert(host, n){
    const miss = n.checked ? missingOf(n) : [];
    host.classList.toggle('hidden', !miss.length);
    if(!miss.length) return;
    const names = miss.map(m => missLabel(n, m));
    host.innerHTML = `<img src="assets/n-warning-red.svg" alt="">`
      + `<div class="cfg-alert-text"><b>${names.length} required field${names.length > 1 ? 's are' : ' is'} still empty.</b> `
      + `Fill in ${names.map(esc).join(', ')} to clear the error on this node.</div>`;
  }

  /* the pill carries its label; the tooltip only matters once it has folded away */
  function gotoLabel(n, pill){
    const p = n.parent ? nodes[n.parent] : null;
    const label = p && p.type === 'lane'
      ? 'Go to ' + (p.title || 'Branch')                       // a step under a branch goes back to that branch
      : 'Go to ' + (p ? (p.type === 'trigger' ? 'Trigger' : TYPE_LABEL[p.type]) : 'Trigger') + ' Node';
    pill.querySelector('.pill-text').textContent = label;
    pill.dataset.tip = label;
  }

  /* chain of nodes above this one — offered as "Select Source Node" */
  function ancestorsOf(id){
    const out = []; let cur = nodes[id].parent;
    while(cur){ const n = nodes[cur]; out.unshift({ id:n.id, label:n.title || TYPE_LABEL[n.type] }); cur = n.parent; }
    return out;
  }
  function fillSource(n, sel, box){
    const opts = ancestorsOf(n.id);
    sel.innerHTML = '<option value="">Search or select a field</option>' +
      opts.map(o => `<option ${o.label === n.source ? 'selected' : ''}>${esc(o.label)}</option>`).join('');
    sel.value = n.source || '';
    box.classList.toggle('invalid', n.checked && !n.source);
  }

  /* One "Next Node Selection" row per output port: a dashed add-row when the slot
     is free, the child's name when it is taken. */
  function nextRowsHTML(n){
    if(canParallel(n) && kidsOf(n).length){
      /* the chain's rows: every node that follows (the first, then its parallel
         siblings), then the dashed slot to add one more alongside them */
      const row = (label, body) => `<div class="nns-branch" style="position:relative;width:100%;max-width:none">${label ? `<div class="nns-branch-label">${label}</div>` : ''}${body}</div>`;
      return kidsOf(n).map((cid, i) =>
        row(i ? 'Parallel' : '', `<a class="nns-add filled" data-goto="${cid}"><img src="assets/n-trig-blue.svg" alt=""><span>${esc(nodes[cid].title || TYPE_LABEL[nodes[cid].type])}</span></a>`)
      ).join('') + row('', `<a class="nns-add par" data-slot="par"><img src="assets/plus-square.svg" alt=""><span>Add parallel node</span></a>`);
    }
    return allPortsOf(n).map(p => {
      const cid = n.slots[p.key];
      const body = cid
        ? `<a class="nns-add filled" data-goto="${cid}"><img src="assets/n-trig-blue.svg" alt=""><span>${esc(nodes[cid].title || TYPE_LABEL[nodes[cid].type])}</span></a>`
        : `<a class="nns-add" data-slot="${p.key}"><img src="assets/plus-square.svg" alt=""><span>${esc(p.label ? 'Select next block · ' + p.label : 'Select next block')}</span></a>`;
      return `<div class="nns-branch" style="position:relative;width:100%;max-width:none">`
        + (p.label ? `<div class="nns-branch-label">${esc(p.label)}</div>` : '')
        + body + `</div>`;
    }).join('');
  }
  /* clicks inside any "Next Node Selection" block */
  function bindNext(host){
    host.addEventListener('click', e => {
      const go = e.target.closest('[data-goto]');
      if(go){ selectNode(go.dataset.goto); return; }
      const a = e.target.closest('.nns-add[data-slot]');
      if(a) openNodePicker(selId, a.dataset.slot);
    });
  }

  /* ---- inline description in the drawer header -----------------------------
     A textarea that reads as plain text, tints on hover and becomes a real
     field on focus. It auto-grows so it never shows a scrollbar. */
  function autoGrow(el){ el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
  function setDesc(el, v){ el.value = v || ''; autoGrow(el); }

  /* ---- the header name doubles as a rename field ---- */
  function setHeadName(key, n){
    document.querySelectorAll('span[data-name="' + key + '"]').forEach(el => {
      el.textContent = n.title || 'Add title...';
      el.classList.toggle('ph', !n.title);
    });
  }
  function bindHeadName(key, fieldSel){
    document.addEventListener('click', e => {
      const host = e.target.closest('span[data-name="' + key + '"]');
      if(!host) return;
      const n = nodes[selId]; if(!n) return;
      if(key === 'ln' && n.kind === 'else') return;            // the Default keeps its name
      const input = document.createElement('input');
      input.className = 'cfg-name-input'; input.dataset.name = key;
      input.value = n.title; input.placeholder = 'Add title...';
      host.replaceWith(input); input.focus(); input.select();
      /* only this copy becomes a field; its twin keeps following along */
      const sync = () => { n.title = input.value; $(fieldSel).value = n.title; setHeadName(key, n); render(); };
      input.addEventListener('input', sync);
      input.addEventListener('keydown', ev => { if(ev.key === 'Enter' || ev.key === 'Escape') input.blur(); });
      input.addEventListener('blur', () => {
        sync();
        const span = document.createElement('span');
        span.className = 'cfg-node-name' + (n.title ? '' : ' ph');
        span.dataset.name = key; span.title = 'Click to rename';
        span.textContent = n.title || 'Add title...';
        input.replaceWith(span);
      });
    });
  }
  bindHeadName('tr', '#trTitle');
  bindHeadName('br', '#brTitle');
  bindHeadName('ln', '#lnName');

  /* ---- Next step: expanded by default, collapsible ---- */
  document.querySelectorAll('[data-nn-toggle]').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.next-node').classList.toggle('collapsed'));
  });

  /* ------------------ Trigger drawer */
  function attrRow(val, idx, first){
    const opts = '<option value="">Search or select a field</option>' + ATTRS.map(a => `<option ${a===val?'selected':''}>${esc(a)}</option>`).join('');
    return `<div class="attr-row" data-i="${idx}"><div class="input-box select"><select>${opts}</select><img src="assets/chevron-down2.svg" alt=""></div>`
      + (first ? '' : `<button class="hover-box attr-rm" aria-label="Remove"><img src="assets/close2.svg" alt=""></button>`) + `</div>`;
  }
  function renderAttrs(n){ $('#trAttrs').innerHTML = n.attrs.map((a,i) => attrRow(a, i, i === 0)).join(''); }

  function renderSched(n){
    const s = SCHED[n.trigType]; if(!s) return;
    $('#trSchedLabel').innerHTML = esc(s.label) + ' <span class="req">*</span>';
    $('#trSched').innerHTML = s.fields.map(f => {
      const v = n.sched[f.k] == null ? '' : n.sched[f.k];
      const inner = f.type === 'select'
        ? `<select data-k="${f.k}"><option value="">Select</option>${f.opts.map(o => `<option ${o===v?'selected':''}>${esc(o)}</option>`).join('')}</select><img src="assets/chevron-down2.svg" alt="">`
        : `<input data-k="${f.k}" type="${f.type}" value="${esc(v)}" placeholder="${esc(f.ph||'')}"${f.min!=null?` min="${f.min}"`:''}${f.max!=null?` max="${f.max}"`:''}>`;
      return `<div class="field" style="gap:4px"><div class="field-help" style="padding:0">${esc(f.lab)}</div>`
        + `<div class="input-box${f.type==='select'?' select':''}" data-box="${f.k}">${inner}</div></div>`;
    }).join('');
  }

  function renderTriggerPicked(n){
    $('#trPicked').innerHTML = `<span class="picked-ico">${img('n-trig-blue')}</span>`
      + `<span class="picked-text"><span class="picked-name">${esc(TRIG_LABEL(n.trigType))}</span>`
      + `<span class="picked-kind">${isEventTrig(n.trigType) ? 'Event trigger' : 'Periodic trigger'}</span></span>`
      + `<button class="picked-change" type="button" id="trChange">Change</button>`;
    $('#trChange').addEventListener('click', openTriggerPicker);
  }

  function openTrigger(n){
    openDrawer('trigger');
    const ev = isEventTrig(n.trigType);
    renderTriggerPicked(n);
    $('#trTitle').value = n.title; setDesc($('#trDesc'), n.desc);
    setHeadName('tr', n);
    $('#trModuleField').classList.toggle('hidden', !ev);
    $('#trAttrField').classList.toggle('hidden', !(ev && n.trigType === 'changed'));
    $('#trAddField').classList.toggle('hidden', !(ev && n.trigType === 'changed'));
    $('#trSchedField').classList.toggle('hidden', ev);
    if(ev){
      $('#trModule').innerHTML = '<option value="">Select a module</option>' + MODULES.map(m => `<option ${m===n.module?'selected':''}>${esc(m)}</option>`).join('');
      renderAttrs(n);
    } else renderSched(n);
    syncTriggerValidity(n);
    $('#trScroll').scrollTop = 0; $('#trHead').classList.remove('collapsed');
  }

  /* paints the invalid outlines + shows/hides the Next Node block */
  function syncTriggerValidity(n){
    const miss = missingOf(n), show = n.checked;
    $('#trTitleBox').classList.toggle('invalid', show && miss.includes('title'));
    setHeadName('tr', n);
    const mb = $('#trModuleBox'); if(mb) mb.classList.toggle('invalid', show && miss.includes('module'));
    $('#trSched').querySelectorAll('[data-box]').forEach(b => b.classList.toggle('invalid', show && miss.includes('sched:' + b.dataset.box)));
    $('#trNext').innerHTML = nextRowsHTML(n);
    renderAlert($('#trAlert'), n);
  }

  function trEdited(){
    const n = nodes[selId]; if(!n || n.type !== 'trigger') return;
    syncTriggerValidity(n); render();
  }
  $('#trTitle').addEventListener('input', e => { const n = nodes[selId]; if(n){ n.title = e.target.value; trEdited(); } });
  $('#trDesc').addEventListener('input', e => { const n = nodes[selId]; if(n){ n.desc = e.target.value; autoGrow(e.target); trEdited(); } });
  $('#trModule').addEventListener('change', e => { const n = nodes[selId]; if(n){ n.module = e.target.value; trEdited(); } });
  $('#trAttrs').addEventListener('change', e => {
    const n = nodes[selId], row = e.target.closest('.attr-row'); if(!row) return;
    n.attrs[+row.dataset.i] = e.target.value; trEdited();
  });
  $('#trAttrs').addEventListener('click', e => {
    const b = e.target.closest('.attr-rm'); if(!b) return;
    const n = nodes[selId]; n.attrs.splice(+b.closest('.attr-row').dataset.i, 1); renderAttrs(n); trEdited();
  });
  $('#trAdd').addEventListener('click', () => { const n = nodes[selId]; n.attrs.push(''); renderAttrs(n); trEdited(); });
  $('#trSched').addEventListener('input', e => {
    const k = e.target.dataset.k; if(!k) return;
    const n = nodes[selId]; n.sched[k] = e.target.value; trEdited();
  });
  $('#trSched').addEventListener('change', e => {
    const k = e.target.dataset.k; if(!k) return;
    const n = nodes[selId]; n.sched[k] = e.target.value; trEdited();
  });
  $('#trMore').addEventListener('click', () => openNodeMenu(nodes[rootId], $('#trMore')));
  $('#trClear').addEventListener('click', () => {
    const n = nodes[rootId];
    n.trigType = null; n.title = ''; n.desc = ''; n.module = ''; n.attrs = ['']; n.sched = {}; n.checked = false;
    selId = rootId; render(); openTriggerPicker();
  });
  $('#trClose').addEventListener('click', deselect);
  bindNext($('#trNext'));


  /* ------------------ Branch drawer
     The Branch node's own settings, then the list of its branches. Each row opens
     that branch's own drawer (openLane); the next steps live THERE, not here. */
  function laneRowsHTML(b){
    return b.lanes.map(id => nodes[id]).map(l => {
      const bad = l.checked && !isComplete(l);
      const sum = condSummary(l) || 'Set up conditions';
      const del = ifLanes(b)[0] === l ? '' : `<button class="hover-box sm br-row-del" type="button" data-del="${l.id}" aria-label="Delete ${esc(l.title)}"><img src="assets/delete.svg" alt=""></button>`;
      return `<div class="br-row${bad ? ' bad' : ''}" data-row="${l.id}">`
        + `<button class="br-row-main" type="button" data-lane="${l.id}"><span class="br-row-name">${esc(l.title || 'Add name...')}</span>`
        + `<span class="br-row-sum${condSummary(l) ? '' : ' ph'}">${esc(sum)}</span></button>${del}`
        + `<span class="br-row-chev">${img('chevron-down')}</span></div>`;
    }).join('')
      /* the add button rides the same rail, as the last leaf of the tree —
         Inline Condition (single) never gets one, it's capped at its one IF */
      + `<div class="br-row-add"><button class="btn-ghost" type="button" data-add><img src="assets/n-plus.svg" alt="">Add branch</button></div>`;
  }
  function syncBrValidity(n){
    $('#brTitleBox').classList.toggle('invalid', n.checked && !n.title.trim());
    setHeadName('br', n);
    $('#brSourceBox').classList.toggle('invalid', n.checked && !n.source);
    renderAlert($('#brAlert'), n);
    $('#brRows').innerHTML = laneRowsHTML(n);
  }
  function openBranch(n){
    openDrawer('branch');
    $('#brTitle').value = n.title; setDesc($('#brDesc'), n.desc);
    setHeadName('br', n);
    gotoLabel(n, $('#brGoto'));
    fillSource(n, $('#brSource'), $('#brSourceBox'));
    syncBrValidity(n);
    $('#brScroll').scrollTop = 0; $('#brHead').classList.remove('collapsed');
  }
  $('#brTitle').addEventListener('input', e => {
    const n = nodes[selId]; if(!n) return;
    n.title = e.target.value; syncBrValidity(n); render();
  });
  $('#brDesc').addEventListener('input', e => { const n = nodes[selId]; if(n){ n.desc = e.target.value; autoGrow(e.target); render(); } });
  $('#brSource').addEventListener('change', e => {
    const n = nodes[selId]; if(!n) return;
    n.source = e.target.value; syncBrValidity(n); render();
  });
  /* adds an "Or if" branch; the Default (if any) stays last */
  function addBranchFromDrawer(){
    const n = nodes[selId], lane = addLane(n, 'if');
    syncBrValidity(n); render();
    const row = $('#brRows').querySelector(`[data-row="${lane.id}"]`);
    if(row){ row.classList.add('fresh'); row.scrollIntoView({ block:'nearest', behavior:'smooth' }); setTimeout(() => row.classList.remove('fresh'), 900); }
  }
  $('#brRows').addEventListener('click', e => {
    if(e.target.closest('[data-add]')){ addBranchFromDrawer(); return; }
    const del = e.target.closest('[data-del]');
    if(del){ removeNode(del.dataset.del); return; }
    const go = e.target.closest('[data-lane]');
    if(go){ selectNode(go.dataset.lane); focusNode(go.dataset.lane); }
  });
  $('#brClose').addEventListener('click', deselect);
  $('#brGoto').addEventListener('click', () => { const p = nodes[selId].parent; if(p){ selectNode(p); focusNode(p); } });
  $('#brDelete').addEventListener('click', () => removeNode(selId));
  $('#brReplace').addEventListener('click', () => replaceNode(selId));
  $('#brMore').addEventListener('click', () => openNodeMenu(nodes[selId], $('#brMore')));

  /* ------------------ Branch-path (lane) drawer
     One branch's own configuration: its name and conditions, then what runs next
     along THIS path. The back arrow returns to the Branch node; prev/next step
     through the sibling branches without going back first. */
  const optionsHTML = (list, cur, ph) => `<option value="">${ph}</option>` + list.map(o => `<option${o === cur ? ' selected' : ''}>${esc(o)}</option>`).join('');
  /* One line under the groups when no condition is complete yet: names the first
     incomplete condition and what it still needs. Nothing is outlined in red. */
  function condError(n){
    if(!n.checked || n.groups.some(g => g.conds.some(condDone))) return '';
    const g = n.groups[0], c = g.conds[0];
    const need = [!c.field && 'a field', !c.op && 'an operator', !String(c.value).trim() && 'a value'].filter(Boolean);
    const list = need.length > 1 ? need.slice(0, -1).join(', ') + ' and ' + need[need.length - 1] : need[0];
    return 'Condition Group 1, Condition 1 needs ' + list + '.';
  }
  function showCondError(sel, n){
    const el = $(sel), msg = condError(n);
    el.textContent = msg; el.classList.toggle('hidden', !msg);
  }

  /* The grouped condition builder: "Condition Group n" cards, each holding
     collapsible conditions joined by an And/Or chip; groups are joined by their
     own chip. Every join chip is a toggle (the ⟳ flips And ↔ Or). */
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const joinChip = (act, g, c, join) =>
    `<div class="cg-join"><i></i><button class="join-chip" type="button" data-a="${act}" data-g="${g}" data-c="${c}" data-tip="Switch between And / Or">${cap(join)} ${img('refresh-ccw')}</button><i></i></div>`;
  function condHTML(n, g, gi, c, ci){
    return (ci ? joinChip('cjoin', gi, ci, c.join) : '')
      + `<div class="cg-cond${c.open ? '' : ' closed'}" data-g="${gi}" data-c="${ci}">`
      + `<div class="cg-cond-head"><button class="cg-toggle" type="button" data-a="ctoggle"><img src="assets/chevron-down.svg" alt="">Condition ${ci + 1}</button>`
      + (g.conds.length > 1 ? `<button class="cg-x" type="button" data-a="cdel" aria-label="Remove condition"><img src="assets/delete.svg" alt=""></button>` : '')
      + `</div><div class="cg-cond-body"><div class="cond-grid">`
      + `<div class="cond-row"><div class="cell cell-condition"><select data-f="field">${optionsHTML(FIELDS, c.field, 'Select condition')}</select><img src="assets/chevron-down.svg" alt=""></div>`
      + `<div class="cell cell-operator"><select data-f="op">${optionsHTML(OPS, c.op, 'Select operator')}</select><img src="assets/chevron-down.svg" alt=""></div></div>`
      + `<div class="cond-row"><div class="cell cell-val"><input data-f="value" type="text" placeholder="${c.fx ? 'Expression, e.g. ticket.priority' : 'Select value'}" value="${esc(c.value)}"></div>`
      + `<button class="fx-btn${c.fx ? ' on' : ''}" type="button" data-a="fx" data-tip="${c.fx ? 'Use a plain value' : 'Use an expression'}">fx</button></div>`
      + `</div></div></div>`;
  }
  function groupsHTML(n){
    return n.groups.map((g, gi) =>
      (gi ? joinChip('gjoin', gi, 0, g.join) : '')
      + `<div class="cg" data-g="${gi}"><div class="cg-head"><span class="cg-chip">Condition Group ${gi + 1}</span>`
      + `<div class="cg-tools"><button class="hover-box sm" type="button" data-a="gdup" data-tip="Duplicate group" aria-label="Duplicate group"><img src="assets/copy.svg" alt=""></button>`
      + (n.groups.length > 1 ? `<button class="hover-box sm danger" type="button" data-a="gdel" data-tip="Delete group" aria-label="Delete group"><img src="assets/delete.svg" alt=""></button>` : '')
      + `</div></div><div class="cg-body">${g.conds.map((c, ci) => condHTML(n, g, gi, c, ci)).join('')}`
      + `<button class="btn-ghost sm" type="button" data-a="cadd" data-g="${gi}"><img src="assets/n-plus.svg" alt="">Add Condition</button></div></div>`
    ).join('');
  }
  function syncLaneValidity(n){
    const miss = missingOf(n), show = n.checked;
    $('#lnNameBox').classList.toggle('invalid', show && miss.includes('title'));
    showCondError('#lnCondErr', n);
    setHeadName('ln', n);
    renderAlert($('#lnAlert'), n);
    $('#lnNext').innerHTML = nextRowsHTML(n);
  }
  function openLane(n){
    openDrawer('lane');
    const b = nodes[n.parent], isElse = n.kind === 'else', idx = b.lanes.indexOf(n.id);
    gotoLabel(n, $('#lnGoto'));
    $('#lnName').value = n.title; setHeadName('ln', n);
    $('#lnIfOnly').classList.toggle('hidden', isElse);
    $('#lnDesc').textContent = isElse
      ? 'Runs when none of the branches above match.'
      : 'Set the conditions that send the workflow down this path.';
    $('#lnCond').innerHTML = isElse ? '' : groupsHTML(n);
    $('#lnDelete').classList.toggle('hidden', ifLanes(b)[0] === n);
    $('#lnPos').textContent = (idx + 1) + ' of ' + b.lanes.length;
    $('.lane-step').classList.toggle('hidden', b.lanes.length < 2);     // nothing to step through with a single branch
    $('#lnPrev').disabled = idx <= 0;
    $('#lnNextBtn').disabled = idx >= b.lanes.length - 1;
    syncLaneValidity(n);
    $('#lnScroll').scrollTop = 0; $('#lnHead').classList.remove('collapsed');
  }
  const laneEdited = () => { const n = nodes[selId]; if(n && n.type === 'lane'){ syncLaneValidity(n); render(); } };
  $('#lnName').addEventListener('input', e => {
    const n = nodes[selId]; if(!n) return;
    n.title = e.target.value;
    laneEdited();
  });
  /* Wires one grouped builder to its DOM: `edited` runs after every change so the
     owning drawer can revalidate and repaint the canvas. Used by the branch-path
     drawer and by IF/Else — one builder, two homes. */
  const condAt = (n, el) => { const c = el.closest('.cg-cond'); return c ? n.groups[+c.dataset.g].conds[+c.dataset.c] : null; };
  function bindBuilder(listSel, addSel, clearSel, edited){
    const list = $(listSel);
    const redraw = n => { list.innerHTML = groupsHTML(n); edited(); };
    function onField(e){
      const f = e.target.dataset.f; if(!f) return;
      const n = nodes[selId], c = condAt(n, e.target); if(!c) return;
      c[f] = e.target.value; edited();
    }
    list.addEventListener('input', onField);
    list.addEventListener('change', onField);
    list.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if(!b) return;
      const n = nodes[selId], a = b.dataset.a, host = b.closest('.cg-cond');
      const gi = +(b.dataset.g != null && b.dataset.g !== '' ? b.dataset.g : (host ? host.dataset.g : b.closest('.cg').dataset.g));
      const ci = host ? +host.dataset.c : +b.dataset.c;
      const g = n.groups[gi];
      if(a === 'ctoggle'){ g.conds[ci].open = !g.conds[ci].open; list.innerHTML = groupsHTML(n); return; }   // layout only
      if(a === 'fx') g.conds[ci].fx = !g.conds[ci].fx;
      else if(a === 'cjoin') g.conds[ci].join = g.conds[ci].join === 'and' ? 'or' : 'and';
      else if(a === 'gjoin') g.join = g.join === 'and' ? 'or' : 'and';
      else if(a === 'cadd') g.conds.push(newCond());
      else if(a === 'cdel') g.conds.splice(ci, 1);
      else if(a === 'gdup') n.groups.splice(gi + 1, 0, JSON.parse(JSON.stringify(g)));
      else if(a === 'gdel'){ if(n.groups.length < 2) return; n.groups.splice(gi, 1); }
      redraw(n);
    });
    $(addSel).addEventListener('click', () => { const n = nodes[selId]; n.groups.push(newGroup()); redraw(n); });
    $(clearSel).addEventListener('click', () => { const n = nodes[selId]; n.groups = [newGroup()]; redraw(n); });
  }
  bindBuilder('#lnCond', '#lnAddGroup', '#lnClearAll', () => laneEdited());
  function stepLane(d){
    const n = nodes[selId], b = nodes[n.parent], to = b.lanes[b.lanes.indexOf(n.id) + d];
    if(to){ selectNode(to); focusNode(to); }
  }
  $('#lnPrev').addEventListener('click', () => stepLane(-1));
  $('#lnNextBtn').addEventListener('click', () => stepLane(1));
  /* the "1 of N" readout is also a quick-jump: click it for the full list of
     sibling branches, so a workflow with many branches doesn't need N clicks
     of Prev/Next to reach the far one */
  function openLaneJump(){
    const n = nodes[selId]; if(!n || n.type !== 'lane') return;
    const b = nodes[n.parent];
    const items = b.lanes.map(id => {
      const l = nodes[id];
      return {
        id, icon:'split', tone:'split',
        label: l.title || (l.kind === 'else' ? 'Default' : 'Add name...'),
        sub: l.kind === 'else' ? 'Runs when no other branch matches' : (condSummary(l) || 'Set up conditions'),
      };
    });
    WFPop.open({
      anchor: $('#lnPos'), noSearch:true, wide:true, title:'Jump to branch', selected:n.id,
      items,
      onPick(item){ selectNode(item.id); focusNode(item.id); }
    });
  }
  $('#lnPos').addEventListener('click', openLaneJump);
  $('#lnGoto').addEventListener('click', () => { const p = nodes[selId].parent; if(p){ selectNode(p); focusNode(p); } });
  $('#lnClose').addEventListener('click', deselect);
  $('#lnDelete').addEventListener('click', () => removeNode(selId));
  bindNext($('#lnNext'));

  /* ------------------ Condition (Inline) drawer
     One card: title, source node, the grouped And/Or condition builder, and
     what runs next — always visible, same as Trigger's, not gated behind
     completion (the canvas already offers the "+" before the node is filled
     in, so the drawer shouldn't lag behind that). */
  function syncConditionValidity(n){
    $('#cdTitleBox').classList.toggle('invalid', n.checked && !n.title.trim());
    setHeadName('cd', n);
    $('#cdSourceBox').classList.toggle('invalid', n.checked && !n.source);
    showCondError('#cdCondErr', n);
    renderAlert($('#cdAlert'), n);
    $('#cdNext').innerHTML = nextRowsHTML(n);
  }
  function openCondition(n){
    openDrawer('cond');
    $('#cdTitle').value = n.title; setDesc($('#cdDesc'), n.desc);
    setHeadName('cd', n);
    gotoLabel(n, $('#cdGoto'));
    fillSource(n, $('#cdSource'), $('#cdSourceBox'));
    $('#cdCond').innerHTML = groupsHTML(n);
    syncConditionValidity(n);
    $('#cdScroll').scrollTop = 0; $('#cdHead').classList.remove('collapsed');
  }
  const condEdited = () => { const n = nodes[selId]; if(n && n.type === 'cond'){ syncConditionValidity(n); render(); } };
  $('#cdTitle').addEventListener('input', e => {
    const n = nodes[selId]; if(!n) return;
    n.title = e.target.value; condEdited();
  });
  $('#cdDesc').addEventListener('input', e => { const n = nodes[selId]; if(n){ n.desc = e.target.value; autoGrow(e.target); render(); } });
  $('#cdSource').addEventListener('change', e => {
    const n = nodes[selId]; if(!n) return;
    n.source = e.target.value; condEdited();
  });
  bindBuilder('#cdCond', '#cdAddGroup', '#cdClearAll', condEdited);
  $('#cdGoto').addEventListener('click', () => { const p = nodes[selId].parent; if(p){ selectNode(p); focusNode(p); } });
  $('#cdClose').addEventListener('click', deselect);
  $('#cdDelete').addEventListener('click', () => removeNode(selId));
  $('#cdReplace').addEventListener('click', () => replaceNode(selId));
  $('#cdMore').addEventListener('click', () => openNodeMenu(nodes[selId], $('#cdMore')));
  bindNext($('#cdNext'));

  /* ------------------ node lifecycle */
  function dropSubtree(id){
    const n = nodes[id]; if(!n) return;
    Object.values(n.slots).forEach(dropSubtree);
    (n.parallel || []).forEach(dropSubtree);
    delete nodes[id];
  }
  function removeNode(id, confirmed){
    const n = nodes[id]; if(!n || !n.parent) return;
    const parent = nodes[n.parent];
    if(n.type === 'lane'){
      if(ifLanes(parent)[0] === n){
        toast('Branch 1 is required — it cannot be deleted');
        return;
      }
      /* deleting a branch takes everything built after it — so ask first */
      if(!confirmed){
        const k = stepsBelow(id);
        confirmDialog({
          title: 'Delete ' + (n.title || 'this branch') + '?',
          body: k ? 'This branch and the ' + k + ' step' + (k > 1 ? 's' : '') + ' after it will be deleted. You can undo this right after.'
                  : 'This branch will be deleted. You can undo this right after.',
          confirmLabel: 'Delete branch',
          onConfirm: () => removeNode(id, true)
        });
        return;
      }
      parent.lanes.splice(parent.lanes.indexOf(id), 1);
    }
    Object.keys(parent.slots).forEach(k => { if(parent.slots[k] === id) delete parent.slots[k]; });
    if(parent.parallel) parent.parallel = parent.parallel.filter(k => k !== id);
    /* if the first node went and parallel siblings remain, the next one steps up */
    if(!parent.slots.next && parent.parallel && parent.parallel.length) parent.slots.next = parent.parallel.shift();
    dropSubtree(id);
    selId = null; selectNode(parent.id);
  }
  /* swap a node for another type: drop it, then reopen the picker on its own slot */
  function replaceNode(id){
    const n = nodes[id]; if(!n || !n.parent) return;
    const parent = nodes[n.parent];
    let slot = Object.keys(parent.slots).find(k => parent.slots[k] === id);
    Object.keys(parent.slots).forEach(k => { if(parent.slots[k] === id) delete parent.slots[k]; });
    if(parent.parallel && parent.parallel.includes(id)){ parent.parallel = parent.parallel.filter(k => k !== id); slot = 'par'; }
    dropSubtree(id);
    selId = parent.id; render();
    openNodePicker(parent.id, slot);
  }

  /* ---------------------------------------------------------- sticky notes
     A lightweight sibling to the node model: { id, x, y, text, anchor, ax, ay }
     in world space, no slots/parent/ports. Placed by the Note tool (click empty
     canvas), then dragged/edited/deleted like any other canvas object. Included
     in undo history alongside the node graph.

     `anchor` is the id of whichever node the note landed nearest at the moment
     it was placed (or last manually dragged) — a note is almost always commentary
     ABOUT something nearby, so it should travel with that node: when the node
     moves, whether from a plain drag or a layout-direction switch, relayout()
     re-derives the note's x/y from the node's new position plus the fixed
     offset (`ax`,`ay`) captured at anchor time. A note dropped far from
     anything gets `anchor: null` and simply stays where it was put. The anchor
     itself only ever changes on an explicit user action (placing or re-dragging
     the note) — relayout never silently re-pins a note to a different node. */
  let stickies = {}, stickySeq = 0;
  const stickyEls = {};
  const toolCbs = [];
  const STICKY_ANCHOR_MAX = 400;             // beyond this, nothing is "nearby" enough to pin to

  /* the closest node to a world point, or null if nothing is within reach */
  function nearestNode(wx, wy){
    let best = null, bestD = Infinity;
    Object.keys(lastPos).forEach(k => {
      const p = lastPos[k], el = els[k]; if(!p || !el) return;
      const d = Math.hypot(wx - (p.x + el.offsetWidth / 2), wy - (p.y + el.offsetHeight / 2));
      if(d < bestD){ bestD = d; best = k; }
    });
    return best != null && bestD <= STICKY_ANCHOR_MAX ? best : null;
  }
  /* (re)pin a note to whatever node is nearest its CURRENT position — called
     when it's first placed, and again after the user finishes dragging it */
  function anchorSticky(id){
    const s = stickies[id]; if(!s) return;
    const near = nearestNode(s.x + 90, s.y + 48);            // the note's own rough centre
    if(near){ s.anchor = near; s.ax = s.x - lastPos[near].x; s.ay = s.y - lastPos[near].y; }
    else s.anchor = null;
  }

  function stickyHTML(){
    return `<button class="sticky-del" type="button" aria-label="Delete note">${img('close2')}</button>`
      + `<textarea class="sticky-text" placeholder="Note…" spellcheck="false"></textarea>`;
  }
  function renderSticky(id){
    const s = stickies[id]; if(!s) return;
    let el = stickyEls[id];
    if(!el){
      el = document.createElement('div');
      el.className = 'sticky'; el.dataset.key = id;
      el.innerHTML = stickyHTML();
      const ta = el.querySelector('.sticky-text');
      ta.value = s.text;
      ta.addEventListener('input', () => { s.text = ta.value; pushHistory(); });
      world.appendChild(el);
      stickyEls[id] = el;
    }
    el.style.left = s.x + 'px'; el.style.top = s.y + 'px';
  }
  function addSticky(wx, wy){
    const id = 'note' + (++stickySeq);
    stickies[id] = { id, x: Math.round(wx - 90), y: Math.round(wy - 18), text:'', anchor:null, ax:0, ay:0 };
    anchorSticky(id);
    renderSticky(id);
    pushHistory();
    return stickies[id];
  }
  function removeSticky(id){
    delete stickies[id];
    if(stickyEls[id]){ stickyEls[id].remove(); delete stickyEls[id]; }
    pushHistory();
  }
  function renderAllStickies(){ Object.keys(stickies).forEach(renderSticky); }

  /* ------------------ canvas interactions */
  /* ---- dragging: nodes move themselves (and their subtree), empty canvas pans ----
     A node drag stores an offset that `layout` adds on top of the computed
     position, so the automatic layout still runs — the offset just nudges it. */
  let drag = null, dragged = false, tool = 'select';
  const DRAG_SLOP = 4;                                   // below this it counts as a click

  canvasEl.addEventListener('mousedown', e => {
    if(e.button !== 0) return;
    if(e.target.closest('.t-plus,.par-slot,.edge-hot,[data-act],.card-bot:not(.ro)')) return;   // those have their own jobs
    /* No more Hand/Select mode to pick between: a node or sticky under the
       cursor drags itself, and empty canvas always pans — the one exception
       is the Note tool, where an empty-canvas press is left alone so the
       click handler below can place a note there instead. */
    const stickyEl = e.target.closest('.sticky');
    if(stickyEl && !e.target.closest('.sticky-text,.sticky-del')){
      const id = stickyEl.dataset.key, s = stickies[id]; if(!s) return;
      drag = { kind:'sticky', id, sx:e.clientX, sy:e.clientY, ox:s.x, oy:s.y, moved:0 };
      stickyEl.classList.add('dragging');
      dragged = false; e.preventDefault();
      return;
    }
    const el = e.target.closest('.nd');
    if(el && nodes[el.dataset.key]){
      const n = nodes[el.dataset.key];
      n.off = n.off || { x:0, y:0 };
      drag = { kind:'node', id:n.id, sx:e.clientX, sy:e.clientY, ox:n.off.x, oy:n.off.y, moved:0, raf:0 };
      el.classList.add('dragging');
    } else if(tool !== 'note'){
      drag = { kind:'pan', sx:e.clientX, sy:e.clientY, px:panX, py:panY, moved:0, raf:0 };
      canvasEl.classList.add('panning');
    } else {
      return;                                            // empty canvas, note tool → the click places it instead
    }
    dragged = false;
    e.preventDefault();                                  // no text selection while dragging
  });

  window.addEventListener('mousemove', e => {
    if(!drag) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
    if(drag.moved > DRAG_SLOP) dragged = true;
    if(drag.kind === 'pan'){
      panX = drag.px + dx; panY = drag.py + dy;   // the world follows the cursor 1:1
      applyView();
      return;
    }
    if(drag.kind === 'sticky'){
      const s = stickies[drag.id]; if(!s) return;
      s.x = Math.round(drag.ox + dx / zoom); s.y = Math.round(drag.oy + dy / zoom);
      renderSticky(drag.id);
      return;
    }
    const n = nodes[drag.id]; if(!n) return;
    n.off.x = drag.ox + dx / zoom;                       // screen pixels → world units
    n.off.y = drag.oy + dy / zoom;
    if(!drag.raf) drag.raf = requestAnimationFrame(() => { if(drag){ drag.raf = 0; relayout(); } });
  });

  window.addEventListener('mouseup', () => {
    if(!drag) return;
    if(drag.raf) cancelAnimationFrame(drag.raf);
    if(drag.kind === 'node'){ const el = els[drag.id]; if(el) el.classList.remove('dragging'); }
    else if(drag.kind === 'sticky'){
      const el = stickyEls[drag.id]; if(el) el.classList.remove('dragging');
      anchorSticky(drag.id);       // dropped here → (re)pin to whatever's nearest now
      pushHistory();
    }
    else canvasEl.classList.remove('panning');
    drag = null;
    relayout();
    setTimeout(() => { dragged = false; }, 0);           // let the click event see the flag first
  });

  /* on-canvas description: update the model as you type, repaint on blur */
  world.addEventListener('input', e => {
    const f = e.target.closest('.card-bot'); if(!f) return;
    const n = nodes[f.dataset.desc]; if(!n) return;
    n.desc = f.value;
    if(n.id === selId){                       // keep the open drawer in step
      const d = $({ trigger:'#trDesc', branch:'#brDesc' }[n.type]);
      if(d) d.value = n.desc;
    }
  });
  world.addEventListener('focusout', e => {
    if(e.target.closest('.card-bot')) render();
  });

  /* The canvas no longer scrolls, so the wheel has to do the panning itself —
     and ctrl/⌘ + wheel zooms around the pointer, as a canvas is expected to. */
  canvasEl.addEventListener('wheel', e => {
    e.preventDefault();
    const c = canvasEl.getBoundingClientRect();
    if(e.ctrlKey || e.metaKey){
      zoomAt(zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12), e.clientX - c.left, e.clientY - c.top);
      zoomCbs.forEach(cb => cb(Math.round(zoom * 100)));
    } else {
      panX -= e.deltaX; panY -= e.deltaY;
      applyView();
    }
  }, { passive:false });

  /* ONE handler for the whole canvas. It has to be one: a node click re-renders
     the card, which detaches the clicked element — a second listener further up
     would then find no .nd on the (now parentless) target and read the click as
     a background click, closing the drawer it had just opened. */
  canvasEl.addEventListener('click', e => {
    if(dragged) return;                                  // that was a drag, not a click
    const del = e.target.closest('.sticky-del');
    if(del){ removeSticky(del.closest('.sticky').dataset.key); return; }
    if(e.target.closest('.sticky')) return;               // its textarea handles itself
    if(e.target.closest('.t-plus,.par-slot,.card-bot:not(.ro)')) return;     // handle themselves
    if(tool === 'note'){
      const c = canvasEl.getBoundingClientRect();
      addSticky((e.clientX - c.left - panX) / zoom, (e.clientY - c.top - panY) / zoom);
      tool = 'select'; toolCbs.forEach(cb => cb(tool));   // one note per click, then back to normal
      return;
    }
    const el = e.target.closest('.nd');
    if(!el){ deselect(); return; }                       // empty canvas → drop the selection
    const n = nodes[el.dataset.key]; if(!n) return;
    const act = e.target.closest('[data-act]');
    if(act){
      const a = act.dataset.act;
      if(a === 'toggle'){ n.expanded = !n.expanded; render(); return; }
      if(a === 'delete'){
        if(n.type === 'trigger'){ selId = rootId; $('#trClear').click(); }
        else removeNode(n.id);
        return;
      }
      if(a === 'repeat'){
        if(n.type === 'trigger'){ selId = rootId; openTriggerPicker(); }
        else replaceNode(n.id);
        return;
      }
      if(a === 'more'){
        openNodeMenu(n, () => els[n.id] && els[n.id].querySelector('[data-act="more"]'));
        return;
      }
      toast('Coming soon');
      return;
    }
    selectNode(n.id);
  });

  /* Scroll-driven collapsing header (all three drawers share the behaviour).
     Threshold + hysteresis band so the header never flickers. */
  function bindCollapse(scroll, head){
    /* while the pill still shows its label, its tooltip would only repeat it */
    const syncTip = () => {
      const pill = head.querySelector('.goto-pill');
      if(pill) pill.toggleAttribute('data-tipoff', !head.classList.contains('collapsed'));
    };
    syncTip();
    /* Collapsing hands its height back to the scroll area. If the panel only
       overflows by less than that, the overflow disappears, the browser forces
       scrollTop to 0, and the header immediately expands again — an oscillation.
       So only collapse when there is enough scroll to survive it. */
    const worthCollapsing = () => {
      const exp = head.querySelector('.head-expanded');
      const freed = exp ? exp.scrollHeight + 12 : 0;          // + its margin-top
      return (scroll.scrollHeight - scroll.clientHeight) > freed + 16;
    };
    scroll.addEventListener('scroll', () => {
      const st = scroll.scrollTop, c = head.classList.contains('collapsed');
      if(!c && st > 24 && worthCollapsing()){ head.classList.add('collapsed'); syncTip(); }
      else if(c && st < 8){ head.classList.remove('collapsed'); syncTip(); }
    }, { passive:true });
  }
  bindCollapse($('#brScroll'), $('#brHead'));
  bindCollapse($('#trScroll'), $('#trHead'));
  bindCollapse($('#lnScroll'), $('#lnHead'));
  bindCollapse($('#cdScroll'), $('#cdHead'));

  document.querySelectorAll('.switch-tabs').forEach(group => {
    group.querySelectorAll('.switch-tab').forEach(btn => btn.addEventListener('click', () => {
      group.querySelectorAll('.switch-tab').forEach(b => b.classList.remove('active')); btn.classList.add('active');
    }));
  });

  /* ---------------------------------------------------------- view (pan + zoom)
     The canvas is a free surface, not a scroller: panning moves the whole world
     by a transform, so you can drag in any direction whether the flow overflows
     the viewport or fits inside it. The dot grid rides along with the pan, which
     is what makes the movement read as the canvas itself moving. */
  let zoom = 1, panX = 0, panY = 0, axis = 'v';           // axis: 'v' vertical (default) | 'h' horizontal
  const zoomCbs = [], viewCbs = [];
  world.style.transformOrigin = '0 0';
  function applyView(){
    world.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    canvasEl.style.backgroundPosition = panX + 'px ' + panY + 'px';
    /* one hook for "the view changed" — pan, zoom, or a relayout after an edit —
       so the minimap can stay in sync without polling */
    viewCbs.forEach(cb => cb({ zoom, panX, panY, content }));
  }
  /* centre the viewport on a WORLD point at the current zoom — what a minimap
     click/drag, or "jump to this node", pans to */
  function panTo(wx, wy){
    panX = canvasEl.clientWidth / 2 - wx * zoom;
    panY = canvasEl.clientHeight / 2 - wy * zoom;
    applyView();
  }
  /* keep the point under (px,py) — viewport coords — fixed across a zoom change */
  function zoomAt(z, px, py){
    z = Math.max(.25, Math.min(2, z));
    const wx = (px - panX) / zoom, wy = (py - panY) / zoom;
    zoom = z;
    panX = px - wx * zoom; panY = py - wy * zoom;
    applyView();
  }
  function centerContent(){
    if(!content) return;
    const w = content.maxX - content.minX, h = content.maxY - content.minY;
    panX = (canvasEl.clientWidth - w * zoom) / 2 - content.minX * zoom;
    panY = (canvasEl.clientHeight - h * zoom) / 2 - content.minY * zoom;
    applyView();
  }
  /* Nudge the view so an element sits comfortably inside the canvas. The margins
     are per-side because what needs clearing differs by direction — a menu that
     opens to the right needs room for itself AND its help bubble. */
  function panIntoView(el, m){
    if(!el) return;
    m = Object.assign({ left:150, right:150, top:150, bottom:150 },
                      typeof m === 'number' ? { left:m, right:m, top:m, bottom:m } : m);
    const r = el.getBoundingClientRect(), c = canvasEl.getBoundingClientRect();
    let dx = 0, dy = 0;
    if(r.left < c.left + m.left) dx = c.left + m.left - r.left;
    else if(r.right > c.right - m.right) dx = c.right - m.right - r.right;
    if(r.top < c.top + m.top) dy = c.top + m.top - r.top;
    else if(r.bottom > c.bottom - m.bottom) dy = c.bottom - m.bottom - r.bottom;
    if(dx || dy){ panX += dx; panY += dy; applyView(); }
  }

  /* ---------------------------------------------------------- history */
  /* Snapshot-per-settled-state. render() is the single funnel every mutation
     passes through, so the history is taken there, debounced so a burst of
     keystrokes collapses into one undo step. */
  let hist = [], hi = -1, histT = null, restoring = false;
  const histCbs = [];
  const snapshot = () => JSON.stringify({ nodes, rootId, selId, seq, brSeq, stickies, stickySeq });
  function pushHistory(){
    if(restoring) return;
    clearTimeout(histT);
    histT = setTimeout(() => {
      const s = snapshot();
      if(hist[hi] === s) return;
      hist = hist.slice(0, hi + 1); hist.push(s); hi = hist.length - 1;
      if(hist.length > 100){ hist.shift(); hi--; }
      histCbs.forEach(cb => cb());
    }, 350);
  }
  function restore(json){
    const s = JSON.parse(json);
    restoring = true;
    Object.keys(nodes).forEach(k => delete nodes[k]);
    Object.assign(nodes, s.nodes);
    rootId = s.rootId; seq = s.seq; brSeq = s.brSeq;
    Object.keys(els).forEach(k => { els[k].remove(); delete els[k]; });
    born.clear(); born.add(rootId);
    Object.keys(stickies).forEach(k => delete stickies[k]);
    Object.assign(stickies, s.stickies || {});
    stickySeq = s.stickySeq || 0;
    Object.keys(stickyEls).forEach(k => { stickyEls[k].remove(); delete stickyEls[k]; });
    renderAllStickies();
    picking = null;
    selId = s.selId && nodes[s.selId] ? s.selId : null;
    render();
    /* an unconfigured trigger would pop the type picker — an undo should never
       open a menu, so only reopen a drawer that has something to show */
    const sel = selId && nodes[selId];
    if(sel && !(sel.type === 'trigger' && !sel.trigType)) selectNode(selId);
    else { selId = null; closeDrawer(); render(); }
    restoring = false;
  }

  /* ---------------------------------------------------------- chrome bridge */
  window.WFApp = {
    toast,
    confirm: confirmDialog,
    setZoom(z){ zoomAt(z, canvasEl.clientWidth / 2, canvasEl.clientHeight / 2); },
    onZoom(cb){ zoomCbs.push(cb); },
    fitScale(){
      if(!content) return 1;
      const w = content.maxX - content.minX, h = content.maxY - content.minY;
      if(!w || !h) return 1;
      return Math.min((canvasEl.clientWidth - 90) / w, (canvasEl.clientHeight - 90) / h, 1);
    },
    scrollToStart(){ centerContent(); },
    onViewChange(cb){ viewCbs.push(cb); },
    setAxis(a){ axis = a === 'h' ? 'h' : 'v'; render(); },
    getAxis(){ return axis; },
    panTo(wx, wy){ panTo(wx, wy); },
    canvasSize(){ return { w: canvasEl.clientWidth, h: canvasEl.clientHeight }; },
    /* everything the minimap draws: node cards (by type) and sticky notes, all
       in world space, taken straight from the last committed layout */
    overviewRects(){
      const out = Object.keys(lastPos).map(k => {
        const n = nodes[k]; if(!n) return null;
        const el = els[k]; if(!el) return null;
        return { x: lastPos[k].x, y: lastPos[k].y, w: 250, h: el.offsetHeight, type: n.type };
      }).filter(Boolean);
      Object.values(stickies).forEach(s => {
        const el = stickyEls[s.id];
        out.push({ x: s.x, y: s.y, w: el ? el.offsetWidth : 180, h: el ? el.offsetHeight : 90, type:'note' });
      });
      return out;
    },
    canUndo: () => hi > 0,
    canRedo: () => hi < hist.length - 1,
    undo(){ if(hi > 0){ hi--; restore(hist[hi]); } },
    redo(){ if(hi < hist.length - 1){ hi++; restore(hist[hi]); } },
    resetFlow(){
      Object.keys(nodes).forEach(k => delete nodes[k]);
      Object.keys(els).forEach(k => { els[k].remove(); delete els[k]; });
      born.clear(); seq = 0; brSeq = 0; selId = null; picking = null;
      Object.keys(stickies).forEach(k => delete stickies[k]);
      Object.keys(stickyEls).forEach(k => { stickyEls[k].remove(); delete stickyEls[k]; });
      const fresh = newTrigger(); rootId = fresh.id; born.add(rootId);
      closeDrawer(); render();
    },
    onHistory(cb){ histCbs.push(cb); },
    setTool(t){ tool = t; canvasEl.classList.toggle('tool-note', t === 'note'); },
    onToolChange(cb){ toolCbs.push(cb); },
    /* the Delete/Backspace shortcut — same removeNode() the canvas's own
       delete icon calls, so it inherits the same confirm-before-deleting-a-
       branch-with-steps-after-it and can't-delete-Branch-1 guards for free.
       A no-op if nothing is selected, or the selection is the trigger. */
    deleteSelected(){ if(selId) removeNode(selId); },
  };

  /* the root stays centred, so a window resize has to re-lay-out */
  let resizeT;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(render, 120); });

  /* Dev helper: __wf.nodes / __wf.state() */
  window.__wf = { nodes, state:() => Object.values(nodes).map(n => ({ id:n.id, type:n.type, state:stateOf(n) })) };

  /* ---------------------------------------------------------- boot */
  const t = newTrigger(); rootId = t.id;
  born.add(rootId);
  render();                      // trigger sits on the canvas; no drawer until it is clicked
})();
