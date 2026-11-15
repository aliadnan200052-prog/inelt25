/* ═══════════════════════════════════════════════════════════════════════
   Vocabulary Size Estimator · charts (hand-written SVG, no libraries)
   Single-series charts: colour carries no identity, so one accent hue is
   used; values sit in text tokens. Each mark has a hover/focus tooltip and
   every chart has a table alternative rendered by app.js.
   ═══════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function pct(p) { return p == null ? '—' : Math.round(p * 100) + '%'; }

  var tip = null;
  function showTip(evt, html, anchor) {
    tip = tip || document.getElementById('tooltip');
    if (!tip) return;
    tip.innerHTML = html;
    tip.hidden = false;
    var r = anchor.getBoundingClientRect();
    var tw = tip.offsetWidth, th = tip.offsetHeight;
    var x = r.left + r.width / 2 - tw / 2;
    x = Math.max(8, Math.min(window.innerWidth - tw - 8, x));
    var y = r.top - th - 10;
    if (y < 8) y = r.bottom + 10;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }
  function hideTip() { if (tip) tip.hidden = true; }
  window.addEventListener('scroll', hideTip, { passive: true });

  function bindTip(node, html) {
    node.setAttribute('tabindex', '0');
    node.setAttribute('role', 'img');
    node.setAttribute('aria-label', html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    node.addEventListener('pointerenter', function (e) { showTip(e, html, node); });
    node.addEventListener('pointerleave', hideTip);
    node.addEventListener('focus', function (e) { showTip(e, html, node); });
    node.addEventListener('blur', hideTip);
  }

  function bandLabel(b) {
    return b.to >= 1000 ? (b.to / 1000) + 'k' : String(b.to);
  }

  /* Column chart: % of each band known, with 95% bootstrap interval whiskers. */
  function bandChart(container, bands) {
    container.innerHTML = '';
    // Draw at the container's real pixel width so text stays 11px on phones.
    var W = Math.max(300, Math.min(900, container.clientWidth || 640)), H = W < 480 ? 230 : 260, m = { t: 16, r: 4, b: 44, l: 38 };
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart', role: 'group',
      'aria-label': 'Estimated percentage of words known in each frequency band' }, container);
    var iw = W - m.l - m.r, ih = H - m.t - m.b;
    var y = function (p) { return m.t + ih * (1 - p); };
    [0, 0.25, 0.5, 0.75, 1].forEach(function (g) {
      el('line', { x1: m.l, x2: W - m.r, y1: y(g), y2: y(g), class: g === 0 ? 'axis' : 'grid' }, svg);
      var t = el('text', { x: m.l - 8, y: y(g) + 4, class: 'tick', 'text-anchor': 'end' }, svg);
      t.textContent = Math.round(g * 100) + '%';
    });
    var slot = iw / bands.length, bw = Math.min(36, slot * 0.56);
    bands.forEach(function (b, i) {
      var cx = m.l + slot * i + slot / 2;
      var p = b.p == null ? 0 : b.p;
      var top = y(p), h = Math.max(0, y(0) - top);
      var g = el('g', { class: 'mark' }, svg);
      // hit target: full column height
      el('rect', { x: cx - slot / 2, y: m.t, width: slot, height: ih, class: 'hit' }, g);
      if (h > 0) {
        var r = Math.min(4, h, bw / 2);
        // rounded data-end, square base
        el('path', { class: 'bar', d: 'M' + (cx - bw / 2) + ',' + y(0) + 'V' + (top + r) +
          'Q' + (cx - bw / 2) + ',' + top + ' ' + (cx - bw / 2 + r) + ',' + top +
          'H' + (cx + bw / 2 - r) + 'Q' + (cx + bw / 2) + ',' + top + ' ' + (cx + bw / 2) + ',' + (top + r) +
          'V' + y(0) + 'Z' }, g);
      }
      if (b.lo != null && b.hi != null) {
        el('line', { x1: cx, x2: cx, y1: y(b.hi), y2: y(b.lo), class: 'whisker-halo' }, g);
        el('line', { x1: cx, x2: cx, y1: y(b.hi), y2: y(b.lo), class: 'whisker' }, g);
        el('line', { x1: cx - 5, x2: cx + 5, y1: y(b.hi), y2: y(b.hi), class: 'whisker' }, g);
        el('line', { x1: cx - 5, x2: cx + 5, y1: y(b.lo), y2: y(b.lo), class: 'whisker' }, g);
      }
      var lab = el('text', { x: cx, y: H - m.b + 18, class: 'tick', 'text-anchor': 'middle' }, svg);
      lab.textContent = bandLabel(b);
      bindTip(g, '<strong>Ranks ' + fmt(b.from) + '–' + fmt(b.to) + '</strong><br>' +
        pct(b.p) + ' known (95% range ' + pct(b.lo) + '–' + pct(b.hi) + ')<br>' +
        '≈ ' + fmt(b.known || 0) + ' of ' + fmt(b.size) + ' families<br><span class="tip-muted">' + b.n + ' words tested</span>');
    });
    var xl = el('text', { x: m.l + iw / 2, y: H - 6, class: 'axis-label', 'text-anchor': 'middle' }, svg);
    xl.textContent = W < 480 ? 'Band (upper rank) → rarer' : 'Frequency band (upper rank of each band) → rarer words';
  }

  /* Progress chart: estimate per saved result with its 95% interval. */
  function progressChart(container, history) {
    container.innerHTML = '';
    var W = Math.max(300, Math.min(900, container.clientWidth || 640)), H = 240, m = { t: 16, r: 16, b: 36, l: 48 };
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chart', role: 'group',
      'aria-label': 'Estimated vocabulary size for each saved assessment' }, container);
    var iw = W - m.l - m.r, ih = H - m.t - m.b;
    var maxV = Math.max.apply(null, history.map(function (h) { return h.hi; }).concat([1000]));
    var step = maxV > 10000 ? 5000 : maxV > 4000 ? 2000 : 1000;
    var top = Math.ceil(maxV / step) * step;
    var y = function (v) { return m.t + ih * (1 - v / top); };
    for (var g = 0; g <= top; g += step) {
      el('line', { x1: m.l, x2: W - m.r, y1: y(g), y2: y(g), class: g === 0 ? 'axis' : 'grid' }, svg);
      var t = el('text', { x: m.l - 8, y: y(g) + 4, class: 'tick', 'text-anchor': 'end' }, svg);
      t.textContent = g >= 1000 ? (g / 1000) + 'k' : g;
    }
    var n = history.length;
    var x = function (i) { return n === 1 ? m.l + iw / 2 : m.l + 12 + (iw - 24) * i / (n - 1); };
    // interval band
    if (n > 1) {
      var d = history.map(function (h, i) { return (i ? 'L' : 'M') + x(i) + ',' + y(h.hi); }).join('') +
        history.slice().reverse().map(function (h, j) { return 'L' + x(n - 1 - j) + ',' + y(h.lo); }).join('') + 'Z';
      el('path', { d: d, class: 'ci-area' }, svg);
      el('path', { d: history.map(function (h, i) { return (i ? 'L' : 'M') + x(i) + ',' + y(h.estimate); }).join(''), class: 'line' }, svg);
    }
    history.forEach(function (h, i) {
      var gg = el('g', { class: 'mark' }, svg);
      el('rect', { x: x(i) - 16, y: m.t, width: 32, height: ih, class: 'hit' }, gg);
      el('line', { x1: x(i), x2: x(i), y1: y(h.hi), y2: y(h.lo), class: 'whisker' }, gg);
      el('circle', { cx: x(i), cy: y(h.estimate), r: 5, class: 'dot' }, gg);
      var date = new Date(h.date);
      if (n <= 8 || i === 0 || i === n - 1) {
        var t2 = el('text', { x: x(i), y: H - m.b + 18, class: 'tick', 'text-anchor': 'middle' }, svg);
        t2.textContent = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      }
      bindTip(gg, '<strong>' + date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + '</strong><br>' +
        '≈ ' + fmt(root.VSE.roundEstimate(h.estimate)) + ' families<br>95% range ' + fmt(h.lo) + '–' + fmt(h.hi) +
        '<br><span class="tip-muted">' + h.modeLabel + ' test</span>');
    });
  }

  var redraws = [];
  var rt = null;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      redraws = redraws.filter(function (r) { return document.body.contains(r.c); });
      redraws.forEach(function (r) { r.fn(r.c, r.data); });
    }, 150);
  });
  function track(fn) {
    return function (c, data) {
      var w = c.clientWidth;
      if (!redraws.some(function (r) { return r.c === c; })) redraws.push({ c: c, fn: fn, data: data, w: w });
      fn(c, data);
    };
  }
  bandChart = track(bandChart);
  progressChart = track(progressChart);
  root.VSE_CHARTS = { bandChart: bandChart, progressChart: progressChart, hideTip: hideTip };
})(this);
