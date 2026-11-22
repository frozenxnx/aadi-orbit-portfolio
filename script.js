(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s) => document.querySelector(s);

  /* ---------- Clock (IST) and year ---------- */
  const clock = $('#clock');
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
  const tickClock = () => { if (clock) clock.textContent = fmt.format(new Date()) + ' IST'; };
  tickClock(); setInterval(tickClock, 20000);
  const year = $('#year'); if (year) year.textContent = new Date().getFullYear();

  /* ---------- Active nav link ---------- */
  const navLinks = Array.from(document.querySelectorAll('.nav nav a'));
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['work', 'about', 'launch', 'contact'].forEach((id) => { const el = document.getElementById(id); if (el) sectionObserver.observe(el); });

  /* ---------- Galaxy (raw WebGL, no libraries) ---------- */
  const canvas = $('#galaxy');
  const gl = canvas && (canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' }) || canvas.getContext('experimental-webgl'));
  const galaxy = { warp: 0 };

  if (!gl) {
    document.documentElement.classList.add('no-webgl');
  } else {
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    const ARM_STARS = small ? 26000 : 64000;
    const FIELD_STARS = small ? 1800 : 3500;
    const RADIUS = 5.2, BRANCHES = 3, SPIN = 1.15;
    const inner = [1.0, 0.82, 0.55], outer = [0.36, 0.42, 1.0], rose = [1.0, 0.5, 0.7], cyan = [0.45, 0.85, 1.0];
    const STRIDE = 9; // radius, angle, ox, oy, oz, r, g, b, size
    const data = new Float32Array((ARM_STARS + FIELD_STARS) * STRIDE);
    const mix = (a, b, t) => a + (b - a) * t;
    const spread = (scale) => Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * scale;

    let o = 0;
    for (let i = 0; i < ARM_STARS; i++) {
      const r = Math.pow(Math.random(), 1.5) * RADIUS;
      const branch = ((i % BRANCHES) / BRANCHES) * Math.PI * 2;
      const s = 0.45 + r * 0.16;
      const t = r / RADIUS;
      let c = [mix(inner[0], outer[0], t), mix(inner[1], outer[1], t), mix(inner[2], outer[2], t)];
      const roll = Math.random();
      if (t > 0.3 && roll < 0.035) c = rose;
      else if (t > 0.5 && roll < 0.07) c = cyan;
      const b = 0.55 + Math.random() * 0.45;
      data[o++] = r;
      data[o++] = branch + r * SPIN;
      data[o++] = spread(s);
      data[o++] = spread(s * 0.45) * (1.1 - t * 0.7);
      data[o++] = spread(s);
      data[o++] = c[0] * b; data[o++] = c[1] * b; data[o++] = c[2] * b;
      data[o++] = (r < 0.6 ? 0.9 : 1) * (1 + Math.random() * 1.8);
    }
    for (let i = 0; i < FIELD_STARS; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, d = 22 + Math.random() * 40;
      const q = Math.sqrt(1 - u * u);
      const w = 0.55 + Math.random() * 0.45;
      data[o++] = 0; data[o++] = 0;
      data[o++] = q * Math.cos(th) * d; data[o++] = u * d; data[o++] = q * Math.sin(th) * d;
      data[o++] = 0.85 * w; data[o++] = 0.88 * w; data[o++] = w;
      data[o++] = 6 + Math.random() * 10;
    }

    const vs = `
      attribute float aRadius; attribute float aAngle; attribute vec3 aOffset; attribute vec3 aColor; attribute float aSize;
      uniform mat4 uProj; uniform mat4 uView; uniform float uTime; uniform float uScale; uniform float uShift; uniform float uBright;
      varying vec3 vColor;
      void main(){
        float a = aAngle - uTime * 0.16 / (aRadius + 0.7);
        vec3 p = vec3(cos(a) * aRadius, 0.0, sin(a) * aRadius) + aOffset;
        vec4 mv = uView * vec4(p, 1.0);
        gl_Position = uProj * mv;
        gl_Position.x += uShift * gl_Position.w;
        gl_PointSize = max(1.0, aSize * uScale / -mv.z);
        vColor = aColor * uBright;
      }`;
    const fs = `
      precision mediump float; varying vec3 vColor;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float s = pow(1.0 - d * 2.0, 2.4);
        gl_FragColor = vec4(vColor * s, 1.0);
      }`;
    const compile = (type, src) => { const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh); return sh; };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    const attr = (name, size, offset) => {
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, STRIDE * 4, offset * 4);
    };
    attr('aRadius', 1, 0); attr('aAngle', 1, 1); attr('aOffset', 3, 2); attr('aColor', 3, 5); attr('aSize', 1, 8);
    const U = (n) => gl.getUniformLocation(prog, n);
    const uProj = U('uProj'), uView = U('uView'), uTime = U('uTime'), uScale = U('uScale'), uShift = U('uShift'), uBright = U('uBright');

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.clearColor(0.02, 0.024, 0.043, 1);

    const perspective = (fovy, aspect, near, far) => {
      const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
      return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
    };
    const lookAt = (e, t) => {
      let zx = e[0] - t[0], zy = e[1] - t[1], zz = e[2] - t[2];
      let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
      let xx = zz, xy = 0, xz = -zx; // up = (0,1,0) cross z
      l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
      const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
      return new Float32Array([
        xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
        -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1
      ]);
    };

    let W = 0, H = 0, wide = true;
    const resize = () => {
      const pr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
      W = window.innerWidth; H = window.innerHeight; wide = W > 900;
      canvas.width = Math.round(W * pr); canvas.height = Math.round(H * pr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniformMatrix4fv(uProj, false, perspective(0.9, W / H, 0.1, 200));
      gl.uniform1f(uScale, pr * Math.max(7, H / 85));
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Camera keyframes along the page: [progress, azimuth, elevation, distance, horizontal shift, brightness]
    const KEYS = [
      [0.00, 0.55, 0.60, 6.3, 0.34, 1.00],
      [0.22, 1.45, 0.26, 5.2, 0.00, 0.70],
      [0.52, 2.35, 0.18, 3.6, 0.00, 0.55],
      [0.74, 3.10, 0.85, 6.4, -0.28, 0.80],
      [1.00, 3.90, 1.40, 10.5, 0.00, 0.95],
    ];
    const ease = (t) => t * t * (3 - 2 * t);
    const sample = (p) => {
      for (let i = 0; i < KEYS.length - 1; i++) {
        const a = KEYS[i], b = KEYS[i + 1];
        if (p <= b[0]) { const t = ease((p - a[0]) / (b[0] - a[0])); return a.map((v, k) => v + (b[k] - v) * t); }
      }
      return KEYS[KEYS.length - 1].slice();
    };

    // Drag to spin (hero), gentle pointer parallax everywhere
    const cam = sample(0);
    let dragAz = 0, dragVel = 0, dragging = false, lastX = 0, px = 0, py = 0, spx = 0, spy = 0;
    const hero = $('.hero');
    hero?.addEventListener('pointerdown', (e) => {
      if (e.target.closest('a,button')) return;
      dragging = true; lastX = e.clientX; hero.classList.add('dragging'); hero.setPointerCapture(e.pointerId);
    });
    hero?.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX; lastX = e.clientX;
      dragVel = dx * 0.006; dragAz += dragVel;
    });
    const endDrag = () => { dragging = false; hero?.classList.remove('dragging'); };
    hero?.addEventListener('pointerup', endDrag); hero?.addEventListener('pointercancel', endDrag);
    window.addEventListener('pointermove', (e) => { px = e.clientX / W - 0.5; py = e.clientY / H - 0.5; }, { passive: true });

    let time = 12, last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!reduceMotion) time += dt * (1 + galaxy.warp * 9);
      galaxy.warp *= 0.985;
      if (!dragging) { dragAz += dragVel; dragVel *= 0.94; }

      const max = Math.max(1, document.documentElement.scrollHeight - H);
      const target = sample(Math.min(1, Math.max(0, window.scrollY / max)));
      const k = reduceMotion ? 1 : 0.06;
      for (let i = 1; i < cam.length; i++) cam[i] += (target[i] - cam[i]) * k;
      spx += (px - spx) * 0.05; spy += (py - spy) * 0.05;

      const az = cam[1] + dragAz + spx * 0.25, el = cam[2] - spy * 0.12, dist = cam[3] * (1 - galaxy.warp * 0.25);
      const eye = [Math.cos(el) * Math.cos(az) * dist, Math.sin(el) * dist, Math.cos(el) * Math.sin(az) * dist];
      gl.uniformMatrix4fv(uView, false, lookAt(eye, [0, 0, 0]));
      gl.uniform1f(uTime, time);
      gl.uniform1f(uShift, wide ? cam[4] : cam[4] * 0.25);
      gl.uniform1f(uBright, cam[5] * (wide ? 0.95 : 0.8));
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, ARM_STARS + FIELD_STARS);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame((t) => { last = t; frame(t); document.documentElement.classList.add('ready'); });
  }

  /* ---------- Rocket launch ---------- */
  const btn = $('#launch-btn'), stage = $('#stage'), count = $('#count'), status = $('#launch-status');
  let timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const show = (text, cls) => { count.textContent = text; count.className = 'count'; void count.offsetWidth; count.classList.add(cls); };
  const reset = () => {
    timers.forEach(clearTimeout); timers = [];
    stage.classList.remove('ignite', 'liftoff'); count.className = 'count'; count.textContent = '';
    btn.disabled = false; btn.textContent = 'Start the countdown'; status.textContent = '';
  };
  btn?.addEventListener('click', () => {
    if (stage.classList.contains('liftoff')) { reset(); return; }
    btn.disabled = true; status.textContent = 'Systems nominal. Holding the dream.';
    const step = reduceMotion ? 250 : 1000;
    [3, 2, 1].forEach((n, i) => later(() => { show(n, 'tick'); if (n === 1) stage.classList.add('ignite'); }, i * step));
    later(() => { show('Liftoff', 'word'); stage.classList.add('liftoff'); galaxy.warp = 1; status.textContent = 'Liftoff.'; }, 3 * step);
    later(() => { btn.disabled = false; btn.textContent = 'Reset the pad'; status.textContent = 'Orbit reached. Keep looking up.'; }, 3 * step + (reduceMotion ? 300 : 2800));
  });

  /* ---------- Copy email ---------- */
  const copyBtn = $('#copy-email'), copyStatus = $('#copy-status');
  copyBtn?.addEventListener('click', async () => {
    const email = 'adityasrivastava9567@gmail.com';
    try { await navigator.clipboard.writeText(email); copyStatus.textContent = 'Copied. Transmission ready.'; }
    catch (_) { copyStatus.textContent = email; }
    setTimeout(() => { copyStatus.textContent = ''; }, 2600);
  });
})();
