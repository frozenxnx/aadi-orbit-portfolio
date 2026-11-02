const signalButton = document.querySelector('#signal-trigger');
const signalCaption = document.querySelector('#signal-caption');
const signalNotes = [
  'A SYSTEMS NOTEBOOK / 2026',
  'EVALFORGE / TRACE → COMPARE',
  'VOICE CURSOR / LISTEN → ACT',
  'AI AGENTS / PLAN → RETRIEVE',
];
let signalIndex = 0;
signalButton?.addEventListener('click', () => {
  signalIndex = (signalIndex + 1) % signalNotes.length;
  if (signalCaption) signalCaption.textContent = signalNotes[signalIndex];
  signalButton.setAttribute('aria-label', `Explore another project focus, ${signalIndex + 1} of ${signalNotes.length}`);
});

const menuButton = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('#site-nav');

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  siteNav?.classList.toggle('is-open', !isOpen);
});

siteNav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    siteNav.classList.remove('is-open');
  });
});

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  document.documentElement.classList.add('js-motion');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}
