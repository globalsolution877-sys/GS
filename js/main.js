// GLOBAL SOLUTIONS — main.js (animations, back-to-top, lightbox, reveal)
document.addEventListener('DOMContentLoaded', () => {
  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Back to top
  const toTop = document.querySelector('.to-top');
  window.addEventListener('scroll', () => {
    if (toTop) toTop.classList.toggle('show', window.scrollY > 600);
  }, { passive: true });
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Lightbox
  const lb = document.querySelector('.lightbox');
  const lbImg = lb ? lb.querySelector('img') : null;
  const lbCap = lb ? lb.querySelector('.lightbox-cap') : null;
  const closeLb = () => lb && lb.classList.remove('open');
  document.querySelectorAll('[data-lightbox]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const src = el.getAttribute('data-lightbox');
      const cap = el.getAttribute('data-caption') || el.querySelector('h3')?.textContent || '';
      if (lb && lbImg) { lbImg.src = src; lbImg.alt = cap; if (lbCap) lbCap.textContent = cap; lb.classList.add('open'); }
    });
  });
  if (lb) {
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
    lb.querySelector('.lightbox-close')?.addEventListener('click', closeLb);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLb(); });
  }

  // Parallax léger sur hero
  const heroImg = document.querySelector('.hero-bg img');
  if (heroImg) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < window.innerHeight) heroImg.style.transform = `translateY(${y * 0.18}px) scale(1.05)`;
    }, { passive: true });
  }

  // Année footer
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
});
