/* =============================================================================
   Cultivando Culturas — Apostila digital interativa
   JavaScript puro, sem dependências. Funciona abrindo o index.html direto no navegador.

   Dados:      assets/data/pages.js       (títulos, seções, campos editáveis)
               assets/data/text-layer.js  (texto de cada página, gerado do PDF)
   Imagens:    assets/pages/pagina-NN.jpg (páginas originais)
   ============================================================================= */
(function () {
  'use strict';

  var PW = window.PAGE_W, PH = window.PAGE_H;
  var PAGES = window.PAGES, SECTIONS = window.SECTIONS;
  var TOTAL = PAGES.length;
  var BACKUP_APP = 'cultivando-culturas-apostila';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var pageByN = {};
  PAGES.forEach(function (p) { pageByN[p.n] = p; });
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
  var imgUrl = function (n) { return 'assets/pages/pagina-' + pad2(n) + '.jpg'; };
  var cqw = function (pt) { return (pt / PW * 100).toFixed(4) + 'cqw'; };
  var pct = function (pt, total) { return (pt / total * 100).toFixed(4) + '%'; };

  /* ===========================================================================
     ARMAZENAMENTO  (localStorage; cai para memória se o navegador bloquear)
     =========================================================================== */
  var Store = (function () {
    var data = fresh();
    var persistent = true;
    var timer = null;

    function fresh() {
      return { answers: {}, checks: {}, visited: [], last: 1, hintSeen: false, mode: 'single', zoom: 1, indice: false };
    }
    function read() {
      try {
        var raw = window.localStorage.getItem(window.STORAGE_KEY);
        if (!raw) return null;
        var o = JSON.parse(raw);
        return (o && typeof o === 'object') ? o : null;
      } catch (e) { persistent = false; return null; }
    }
    function load() {
      var o = read();
      data = fresh();
      if (o) {
        if (o.answers && typeof o.answers === 'object') data.answers = o.answers;
        if (o.checks && typeof o.checks === 'object') data.checks = o.checks;
        if (Array.isArray(o.visited)) data.visited = o.visited.filter(function (n) { return pageByN[n]; });
        ['last', 'hintSeen', 'mode', 'zoom', 'indice'].forEach(function (k) { if (o[k] !== undefined) data[k] = o[k]; });
      }
      try { window.localStorage.setItem(window.STORAGE_KEY + ':t', '1'); window.localStorage.removeItem(window.STORAGE_KEY + ':t'); }
      catch (e) { persistent = false; }
    }
    function writeNow() {
      clearTimeout(timer); timer = null;
      try { window.localStorage.setItem(window.STORAGE_KEY, JSON.stringify(data)); persistent = true; return true; }
      catch (e) { persistent = false; return false; }
    }
    function save(delay) {
      clearTimeout(timer);
      timer = setTimeout(function () { var ok = writeNow(); UI.saved(ok); }, delay === undefined ? 350 : delay);
    }
    function flush() { if (timer) { var ok = writeNow(); UI.saved(ok); } }
    return {
      load: load, save: save, flush: flush, writeNow: writeNow,
      get d() { return data; },
      set d(v) { data = v; },
      get ok() { return persistent; }
    };
  })();

  /* ===========================================================================
     CONSTRUÇÃO DE UMA PÁGINA
     A página original é uma imagem. Os espaços do participante são campos que
     crescem: a imagem é "fatiada" nos pontos de cada campo e o campo ocupa o espaço
     entre as fatias — assim o resto da página (rodapé, logo) desce junto.
     =========================================================================== */
  function buildSheet(page, opts) {
    opts = opts || {};
    var isPrint = !!opts.print;
    var sheet = el('section', 'sheet' + (isPrint ? ' is-print' : ''));
    sheet.dataset.page = page.n;
    sheet.setAttribute('aria-label', 'Página ' + page.n + ' — ' + page.title);

    var fields = (page.fields || []).slice().sort(function (a, b) { return a.top - b.top; });
    var layer = (window.TEXT_LAYER && window.TEXT_LAYER[page.n]) || [];
    var parts = [];     // {type:'slice', t0, t1} | {type:'field', f}
    var cursor = 0;
    fields.forEach(function (f) {
      parts.push({ type: 'slice', t0: cursor, t1: f.top });
      parts.push({ type: 'field', f: f });
      cursor = f.bottom;
    });
    parts.push({ type: 'slice', t0: cursor, t1: PH });

    var banded = fields.length > 0;
    var firstSlice = true;
    parts.forEach(function (part) {
      if (part.type === 'slice') {
        if (part.t1 - part.t0 < 0.01) return;
        var s = el('div', 'slice');
        if (!banded) {
          var img = document.createElement('img');
          img.src = imgUrl(page.n);
          img.alt = 'Página ' + page.n + ' da apostila — ' + page.title;
          img.decoding = 'async';
          img.draggable = false;
          img.width = 1406; img.height = 1988;
          s.appendChild(img);
        } else {
          var h = part.t1 - part.t0;
          s.style.height = cqw(h);
          s.style.backgroundImage = 'url("' + imgUrl(page.n) + '")';
          s.style.backgroundPosition = '0 ' + (PH - h > 0 ? (part.t0 / (PH - h) * 100).toFixed(4) : 0) + '%';
          if (firstSlice) { s.setAttribute('role', 'img'); s.setAttribute('aria-label', 'Página ' + page.n + ' da apostila — ' + page.title); }
        }
        firstSlice = false;
        if (!isPrint) s.appendChild(textLayer(layer, part.t0, part.t1, page.n));
        sheet.appendChild(s);
        if (!banded) overlays(page, s, isPrint);
      } else {
        sheet.appendChild(buildField(part.f, isPrint));
      }
    });

    if (!layer.length && window.PAGE_TEXT && window.PAGE_TEXT[page.n]) {
      var p = el('p', 'sr'); p.textContent = window.PAGE_TEXT[page.n]; sheet.appendChild(p);
    }
    return sheet;
  }

  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }

  /* Camada de texto transparente (seleção, busca do navegador, leitores de tela) */
  function textLayer(lines, t0, t1, n) {
    var wrap = el('div', 'tl');
    var h = t1 - t0;
    var frag = document.createDocumentFragment();
    lines.forEach(function (l) {
      if (l[1] < t0 || l[1] >= t1) return;
      var s = document.createElement('span');
      s.textContent = l[4];
      s.style.left = pct(l[0], PW);
      s.style.top = pct(l[1] - t0, h);
      s.style.width = pct(l[2] - l[0], PW);
      s.style.height = pct(l[3] - l[1], h);
      s.style.fontSize = cqw((l[3] - l[1]) * 0.78);
      frag.appendChild(s);
    });
    wrap.appendChild(frag);
    return wrap;
  }

  /* Links do Índice e caixinhas ☐ impressas no original */
  function overlays(page, host, isPrint) {
    if (isPrint) {
      (page.checks || []).forEach(function (c) {
        if (Store.d.checks[c.id]) host.appendChild(checkEl(c, true));
      });
      return;
    }
    (page.links || []).forEach(function (L) {
      var a = document.createElement('a');
      a.className = 'pg-link';
      a.href = '#p' + L.to;
      a.setAttribute('aria-label', 'Ir para a página ' + L.to + ' — ' + pageByN[L.to].title);
      a.style.left = pct(L.x, PW); a.style.top = pct(L.y, PH);
      a.style.width = pct(L.w, PW); a.style.height = pct(L.h, PH);
      a.addEventListener('click', function (e) { e.preventDefault(); goTo(L.to); });
      host.appendChild(a);
    });
    (page.checks || []).forEach(function (c) { host.appendChild(checkEl(c, false)); });
  }

  function checkEl(c, isPrint) {
    var lab = el('label', 'chk' + (isPrint ? ' is-print' : ''));
    lab.style.left = pct(c.x - 1, PW); lab.style.top = pct(c.y - 1, PH);
    lab.style.width = pct(c.w + 2, PW); lab.style.height = pct((c.h + 2), PH);
    var input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!Store.d.checks[c.id];
    input.setAttribute('aria-label', c.label);
    input.dataset.id = c.id;
    if (isPrint) input.disabled = true;
    else input.addEventListener('change', function () {
      if (input.checked) Store.d.checks[c.id] = true; else delete Store.d.checks[c.id];
      Store.save(); UI.progress(); UI.tocMarks();
    });
    var mark = el('span', 'mark');
    mark.setAttribute('aria-hidden', 'true');
    mark.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4.5 12.5l5 5L19.5 6.5"/></svg>';
    lab.appendChild(input); lab.appendChild(mark);
    return lab;
  }

  function buildField(f, isPrint) {
    var w = el('div', 'field ' + (f.kind === 'plain' ? 'plain' : 'ruled') + (f.box ? ' boxed' : ''));
    w.style.setProperty('--min', cqw(f.bottom - f.top));
    w.style.marginLeft = cqw(f.box ? 70.3 : 70.9);
    w.style.width = cqw(f.box ? 538.6 - 70.3 : 538.58 - 70.9);
    if (f.box) w.style.setProperty('--bc', f.box.color);
    var val = Store.d.answers[f.id] || '';

    var mirror = el('div', 'mirror');
    mirror.setAttribute('aria-hidden', 'true');
    mirror.textContent = isPrint ? val : val + '\u200b';
    w.appendChild(mirror);

    if (isPrint) { w.classList.add('is-print'); return w; }

    var ta = document.createElement('textarea');
    ta.id = 'campo-' + f.id;
    ta.dataset.id = f.id;
    ta.rows = 1;
    ta.value = val;
    ta.lang = 'pt-BR';
    ta.spellcheck = true;
    ta.setAttribute('aria-label', f.label + ' — suas respostas');
    ta.placeholder = '';
    ta.addEventListener('input', function () {
      var v = ta.value;
      mirror.textContent = v + '\u200b';
      if (v) Store.d.answers[f.id] = v; else delete Store.d.answers[f.id];
      UI.saving();
      Store.save();
      UI.progress(); UI.tocMarks();
    });
    w.appendChild(ta);
    var tag = el('span', 'tag'); tag.setAttribute('aria-hidden', 'true'); tag.textContent = 'minhas respostas';
    w.appendChild(tag);
    return w;
  }

  /* ===========================================================================
     LEITOR  (uma página ou duas, navegação, zoom)
     =========================================================================== */
  var state = { cur: 1, mode: 'single', zoom: 1 };
  var stage = $('#stage'), scroller = $('#scroller');
  var ZOOMS = [0.6, 0.75, 0.9, 1, 1.15, 1.3, 1.5, 1.75, 2];

  function spreadAllowed() { return window.innerWidth >= 900; }
  function effMode() { return (state.mode === 'spread' && spreadAllowed()) ? 'spread' : 'single'; }

  function viewPages(n) {
    if (effMode() === 'single') return [n];
    if (n === 1) return [1];
    var a = (n % 2 === 0) ? n : n - 1;
    return a + 1 <= TOTAL ? [a, a + 1] : [a];
  }

  function render(keepScroll) {
    var pages = viewPages(state.cur);
    state.cur = pages[0];
    var y = scroller.scrollTop;
    stage.textContent = '';
    stage.className = 'stage ' + (pages.length === 2 ? 'is-spread' : (effMode() === 'spread' ? 'is-spread is-cover' : 'is-single'));
    pages.forEach(function (n) { stage.appendChild(buildSheet(pageByN[n])); });
    sizeStage();
    scroller.scrollTop = keepScroll ? y : 0;
    pages.forEach(markVisited);
    UI.pager(pages);
    UI.toc(pages);
    UI.progress();
    try { history.replaceState(null, '', '#p' + state.cur); } catch (e) { /* file:// em alguns navegadores */ }
    Store.d.last = state.cur;
    Store.save(600);
    preloadNear(pages[pages.length - 1]);
    document.title = 'Página ' + state.cur + ' — Cultivando Culturas';
  }

  function markVisited(n) {
    if (Store.d.visited.indexOf(n) < 0) Store.d.visited.push(n);
  }

  function sizeStage() {
    var cs = getComputedStyle(scroller);
    var avail = scroller.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var two = effMode() === 'spread';
    var gap = 0;
    var base = two ? Math.min((avail - gap) / 2, 820) : Math.min(avail, 900);
    var w = Math.max(240, Math.floor(base * state.zoom));
    stage.style.setProperty('--sheet-w', w + 'px');
    $('#zoomVal').textContent = Math.round(state.zoom * 100) + '%';
  }

  function goTo(n, opts) {
    n = Math.max(1, Math.min(TOTAL, n | 0));
    state.cur = n;
    render(false);
    if (opts && opts.focus) { scroller.focus({ preventScroll: true }); }
    closeIndiceIfOverlay();
  }
  function next() {
    var pages = viewPages(state.cur);
    var n = pages[pages.length - 1] + 1;
    if (n <= TOTAL) goTo(n);
  }
  function prev() {
    var pages = viewPages(state.cur);
    var n = pages[0] - 1;
    if (n < 1) return;
    goTo(n);   // viewPages normaliza para o início do par
  }

  function preloadNear(last) {
    [last + 1, last + 2, state.cur - 1].forEach(function (n) {
      if (n >= 1 && n <= TOTAL) { var i = new Image(); i.src = imgUrl(n); }
    });
  }

  function setZoom(z) {
    var i = ZOOMS.indexOf(z);
    state.zoom = z; Store.d.zoom = z; Store.save(800);
    sizeStage();
  }
  function stepZoom(dir) {
    var idx = 0, best = 9;
    ZOOMS.forEach(function (z, i) { var d = Math.abs(z - state.zoom); if (d < best) { best = d; idx = i; } });
    idx = Math.max(0, Math.min(ZOOMS.length - 1, idx + dir));
    setZoom(ZOOMS[idx]);
  }
  function setMode(m) {
    state.mode = m; Store.d.mode = m; Store.save(800);
    $('#btnSingle').setAttribute('aria-pressed', String(m === 'single'));
    $('#btnSpread').setAttribute('aria-pressed', String(m === 'spread'));
    render(false);
  }

  /* ===========================================================================
     INTERFACE: pager, índice lateral, progresso, indicador de salvamento
     =========================================================================== */
  var UI = {
    pager: function (pages) {
      var two = pages.length === 2;
      $('#pageLbl').textContent = two ? 'Páginas' : 'Página';
      $('#pageInput').value = two ? pages[0] + '–' + pages[1] : String(pages[0]);
      $('#pageInput').size = two ? 5 : 3;
      $('#pageTotal').textContent = 'de ' + TOTAL;
      var atStart = pages[0] <= 1, atEnd = pages[pages.length - 1] >= TOTAL;
      [$('#btnPrev'), $('#edgePrev')].forEach(function (b) { b.disabled = atStart; });
      [$('#btnNext'), $('#edgeNext')].forEach(function (b) { b.disabled = atEnd; });
    },

    /* progresso = páginas visitadas (referência de navegação, sem pontos nem ranking) */
    progress: function () {
      var visited = Store.d.visited.length;
      var p = Math.round(visited / TOTAL * 100);
      $('#progressPct').textContent = p + '%';
      $('#progressBar').style.width = p + '%';
      var fields = 0, filled = 0;
      PAGES.forEach(function (pg) {
        (pg.fields || []).forEach(function (f) { fields++; if (Store.d.answers[f.id]) filled++; });
        (pg.checks || []).forEach(function (c) { fields++; if (Store.d.checks[c.id]) filled++; });
      });
      $('#progress').title = visited + ' de ' + TOTAL + ' páginas visitadas · ' + filled + ' de ' + fields + ' espaços de resposta preenchidos';
    },

    saving: function () {
      var s = $('#saved'); s.classList.add('is-saving'); s.classList.remove('is-warn');
      $('#savedTxt').textContent = 'Salvando…';
    },
    saved: function (ok) {
      var s = $('#saved');
      s.classList.remove('is-saving');
      if (ok === false || !Store.ok) {
        s.classList.add('is-warn');
        $('#savedTxt').textContent = 'Não foi possível salvar neste navegador — use “Minhas respostas › Backup”';
      } else {
        s.classList.remove('is-warn'); s.classList.add('flash');
        $('#savedTxt').textContent = 'Salvo automaticamente';
        setTimeout(function () { s.classList.remove('flash'); }, 1400);
      }
    },

    /* índice lateral: seções e títulos reais da apostila */
    buildToc: function () {
      var nav = $('#toc'); nav.textContent = '';
      SECTIONS.forEach(function (sec) {
        var host = nav;
        var group = el('div', 'toc-group'); group.dataset.sec = sec.id;
        var ul = el('ul', 'toc-list');
        if (sec.title) {
          var hb = document.createElement('button');
          hb.className = 'toc-head'; hb.type = 'button';
          hb.setAttribute('aria-expanded', 'false');
          hb.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
          var t = el('span'); t.textContent = sec.title; hb.appendChild(t);
          var r = el('small'); r.textContent = 'p. ' + sec.from + (sec.to > sec.from ? '–' + sec.to : ''); hb.appendChild(r);
          hb.addEventListener('click', function () {
            var open = hb.getAttribute('aria-expanded') === 'true';
            hb.setAttribute('aria-expanded', String(!open)); ul.hidden = open;
          });
          group.appendChild(hb); ul.hidden = true;
        } else { ul.className = 'toc-list toc-flat'; }
        for (var n = sec.from; n <= sec.to; n++) {
          var pg = pageByN[n];
          var li = document.createElement('li');
          var a = document.createElement('a');
          a.href = '#p' + n; a.dataset.n = n;
          a.innerHTML = '<span class="t"></span><span class="mk" aria-hidden="true"></span><span class="n"></span>';
          $('.t', a).textContent = pg.title;
          $('.n', a).textContent = n;
          a.addEventListener('click', function (e) { e.preventDefault(); goTo(parseInt(this.dataset.n, 10)); });
          li.appendChild(a); ul.appendChild(li);
        }
        group.appendChild(ul);
        host.appendChild(group);
      });
      UI.tocMarks();
    },
    /* marca páginas com espaço de resposta (✎) e já preenchidas (●) */
    tocMarks: function () {
      $$('#toc a').forEach(function (a) {
        var pg = pageByN[a.dataset.n], mk = $('.mk', a);
        var has = (pg.fields && pg.fields.length) || (pg.checks && pg.checks.length);
        var done = (pg.fields || []).some(function (f) { return Store.d.answers[f.id]; }) ||
                   (pg.checks || []).some(function (c) { return Store.d.checks[c.id]; });
        mk.className = 'mk' + (has ? ' has' : '') + (done ? ' done' : '');
        mk.title = done ? 'Você já escreveu aqui' : (has ? 'Página com espaço para suas respostas' : '');
        mk.textContent = has ? (done ? '●' : '✎') : '';
      });
    },
    toc: function (pages) {
      var n = pages[0];
      $$('#toc a').forEach(function (a) {
        var cur = pages.indexOf(parseInt(a.dataset.n, 10)) >= 0;
        if (cur) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
        a.classList.toggle('is-cur', cur);
      });
      var sec = SECTIONS.filter(function (s) { return n >= s.from && n <= s.to; })[0];
      $$('#toc .toc-group').forEach(function (g) {
        var isCur = sec && g.dataset.sec === sec.id;
        g.classList.toggle('is-cur', !!isCur);
        var hb = $('.toc-head', g);
        if (hb && isCur) { hb.setAttribute('aria-expanded', 'true'); $('.toc-list', g).hidden = false; }
      });
      var c = $('#toc a.is-cur');
      if (c && !$('#indice').hidden) { var box = $('#indice'); var top = c.offsetTop; if (top < box.scrollTop + 40 || top > box.scrollTop + box.clientHeight - 80) box.scrollTop = Math.max(0, top - 120); }
    }
  };

  /* ---- abrir/fechar índice ---- */
  function indiceOpen() { return !$('#indice').hidden; }
  function setIndice(open, focus) {
    $('#indice').hidden = !open;
    $('#btnIndice').setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('indice-open', open);
    var overlay = window.innerWidth < 1100;
    $('#scrim').hidden = !(open && overlay);
    Store.d.indice = open; Store.save(800);
    sizeStage();
    if (open) { UI.toc(viewPages(state.cur)); if (focus) { var c = $('#toc a.is-cur') || $('#toc a'); if (c) c.focus(); } }
    else if (focus) $('#btnIndice').focus();
  }
  function closeIndiceIfOverlay() { if (indiceOpen() && window.innerWidth < 1100) setIndice(false); }

  /* ---- menu "Minhas respostas" ---- */
  function setMenu(open) {
    $('#menuRespostas').hidden = !open;
    $('#btnMenu').setAttribute('aria-expanded', String(open));
    if (open) { var f = $('#menuRespostas button'); if (f) f.focus(); }
  }

  /* ---- avisos curtos ---- */
  var toastT;
  function toast(msg, ms) {
    var t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, ms || 3500);
  }

  /* ===========================================================================
     BACKUP / RESTAURAR / LIMPAR
     =========================================================================== */
  function exportBackup() {
    Store.flush();
    var d = new Date();
    var payload = {
      app: BACKUP_APP, version: 1, exportedAt: d.toISOString(),
      answers: Store.d.answers, checks: Store.d.checks, visited: Store.d.visited
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var name = 'cultivando-culturas-respostas-' + d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + '.json';
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    toast('Backup gerado: ' + name);
  }

  var knownFields = {}, knownChecks = {};
  PAGES.forEach(function (p) {
    (p.fields || []).forEach(function (f) { knownFields[f.id] = true; });
    (p.checks || []).forEach(function (c) { knownChecks[c.id] = true; });
  });

  function readBackup(file) {
    var fr = new FileReader();
    fr.onerror = function () { toast('Não foi possível ler o arquivo.'); };
    fr.onload = function () {
      var obj;
      try { obj = JSON.parse(fr.result); } catch (e) { return toast('Este arquivo não é um backup válido (JSON ilegível).', 5000); }
      if (!obj || obj.app !== BACKUP_APP || typeof obj.answers !== 'object' || obj.answers === null) {
        return toast('Este arquivo não parece ser um backup desta apostila.', 5000);
      }
      var answers = {}, checks = {}, nA = 0;
      Object.keys(obj.answers).forEach(function (k) {
        if (knownFields[k] && typeof obj.answers[k] === 'string' && obj.answers[k]) { answers[k] = obj.answers[k]; nA++; }
      });
      Object.keys(obj.checks || {}).forEach(function (k) { if (knownChecks[k] && obj.checks[k]) { checks[k] = true; nA++; } });
      var visited = Array.isArray(obj.visited) ? obj.visited.filter(function (n) { return pageByN[n]; }) : [];
      var when = obj.exportedAt ? new Date(obj.exportedAt) : null;
      var has = Object.keys(Store.d.answers).length + Object.keys(Store.d.checks).length;
      var msg = 'O backup contém ' + nA + ' resposta(s)/marcação(ões)' +
        (when && !isNaN(when) ? ', gerado em ' + when.toLocaleString('pt-BR') : '') + '. ' +
        (has ? 'Ao restaurar, as respostas atuais deste navegador serão substituídas. ' : '') + 'Deseja restaurar?';
      $('#dlgRestaurarTxt').textContent = msg;
      var dlg = $('#dlgRestaurar');
      dlg.returnValue = '';
      dlg.onclose = function () {
        if (dlg.returnValue !== 'ok') return;
        Store.d.answers = answers; Store.d.checks = checks;
        visited.forEach(function (n) { if (Store.d.visited.indexOf(n) < 0) Store.d.visited.push(n); });
        Store.writeNow(); UI.saved(Store.ok);
        render(true); UI.tocMarks();
        toast('Respostas restauradas.');
      };
      dlg.showModal();
    };
    fr.readAsText(file);
  }

  function askClear() {
    var dlg = $('#dlgLimpar'); dlg.returnValue = '';
    dlg.onclose = function () {
      if (dlg.returnValue !== 'ok') return;
      Store.d.answers = {}; Store.d.checks = {};
      Store.writeNow(); UI.saved(Store.ok);
      render(true); UI.tocMarks(); UI.progress();
      toast('Respostas e anotações apagadas deste navegador.');
    };
    dlg.showModal();
  }

  /* ===========================================================================
     EXPORTAR PDF / IMPRIMIR
     Monta uma "raiz de impressão" com as 84 páginas (conteúdo + respostas) e chama
     window.print(). O @media print esconde toda a interface.
     =========================================================================== */
  var printRoot = $('#printRoot');

  function buildPrintRoot() {
    printRoot.textContent = '';
    var frag = document.createDocumentFragment();
    PAGES.forEach(function (pg) {
      var ps = el('div', 'psheet'), inner = el('div', 'pinner');
      inner.appendChild(buildSheet(pg, { print: true }));
      ps.appendChild(inner); frag.appendChild(ps);
    });
    printRoot.appendChild(frag);
    // páginas cujo conteúdo cresceu além de uma folha A4 são reduzidas para caber em uma única folha
    printRoot.classList.add('measuring');
    var probe = el('div'); probe.style.cssText = 'position:absolute;height:297mm;width:1px;visibility:hidden';
    printRoot.appendChild(probe);
    var a4 = probe.getBoundingClientRect().height;
    printRoot.removeChild(probe);
    $$('.pinner', printRoot).forEach(function (inner) {
      var h = inner.getBoundingClientRect().height;
      if (h > a4 + 1) inner.style.transform = 'scale(' + (a4 / h).toFixed(4) + ')';
    });
    printRoot.classList.remove('measuring');
  }

  function preloadAll(onProgress) {
    var n = 0;
    return Promise.all(PAGES.map(function (pg) {
      return new Promise(function (res) {
        var i = new Image();
        i.onload = i.onerror = function () { n++; if (onProgress) onProgress(n); res(); };
        i.src = imgUrl(pg.n);
      });
    }));
  }

  function exportPdf() {
    var dlg = $('#dlgPdf'); dlg.returnValue = '';
    dlg.onclose = function () {
      if (dlg.returnValue !== 'ok') return;
      Store.flush();
      toast('Preparando as 84 páginas…', 60000);
      preloadAll(function (n) { if (n % 12 === 0) toast('Preparando as páginas… ' + n + ' de ' + TOTAL, 60000); })
        .then(function () {
          buildPrintRoot();
          return new Promise(function (r) { setTimeout(r, 250); });
        })
        .then(function () { $('#toast').hidden = true; window.print(); });
    };
    dlg.showModal();
  }

  window.addEventListener('beforeprint', function () { if (!printRoot.firstChild) buildPrintRoot(); });
  window.addEventListener('afterprint', function () { printRoot.textContent = ''; });

  /* ===========================================================================
     EVENTOS
     =========================================================================== */
  function bind() {
    $('#btnPrev').addEventListener('click', prev);
    $('#btnNext').addEventListener('click', next);
    $('#edgePrev').addEventListener('click', prev);
    $('#edgeNext').addEventListener('click', next);
    $('#btnIndice').addEventListener('click', function () { setIndice(!indiceOpen(), true); });
    $('#indiceClose').addEventListener('click', function () { setIndice(false, true); });
    $('#scrim').addEventListener('click', function () { setIndice(false, true); });
    $('#btnSingle').addEventListener('click', function () { setMode('single'); });
    $('#btnSpread').addEventListener('click', function () { setMode('spread'); });
    $('#zoomIn').addEventListener('click', function () { stepZoom(1); });
    $('#zoomOut').addEventListener('click', function () { stepZoom(-1); });
    $('#zoomVal').addEventListener('click', function () { setZoom(1); });
    $('#btnPdf').addEventListener('click', exportPdf);

    $('#btnMenu').addEventListener('click', function () { setMenu($('#menuRespostas').hidden); });
    $('#btnBackup').addEventListener('click', function () { setMenu(false); exportBackup(); });
    $('#btnRestaurar').addEventListener('click', function () { setMenu(false); $('#fileImport').value = ''; $('#fileImport').click(); });
    $('#btnLimpar').addEventListener('click', function () { setMenu(false); askClear(); });
    $('#fileImport').addEventListener('change', function (e) { var f = e.target.files && e.target.files[0]; if (f) readBackup(f); });
    document.addEventListener('click', function (e) {
      if (!$('#menuRespostas').hidden && !e.target.closest('.menuwrap')) setMenu(false);
    });
    $('#menuRespostas').addEventListener('keydown', function (e) {
      var items = $$('#menuRespostas button');
      var i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    });

    var pi = $('#pageInput');
    function applyPageInput() {
      var m = String(pi.value).match(/\d+/);
      var n = m ? parseInt(m[0], 10) : NaN;
      if (isNaN(n) || n < 1 || n > TOTAL) { UI.pager(viewPages(state.cur)); toast('Digite um número de página entre 1 e ' + TOTAL + '.'); return; }
      if (viewPages(state.cur).indexOf(n) < 0) goTo(n); else UI.pager(viewPages(state.cur));
    }
    pi.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); applyPageInput(); pi.blur(); } });
    pi.addEventListener('focus', function () { pi.select(); });
    pi.addEventListener('blur', applyPageInput);

    $('#hintClose').addEventListener('click', function () { $('#hint').hidden = true; Store.d.hintSeen = true; Store.save(0); sizeStage(); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (!$('#menuRespostas').hidden) { setMenu(false); $('#btnMenu').focus(); return; }
        if (indiceOpen() && window.innerWidth < 1100) { setIndice(false, true); return; }
      }
      var t = e.target, tag = t && t.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector('dialog[open]')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { if (tag === 'BUTTON' && e.key === 'PageDown') return; e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
      else if (e.key === 'Home') { e.preventDefault(); goTo(1); }
      else if (e.key === 'End') { e.preventDefault(); goTo(TOTAL); }
      else if (e.key === 'i' || e.key === 'I') { setIndice(!indiceOpen(), true); }
      else if (e.key === '+' || e.key === '=') { stepZoom(1); }
      else if (e.key === '-' || e.key === '_') { stepZoom(-1); }
    });

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        var spreadNow = effMode() === 'spread';
        if (spreadNow !== stage.classList.contains('is-spread')) render(true); else sizeStage();
        if (indiceOpen()) { $('#scrim').hidden = window.innerWidth >= 1100; }
      }, 80);
    });
    window.addEventListener('hashchange', function () {
      var m = location.hash.match(/^#p(\d+)$/);
      if (m && viewPages(state.cur).indexOf(parseInt(m[1], 10)) < 0) goTo(parseInt(m[1], 10));
    });
    window.addEventListener('pagehide', function () { Store.flush(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) Store.flush(); });
    window.addEventListener('storage', function (e) {
      if (e.key !== window.STORAGE_KEY) return;
      var active = document.activeElement && document.activeElement.tagName === 'TEXTAREA';
      Store.load();
      if (!active) { render(true); UI.tocMarks(); }
    });
  }

  /* ===========================================================================
     INÍCIO
     =========================================================================== */
  function init() {
    Store.load();
    state.mode = Store.d.mode === 'spread' ? 'spread' : 'single';
    state.zoom = ZOOMS.indexOf(Store.d.zoom) >= 0 ? Store.d.zoom : 1;
    $('#btnSingle').setAttribute('aria-pressed', String(state.mode === 'single'));
    $('#btnSpread').setAttribute('aria-pressed', String(state.mode === 'spread'));
    $('#pageTotal').textContent = 'de ' + TOTAL;

    UI.buildToc();
    bind();

    var m = location.hash.match(/^#p(\d+)$/);
    var start = m ? parseInt(m[1], 10) : (Store.d.last || 1);
    state.cur = Math.max(1, Math.min(TOTAL, start | 0));

    if (!Store.d.hintSeen) $('#hint').hidden = false;
    if (Store.d.indice && window.innerWidth >= 1100) setIndice(true, false);
    UI.saved(Store.ok);
    render(false);

    // aquece o cache das imagens para a impressão (sem competir com a leitura)
    var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 2500); };
    idle(function () { preloadAll(); });
  }

  init();
})();
