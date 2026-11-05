/* HiEnd Asia 2026 – Level 3 room finder (Suntec Singapore).
   Mobile first: search and room list, a flat portrait schematic map (not to scale, escalators and entrance at the bottom)
   with a walking route, and a details panel with directions. No dependencies.
   Room info comes from a published Google Sheet (CSV); room positions live in ROOMS below.

   Usage:
     <div id="hea-map" data-sheet="https://docs.google.com/.../pub?output=csv"></div>
     <link rel="stylesheet" href="floormap/floormap.css">
     <script src="floormap/floormap.js" defer></script>
   Optional: window.HEA_MAP_CONFIG = { mount: '#hea-map', sheetCsv: '...', here: 'entrance' }
   "You are here": add ?here=entrance, ?here=esc-left, ?here=esc-right or ?here=308 to the page URL (QR signage). */
(function () {
  'use strict';

  // ---------- Text (translate here) ----------
  var STR = {
    search: 'Search brand, exhibitor or room',
    clear: 'Clear search',
    all: 'All',
    zones: { east: 'East wing', west: 'West wing', centre: 'Front' },
    zoneRooms: { east: 'Rooms 303–312', west: 'Rooms 332–336', centre: 'Room 323, Concourse 2 & 3' },
    room: 'Room',
    tba: 'Exhibitor to be announced',
    none: 'No rooms match your search.',
    pick: 'Pick a room on the map or in the list to see who is there and how to get there.',
    close: 'Close',
    youAreHere: 'You are here',
    infoCounter: 'Info counter',
    escalators: 'Escalators to ground floor',
    wc: 'Toilets',
    route: 'Your route',
    notToScale: 'Not to scale',
    entranceBottom: 'Escalators and entrance at the bottom',
    updated: 'Room allocations may change before the show.',
    types: { listening: 'Listening room', vip: 'VIP room', hall: 'Exhibition hall', stage: 'Concert hall', tbc: 'To be confirmed' },
    tbcShort: 'TBC',
    // Directions. {from} = starting point, {n} = room, {ord} = first/second/…
    from: { entrance: 'the info counter', esc: 'the escalators', room: 'Room {n}' },
    ord: ['first', 'second', 'third', 'fourth', 'fifth'],
    dir: {
      east: 'From {from}, walk up Foyer 3. Room {n} is on your right, the {ord} door.',
      farEast: 'From {from}, walk up Foyer 1 on the far right. Room {n} is on your right, the {ord} door.',
      top: 'From {from}, walk up Foyer 3 to the end and turn right into Foyer 2. Room {n} is on your left, the {ord} door.',
      west: 'From {from}, walk left along Foyer 6, then up Foyer 5. Room {n} is on your left, the {ord} door.',
      centre: 'From {from}, walk ahead to Foyer 6. Room {n} is in front of you.',
      concourse: 'Concourse 2 & 3 is at the front of the floor, between the escalators.',
      follow: 'Follow the dashed line from {from}.',
      same: 'You are here.'
    }
  };

  // ---------- Schematic (viewBox 360 × 486, not to scale; front of the floor at the bottom) ----------
  // Each room: [x1, y1, x2, y2, door side]. Positions follow Suntec's Level 3 plan, simplified.
  var ROOMS = {
    '332': [16, 40, 82, 78, 'west'], '333': [16, 82, 82, 120, 'west'], '334': [16, 124, 82, 162, 'west'],
    '335': [16, 166, 82, 204, 'west'], '336': [16, 208, 82, 246, 'west'],
    '307': [208, 20, 250, 62, 'top'], '306': [254, 20, 296, 62, 'top'], '305': [300, 20, 342, 62, 'top'],
    '308': [208, 84, 282, 122, 'east'], '309': [208, 126, 282, 164, 'east'], '310': [208, 168, 282, 206, 'east'],
    '311': [208, 210, 282, 248, 'east'], '312': [208, 256, 282, 294, 'east'],
    '304': [292, 84, 344, 130, 'farEast'], '303': [292, 134, 344, 180, 'farEast'],
    '323': [124, 256, 176, 294, 'centre'],
    'C23': [96, 438, 264, 470, 'concourse']
  };
  var ZONE = { west: 'west', top: 'east', east: 'east', farEast: 'east', centre: 'centre', concourse: 'centre' };
  var ORDER = { east: ['312', '311', '310', '309', '308'], farEast: ['303', '304'], top: ['307', '306', '305'], west: ['336', '335', '334', '333', '332'] };
  var SHORT = { C23: 'Concourse 2 & 3' };
  var VENUE = [ // other Level 3 rooms, drawn faintly for orientation
    { r: [112, 20, 182, 62], t: '327–330' }, { r: [100, 84, 192, 240], t: 'Summit 1 & 2|324–326' },
    { r: [292, 184, 344, 294], t: '300–302' }
  ];
  var WC = [[100, 41], [194, 41], [106, 275], [192, 275]];
  var ESC = [[88, 360, 152, 387], [88, 390, 124, 406], [88, 413, 124, 430], [206, 360, 269, 387],
    [233, 390, 269, 406], [233, 413, 269, 430], [46, 417, 73, 430], [287, 417, 314, 430]];
  var FOYER = [['Foyer 5', 91, 150, -90], ['Foyer 3', 200, 150, -90], ['Foyer 1', 287, 240, -90], ['Foyer 2', 318, 76, 0], ['Foyer 6', 146, 316, 0]];
  var POI = { entrance: [180, 352], 'esc-left': [120, 375], 'esc-right': [238, 375] };

  // Corridors (route network)
  var N = { Wtop: [91, 30], Wt: [91, 72], Wf: [91, 312], Et: [200, 72], Ef: [200, 312], Ft: [287, 72], Ff: [287, 312], Tr: [344, 72] };
  var SEG = [['Wtop', 'Wt'], ['Wt', 'Wf'], ['Wt', 'Et'], ['Et', 'Ft'], ['Ft', 'Tr'], ['Et', 'Ef'], ['Ft', 'Ff'], ['Wf', 'Ef'], ['Ef', 'Ff']];

  // Default rows, used until the sheet loads (or if it fails)
  var DEFAULT_ROWS = [];
  ['332', '333', '334', '335', '336', '303', '304', '305', '306', '307', '308', '309', '310', '311'].forEach(function (r) {
    DEFAULT_ROWS.push({ room: r, type: 'listening' });
  });
  DEFAULT_ROWS.push({ room: '312', type: 'vip', name: 'VIP room' });
  DEFAULT_ROWS.push({ room: '323', type: 'tbc' });
  DEFAULT_ROWS.push({ room: 'C23', type: 'tbc', name: 'Concourse 2 & 3' });

  // ---------- Helpers ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fill(t, o) { return t.replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function isNum(s) { return /^\d+$/.test(s); }
  function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }

  // Door point on the room edge, and where it meets a corridor
  function door(id) {
    var g = ROOMS[id], cx = (g[0] + g[2]) / 2, cy = (g[1] + g[3]) / 2;
    switch (g[4]) {
      case 'west': return { d: [g[2], cy], a: [91, cy] };
      case 'east': return { d: [g[0], cy], a: [200, cy] };
      case 'farEast': return { d: [g[0], cy], a: [287, cy] };
      case 'top': return { d: [cx, g[3]], a: [cx, 72] };
      case 'centre': return { d: [cx, g[3]], a: [cx, 312] };
      default: return { d: [cx, g[1]], a: [cx, 312], lobby: true }; // concourse: open front area
    }
  }
  function startPoint(here) {
    if (POI[here]) { var p = POI[here]; return { d: p, a: [p[0], 312], lobby: true, poi: here }; }
    if (ROOMS[here]) return door(here);
    return { d: POI.entrance, a: [POI.entrance[0], 312], lobby: true, poi: 'entrance' };
  }
  function onSeg(p, a, b) {
    var cross = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    if (Math.abs(cross) > 0.5) return false;
    return p[0] >= Math.min(a[0], b[0]) - 0.5 && p[0] <= Math.max(a[0], b[0]) + 0.5 &&
      p[1] >= Math.min(a[1], b[1]) - 0.5 && p[1] <= Math.max(a[1], b[1]) + 0.5;
  }
  // Shortest walk along the corridors (Dijkstra on a tiny graph)
  function route(s, e) {
    if (s.lobby && e.lobby) { // both in the open front area: a simple dog-leg
      var mid = (s.d[1] + e.d[1]) / 2;
      return [s.d, [s.d[0], mid], [e.d[0], mid], e.d];
    }
    var pts = {}, adj = {}, extra = { S: s.a, E: e.a };
    Object.keys(N).forEach(function (k) { pts[k] = N[k]; adj[k] = []; });
    Object.keys(extra).forEach(function (k) { pts[k] = extra[k]; adj[k] = []; });
    function link(a, b) { if (a === b) return; var w = dist(pts[a], pts[b]); adj[a].push([b, w]); adj[b].push([a, w]); }
    SEG.forEach(function (sg) {
      var on = Object.keys(extra).filter(function (k) { return onSeg(extra[k], N[sg[0]], N[sg[1]]); })
        .sort(function (x, y) { return dist(N[sg[0]], extra[x]) - dist(N[sg[0]], extra[y]); });
      var chain = [sg[0]].concat(on, [sg[1]]);
      for (var i = 0; i < chain.length - 1; i++) link(chain[i], chain[i + 1]);
    });
    var D = {}, prev = {}, Q = Object.keys(pts);
    Q.forEach(function (k) { D[k] = Infinity; }); D.S = 0;
    while (Q.length) {
      Q.sort(function (x, y) { return D[x] - D[y]; });
      var u = Q.shift(); if (u === 'E' || D[u] === Infinity) break;
      adj[u].forEach(function (n) { var alt = D[u] + n[1]; if (alt < D[n[0]]) { D[n[0]] = alt; prev[n[0]] = u; } });
    }
    var path = [], c = 'E';
    while (c) { path.unshift(pts[c]); c = prev[c]; }
    var out = [s.d].concat(path, [e.d]);
    return out.filter(function (p, i) { return i === 0 || dist(p, out[i - 1]) > 0.5; });
  }

  // ---------- CSV ----------
  function parseCSV(text) {
    var rows = [], row = [], f = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(f); rows.push(row); row = []; f = '';
      } else f += c;
    }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    if (!rows.length) return [];
    var head = rows.shift().map(function (h) { return h.trim().toLowerCase(); });
    return rows.filter(function (r) { return r.some(function (v) { return v.trim(); }); }).map(function (r) {
      var o = {}; head.forEach(function (h, j) { o[h] = (r[j] || '').trim(); }); return o;
    });
  }
  function normalise(rows) {
    return rows.map(function (o) {
      var type = (o.type || 'listening').toLowerCase();
      if (!STR.types[type]) type = 'tbc';
      return { room: String(o.room || '').trim().toUpperCase(), name: o.name || '', type: type,
        exhibitor: o.exhibitor || '', brands: o.brands || '', note: o.note || '',
        show: !/^(n|no|false|0)$/i.test(o.show || '') };
    }).filter(function (o) { return ROOMS[o.room] && o.show; });
  }

  // ---------- Widget ----------
  var uid = 0;
  function init(mount) {
    var cfg = Object.assign({ sheetCsv: mount.getAttribute('data-sheet') || '' }, window.HEA_MAP_CONFIG || {});
    var here = (new URLSearchParams(location.search).get('here') || cfg.here || '').toLowerCase();
    if (ROOMS[here.toUpperCase()]) here = here.toUpperCase();
    var rows = normalise(DEFAULT_ROWS), sel = null, query = '', zone = 'all', id = 'hm' + (++uid);

    mount.classList.add('hm');
    mount.innerHTML =
      '<div class="hm-side">' +
        '<div class="hm-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>' +
        '<input type="search" enterkeyhint="search" autocomplete="off" aria-label="' + esc(STR.search) + '" placeholder="' + esc(STR.search) + '">' +
        '<button type="button" class="hm-clear" aria-label="' + esc(STR.clear) + '" hidden>×</button></div>' +
        '<div class="hm-chips" role="group"></div>' +
        '<div class="hm-list" aria-live="polite"></div>' +
        '<p class="hm-note">' + esc(STR.updated) + '</p>' +
      '</div>' +
      '<div class="hm-main">' +
        '<figure class="hm-stage"><svg class="hm-svg" viewBox="0 0 360 486" role="group" aria-label="Level 3 map"></svg>' +
        '<figcaption class="hm-cap"><span>' + esc(STR.notToScale) + '</span><span>↓ ' + esc(STR.entranceBottom) + '</span></figcaption></figure>' +
        '<ul class="hm-legend"></ul>' +
        '<div class="hm-detail" aria-live="polite"></div>' +
      '</div>';

    var $ = function (s) { return mount.querySelector(s); };
    var svg = $('.hm-svg'), input = $('input'), clearBtn = $('.hm-clear'), chips = $('.hm-chips'),
      list = $('.hm-list'), detail = $('.hm-detail'), legend = $('.hm-legend'), stage = $('.hm-stage');

    function title(r) { return r.name || (SHORT[r.room] || STR.room + ' ' + r.room); }
    function zoneOf(r) { return ZONE[ROOMS[r.room][4]]; }
    function matches(r) {
      if (zone !== 'all' && zoneOf(r) !== zone) return false;
      if (!query) return true;
      return [r.room, SHORT[r.room], r.name, r.exhibitor, r.brands, STR.types[r.type]].join(' ').toLowerCase().indexOf(query) > -1;
    }
    function fromText() {
      var s = startPoint(here);
      if (s.poi === 'entrance') return STR.from.entrance;
      if (s.poi) return STR.from.esc;
      return fill(STR.from.room, { n: here });
    }
    function directions(r) {
      if (here && here === r.room) return STR.dir.same;
      var kind = ROOMS[r.room][4], from = fromText();
      if (ROOMS[here]) return fill(STR.dir.follow, { from: from });
      if (kind === 'concourse') return STR.dir.concourse;
      if (kind === 'centre') return fill(STR.dir.centre, { from: from, n: r.room });
      var i = ORDER[kind].indexOf(r.room);
      return fill(STR.dir[kind], { from: from, n: r.room, ord: STR.ord[i] || String(i + 1) });
    }

    // ---- Map ----
    function drawMap() {
      var o = '<defs><pattern id="' + id + '-tread" width="6" height="4" patternUnits="userSpaceOnUse">' +
        '<rect width="6" height="4" class="hm-esc-bg"/><rect y="3" width="6" height="1" class="hm-esc-line"/></pattern></defs>';
      o += '<rect class="hm-floor" x="6" y="6" width="348" height="474" rx="14"/>';
      o += VENUE.map(function (v) {
        var r = v.r, cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2, lines = v.t.split('|');
        return '<g class="hm-venue"><rect x="' + r[0] + '" y="' + r[1] + '" width="' + (r[2] - r[0]) + '" height="' + (r[3] - r[1]) + '" rx="4"/>' +
          lines.map(function (w, i) { return '<text x="' + cx + '" y="' + (cy + 4 + (i - (lines.length - 1) / 2) * 15) + '">' + esc(w) + '</text>'; }).join('') + '</g>';
      }).join('');
      o += FOYER.map(function (f) {
        return '<text class="hm-foyer" transform="translate(' + f[1] + ' ' + f[2] + ') rotate(' + f[3] + ')">' + f[0] + '</text>';
      }).join('');
      o += ESC.map(function (e) {
        return '<rect class="hm-esc" x="' + e[0] + '" y="' + e[1] + '" width="' + (e[2] - e[0]) + '" height="' + (e[3] - e[1]) + '" rx="2" fill="url(#' + id + '-tread)"><title>' + esc(STR.escalators) + '</title></rect>';
      }).join('');
      o += WC.map(function (w) { return '<g class="hm-wc" role="img" aria-label="' + esc(STR.wc) + '"><circle cx="' + w[0] + '" cy="' + w[1] + '" r="9"/><text x="' + w[0] + '" y="' + (w[1] + 3.5) + '">WC</text></g>'; }).join('');

      rows.forEach(function (r) {
        var g = ROOMS[r.room], x = g[0], y = g[1], w = g[2] - g[0], h = g[3] - g[1], cx = x + w / 2, cy = y + h / 2;
        var big = isNum(r.room) ? r.room : (SHORT[r.room] || r.room);
        var small = r.type === 'vip' ? 'VIP' : r.type === 'tbc' ? STR.tbcShort : '';
        var cls = 'hm-room t-' + r.type + (sel === r.room ? ' is-sel' : '') + (matches(r) ? '' : ' is-dim');
        // The accessible name starts with the text drawn on the room (WCAG 2.5.3 label-in-name), then adds
        // the room's name and type only where they say something new, so nothing is read out twice.
        var vis = big + (small ? ' ' + small : ''), tt = title(r), ty = STR.types[r.type], parts = [vis];
        if (tt && tt !== vis && tt !== ty && tt.indexOf(big) < 0) parts.push(tt);
        if (ty && ty !== vis) parts.push(ty);
        if (r.exhibitor) parts.push(r.exhibitor);
        var aria = parts.join(', ');
        o += '<g class="' + cls + '" data-room="' + esc(r.room) + '" tabindex="0" role="button" aria-label="' + esc(aria) + '" aria-pressed="' + (sel === r.room) + '">' +
          '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5"/>' +
          '<text class="hm-rn" x="' + cx + '" y="' + (small ? cy + 1 : cy + 5.5) + '"' + (big.length > 4 ? ' style="font-size:13px"' : '') + '>' + esc(big) + '</text>' +
          // the leading space keeps the room's text content "312 VIP" (not "312VIP"); SVG doesn't draw it
          (small ? '<text class="hm-rs" x="' + cx + '" y="' + (cy + 14) + '"> ' + esc(small) + '</text>' : '') + '</g>';
      });

      var s = startPoint(here);
      if (sel && ROOMS[sel] && sel !== here) {
        var path = route(s, door(sel));
        o += '<polyline class="hm-route" points="' + path.map(function (p) { return p[0] + ',' + p[1]; }).join(' ') + '"/>';
      }
      var ic = POI.entrance;
      o += '<g class="hm-info" role="img" aria-label="' + esc(STR.infoCounter) + '"><circle cx="' + ic[0] + '" cy="' + ic[1] + '" r="7"/><text class="i" x="' + ic[0] + '" y="' + (ic[1] + 3.5) + '">i</text>' +
        '<text x="' + ic[0] + '" y="' + (ic[1] - 12) + '">' + esc(STR.infoCounter) + '</text></g>';
      if (here && (POI[here] || ROOMS[here])) {
        var sp = s.d;
        o += '<g class="hm-here"><circle class="ring" cx="' + sp[0] + '" cy="' + sp[1] + '" r="8"/><circle class="dot" cx="' + sp[0] + '" cy="' + sp[1] + '" r="6"/>' +
          (function () { // label on the corridor side, away from the room
            var k = ROOMS[here] ? ROOMS[here][4] : '', lx = sp[0] + 11, ly = sp[1] + 4, an = 'start';
            if (k === 'east' || k === 'farEast') { lx = sp[0] - 11; an = 'end'; }
            else if (k === 'top' || k === 'centre') { lx = sp[0]; ly = sp[1] + 22; an = 'middle'; }
            return '<text x="' + lx + '" y="' + ly + '" style="text-anchor:' + an + '">' + esc(STR.youAreHere) + '</text>';
          })() + '</g>';
      }
      svg.innerHTML = o;
    }

    // ---- Side: chips, list, detail, legend ----
    function drawChips() {
      var present = {}; rows.forEach(function (r) { present[zoneOf(r)] = 1; });
      var keys = ['all'].concat(['east', 'west', 'centre'].filter(function (z) { return present[z]; }));
      chips.innerHTML = keys.map(function (k) {
        return '<button type="button" data-zone="' + k + '" aria-pressed="' + (zone === k) + '">' + esc(k === 'all' ? STR.all : STR.zones[k]) + '</button>';
      }).join('');
    }
    function drawList() {
      var html = '', any = false;
      ['east', 'west', 'centre'].forEach(function (z) {
        var items = rows.filter(function (r) { return zoneOf(r) === z && matches(r); })
          .sort(function (a, b) { return a.room.localeCompare(b.room, undefined, { numeric: true }); });
        if (!items.length) return; any = true;
        html += '<section class="hm-group"><h3>' + esc(STR.zones[z]) + ' <span>' + esc(STR.zoneRooms[z]) + '</span></h3><ul>' +
          items.map(function (r) {
            var main = r.exhibitor || r.name || (r.type === 'listening' ? STR.tba : STR.types[r.type]);
            var sub = [STR.types[r.type], r.brands].filter(Boolean).join(' · ');
            return '<li><button type="button" data-room="' + esc(r.room) + '" aria-pressed="' + (sel === r.room) + '">' +
              '<span class="n t-' + r.type + '">' + esc(isNum(r.room) ? r.room : 'C2–3') + '</span>' +
              '<span class="b"><span class="m">' + esc(main) + '</span><span class="s">' + esc(sub) + '</span></span>' +
              '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg></button></li>';
          }).join('') + '</ul></section>';
      });
      list.innerHTML = any ? html : '<p class="hm-empty">' + esc(STR.none) + '</p>';
    }
    function drawDetail() {
      var r = rows.filter(function (x) { return x.room === sel; })[0];
      detail.classList.toggle('is-open', !!r);
      if (!r) { detail.innerHTML = '<p class="hm-pick">' + esc(STR.pick) + '</p>'; return; }
      detail.innerHTML =
        '<button type="button" class="hm-x" aria-label="' + esc(STR.close) + '">×</button>' +
        '<p class="k"><i class="sw t-' + r.type + '"></i>' + esc(STR.types[r.type]) + ' · ' + esc(STR.zones[zoneOf(r)]) + '</p>' +
        '<h3>' + esc(title(r)) + (r.name && isNum(r.room) ? ' <span>' + esc(STR.room + ' ' + r.room) + '</span>' : '') + '</h3>' +
        '<p class="ex">' + esc(r.exhibitor || (r.type === 'listening' ? STR.tba : '')) + '</p>' +
        (r.brands ? '<p class="br">' + esc(r.brands) + '</p>' : '') +
        (r.note ? '<p class="br">' + esc(r.note) + '</p>' : '') +
        '<p class="dir"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="13" cy="4" r="2"/><path d="M10 21l2-6 3 3v5M7 12l3-4 4 1 3 4M12 15l-1-6"/></svg><span>' + esc(directions(r)) + '</span></p>';
    }
    function drawLegend() {
      var present = {}; rows.forEach(function (r) { present[r.type] = 1; });
      legend.innerHTML = Object.keys(STR.types).filter(function (t) { return present[t]; }).map(function (t) {
        return '<li><i class="sw t-' + t + '"></i>' + esc(STR.types[t]) + '</li>';
      }).join('') +
        '<li><i class="sw sw-wc">WC</i>' + esc(STR.wc) + '</li>' +
        '<li><i class="sw sw-esc"></i>' + esc(STR.escalators) + '</li>' +
        '<li><i class="sw sw-route"></i>' + esc(STR.route) + '</li>';
    }
    function render() { drawMap(); drawChips(); drawList(); drawDetail(); drawLegend(); }

    function narrow() { return !matchMedia('(min-width: 900px)').matches; }
    // Analytics hook: the page's trackIntent (if present) reports finder use to GA4. Never throws.
    function track(action, detail) { try { if (window.trackIntent) window.trackIntent(action, detail); } catch (e) {} }
    var searchTimer = null, lastSearch = '';

    function select(rid, fromList) {
      sel = rid; render();
      if (rid) track('find_room', { room: rid, search_term: query || undefined, from: fromList ? 'list' : 'map' });
      if (rid && fromList && narrow()) stage.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }

    // ---- Events ----
    svg.addEventListener('click', function (e) {
      var g = e.target.closest && e.target.closest('.hm-room');
      if (g) { var rid = g.getAttribute('data-room'); select(rid === sel ? null : rid, false); }
    });
    svg.addEventListener('keydown', function (e) {
      var g = e.target.closest && e.target.closest('.hm-room');
      if (g && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault(); var rid = g.getAttribute('data-room'); select(rid, false);
        var again = svg.querySelector('[data-room="' + rid + '"]'); if (again) again.focus();
      }
    });
    list.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-room]'); if (b) select(b.getAttribute('data-room'), true);
    });
    chips.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-zone]'); if (!b) return;
      zone = b.getAttribute('data-zone'); render();
    });
    detail.addEventListener('click', function (e) { if (e.target.closest('.hm-x')) select(null, false); });
    input.addEventListener('input', function () {
      query = input.value.trim().toLowerCase(); clearBtn.hidden = !query;
      var hits = rows.filter(matches);
      if (query && hits.length === 1) sel = hits[0].room;
      render();
      // Report what people search for once they pause typing (brand demand), once per distinct term
      clearTimeout(searchTimer);
      if (query.length >= 2) searchTimer = setTimeout(function () {
        if (query && query !== lastSearch) { lastSearch = query; track('search', { search_term: query, results: rows.filter(matches).length }); }
      }, 1500);
    });
    clearBtn.addEventListener('click', function () { input.value = ''; query = ''; clearBtn.hidden = true; render(); input.focus(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sel) select(null, false); });

    // ---- Data ----
    var CACHE = 'hea-map-rows-v3';
    try { var cached = JSON.parse(localStorage.getItem(CACHE) || 'null'); if (cached && cached.length) rows = normalise(cached); } catch (e) {}
    if (ROOMS[here]) sel = here;
    render();
    if (cfg.sheetCsv) {
      fetch(cfg.sheetCsv, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw r.status; return r.text(); })
        .then(function (t) {
          var raw = parseCSV(t), n = normalise(raw);
          if (!n.length) return;
          rows = n; render();
          try { localStorage.setItem(CACHE, JSON.stringify(raw)); } catch (e) {}
        }).catch(function () { /* keep defaults / cache */ });
    }
  }

  function boot() {
    var sel = (window.HEA_MAP_CONFIG && window.HEA_MAP_CONFIG.mount) || '#hea-map';
    var el = document.querySelector(sel); if (el) init(el);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
