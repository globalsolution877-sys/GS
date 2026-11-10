// GLOBAL SOLUTIONS — navigation.js (menu mobile, lien actif, accès admin discret)
document.addEventListener('DOMContentLoaded', () => {
  const burger = document.querySelector('.burger');
  const menu = document.querySelector('.mobile-menu');
  if (burger && menu) {
    burger.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
  }
  // Lien actif selon URL
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a, .mobile-menu a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });

  // ------------------------------------------------------------------------
  // Accès administrateur discret
  //   • Double-clic sur le logo        → /admin.html
  //   • Ctrl + clic / Cmd + clic       → /admin.html
  //   • Appui long (mobile, 700 ms)    → /admin.html
  // Le simple clic continue de fonctionner normalement (délai de 300 ms
  // nécessaire pour distinguer un double-clic).
  // ------------------------------------------------------------------------
  const ADMIN_URL = 'admin.html';
  const DBL_DELAY = 300;

  document.querySelectorAll('.logo').forEach((logo) => {
    const href = logo.getAttribute('href') || 'index.html';
    let clickTimer = null;
    let pressTimer = null;

    const goTo = (url) => {
      if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
      window.location.href = url;
    };

    logo.addEventListener('click', (e) => {
      // Ctrl / Cmd + clic : accès administration immédiat
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        goTo(ADMIN_URL);
        return;
      }
      // Clic du milieu, Maj ou Alt : on laisse le navigateur décider
      if (e.button !== 0 || e.shiftKey || e.altKey) return;

      e.preventDefault();

      if (clickTimer) {
        // Deuxième clic dans la fenêtre de 300 ms → double-clic
        goTo(ADMIN_URL);
        return;
      }

      clickTimer = setTimeout(() => {
        clickTimer = null;
        window.location.href = href;
      }, DBL_DELAY);
    });

    logo.addEventListener('dblclick', (e) => e.preventDefault());

    // Appui long sur mobile (700 ms)
    const start = () => {
      pressTimer = setTimeout(() => {
        pressTimer = null;
        goTo(ADMIN_URL);
      }, 700);
    };
    const cancel = () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } };
    logo.addEventListener('touchstart', start, { passive: true });
    logo.addEventListener('touchend', cancel);
    logo.addEventListener('touchmove', cancel);
    logo.addEventListener('touchcancel', cancel);

    logo.setAttribute('title', 'GLOBAL SOLUTIONS — Accueil (double-clic : administration)');
  });
});
