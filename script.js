const scenes = Array.from(document.querySelectorAll('.scene-card'));
const navNodes = Array.from(document.querySelectorAll('[data-scene-link]'));
const chapterStops = Array.from(document.querySelectorAll('.chapter-stop'));
const progressBar = document.querySelector('#progress');
const chapterLabel = document.querySelector('#chart-chapter');
const coordinates = document.querySelector('#chart-coordinate');
let activeScene = 0;
const chapterNames = ['INTRODUCTION', 'LLM SYSTEMS', 'HUMAN INTERACTION', 'AGENT EXPERIMENTS', 'ORIGIN', 'THE SKY', 'OPEN CHANNEL'];
const coordinatesByScene = ['ORIGIN / EARTH', 'MODEL / 01 · EVALUATION', 'SIGNAL / 02 · INTERACTION', 'SYSTEM / 03 · AGENTS', 'ORIGIN / 04 · EARTH', 'VECTOR / 05 · OUTWARD', 'CHANNEL / 06 · OPEN'];

function showScene(index) {
  const next = Math.max(0, Math.min(scenes.length - 1, index));
  if (next === activeScene && document.body.dataset.scene) return;
  activeScene = next;
  document.body.dataset.scene = String(next);
  scenes.forEach((card, i) => {
    const selected = i === next;
    card.classList.toggle('is-active', selected);
    card.setAttribute('aria-hidden', String(!selected));
    card.inert = !selected;
  });
  navNodes.forEach((node) => {
    const selected = Number(node.dataset.sceneLink) === next;
    node.classList.toggle('is-active', selected);
    if (selected) node.setAttribute('aria-current', 'step');
    else node.removeAttribute('aria-current');
  });
  if (chapterLabel) chapterLabel.textContent = String(next).padStart(2, '0') + ' / ' + chapterNames[next];
  if (coordinates) coordinates.textContent = coordinatesByScene[next];
  if (progressBar) progressBar.style.width = ((next / (scenes.length - 1)) * 100) + '%';
  document.dispatchEvent(new CustomEvent('orbit:scene', { detail: { index: next } }));
}

showScene(0);
const sceneObserver = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (visible) showScene(Number(visible.target.dataset.index));
}, { threshold: [0.35, 0.55, 0.72] });
chapterStops.forEach((stop) => sceneObserver.observe(stop));

const clock = document.querySelector('#clock');
function updateClock() {
  if (!clock) return;
  clock.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()) + ' IST';
}
updateClock();
setInterval(updateClock, 30000);
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const launchButton = document.querySelector('#launch-button');
const launchStatus = document.querySelector('#launch-status');
let countdownTimer;
launchButton?.addEventListener('click', () => {
  if (document.body.classList.contains('launched')) {
    clearTimeout(countdownTimer);
    document.body.classList.remove('launching', 'launched');
    launchButton.disabled = false;
    launchButton.innerHTML = 'START A COUNTDOWN <span>↗</span>';
    if (launchStatus) launchStatus.textContent = '';
    return;
  }
  clearTimeout(countdownTimer);
  document.body.classList.add('launching');
  launchButton.disabled = true;
  launchButton.innerHTML = 'T − 03 <span>·</span>';
  if (launchStatus) launchStatus.textContent = 'SYSTEMS NOMINAL · HOLDING THE DREAM';
  countdownTimer = setTimeout(() => {
    document.body.classList.add('launched');
    launchButton.disabled = false;
    launchButton.innerHTML = 'LIFTOFF · AGAIN? <span>↗</span>';
    if (launchStatus) launchStatus.textContent = 'ORBIT ACHIEVED · KEEP LOOKING UP';
  }, 1100);
});

const canvas = document.querySelector('#cosmos');
const context = canvas?.getContext('2d', { alpha: false });
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let particles = [];
let pointer = { x: 0, y: 0 };
let sceneForCanvas = 0;
let width = 0;
let height = 0;
let pixelRatio = 1;

function seedParticles() {
  const amount = Math.min(5600, Math.max(2400, Math.floor(window.innerWidth * window.innerHeight / 145)));
  particles = Array.from({ length: amount }, () => {
    const radius = Math.pow(Math.random(), .72);
    const angle = Math.random() * Math.PI * 2;
    return { radius, angle, scatter: (Math.random() - .5) * .22, size: Math.random() * 1.15 + .2, shine: Math.random(), phase: Math.random() * Math.PI * 2 };
  });
}

function resizeCanvas() {
  if (!canvas || !context) return;
  pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  seedParticles();
  if (reduceMotion) drawChart(0);
}

function drawChart(time) {
  if (!context) return;
  context.fillStyle = '#020303';
  context.fillRect(0, 0, width, height);
  const cx = width * (.52 + pointer.x * .008);
  const cy = height * (.53 + pointer.y * .006);
  const maxRadius = Math.min(width * .39, height * .43);
  const angleShift = reduceMotion ? 0 : time * .000035;
  const planetMode = sceneForCanvas === 4;
  const rocketMode = sceneForCanvas === 5;
  const outward = sceneForCanvas === 6;
  context.save();
  context.translate(cx, cy);
  context.rotate(sceneForCanvas === 2 ? .48 : sceneForCanvas === 5 ? -.22 : -.28);
  context.strokeStyle = '#b8b7ae';
  context.globalAlpha = .08;
  for (let ring = 0; ring < 5; ring++) {
    context.beginPath();
    context.ellipse(0, 0, maxRadius * (.38 + ring * .16), maxRadius * (.13 + ring * .055), 0, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();
  for (const p of particles) {
    const radial = p.radius * maxRadius;
    const spiral = p.angle + (p.radius * 5.7) + angleShift + p.scatter;
    let x;
    let y;
    let alpha = .15 + p.shine * .38;
    if (planetMode) {
      x = cx + Math.cos(spiral) * radial;
      y = cy + Math.sin(spiral) * radial * .52;
    } else if (rocketMode) {
      const plume = (p.angle % .6 - .3) * radial * .65;
      x = cx + Math.cos(spiral) * radial * .42 + plume;
      y = cy + Math.sin(spiral) * radial * .82 - (p.radius * height * .1);
      alpha *= .9;
    } else if (outward) {
      const bloom = radial * (1 + p.radius * .7);
      x = cx + Math.cos(spiral + angleShift * 2) * bloom;
      y = cy + Math.sin(spiral + angleShift * 2) * bloom * .58;
    } else {
      x = cx + Math.cos(spiral) * radial;
      y = cy + Math.sin(spiral) * radial * .55;
    }
    if (sceneForCanvas === 1) { x = cx + Math.cos(spiral * .65) * radial * 1.05; y = cy + Math.sin(spiral * .65) * radial * .32; }
    if (sceneForCanvas === 3) { x = cx + Math.cos(spiral * 1.7) * radial * .62; y = cy + Math.sin(spiral * 1.7) * radial * .72; }
    const special = (p.shine > .985) || (rocketMode && p.radius > .76 && p.radius < .88 && p.shine > .72);
    const twinkle = reduceMotion ? 1 : .68 + Math.sin(time * .001 + p.phase) * .32;
    context.beginPath();
    context.fillStyle = special ? 'rgba(218,190,132,' + (alpha * twinkle + .13) + ')' : 'rgba(220,218,209,' + alpha * twinkle + ')';
    context.arc(x, y, p.size * (special ? 1.7 : 1), 0, Math.PI * 2);
    context.fill();
  }
  if (planetMode) {
    const radius = Math.min(width, height) * .07;
    const glow = context.createRadialGradient(cx - radius * .3, cy - radius * .35, radius * .05, cx, cy, radius * 1.5);
    glow.addColorStop(0, '#c8c7be'); glow.addColorStop(.48, '#696b68'); glow.addColorStop(1, '#05060600');
    context.fillStyle = glow; context.beginPath(); context.arc(cx, cy, radius * 1.5, 0, Math.PI * 2); context.fill();
    context.strokeStyle = '#d1c29d66'; context.lineWidth = 1; context.beginPath(); context.ellipse(cx, cy, radius * 2.2, radius * .58, -.32, 0, Math.PI * 2); context.stroke();
  }
  if (rocketMode) {
    const tail = Math.min(height * .24, 150);
    const plume = context.createLinearGradient(cx, cy + 18, cx, cy + tail);
    plume.addColorStop(0, '#e2c98d99'); plume.addColorStop(1, '#d9bd7a00');
    context.strokeStyle = plume; context.lineWidth = 3; context.beginPath(); context.moveTo(cx, cy + 19); context.lineTo(cx, cy + tail); context.stroke();
  }
}

function animate(time) {
  drawChart(time || 0);
  if (!reduceMotion) requestAnimationFrame(animate);
}
if (canvas && context) {
  resizeCanvas();
  animate(0);
  window.addEventListener('resize', resizeCanvas, { passive: true });
  window.addEventListener('pointermove', (event) => {
    pointer.x = event.clientX / Math.max(1, width) - .5;
    pointer.y = event.clientY / Math.max(1, height) - .5;
  }, { passive: true });
  document.addEventListener('orbit:scene', (event) => {
    sceneForCanvas = event.detail.index;
    if (reduceMotion) drawChart(0);
  });
}
