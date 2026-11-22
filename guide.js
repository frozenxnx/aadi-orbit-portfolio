/* Field Guide: catalog, live viewer, dossier, size comparison and random facts. */
(() => {
  'use strict';
  const ARV = (window.ARV = window.ARV || {});
  const B = ARV.BODIES;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);
  const list = $('catalog'), canvas = $('body-canvas');
  const GROUP_NAMES = { star: 'Star', planet: 'Planet', moon: 'Moon', dwarf: 'Dwarf planet', extreme: 'Extreme' };
  let index = 3, filter = 'all', active = false;

  /* Thumbnails: render each body once with a small offscreen renderer */
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = thumbCanvas.height = 128;
  const thumbR = ARV.createBodyRenderer(thumbCanvas);

  B.forEach((b, i) => {
    const li = document.createElement('li');
    li.dataset.group = b.group;
    li.innerHTML = `<button type="button" data-i="${i}" aria-label="${b.name}"><canvas width="128" height="128" aria-hidden="true"></canvas><span><b>${b.name}</b><small>${b.kind}</small></span></button>`;
    list.appendChild(li);
    if (thumbR) {
      thumbR.draw(b, 3.0, 0.6);
      li.querySelector('canvas').getContext('2d').drawImage(thumbCanvas, 0, 0);
    }
  });
  if (thumbR) { const ext = thumbR.gl.getExtension('WEBGL_lose_context'); ext && ext.loseContext(); }

  list.addEventListener('click', (e) => { const btn = e.target.closest('button[data-i]'); if (btn) select(+btn.dataset.i); });

  /* Filters */
  $('filters').addEventListener('click', (e) => {
    const f = e.target.closest('.filter'); if (!f) return;
    filter = f.dataset.group;
    document.querySelectorAll('.filter').forEach((x) => x.classList.toggle('is-on', x === f));
    list.querySelectorAll('li').forEach((li) => { li.hidden = filter !== 'all' && li.dataset.group !== filter; });
    const visible = visibleIdx();
    if (!visible.includes(index)) select(visible[0]);
  });
  const visibleIdx = () => B.map((b, i) => i).filter((i) => filter === 'all' || B[i].group === filter);

  /* Viewer */
  const renderer = ARV.createBodyRenderer(canvas);
  let spin = 0, spinVel = 0, dragging = false, lastX = 0, t = 0, last = performance.now(), swap = 1;
  const size = () => {
    const r = canvas.getBoundingClientRect(), pr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(2, Math.round(r.width * pr)); canvas.height = Math.max(2, Math.round(r.height * pr));
  };
  addEventListener('resize', () => active && size(), { passive: true });
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; try { canvas.setPointerCapture(e.pointerId); } catch (_) {} canvas.classList.add('grabbing'); });
  canvas.addEventListener('pointermove', (e) => { if (!dragging) return; spinVel = (e.clientX - lastX) * 0.012; spin += spinVel; lastX = e.clientX; });
  const end = () => { dragging = false; canvas.classList.remove('grabbing'); };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

  const loop = (now) => {
    if (!active) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!reduce) t += dt;
    if (!dragging) { spin += spinVel; spinVel *= 0.95; }
    swap = Math.min(1, swap + dt * 2.2);
    canvas.style.setProperty('--swap', swap.toFixed(3));
    renderer && renderer.draw(B[index], t, spin);
    requestAnimationFrame(loop);
  };

  /* Dossier */
  const compare = (b) => {
    const svg = $('b-compare'), note = $('b-compare-note');
    const earth = 12742, ratio = b.diameter / earth, MAX = 44;
    let rb, re;
    if (ratio >= 1) { rb = MAX; re = MAX / ratio; } else { re = MAX; rb = MAX * ratio; }
    const show = (r) => Math.max(r, 0.8);
    const solo = b.id === 'earth';
    const bx = solo ? 150 : 80, ex = 220, cy = 50;
    const bodyCol = b.id === 'earth' ? '#3f7fe0' : `rgb(${b.look.c1.map((v) => Math.round(Math.min(1, v) * 255)).join(',')})`;
    svg.innerHTML = `
      <circle cx="${bx}" cy="${cy}" r="${show(rb)}" fill="${b.look.type === 9 ? '#000' : bodyCol}" stroke="${b.look.type === 9 ? '#ffb86b' : 'none'}" />
      ${solo ? '' : `<circle cx="${ex}" cy="${cy}" r="${show(re)}" fill="#3f7fe0" />`}
      <text x="${bx}" y="${cy + MAX + 18}">${b.name.replace('The ', '')}</text>
      ${solo ? '' : `<text x="${ex}" y="${cy + MAX + 18}">Earth</text>`}`;
    const fmt = (x) => (x >= 100 ? Math.round(x).toLocaleString('en-US') : x >= 10 ? x.toFixed(0) : x >= 1 ? x.toFixed(1) : x >= 0.01 ? x.toFixed(2) : x.toExponential(1));
    let txt;
    if (b.id === 'earth') txt = 'This is the yardstick: 12,742 km across.';
    else if (ratio >= 1) txt = `${fmt(ratio)}× Earth’s diameter.` + (re < 0.8 ? ' At this scale Earth is smaller than a pixel.' : '');
    else txt = `${fmt(ratio)}× Earth’s diameter.` + (rb < 0.8 ? ' At this scale it is smaller than a pixel.' : '');
    if (b.id === 'sgra') txt += ' Measured across its event horizon.';
    note.textContent = txt;
    svg.setAttribute('aria-label', `${b.name} compared with Earth: ${txt}`);
  };

  function select(i, focusList) {
    if (i == null || i < 0) return;
    index = i; const b = B[i];
    swap = reduce ? 1 : 0;
    $('b-kind').textContent = b.kind;
    $('b-name').textContent = b.name;
    $('b-tag').textContent = b.tag;
    $('b-index').textContent = `${String(i + 1).padStart(2, '0')} / ${B.length}`;
    $('b-stats').innerHTML = b.stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    $('b-facts').innerHTML = b.facts.map((f) => `<li>${f}</li>`).join('');
    compare(b);
    list.querySelectorAll('button[data-i]').forEach((x) => {
      const on = +x.dataset.i === i; x.classList.toggle('is-on', on);
      if (on) { x.setAttribute('aria-current', 'true'); if (focusList) x.focus(); x.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
      else x.removeAttribute('aria-current');
    });
    const dossier = document.querySelector('.dossier');
    dossier.classList.remove('flash'); void dossier.offsetWidth; dossier.classList.add('flash');
  }
  const step = (d) => { const v = visibleIdx(); const k = v.indexOf(index); select(v[(k + d + v.length) % v.length]); };
  $('b-prev').addEventListener('click', () => step(-1));
  $('b-next').addEventListener('click', () => step(1));
  addEventListener('keydown', (e) => {
    if (!active || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest && e.target.closest('input,textarea')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
  });

  /* Random fact strip */
  const ALL = B.flatMap((b) => b.facts.map((f) => ({ f, b })));
  let lastFact = -1;
  const nextFact = () => {
    let k; do { k = (Math.random() * ALL.length) | 0; } while (k === lastFact && ALL.length > 1);
    lastFact = k;
    const el = $('fs-text'); el.classList.remove('in'); void el.offsetWidth;
    el.textContent = ALL[k].f; el.classList.add('in');
    $('fs-source').innerHTML = `From <button type="button" class="linkish" data-i="${B.indexOf(ALL[k].b)}">${ALL[k].b.name}</button>`;
  };
  $('fs-next').addEventListener('click', nextFact);
  $('fs-source').addEventListener('click', (e) => { const x = e.target.closest('[data-i]'); if (x) { select(+x.dataset.i); document.querySelector('.guide-grid').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); } });

  ARV.guide = {
    start() { active = true; size(); last = performance.now(); requestAnimationFrame(loop); },
    stop() { active = false; },
  };
  select(index); nextFact();
})();
