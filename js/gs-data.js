// ============================================================================
// GLOBAL SOLUTIONS — gs-data.js
// Couche de données commune : Supabase REST + cache local + fallbacks
// Aucun framework. Chargé avant navigation.js / main.js.
// ============================================================================
(function () {
  'use strict';

  const cfg = window.GS_SUPABASE || {};
  const hasSupabase = !!(cfg.url && cfg.anonKey);

  // --- Cache mémoire + sessionStorage (évite les requêtes répétées) ----------
  const mem = {};
  const TTL = 5 * 60 * 1000; // 5 minutes

  function cacheGet(key) {
    if (mem[key]) return mem[key];
    try {
      const raw = sessionStorage.getItem('gs:' + key);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (Date.now() - obj.t > TTL) return null;
      mem[key] = obj.v;
      return obj.v;
    } catch (e) { return null; }
  }

  function cacheSet(key, value) {
    mem[key] = value;
    try { sessionStorage.setItem('gs:' + key, JSON.stringify({ t: Date.now(), v: value })); } catch (e) {}
  }

  async function apiGet(path) {
    if (!hasSupabase) throw new Error('Supabase non configuré');
    const res = await fetch(cfg.url + '/rest/v1/' + path, {
      headers: {
        apikey: cfg.anonKey,
        Authorization: 'Bearer ' + cfg.anonKey,
        Accept: 'application/json'
      }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  async function cached(key, path) {
    const hit = cacheGet(key);
    if (hit) return hit;
    try {
      const data = await apiGet(path);
      if (Array.isArray(data) && data.length) cacheSet(key, data);
      return data;
    } catch (e) {
      console.warn('[GS] Lecture Supabase impossible (' + key + '), contenus locaux utilisés.', e.message);
      return null;
    }
  }

  // --- Utilitaires ----------------------------------------------------------
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const telHref = (t) => 'tel:' + String(t || '').replace(/[^\d+]/g, '');

  // Anciens visuels de démonstration : remplacer uniquement ces images connues,
  // sans toucher aux photos personnalisées publiées depuis l'administration.
  // L'image du bandeau d'accueil reste gérée séparément par applyContent.
  const legacyPhotos = {
    'photo-1541888946425-d81bb19240f5': 'assets/images/rehabilitation-batiment.jpeg',
    'photo-1503387762-592deb58ef4e': 'assets/images/rehabilitation-batiment.jpeg',
    'photo-1504328345606-18bbc8c9d7d1': 'assets/images/equipement-hydraulique.jpeg',
    'photo-1625246333195-78d9c38ad449': 'assets/images/equipement-hydraulique.jpeg',
    'photo-1585704032915-c3400ca199e7': 'assets/images/point-eau.jpeg',
    'photo-1509391366360-2e959784a276': 'assets/images/pompage-solaire.jpeg',
    'photo-1473341304170-971dccb5ac1e': 'assets/images/pompage-solaire.jpeg',
    'photo-1523848309072-c199db53f137': 'assets/images/chantier-forage.jpeg',
    'photo-1504307651254-35680f356dfd': 'assets/images/structure-metallique.jpeg',
    'photo-1584622650111-9934e148f67b': 'assets/images/ouvrage-assainissement.jpeg',
    'photo-1519003722824-194d4455a60c': 'assets/images/chantier-forage.jpeg',
    'photo-1581091226825-a6a2a5aee158': 'assets/images/equipement-hydraulique.jpeg',
    'photo-1581094794329-c8112a89af12': 'assets/images/rehabilitation-batiment.jpeg',
    'photo-1486406146926-c627a92ad1ab': 'assets/images/amenagement-site.jpeg',
    'photo-1454165804606-c3d57bc86b40': 'assets/images/rehabilitation-batiment.jpeg',
    'photo-1513828583688-c52646db42da': 'assets/images/chantier-forage.jpeg'
  };

  function resolvePhoto(url, fallback) {
    if (!url) return fallback || '';
    const match = /^https?:\/\/images\.unsplash\.com\/([^/?#]+)/i.exec(String(url));
    const replacement = match && Object.prototype.hasOwnProperty.call(legacyPhotos, match[1]) ? legacyPhotos[match[1]] : '';
    return replacement ? (fallback || replacement) : url;
  }

  const dateFr = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    if (isNaN(dt)) return String(d);
    return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // Applique un contenu éditable sur des éléments [data-content="page.cle"]
  function applyContent(rows) {
    document.querySelectorAll('[data-content-src]').forEach((el) => {
      const key = el.getAttribute('data-content-src');
      const row = rows.find((r) => r.page + '.' + r.cle === key);
      if (row && row.valeur) el.setAttribute('src', row.valeur);
    });
    document.querySelectorAll('[data-content]').forEach((el) => {
      const key = el.getAttribute('data-content');
      const row = rows.find((r) => r.page + '.' + r.cle === key);
      if (!row || row.valeur == null || row.valeur === '') return;
      if (el.getAttribute('data-content-html') !== null || row.type === 'html' || /<[a-z][\s\S]*>/i.test(row.valeur)) {
        el.innerHTML = row.valeur;
      } else {
        el.textContent = row.valeur;
      }
    });
  }

  // --- Chargements spécifiques ---------------------------------------------
  let contentPromise = null;
  function getContent() {
    if (!contentPromise) {
      contentPromise = cached('pages_contenu', 'pages_contenu?select=page,cle,valeur,type').then((rows) => {
        if (rows && rows.length) applyContent(rows);
        return rows || [];
      });
    }
    return contentPromise;
  }

  function getSettings() {
    return cached('site_settings', 'site_settings?select=cle,valeur').then((rows) => {
      const out = {};
      (rows || []).forEach((r) => { if (r.cle) out[r.cle] = r.valeur; });
      return out;
    });
  }

  function getExpertises() {
    return cached('expertises', 'expertises?select=*&actif=eq.true&order=ordre.asc');
  }

  function getEquipe() {
    return cached('equipe', 'equipe?select=*&actif=eq.true&order=ordre.asc');
  }

  function getStats() {
    return cached('stats', 'stats?select=*&actif=eq.true&order=ordre.asc');
  }

  function getRealisations() {
    return cached('realisations', 'realisations?select=*&statut=eq.publie&order=annee.desc');
  }

  function getActualites() {
    return cached('actualites', 'actualites?select=*&statut=eq.publie&order=date_publication.desc');
  }

  // Applique les réglages visibles partout (WhatsApp, bandeau d'annonce)
  function applyGlobalUI(settings, contentRows) {
    // Numéro WhatsApp réel depuis site_settings
    if (settings && settings.whatsapp) {
      const num = String(settings.whatsapp).replace(/[^\d]/g, '');
      document.querySelectorAll('a[href*="wa.me"], a[data-whatsapp]').forEach((a) => {
        const txt = a.getAttribute('data-wa-text') || "Bonjour GLOBAL SOLUTIONS, je souhaite discuter d'un projet.";
        a.href = 'https://wa.me/' + num + '?text=' + encodeURIComponent(txt);
      });
    }
    // Emails (site_settings.email_contact prioritaire)
    if (settings && settings.email_contact) {
      const mail = settings.email_contact.trim();
      document.querySelectorAll('a[href^="mailto:info@globalsolutions.one"]').forEach((a) => {
        a.href = a.href.replace('info@globalsolutions.one', mail);
        if (a.textContent.includes('info@globalsolutions.one')) a.textContent = a.textContent.replace('info@globalsolutions.one', mail);
      });
    }
    // Bandeau d'annonce
    const row = (contentRows || []).find((r) => r.page === 'global' && r.cle === 'bandeau_annonce');
    if (row && row.valeur && row.valeur.trim()) {
      const bar = document.createElement('div');
      bar.className = 'announce-bar';
      bar.innerHTML = '<div class="container"><span>' + esc(row.valeur) + '</span><button aria-label="Fermer le bandeau" type="button">&times;</button></div>';
      bar.querySelector('button').addEventListener('click', () => bar.remove());
      const header = document.querySelector('.header');
      if (header) document.body.insertBefore(bar, header); else document.body.prepend(bar);
    }
  }

  // Injection des favicons si absents (robustesse)
  window.GS = {
    esc, telHref, dateFr, resolvePhoto,
    hasSupabase,
    getContent, getSettings, getExpertises, getEquipe, getStats,
    getRealisations, getActualites,
    applyGlobalUI,
    applyContent,
    clearCache() {
      Object.keys(mem).forEach((k) => delete mem[k]);
      // Ne supprimer que nos propres entrées « gs:* » : un sessionStorage.clear()
      // effacerait aussi la session d'administration et le brouillon du formulaire.
      try {
        const keys = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k && k.indexOf('gs:') === 0) keys.push(k);
        }
        keys.forEach((k) => sessionStorage.removeItem(k));
      } catch (e) {}
    }
  };

  // Démarrage : contenus éditables + réglages sur toutes les pages
  function boot() {
    Promise.all([getContent(), getSettings()]).then(([rows, settings]) => {
      applyGlobalUI(settings, rows);
      document.dispatchEvent(new CustomEvent('gs:ready', { detail: { content: rows, settings } }));
    }).catch(() => {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
