/* Sky: a hand-written WebGL galaxy over a drifting nebula, with a warp-in on load.
   Exposes window.ARV.sky = { setMode(name), starCount, kick() } */
(() => {
  'use strict';
  const ARV = (window.ARV = window.ARV || {});
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('sky');
  const gl = canvas && canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  ARV.sky = { setMode() {}, starCount: 0, kick() {} };
  if (!gl) { document.documentElement.classList.add('no-webgl'); return; }

  const small = Math.min(innerWidth, innerHeight) < 700;
  const ARM = small ? 24000 : 60000, FIELD = small ? 2200 : 4200;
  const R = 5.4, BR = 3, SPIN = 1.2, STRIDE = 9;
  const data = new Float32Array((ARM + FIELD) * STRIDE);
  const mix = (a, b, t) => a + (b - a) * t;
  const spread = (s) => Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * s;
  const inner = [1.0, 0.74, 0.45], outer = [0.42, 0.40, 1.0];
  let o = 0;
  for (let i = 0; i < ARM; i++) {
    const r = Math.pow(Math.random(), 1.45) * R, t = r / R, s = 0.42 + r * 0.17;
    let c = [mix(inner[0], outer[0], t), mix(inner[1], outer[1], t), mix(inner[2], outer[2], t)];
    const roll = Math.random();
    if (t > 0.28 && roll < 0.045) c = [1.0, 0.42, 0.72];          // pink HII regions
    else if (t > 0.45 && roll < 0.09) c = [0.45, 0.86, 1.0];      // young blue stars
    const b = 0.5 + Math.random() * 0.5;
    data[o++] = r; data[o++] = ((i % BR) / BR) * Math.PI * 2 + r * SPIN;
    data[o++] = spread(s); data[o++] = spread(s * 0.42) * (1.1 - t * 0.7); data[o++] = spread(s);
    data[o++] = c[0] * b; data[o++] = c[1] * b; data[o++] = c[2] * b;
    data[o++] = (1 + Math.random() * 1.8) * (r < 0.5 ? 0.85 : 1);
  }
  for (let i = 0; i < FIELD; i++) {
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, d = 18 + Math.random() * 46, q = Math.sqrt(1 - u * u);
    const w = 0.5 + Math.random() * 0.5, hue = Math.random();
    data[o++] = 0; data[o++] = 0;
    data[o++] = q * Math.cos(th) * d; data[o++] = u * d; data[o++] = q * Math.sin(th) * d;
    data[o++] = (hue < 0.2 ? 1.0 : 0.82) * w; data[o++] = 0.86 * w; data[o++] = (hue > 0.8 ? 1.0 : 0.92) * w;
    data[o++] = 5 + Math.random() * 11;
  }
  ARV.sky.starCount = ARM + FIELD;

  const compile = (type, src) => {
    const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh));
    return sh;
  };
  const program = (vs, fs) => {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    return p;
  };

  /* Stars */
  const starProg = program(`
    attribute float aR; attribute float aA; attribute vec3 aO; attribute vec3 aC; attribute float aS;
    uniform mat4 uP; uniform mat4 uV; uniform float uT; uniform float uScale; uniform float uShift; uniform float uB; uniform float uStretch;
    varying vec3 vC;
    void main(){
      float a = aA - uT * 0.15 / (aR + 0.7);
      vec3 p = vec3(cos(a) * aR, 0.0, sin(a) * aR) + aO;
      vec4 mv = uV * vec4(p, 1.0);
      gl_Position = uP * mv;
      gl_Position.x += uShift * gl_Position.w;
      gl_PointSize = max(1.0, aS * uScale / -mv.z * (1.0 + uStretch));
      vC = aC * uB;
    }`, `
    precision mediump float; varying vec3 vC;
    void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(vC * pow(1.0 - d * 2.0, 2.3), 1.0); }`);
  const starBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, starBuf); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  const sa = (n) => gl.getAttribLocation(starProg, n), su = (n) => gl.getUniformLocation(starProg, n);
  const SA = [[sa('aR'), 1, 0], [sa('aA'), 1, 1], [sa('aO'), 3, 2], [sa('aC'), 3, 5], [sa('aS'), 1, 8]];
  const SU = { P: su('uP'), V: su('uV'), T: su('uT'), scale: su('uScale'), shift: su('uShift'), B: su('uB'), stretch: su('uStretch') };

  /* Nebula: domain-warped fbm on a full-screen triangle */
  const nebProg = program(`attribute vec2 aP; void main(){ gl_Position = vec4(aP, 0.0, 1.0); }`, `
    precision mediump float; uniform vec2 uRes; uniform float uT; uniform vec2 uOff; uniform float uAmt;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
      return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
    float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a*n(p); p = p*2.02 + vec2(3.1, 1.7); a *= 0.5; } return v; }
    void main(){
      vec2 p = gl_FragCoord.xy / uRes.y * 1.5 + uOff;
      float t = uT * 0.012;
      vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
      vec2 r = vec2(fbm(p + 2.0*q + vec2(1.7, 9.2)), fbm(p + 2.0*q + vec2(8.3, 2.8)));
      float f = fbm(p + 2.4*r);
      vec3 c = mix(vec3(0.05, 0.02, 0.12), vec3(0.32, 0.07, 0.36), clamp(f*f*2.2, 0.0, 1.0));
      c = mix(c, vec3(0.04, 0.22, 0.34), clamp(length(q) * 0.55, 0.0, 1.0) * 0.7);
      c = mix(c, vec3(0.55, 0.28, 0.12), clamp(r.x * r.x * 0.9, 0.0, 1.0) * 0.35);
      c *= smoothstep(0.32, 1.0, f) * uAmt;
      gl_FragColor = vec4(c, 1.0);
    }`);
  const triBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const NA = gl.getAttribLocation(nebProg, 'aP');
  const NU = { res: gl.getUniformLocation(nebProg, 'uRes'), T: gl.getUniformLocation(nebProg, 'uT'), off: gl.getUniformLocation(nebProg, 'uOff'), amt: gl.getUniformLocation(nebProg, 'uAmt') };

  const perspective = (fovy, aspect, near, far) => {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  };
  const lookAt = (e) => {
    let zx = e[0], zy = e[1], zz = e[2], l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
    let xx = zz, xz = -zx; l = Math.hypot(xx, xz) || 1; xx /= l; xz /= l;
    const yx = zy * xz, yy = zz * xx - zx * xz, yz = -zy * xx;
    return new Float32Array([xx, yx, zx, 0, 0, yy, zy, 0, xz, yz, zz, 0,
      -(xx * e[0] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1]);
  };

  let W = 0, H = 0, wide = true, proj;
  const resize = () => {
    const pr = Math.min(devicePixelRatio || 1, small ? 1 : 1.35);
    W = innerWidth; H = innerHeight; wide = W > 900;
    canvas.width = Math.round(W * pr); canvas.height = Math.round(H * pr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    proj = perspective(0.9, W / H, 0.1, 300);
    SU.scaleVal = pr * Math.max(7, H / 85);
  };
  resize(); addEventListener('resize', resize, { passive: true });

  // Camera path for the portfolio: [progress, azimuth, elevation, distance, shift, brightness, nebula]
  const PATH = [
    [0.00, 0.50, 0.58, 6.2, 0.30, 1.00, 0.9],
    [0.20, 1.40, 0.24, 5.0, 0.00, 0.62, 0.7],
    [0.45, 2.30, 0.14, 3.4, 0.00, 0.50, 0.6],
    [0.70, 3.10, 0.90, 7.0, 0.00, 0.62, 0.8],
    [1.00, 3.90, 1.35, 10.0, 0.00, 0.95, 1.0],
  ];
  const GUIDE = [0, 0.9, 1.45, 13.5, 0, 0.42, 1.25];
  const ease = (t) => t * t * (3 - 2 * t);
  const sample = (p) => {
    for (let i = 0; i < PATH.length - 1; i++) {
      const a = PATH[i], b = PATH[i + 1];
      if (p <= b[0]) { const t = ease((p - a[0]) / (b[0] - a[0])); return a.map((v, k) => v + (b[k] - v) * t); }
    }
    return PATH[PATH.length - 1].slice();
  };

  let mode = 'portfolio';
  ARV.sky.setMode = (m) => { mode = m; };
  let warp = reduce ? 0 : 1;            // intro: fly in from deep space
  ARV.sky.kick = () => { if (!reduce) warp = Math.max(warp, 0.45); };

  // Drag-to-spin on the hero, pointer parallax everywhere
  const cam = sample(0); cam[3] = reduce ? cam[3] : 48;
  let dragAz = 0, vel = 0, dragging = false, lastX = 0, px = 0, py = 0, spx = 0, spy = 0;
  const hero = document.querySelector('.hero');
  hero && hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a,button,.readout')) return;
    dragging = true; lastX = e.clientX; hero.classList.add('dragging');
    try { hero.setPointerCapture(e.pointerId); } catch (_) {}
  });
  hero && hero.addEventListener('pointermove', (e) => { if (!dragging) return; vel = (e.clientX - lastX) * 0.006; dragAz += vel; lastX = e.clientX; });
  const end = () => { dragging = false; hero && hero.classList.remove('dragging'); };
  hero && hero.addEventListener('pointerup', end); hero && hero.addEventListener('pointercancel', end);
  addEventListener('pointermove', (e) => { px = e.clientX / W - 0.5; py = e.clientY / H - 0.5; }, { passive: true });

  let time = 20, last = performance.now();
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!reduce) time += dt * (1 + warp * 14);
    warp = Math.max(0, warp - dt * 0.42);
    if (!dragging) { dragAz += vel; vel *= 0.94; }

    let target;
    if (mode === 'guide') target = GUIDE.slice();
    else {
      const max = Math.max(1, document.documentElement.scrollHeight - H);
      target = sample(Math.min(1, Math.max(0, scrollY / max)));
    }
    const k = reduce ? 1 : 0.05;
    for (let i = 1; i < cam.length; i++) cam[i] += (target[i] - cam[i]) * k * (i === 3 && warp > 0 ? 0.9 : 1);
    spx += (px - spx) * 0.05; spy += (py - spy) * 0.05;

    const az = cam[1] + dragAz + spx * 0.22 + (reduce ? 0 : time * 0.004), el = cam[2] - spy * 0.1, d = cam[3];
    const eye = [Math.cos(el) * Math.cos(az) * d, Math.sin(el) * d, Math.cos(el) * Math.sin(az) * d];

    gl.clearColor(0.016, 0.016, 0.04, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);

    // nebula
    gl.useProgram(nebProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, triBuf);
    for (const a of SA) if (a[0] >= 0) gl.disableVertexAttribArray(a[0]);
    gl.enableVertexAttribArray(NA); gl.vertexAttribPointer(NA, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(NU.res, canvas.width, canvas.height); gl.uniform1f(NU.T, time);
    gl.uniform2f(NU.off, az * 0.35 + spx * 0.2, el * 0.4 - (mode === 'guide' ? 0 : scrollY / H * 0.08));
    gl.uniform1f(NU.amt, cam[6] * (wide ? 1 : 0.8));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disableVertexAttribArray(NA);

    // stars
    gl.useProgram(starProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, starBuf);
    for (const [loc, size, off] of SA) { if (loc < 0) continue; gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, STRIDE * 4, off * 4); }
    gl.uniformMatrix4fv(SU.P, false, proj); gl.uniformMatrix4fv(SU.V, false, lookAt(eye));
    gl.uniform1f(SU.T, time); gl.uniform1f(SU.scale, SU.scaleVal);
    gl.uniform1f(SU.shift, wide ? cam[4] : 0); gl.uniform1f(SU.B, cam[5] * (wide ? 0.95 : 0.8));
    gl.uniform1f(SU.stretch, warp * 1.5);
    gl.drawArrays(gl.POINTS, 0, ARM + FIELD);

    requestAnimationFrame(frame);
  };
  requestAnimationFrame((t) => { last = t; frame(t); document.documentElement.classList.add('sky-ready'); });
})();

/* Stardust: a soft particle trail behind the pointer (fine pointers only) */
(() => {
  const c = document.getElementById('dust');
  if (!c || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.matchMedia('(pointer: fine)').matches) return;
  const ctx = c.getContext('2d');
  let W, H, pr; const parts = [];
  const size = () => { pr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; c.width = W * pr; c.height = H * pr; ctx.setTransform(pr, 0, 0, pr, 0, 0); };
  size(); addEventListener('resize', size, { passive: true });
  const cols = ['255,184,107', '143,125,255', '89,227,255', '255,255,255'];
  let lx = null, ly = null;
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const dx = lx == null ? 0 : e.clientX - lx, dy = ly == null ? 0 : e.clientY - ly; lx = e.clientX; ly = e.clientY;
    const n = Math.min(4, 1 + Math.hypot(dx, dy) / 14);
    for (let i = 0; i < n; i++) parts.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - .5) * .6 - dx * .02, vy: (Math.random() - .5) * .6 - dy * .02, life: 1, r: Math.random() * 1.6 + .4, c: cols[(Math.random() * cols.length) | 0] });
    if (parts.length > 260) parts.splice(0, parts.length - 260);
  }, { passive: true });
  const tick = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.004; p.life -= 0.018;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(${p.c},${p.life * 0.8})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.6 + p.life), 0, 6.283); ctx.fill();
    }
    requestAnimationFrame(tick);
  };
  tick();
})();
