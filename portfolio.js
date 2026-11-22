/* Portfolio: routing between tabs, live sky readouts, project orrery, Orbit Lab, contact. */
(() => {
  'use strict';
  const ARV = (window.ARV = window.ARV || {});
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (id) => document.getElementById(id);

  /* ---------- Title letters ---------- */
  document.querySelectorAll('[data-split]').forEach((el, w) => {
    const text = el.textContent; el.textContent = '';
    [...text].forEach((ch, i) => {
      const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', i + w * 7); el.appendChild(s);
    });
  });

  /* ---------- Clock, moon phase, readout ---------- */
  const ist = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
  const local = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
  const SYNODIC = 29.530588853, REF_NEW = Date.UTC(2000, 0, 6, 18, 14);
  const moon = () => {
    const age = ((((Date.now() - REF_NEW) / 86400000) % SYNODIC) + SYNODIC) % SYNODIC;
    const theta = (age / SYNODIC) * Math.PI * 2;
    const lit = (1 - Math.cos(theta)) / 2;
    const names = [[1.84, 'New moon'], [5.53, 'Waxing crescent'], [9.22, 'First quarter'], [12.91, 'Waxing gibbous'], [16.61, 'Full moon'], [20.30, 'Waning gibbous'], [23.99, 'Last quarter'], [27.68, 'Waning crescent'], [99, 'New moon']];
    const name = names.find(([a]) => age < a)[1];
    return { age, lit, name, waxing: age < SYNODIC / 2, theta };
  };
  const drawMoon = (m) => {
    const r = 15, cx = 20, top = cx - r, bot = cx + r, rx = Math.abs(Math.cos(m.theta)) * r, gib = m.lit > 0.5;
    const d = m.waxing
      ? `M${cx} ${top} A${r} ${r} 0 0 1 ${cx} ${bot} A${rx} ${r} 0 0 ${gib ? 1 : 0} ${cx} ${top}Z`
      : `M${cx} ${top} A${r} ${r} 0 0 0 ${cx} ${bot} A${rx} ${r} 0 0 ${gib ? 0 : 1} ${cx} ${top}Z`;
    $('moon-lit').setAttribute('d', d);
  };
  const tick = () => {
    const m = moon(), pct = Math.round(m.lit * 100);
    $('clock').textContent = ist.format(new Date()) + ' IST';
    $('moon-text').textContent = `${m.name}, ${pct}% lit`;
    $('ro-time').textContent = local.format(new Date());
    $('ro-moon').textContent = `${m.name}, ${pct}%`;
    drawMoon(m);
  };
  tick(); setInterval(tick, 20000);
  $('ro-stars').textContent = ARV.sky && ARV.sky.starCount ? ARV.sky.starCount.toLocaleString('en-US') : 'WebGL off';
  $('year').textContent = new Date().getFullYear();

  /* ---------- Header backdrop once you scroll ---------- */
  const top = document.querySelector('.top');
  const onScroll = () => top.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Routing (Portfolio / Field Guide tabs) ---------- */
  const views = { portfolio: $('view-portfolio'), guide: $('view-guide') };
  const tabs = [...document.querySelectorAll('.tab')];
  const ink = document.querySelector('.tab-ink');
  const placeInk = () => {
    const on = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
    if (on) { ink.style.width = on.offsetWidth + 'px'; ink.style.transform = `translateX(${on.offsetLeft}px)`; }
  };
  let current = null;
  const route = (name, fromHash) => {
    if (name === current) return;
    current = name;
    Object.entries(views).forEach(([k, v]) => { v.hidden = k !== name; });
    tabs.forEach((t) => { const on = t.dataset.route === name; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    document.body.dataset.view = name;
    placeInk();
    ARV.sky.setMode(name); ARV.sky.kick();
    if (name === 'guide') { ARV.guide && ARV.guide.start(); lab.stop(); } else { ARV.guide && ARV.guide.stop(); lab.maybeStart(); }
    if (!fromHash || name === 'guide') window.scrollTo(0, 0);
  };
  const fromHash = () => route(location.hash === '#guide' ? 'guide' : 'portfolio', true);
  document.addEventListener('click', (e) => {
    const r = e.target.closest('[data-route]'); if (!r) return;
    const name = r.dataset.route;
    if (name === 'guide') { e.preventDefault(); if (location.hash !== '#guide') location.hash = 'guide'; else route('guide'); }
    else if (current === 'guide') { e.preventDefault(); history.pushState(null, '', location.pathname + location.search); route('portfolio'); }
  });
  document.querySelector('.tabs').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const i = tabs.indexOf(document.activeElement); if (i < 0) return;
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    next.focus(); next.click();
  });
  addEventListener('hashchange', fromHash);
  addEventListener('popstate', fromHash);
  addEventListener('resize', placeInk, { passive: true });
  document.fonts && document.fonts.ready.then(placeInk);

  /* ---------- Project orrery ---------- */
  const PROJECTS = [
    { name: 'EvalForge', status: 'In progress', live: true, orbit: [130, 55], speed: 0.26, phase: 0.6, cls: 'p-eval',
      desc: 'An LLM evaluation and observability toolkit. It traces every model call, runs experiments, scores outputs, and compares RAG pipelines side by side, so you can see whether a change actually made things better.',
      flow: ['Trace', 'Evaluate', 'Compare'], tags: ['Python', 'LLM observability', 'RAG evaluation'], url: 'https://github.com/frozenxnx/EvalForge' },
    { name: 'Voice Cursor', status: 'Experiment', orbit: [200, 84], speed: 0.17, phase: 2.6, cls: 'p-voice',
      desc: 'Move and click through your computer by speaking instead of pointing: a voice-first take on cursor control, built with accessibility in mind.',
      flow: ['Listen', 'Interpret', 'Navigate'], tags: ['Python', 'Voice interface', 'Accessibility'], url: 'https://github.com/frozenxnx/Voice-Control-Cursor-Navigation-system' },
    { name: 'AI Agents', status: 'Experiments', orbit: [270, 113], speed: 0.11, phase: 4.4, cls: 'p-agents',
      desc: 'Small agents for real tasks: finance workflows and a Gemma-powered recipe assistant that retrieves before it answers.',
      flow: ['Plan', 'Retrieve', 'Act'], tags: ['Agents', 'RAG', 'Gemma'], url: 'https://github.com/frozenxnx/AI-Agents' },
  ];
  const orrery = $('orrery');
  const planets = PROJECTS.map((p, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = `planet ${p.cls}`; b.dataset.i = i;
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = `<span class="ball" aria-hidden="true"></span><span class="pname">${p.name}</span>`;
    orrery.appendChild(b);
    return b;
  });
  let chosen = 0, slow = 1;
  const showProject = (i) => {
    chosen = i; const p = PROJECTS[i];
    planets.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    const card = $('mission'); card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap');
    card.dataset.theme = p.cls;
    $('m-status').textContent = p.status;
    $('m-title').textContent = p.name;
    $('m-desc').textContent = p.desc;
    $('m-flow').innerHTML = p.flow.map((f) => `<li>${f}</li>`).join('');
    $('m-tags').innerHTML = p.tags.map((t) => `<li>${t}</li>`).join('');
    const link = $('m-link'); link.href = p.url; link.textContent = `Open ${p.name} on GitHub`;
  };
  orrery.addEventListener('click', (e) => { const b = e.target.closest('.planet'); if (b) showProject(+b.dataset.i); });
  orrery.addEventListener('pointerenter', () => { slow = 0.25; });
  orrery.addEventListener('pointerleave', () => { slow = 1; });
  orrery.addEventListener('focusin', () => { slow = 0.15; });
  orrery.addEventListener('focusout', () => { slow = 1; });
  showProject(0);
  let ot = 0, olast = performance.now(), ospeed = 1;
  const orbitLoop = (now) => {
    const dt = Math.min(0.05, (now - olast) / 1000); olast = now;
    ospeed += (slow - ospeed) * 0.08;
    if (!reduce) ot += dt * ospeed;
    const s = orrery.clientWidth / 600;
    PROJECTS.forEach((p, i) => {
      const a = p.phase + ot * p.speed, x = Math.cos(a) * p.orbit[0] * s, y = Math.sin(a) * p.orbit[1] * s;
      const depth = Math.sin(a), sc = 0.82 + (depth + 1) * 0.14;
      const el = planets[i];
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${sc.toFixed(3)})`;
      el.style.zIndex = depth > 0 ? 6 : 2;
      el.style.setProperty('--shade', (0.55 + (depth + 1) * 0.225).toFixed(3));
    });
    requestAnimationFrame(orbitLoop);
  };
  requestAnimationFrame(orbitLoop);

  /* ---------- Orbit Lab ---------- */
  const lab = (() => {
    const cv = $('lab-canvas'), ctx = cv.getContext('2d');
    let W = 0, H = 0, S = 0, GM = 0, pr = 1, running = false, visible = false, last = 0;
    const bodies = [], flashes = [];
    let lost = 0, escaped = 0, aim = null, companion = null, hinted = false;
    const PALETTE = ['#ffb86b', '#8f7dff', '#59e3ff', '#ff7ab8', '#9bf0b4', '#f2efe9'];
    const resize = () => {
      const r = cv.getBoundingClientRect(); pr = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height; S = Math.min(W, H) / 2; GM = 0.15 * S * S * S;
      cv.width = Math.round(W * pr); cv.height = Math.round(H * pr); ctx.setTransform(pr, 0, 0, pr, 0, 0);
    };
    const STAR_R = () => Math.max(10, S * 0.075);
    const stars = () => {
      const list = [{ x: 0, y: 0, gm: GM, r: STAR_R() }];
      if (companion) list.push({ x: Math.cos(companion.a) * companion.d, y: Math.sin(companion.a) * companion.d, gm: GM * 0.3, r: STAR_R() * 0.62 });
      return list;
    };
    const accel = (x, y, list) => {
      let ax = 0, ay = 0;
      for (const s of list) { const dx = s.x - x, dy = s.y - y, d2 = dx * dx + dy * dy + 40, inv = s.gm / (d2 * Math.sqrt(d2)); ax += dx * inv; ay += dy * inv; }
      return [ax, ay];
    };
    const add = (x, y, vx, vy) => {
      bodies.push({ x, y, vx, vy, r: 2.5 + Math.random() * 3.5, c: PALETTE[(Math.random() * PALETTE.length) | 0], trail: [] });
      if (bodies.length > 40) bodies.shift();
    };
    const seed = () => {
      bodies.length = 0;
      const n = 6;
      for (let i = 0; i < n; i++) {
        const r = S * (0.22 + i * 0.12), a = Math.random() * Math.PI * 2, v = Math.sqrt(GM / r) * (0.98 + Math.random() * 0.06);
        add(Math.cos(a) * r, Math.sin(a) * r, -Math.sin(a) * v, Math.cos(a) * v);
      }
      $('lab-hint').classList.add('gone');
    };
    const stats = () => { $('lab-count').textContent = bodies.length; $('lab-lost').textContent = lost; $('lab-escaped').textContent = escaped; };
    const toLocal = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left - W / 2, e.clientY - r.top - H / 2]; };
    const K = 1.8;
    cv.addEventListener('pointerdown', (e) => {
      const [x, y] = toLocal(e); aim = { x, y, cx: x, cy: y };
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
      if (!hinted) { hinted = true; $('lab-hint').classList.add('gone'); }
    });
    cv.addEventListener('pointermove', (e) => { if (!aim) return; const [x, y] = toLocal(e); aim.cx = x; aim.cy = y; });
    const release = () => {
      if (!aim) return;
      add(aim.x, aim.y, (aim.x - aim.cx) * K, (aim.y - aim.cy) * K);
      aim = null; stats();
    };
    cv.addEventListener('pointerup', release); cv.addEventListener('pointercancel', () => { aim = null; });
    $('lab-seed').addEventListener('click', () => { seed(); stats(); });
    $('lab-clear').addEventListener('click', () => { bodies.length = 0; lost = 0; escaped = 0; stats(); });
    $('lab-binary').addEventListener('click', (e) => {
      if (companion) { companion = null; e.currentTarget.textContent = 'Add a companion star'; }
      else { companion = { a: 0, d: S * 0.95 }; e.currentTarget.textContent = 'Remove the companion'; }
    });

    const step = (dt) => {
      if (companion) companion.a += dt * Math.sqrt(GM * 1.3 / Math.pow(companion.d, 3));
      const list = stars(), far = Math.hypot(W, H) * 0.9;
      for (let i = bodies.length - 1; i >= 0; i--) {
        const b = bodies[i];
        const [ax, ay] = accel(b.x, b.y, list);
        b.vx += ax * dt; b.vy += ay * dt; b.x += b.vx * dt; b.y += b.vy * dt;
        let gone = false;
        for (const s of list) if (Math.hypot(b.x - s.x, b.y - s.y) < s.r) { flashes.push({ x: s.x, y: s.y, t: 0, c: b.c }); lost++; gone = true; break; }
        if (!gone && Math.hypot(b.x, b.y) > far) { escaped++; gone = true; }
        if (gone) bodies.splice(i, 1);
      }
    };
    const predict = () => {
      const pts = []; let x = aim.x, y = aim.y, vx = (aim.x - aim.cx) * K, vy = (aim.y - aim.cy) * K;
      const saved = companion ? companion.a : 0; const dt = 1 / 90;
      for (let i = 0; i < 540; i++) {
        if (companion) companion.a += dt * Math.sqrt(GM * 1.3 / Math.pow(companion.d, 3));
        const [ax, ay] = accel(x, y, stars()); vx += ax * dt; vy += ay * dt; x += vx * dt; y += vy * dt;
        if (i % 3 === 0) pts.push([x, y]);
        if (Math.hypot(x, y) < STAR_R()) break;
      }
      if (companion) companion.a = saved;
      return pts;
    };
    const drawStar = (s, warm) => {
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 6);
      g.addColorStop(0, warm ? 'rgba(255,226,170,0.95)' : 'rgba(190,210,255,0.95)');
      g.addColorStop(0.18, warm ? 'rgba(255,170,80,0.45)' : 'rgba(120,150,255,0.4)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 6, 0, 6.283); ctx.fill();
      ctx.fillStyle = warm ? '#fff4dc' : '#e6eeff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.75, 0, 6.283); ctx.fill();
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.save(); ctx.translate(W / 2, H / 2);
      ctx.globalCompositeOperation = 'lighter';
      // faint reference rings
      ctx.strokeStyle = 'rgba(214,220,255,0.05)'; ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) { ctx.beginPath(); ctx.arc(0, 0, S * 0.25 * i, 0, 6.283); ctx.stroke(); }
      const list = stars();
      list.forEach((s, i) => drawStar(s, i === 0));
      for (const b of bodies) {
        const tr = b.trail, n = tr.length;
        for (let k = 1; k < n; k++) {
          ctx.strokeStyle = b.c; ctx.globalAlpha = (k / n) * 0.55; ctx.lineWidth = 1 + (k / n) * 1.2;
          ctx.beginPath(); ctx.moveTo(tr[k - 1][0], tr[k - 1][1]); ctx.lineTo(tr[k][0], tr[k][1]); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 4);
        g.addColorStop(0, b.c); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 4, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.6, 0, 6.283); ctx.fill();
      }
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i]; f.t += 0.025;
        if (f.t >= 1) { flashes.splice(i, 1); continue; }
        ctx.strokeStyle = f.c; ctx.globalAlpha = 1 - f.t; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(f.x, f.y, STAR_R() + f.t * S * 0.35, 0, 6.283); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (aim) {
        ctx.globalCompositeOperation = 'source-over';
        const pts = predict();
        ctx.fillStyle = 'rgba(242,239,233,0.7)';
        pts.forEach(([x, y], i) => { ctx.globalAlpha = 1 - i / pts.length; ctx.beginPath(); ctx.arc(x, y, 1.4, 0, 6.283); ctx.fill(); });
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(255,184,107,0.8)'; ctx.setLineDash([4, 5]); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(aim.x, aim.y); ctx.lineTo(aim.cx, aim.cy); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#ffb86b'; ctx.beginPath(); ctx.arc(aim.x, aim.y, 5, 0, 6.283); ctx.fill();
        const sp = Math.hypot(aim.x - aim.cx, aim.y - aim.cy) * K, here = Math.max(1, Math.hypot(aim.x, aim.y));
        const vc = Math.sqrt(GM / here), ve = vc * Math.SQRT2;
        const label = sp < vc * 0.8 ? 'Will fall in' : sp < ve ? 'Will orbit' : 'Will escape';
        ctx.font = '500 12px "Geist Mono", ui-monospace, monospace'; ctx.fillStyle = 'rgba(242,239,233,0.85)';
        const msg = `${label} · ${(sp / vc).toFixed(2)}× circular speed`, tw = ctx.measureText(msg).width;
        const tx = aim.x + 12 + tw > W / 2 - 12 ? aim.x - 12 - tw : aim.x + 12;
        ctx.fillText(msg, tx, Math.max(-H / 2 + 20, aim.y - 12));
      }
      ctx.restore();
    };
    const loop = (now) => {
      if (!running) return;
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const sub = 4;
      for (let i = 0; i < sub; i++) step(dt / sub);
      for (const b of bodies) { b.trail.push([b.x, b.y]); if (b.trail.length > 150) b.trail.shift(); }
      draw(); stats();
      requestAnimationFrame(loop);
    };
    const start = () => { if (running) return; running = true; resize(); last = performance.now(); requestAnimationFrame(loop); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && current !== 'guide') start(); else running = false; }, { threshold: 0.05 });
    io.observe(cv);
    addEventListener('resize', () => { if (running) resize(); }, { passive: true });
    resize(); seed(); stats();
    if (reduce) { draw(); }
    return { stop() { running = false; }, maybeStart() { if (visible) start(); } };
  })();

  /* ---------- Constellation lines draw in when seen ---------- */
  const chart = document.querySelector('.chart');
  new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { chart.classList.add('drawn'); obs.disconnect(); } }, { threshold: 0.4 }).observe(chart);

  /* ---------- Copy email ---------- */
  $('copy-email').addEventListener('click', async () => {
    const email = 'adityasrivastava9567@gmail.com', out = $('copy-status');
    try { await navigator.clipboard.writeText(email); out.textContent = 'Copied. Transmission ready.'; } catch (_) { out.textContent = email; }
    setTimeout(() => { out.textContent = ''; }, 2600);
  });

  fromHash();
})();
