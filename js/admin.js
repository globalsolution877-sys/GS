// ============================================================================
// GLOBAL SOLUTIONS — admin.js
// Authentification Supabase + CRUD des contenus (sans framework).
// Sécurité : la clé anon est publique, l'accès en écriture est contrôlé par
// les policies RLS (fonction public.is_admin()) côté base de données.
// ============================================================================
(function () {
  'use strict';

  const cfg = window.GS_SUPABASE || {};
  const API = cfg.url ? cfg.url + '/rest/v1/' : '';
  const SB_AUTH = cfg.url ? cfg.url + '/auth/v1' : '';

  // ------------------------------- Utils ---------------------------------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function toast(text, isError) {
    const t = $('#toast');
    t.textContent = text;
    t.className = 'toast show' + (isError ? ' error' : '');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.className = 'toast'; }, 3600);
  }

  // --------------------------- Session locale -----------------------------
  const SESSION_KEY = 'gs_admin_session';

  function saveSession(session) {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch (e) {}
    admin = session;
  }
  function loadSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s.access_token || !s.expires_at) return null;
      if (Date.now() > s.expires_at - 60000) return null;
      return s;
    } catch (e) { return null; }
  }
  function clearSession() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    admin = null;
  }

  let admin = null;

  // Encodage base64url du JWT (localStorage pas nécessaire : sessionStorage)
  function jwtExp(tok) {
    try {
      const payload = JSON.parse(atob(tok.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.exp * 1000;
    } catch (e) { return Date.now() + 3600 * 1000; }
  }

  // ------------------------------- Auth -----------------------------------
  async function login(email, password) {
    const res = await fetch(SB_AUTH + '/token?grant_type=password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: cfg.anonKey },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || 'Identifiants incorrects');
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + (data.expires_in || 3600) * 1000,
      email: data.user ? data.user.email : email
    };
  }

  async function signup(email, password, inviteCode) {
    const res = await fetch(SB_AUTH + '/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: cfg.anonKey },
      body: JSON.stringify({ email, password, data: { invite_code: inviteCode } })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || data.error_description || "Création impossible");
    if (data.msg && /already/i.test(data.msg)) throw new Error('Ce compte existe déjà. Utilisez la connexion.');
    return data;
  }

  // --------------------------- Requêtes REST ------------------------------
  async function api(path, opts = {}) {
    if (!admin) throw new Error('Session expirée');
    const res = await fetch(API + path, {
      method: opts.method || 'GET',
      headers: Object.assign({
        apikey: cfg.anonKey,
        Authorization: 'Bearer ' + admin.access_token,
        'Content-Type': 'application/json',
        Prefer: opts.prefer || 'return=representation'
      }, opts.headers || {}),
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    if (res.status === 401) { logout(); throw new Error('Session expirée, reconnectez-vous.'); }
    if (!res.ok) {
      let msg = 'Erreur ' + res.status;
      try { const j = await res.json(); msg = j.message || j.hint || msg; } catch (e) {}
      throw new Error(msg);
    }
    if (res.status === 204) return null;
    const txt = await res.text();
    return txt ? JSON.parse(txt) : null;
  }

  // ---------------------- Téléversement des images -------------------------
  // Les photographies sont compressees dans le navigateur (canvas) avant envoi :
  // une photo de telephone de 8 Mo devient generalement 200-400 Ko, ce qui rend
  // l'envoi fiable en 3G depuis Niamey et allege le site public.
  const BUCKET = 'realisations';
  const MAX_INPUT = 25 * 1024 * 1024;   // taille maximale du fichier d'origine
  const MAX_SIDE = 1800;                // plus grand cote apres compression
  const JPEG_QUALITY = 0.82;

  // Lot de photos selectionne mais pas encore televerse
  let picked = [];

  function humanSize(n) {
    if (!n) return '0 Ko';
    return n >= 1048576 ? (n / 1048576).toFixed(1) + ' Mo' : Math.round(n / 1024) + ' Ko';
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      // Navigateur ancien (canvas.toBlob absent) : on envoie le fichier tel quel
      if (typeof document.createElement('canvas').toBlob !== 'function') {
        return resolve(file);
      }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width: w, height: h } = img;
        const ratio = Math.min(1, MAX_SIDE / Math.max(w, h));
        w = Math.round(w * ratio); h = Math.round(h * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Compression impossible')),
          'image/jpeg', JPEG_QUALITY
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible')); };
      img.src = url;
    });
  }

  function storagePath(file) {
    const d = new Date();
    const stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0') + '-' + Date.now() + '-' +
      Math.random().toString(36).slice(2, 7);
    const base = (file.name || 'photo').replace(/\.[^.]+$/, '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      .toLowerCase().slice(0, 48) || 'photo';
    return stamp + '-' + base + '.jpg';
  }

  async function uploadOne(file) {
    return uploadTo(BUCKET, file);
  }

  // Televersement dans un bucket donne ('realisations' pour le catalogue,
  // 'equipe' pour les portraits). Chaque bucket a ses propres policies.
  async function uploadTo(bucket, file) {
    if (!admin) throw new Error('Session expirée');
    if (!/^image\//.test(file.type)) throw new Error('« ' + file.name + ' » n\u2019est pas une image.');
    if (file.size > MAX_INPUT) throw new Error('« ' + file.name + ' » dépasse 25 Mo.');
    const blob = await compressImage(file);
    const path = storagePath(file);
    const res = await fetch(cfg.url + '/storage/v1/object/' + bucket + '/' + encodeURIComponent(path), {
      method: 'POST',
      headers: {
        apikey: cfg.anonKey,
        Authorization: 'Bearer ' + admin.access_token,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'false',
        'cache-control': '31536000'
      },
      body: blob
    });
    if (!res.ok) {
      let msg = 'Échec du téléversement (' + res.status + ')';
      try {
        const j = await res.json();
        if (j.message) msg = j.message;
        if (/row-level security|Unauthorized|JWT/i.test(msg)) {
          msg = 'Accès refusé par la base : votre compte doit figurer dans la table admins.';
        }
      } catch (e) {}
      throw new Error(msg);
    }
    return cfg.url + '/storage/v1/object/public/' + bucket + '/' + path;
  }

  // Televersement d'une image unique (portrait) : renvoie son URL publique
  async function uploadSingle(bucket, file) {
    return uploadTo(bucket, file);
  }

  // Envoi d'au moins deux photos en parallele (plus rapide, moins d'erreurs reseau)
  async function uploadAll(files, onProgress) {
    return uploadAllTo(BUCKET, files, onProgress);
  }

  async function uploadAllTo(bucket, files, onProgress) {
    const list = Array.from(files);
    const urls = new Array(list.length);
    let done = 0;
    const worker = async (i) => {
      urls[i] = await uploadTo(bucket, list[i]);
      done += 1;
      if (onProgress) onProgress(done, list.length);
    };
    let cursor = 0;
    const runners = Array.from({ length: Math.min(2, list.length) }, async () => {
      while (cursor < list.length) {
        const i = cursor++;
        await worker(i);
      }
    });
    await Promise.all(runners);
    return urls;
  }

  // Apercus + selecteur de fichiers de la fiche « nouvelle realisation »
  function bindUploader() {
    const input = $('#fileRealisation');
    const drop = $('#dropRealisation');
    const box = $('#previewsRealisation') || document.createElement('div');
    const info = $('#uploadRealisationInfo');
    if (!input || !drop) return;

    function syncInfo() {
      if (!info) return;
      const total = picked.reduce((n, p) => n + p.file.size, 0);
      info.textContent = picked.length
        ? picked.length + ' photo' + (picked.length > 1 ? 's' : '') +
          ' sélectionnée' + (picked.length > 1 ? 's' : '') + ' · ' + humanSize(total) + ' avant compression'
        : '';
    }

    function paint() {
      box.innerHTML = picked.map((p, i) => `
        <figure class="gs-preview">
          <img src="${p.preview}" alt="">
          <figcaption>${i === 0 ? '<span class="gs-cover">Couverture</span>' : ''}
            <button type="button" data-drop-photo="${i}" title="Retirer">×</button></figcaption>
        </figure>`).join('');
      box.querySelectorAll('[data-drop-photo]').forEach((b) => b.addEventListener('click', () => {
        const i = Number(b.dataset.dropPhoto);
        URL.revokeObjectURL(picked[i].preview);
        picked.splice(i, 1);
        paint(); syncInfo();
      }));
      syncInfo();
    }

    function add(files) {
      Array.from(files).forEach((file) => {
        if (!/^image\//.test(file.type)) { toast('« ' + file.name + ' » n\u2019est pas une image', true); return; }
        if (file.size > MAX_INPUT) { toast('« ' + file.name + ' » dépasse 25 Mo', true); return; }
        picked.push({ file, preview: URL.createObjectURL(file) });
      });
      paint();
    }

    if (input.dataset.bound) return;
    input.dataset.bound = '1';
    input.addEventListener('change', () => { add(input.files); input.value = ''; });

    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => {
      e.preventDefault(); drop.classList.add('over');
    }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => {
      e.preventDefault(); drop.classList.remove('over');
    }));
    drop.addEventListener('drop', (e) => { if (e.dataTransfer && e.dataTransfer.files) add(e.dataTransfer.files); });

    window.__gsResetPicked = () => { picked.forEach((p) => URL.revokeObjectURL(p.preview)); picked = []; paint(); };
  }

  function logout() {
    clearSession();
    $('#adminView').hidden = true;
    $('#authView').hidden = false;
    $('#authView').style.display = '';
  }

  // ------------------------------ Vues ------------------------------------
  const IMG_FALLBACK = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=400&auto=format&fit=crop';

  const views = {

    // ---------------------------------------------------------- Dashboard
    dashboard: async () => {
      const [msgs, real, news, exp, team, notif] = await Promise.all([
        api('contact_messages?select=id,statut,created_at&order=created_at.desc').catch(() => []),
        api('realisations?select=id,statut').catch(() => []),
        api('actualites?select=id,statut').catch(() => []),
        api('expertises?select=id,actif').catch(() => []),
        api('equipe?select=id,actif').catch(() => []),
        api('notifications?select=*&order=created_at.desc&limit=5').catch(() => [])
      ]);
      const sent = notif.filter((n) => n.statut === 'envoye').length;
      const noProvider = notif.some((n) => n.statut === 'non_configure');
      const newMsgs = msgs.filter((m) => (m.statut || 'nouveau') === 'nouveau').length;
      return `
        <div class="kpis">
          <div class="kpi accent"><strong>${newMsgs}</strong><span>Nouvelles demandes</span></div>
          <div class="kpi"><strong>${real.filter((r) => r.statut === 'publie').length}</strong><span>Réalisations publiées</span></div>
          <div class="kpi"><strong>${news.filter((n) => n.statut === 'publie').length}</strong><span>Actualités publiées</span></div>
          <div class="kpi"><strong>${exp.filter((e) => e.actif).length}</strong><span>Expertises actives</span></div>
          <div class="kpi"><strong>${team.length}</strong><span>Membres de l'équipe</span></div>
        </div>
        ${noProvider ? `<div class="a-card" style="border-left:4px solid #E0A800">
          <h2>Notifications e-mail non configurées</h2>
          <p class="a-sub">La chaîne d'alerte fonctionne, mais aucune clé d'API d'envoi n'est encore renseignée. Ajoutez <code>RESEND_API_KEY</code> (ou <code>BREVO_API_KEY</code>) dans les secrets Supabase pour recevoir les demandes par e-mail. En attendant, elles sont toutes visibles dans l'onglet Demandes.</p>
        </div>` : (sent ? `<div class="a-card" style="border-left:4px solid var(--sky)">
          <h2>Notifications e-mail actives</h2>
          <p class="a-sub">Dernier envoi réussi. ${sent} notification(s) transmise(s) récemment.</p>
        </div>` : '')}
        <div class="a-card">
          <h2>Bienvenue dans votre espace</h2>
          <p class="a-sub">Tout ce que vous modifiez ici est immédiatement visible sur le site public (après actualisation de la page).</p>
          <div class="a-actions">
            <button class="a-btn primary" data-goto="messages">Voir les demandes</button>
            <button class="a-btn" data-goto="realisations">Ajouter une réalisation</button>
            <button class="a-btn" data-goto="actualites">Publier une actualité</button>
            <button class="a-btn" data-goto="contenus">Modifier les textes</button>
          </div>
        </div>
        ${msgs.length ? `<div class="a-card"><h2>Dernières demandes reçues</h2>
        <table class="a-table"><tbody>
        ${msgs.slice(0, 5).map((m) => `<tr><td><strong>${esc(m.nom || '—')}</strong></td><td>${esc(m.objet || '')}</td><td><span class="a-badge ${(m.statut || 'nouveau') === 'nouveau' ? 'new' : ''}">${esc(m.statut || 'nouveau')}</span></td><td>${m.created_at ? new Date(m.created_at).toLocaleDateString('fr-FR') : ''}</td></tr>`).join('')}
        </tbody></table></div>` : ''}
      `;
    },

    // ----------------------------------------------------------- Messages
    messages: async () => {
      const rows = await api('contact_messages?select=*&order=created_at.desc');
      if (!rows.length) return `<div class="a-card"><div class="a-empty"><strong>Aucune demande pour le moment</strong>Les messages envoyés via le formulaire de contact apparaîtront ici.</div></div>`;
      return `<div class="a-card"><h2>${rows.length} demande${rows.length > 1 ? 's' : ''}</h2>
        <p class="a-sub">Cliquez sur « Marquer traité » après avoir répondu à la personne.</p>
        <div class="msg-list">
        ${rows.map((m) => `
          <div class="msg-item">
            <div class="msg-head">
              <strong>${esc(m.nom || '—')} ${m.entreprise ? '<span style="font-weight:500;color:var(--grey-mid)">· ' + esc(m.entreprise) + '</span>' : ''}</strong>
              <span class="a-badge ${(m.statut || 'nouveau') === 'nouveau' ? 'new' : 'pub'}">${esc(m.statut || 'nouveau')}</span>
            </div>
            <div class="msg-meta">
              <span>✉ <a href="mailto:${esc(m.email)}">${esc(m.email || '—')}</a></span>
              ${m.telephone ? `<span>☎ <a href="tel:${esc(m.telephone)}">${esc(m.telephone)}</a></span>` : ''}
              ${m.domaine ? `<span>◆ ${esc(m.domaine)}</span>` : ''}
              <span>🕒 ${m.created_at ? new Date(m.created_at).toLocaleString('fr-FR') : ''}</span>
            </div>
            <div class="msg-body"><strong>${esc(m.objet || 'Sans objet')}</strong>\n\n${esc(m.message || '')}</div>
            <div class="a-actions">
              ${(m.statut || 'nouveau') === 'nouveau' ? `<button class="a-btn primary" data-msg-done="${m.id}">Marquer traité</button>` : `<button class="a-btn" data-msg-reopen="${m.id}">Remettre en nouveau</button>`}
              <a class="a-btn" href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Re: ' + (m.objet || 'Votre demande'))}">Répondre par e-mail</a>
              <button class="a-btn danger" data-msg-del="${m.id}">Supprimer</button>
            </div>
          </div>`).join('')}
        </div></div>`;
    },

    // ------------------------------------------------------- Réalisations
    // Catalogue : chaque projet accepte une photographie de couverture et une
    // galerie de photos, televersees depuis la galerie de l'appareil.
    realisations: async () => {
      const rows = await api('realisations?select=*&order=ordre.asc,created_at.desc');
      const nbPhotos = rows.reduce((n, r) => n + (r.galerie ? r.galerie.length : 0), 0);
      return `
      <div class="a-card">
        <h2>Ajouter une réalisation</h2>
        <p class="a-sub">Choisissez les photographies depuis la galerie de votre téléphone ou de votre ordinateur. La première sélectionnée devient la couverture du catalogue.</p>
        <form class="a-form" id="formRealisation">
          <label>Titre du projet<input name="titre" required placeholder="Ex. Construction du centre de santé de…"></label>
          <label>Catégorie
            <select name="categorie" required>
              <option value="batiments">Bâtiments</option><option value="hydraulique">Hydraulique</option>
              <option value="forages">Forages</option><option value="aeps">Adduction d'eau potable</option>
              <option value="amenagements">Aménagements</option><option value="solaire">Énergie solaire</option>
              <option value="genie-civil">Génie civil</option><option value="metal">Construction métallique</option>
            </select>
          </label>
          <label>Localisation<input name="localisation" placeholder="Ville / région"></label>
          <label>Année<input name="annee" type="number" min="2000" max="2100" placeholder="2024"></label>
          <label class="full">Description<textarea name="description" placeholder="Nature des travaux, maître d'ouvrage, résultats…"></textarea></label>
          <div class="full">
            <label class="gs-upload" id="dropRealisation">
              <input type="file" id="fileRealisation" accept="image/*" multiple hidden>
              <span class="gs-upload__icon" aria-hidden="true">🖼️</span>
              <strong>Choisir les photos</strong>
              <small>Depuis la galerie ou l'appareil photo · JPG, PNG, WEBP, AVIF · 10 Mo max par image · plusieurs photos possibles</small>
            </label>
            <small id="uploadRealisationInfo" class="gs-upload__info"></small>
            <div class="gs-previews" id="previewsRealisation"></div>
          </div>
          <label class="full">Ou coller un lien d'image (facultatif)<input name="image_url" type="url" placeholder="https://…"><small>Utile pour réutiliser une photo déjà hébergée ailleurs. Le téléversement reste la méthode recommandée.</small></label>
          <label>Statut
            <select name="statut"><option value="publie">Publié (visible)</option><option value="brouillon">Brouillon (masqué)</option></select>
          </label>
          <div class="a-form-foot"><button type="submit" class="a-btn primary">Enregistrer la réalisation</button></div>
        </form>
      </div>
      <div class="a-card">
        <h2>Catalogue (${rows.length} fiche${rows.length > 1 ? 's' : ''} · ${nbPhotos} photo${nbPhotos > 1 ? 's' : ''} en galerie)</h2>
        ${rows.length ? `<table class="a-table"><thead><tr><th></th><th>Titre</th><th>Catégorie</th><th>Année</th><th>Photos</th><th>Statut</th><th></th></tr></thead><tbody>
        ${rows.map((r) => `<tr>
          <td><img src="${esc(r.image_url || IMG_FALLBACK)}" alt=""></td>
          <td><strong>${esc(r.titre)}</strong><br><small style="color:var(--grey-mid)">${esc(r.localisation || '')}</small></td>
          <td>${esc(r.categorie || '')}</td><td>${esc(r.annee || '')}</td>
          <td>${r.galerie && r.galerie.length ? r.galerie.length + ' 📷' : '—'}</td>
          <td><span class="a-badge ${r.statut === 'publie' ? 'pub' : ''}">${esc(r.statut || 'brouillon')}</span></td>
          <td><div class="a-actions">
            <button class="a-btn" data-edit-real="${r.id}">Photos / fiche</button>
            <button class="a-btn" data-toggle="realisations:${r.id}:${r.statut === 'publie' ? 'brouillon' : 'publie'}">${r.statut === 'publie' ? 'Dépublier' : 'Publier'}</button>
            <button class="a-btn danger" data-del-real="${r.id}">Supprimer</button>
          </div></td></tr>`).join('')}
        </tbody></table>` : `<div class="a-empty"><strong>Aucune réalisation pour le moment</strong>Le site public affiche les emplacements « À compléter » jusqu'à votre première publication.</div>`}
      </div>`;
    },

    // --------------------------------------------------------- Actualités
    actualites: async () => {
      const rows = await api('actualites?select=*&order=date_publication.desc');
      const today = new Date().toISOString().slice(0, 10);
      return `
      <div class="a-card">
        <h2>Nouvelle actualité</h2>
        <p class="a-sub">Rédigez vos communiqués, avancées de chantier ou annonces.</p>
        <form class="a-form" id="formActualite">
          <label class="full">Titre<input name="titre" required></label>
          <label class="full">Extrait (affiché dans la liste)<textarea name="extrait" style="min-height:70px"></textarea></label>
          <label class="full">Contenu complet<textarea name="contenu" style="min-height:150px" placeholder="Séparez les paragraphes par une ligne vide."></textarea></label>
          <label>Date de publication<input type="date" name="date_publication" value="${today}" required></label>
          <label>Statut<select name="statut"><option value="publie">Publié</option><option value="brouillon">Brouillon</option></select></label>
          <label class="full">Image d'illustration (URL)<input name="image_url" type="url" placeholder="https://…"></label>
          <div class="a-form-foot"><button type="submit" class="a-btn primary">Publier</button></div>
        </form>
      </div>
      <div class="a-card">
        <h2>Articles (${rows.length})</h2>
        ${rows.length ? `<table class="a-table"><thead><tr><th>Titre</th><th>Date</th><th>Statut</th><th></th></tr></thead><tbody>
        ${rows.map((a) => `<tr><td><strong>${esc(a.titre)}</strong></td><td>${esc(a.date_publication || '')}</td>
          <td><span class="a-badge ${a.statut === 'publie' ? 'pub' : ''}">${esc(a.statut || 'brouillon')}</span></td>
          <td><div class="a-actions">
            <button class="a-btn" data-toggle="actualites:${a.id}:${a.statut === 'publie' ? 'brouillon' : 'publie'}">${a.statut === 'publie' ? 'Dépublier' : 'Publier'}</button>
            <button class="a-btn danger" data-del="actualites:${a.id}">Supprimer</button>
          </div></td></tr>`).join('')}</tbody></table>`
        : `<div class="a-empty"><strong>Aucun article</strong>Le site affiche des emplacements éditoriaux en attendant.</div>`}
      </div>`;
    },

    // --------------------------------------------------------- Expertises
    expertises: async () => {
      const rows = await api('expertises?select=*&order=ordre.asc');
      return `
      <div class="a-card"><h2>Ajouter une expertise</h2>
        <form class="a-form" id="formExpertise">
          <label>Titre<input name="titre" required></label>
          <label>Identifiant d'ancre<input name="slug" required placeholder="ex. hydraulique" pattern="[a-z0-9-]+"><small>Minuscules, sans accents ni espaces.</small></label>
          <label class="full">Description<textarea name="description"></textarea></label>
          <label class="full">Mots-clés<input name="tags" placeholder="Séparés par des virgules"></label>
          <label class="full">Secteurs<input name="secteurs" placeholder="Ex. collectivités, agriculture"></label>
          <label class="full">Image (URL)<input name="image_url" type="url"></label>
          <label>Ordre d'affichage<input name="ordre" type="number" value="${rows.length + 1}"></label>
          <div class="a-form-foot"><button class="a-btn primary">Enregistrer</button></div>
        </form>
      </div>
      <div class="a-card"><h2>Les ${rows.length} expertises</h2>
        <table class="a-table"><thead><tr><th>#</th><th>Titre</th><th>Ancre</th><th>État</th><th></th></tr></thead><tbody>
        ${rows.map((e) => `<tr>
          <td>${esc(e.ordre)}</td>
          <td><strong>${esc(e.titre)}</strong></td>
          <td><code style="font-size:12px;color:var(--grey-mid)">#${esc(e.slug)}</code></td>
          <td><span class="a-badge ${e.actif ? 'pub' : ''}">${e.actif ? 'active' : 'masquée'}</span></td>
          <td><div class="a-actions">
            <button class="a-btn" data-edit="expertises:${e.id}">Modifier</button>
            <button class="a-btn" data-toggle="expertises:${e.id}:actif">${e.actif ? 'Masquer' : 'Afficher'}</button>
          </div></td></tr>`).join('')}
        </tbody></table>
      </div>`;
    },

    // -------------------------------------------------------------- Équipe
    equipe: async () => {
      const rows = await api('equipe?select=*&order=ordre.asc');
      const avecPhoto = rows.filter((m) => m.photo_url).length;
      return `
      <div class="a-card">
        <h2>Ajouter un membre</h2>
        <p class="a-sub">Choisissez le portrait depuis la galerie de votre téléphone ou de votre ordinateur. Sans photo, les initiales servent d'avatar.</p>
        <form class="a-form" id="formEquipe">
          <label>Nom complet<input name="nom" required></label>
          <label>Fonction<input name="fonction" placeholder="Directeur Technique"></label>
          <label>Initiales<input name="initiales" maxlength="3" placeholder="MB"><small>Affichées si aucune photo n'est fournie.</small></label>
          <label>Ordre d'affichage<input name="ordre" type="number" value="${rows.length + 1}"></label>
          <label class="full">Biographie<textarea name="bio" placeholder="Parcours, compétences, responsabilités…"></textarea></label>
          <div class="full">
            <label class="gs-upload" id="dropEquipe">
              <input type="file" id="fileEquipe" accept="image/*" hidden>
              <span class="gs-upload__icon" aria-hidden="true">🖼️</span>
              <strong>Choisir le portrait</strong>
              <small>Depuis la galerie ou l'appareil photo · JPG, PNG, WEBP · 10 Mo max · le cadrage carré est recommandé</small>
            </label>
            <div class="gs-previews" id="previewEquipe"></div>
          </div>
          <div class="a-form-foot"><button type="submit" class="a-btn primary">Enregistrer le membre</button></div>
        </form>
      </div>
      <div class="a-card">
        <h2>L'équipe (${rows.length} membre${rows.length > 1 ? 's' : ''} · ${avecPhoto} portrait${avecPhoto > 1 ? 's' : ''})</h2>
        ${rows.length ? `<table class="a-table"><thead><tr><th></th><th>Nom</th><th>Fonction</th><th>Ordre</th><th>État</th><th></th></tr></thead><tbody>
        ${rows.map((m) => `<tr>
          <td>${m.photo_url
            ? `<img class="a-avatar" src="${esc(m.photo_url)}" alt="">`
            : `<span class="a-avatar a-avatar--init">${esc(m.initiales || (m.nom || '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase())}</span>`}</td>
          <td><strong>${esc(m.nom)}</strong></td>
          <td>${esc(m.fonction || '')}</td>
          <td>${esc(m.ordre == null ? '' : m.ordre)}</td>
          <td><span class="a-badge ${m.actif ? 'pub' : ''}">${m.actif ? 'actif' : 'masqué'}</span></td>
          <td><div class="a-actions">
            <button class="a-btn" data-edit-membre="${m.id}">Photos / fiche</button>
            <button class="a-btn" data-toggle="equipe:${m.id}:actif">${m.actif ? 'Masquer' : 'Afficher'}</button>
            <button class="a-btn danger" data-del="equipe:${m.id}">Supprimer</button>
          </div></td></tr>`).join('')}
        </tbody></table>` : `<div class="a-empty"><strong>Aucun membre</strong>Ajoutez les membres de la direction pour les afficher sur le site.</div>`}
      </div>`;
    },

    // ---------------------------------------------------------- Contenus
    contenus: async () => {
      const rows = await api('pages_contenu?select=*&order=page.asc,cle.asc');
      const pages = [...new Set(rows.map((r) => r.page))];
      return `<div class="a-card"><h2>Textes du site</h2>
        <p class="a-sub">Chaque champ modifie instantanément le site public. Les champs marqués « HTML » acceptent la mise en forme.</p>
        ${pages.map((p) => `
          <h3 style="margin:22px 0 10px;font-size:15px;color:var(--sky-deep);text-transform:uppercase;letter-spacing:.1em">${esc(p)}</h3>
          <div class="a-form">
          ${rows.filter((r) => r.page === p).map((r) => `
            <label class="${(r.type === 'html' || r.type === 'texte') ? 'full' : ''}">
              ${esc(r.label || r.cle)} <small>[${esc(r.cle)} · ${esc(r.type || 'texte')}]</small>
              ${r.type === 'html' || String(r.valeur || '').length > 120
                ? `<textarea data-content-id="${r.id}" data-original="${esc(r.valeur)}">${esc(r.valeur || '')}</textarea>`
                : `<input data-content-id="${r.id}" data-original="${esc(r.valeur)}" value="${esc(r.valeur || '')}">`}
            </label>`).join('')}
          </div>`).join('')}
        <div class="a-form-foot"><button class="a-btn primary" id="saveContent">Enregistrer les modifications</button></div>
      </div>`;
    },

    // ------------------------------------------------------------- Stats
    stats: async () => {
      const rows = await api('stats?select=*&order=ordre.asc');
      return `<div class="a-card"><h2>Indicateurs de l'accueil</h2>
        <p class="a-sub">Restez factuel : année de création, domaines, implantation. Évitez les chiffres non vérifiables.</p>
        <table class="a-table"><thead><tr><th>Valeur</th><th>Libellé</th><th>Ordre</th><th></th></tr></thead><tbody>
        ${rows.map((s) => `<tr data-stat="${s.id}">
          <td><input class="stat-v" value="${esc(s.valeur)}" style="width:90px;border:1px solid var(--line);border-radius:8px;padding:7px"></td>
          <td><input class="stat-l" value="${esc(s.label)}" style="width:100%;border:1px solid var(--line);border-radius:8px;padding:7px"></td>
          <td><input class="stat-o" type="number" value="${s.ordre}" style="width:70px;border:1px solid var(--line);border-radius:8px;padding:7px"></td>
          <td><button class="a-btn primary" data-save-stat="${s.id}">Enregistrer</button></td></tr>`).join('')}
        </tbody></table>
      </div>`;
    },

    // ------------------------------------------------------ Notifications
    notifications: async () => {
      const rows = await api('notifications?select=*&order=created_at.desc&limit=50').catch(() => []);
      const state = (s) => ({ envoye: 'pub', non_configure: 'new', echec: 'new', erreur_trigger: 'new' }[s] || '');
      const label = {
        envoye: 'Envoyé', non_configure: 'Non configuré', echec: 'Échec', erreur_trigger: 'Erreur trigger'
      };
      const PROJECT_REF = (cfg.url || '').replace('https://', '').split('.')[0];
      const secretsUrl = 'https://supabase.com/dashboard/project/' + PROJECT_REF + '/functions/secrets';
      const noKey = rows.some((n) => n.statut === 'non_configure');

      return `<div class="a-card">
        <h2>Activer l'envoi des e-mails</h2>
        <p class="a-sub">La chaîne technique est prête. Il manque uniquement la clé d'un fournisseur d'e-mail (Resend ou Brevo, gratuits).</p>
        <ol style="margin:0 0 18px 18px;color:var(--grey-mid);font-size:14px;line-height:1.9">
          <li>Créez un compte sur <a href="https://resend.com" target="_blank" rel="noopener" style="color:var(--sky-dark);font-weight:700">resend.com</a> puis une <strong>API Key</strong>.</li>
          <li>Copiez la clé (elle commence par <code>re_</code>).</li>
          <li>Ouvrez les secrets Supabase (ci-dessous) et créez <code>RESEND_API_KEY</code>.</li>
        </ol>
        <div class="a-actions">
          <a class="a-btn primary" href="${secretsUrl}" target="_blank" rel="noopener">Ouvrir les secrets Supabase ↗</a>
          <a class="a-btn" href="https://resend.com/api-keys" target="_blank" rel="noopener">Créer une clé Resend ↗</a>
        </div>
        ${noKey ? '<p style="margin-top:14px;font-size:13px;color:#8C1D18;background:#FDF3F2;border:1px solid #F3C9C5;border-radius:10px;padding:12px 14px"><strong>État : clé absente.</strong> Les demandes sont enregistrées et visibles dans l\'onglet Demandes, mais aucun e-mail n\'est envoyé.</p>' : ''}
      </div>
      <div class="a-card">
        <h2>Journal des envois</h2>
        <p class="a-sub">Chaque demande de contact déclenche une alerte vers l'adresse de réception. Voici les 50 derniers envois.</p>
        <div class="a-form" style="margin-bottom:18px">
          <label class="full">Adresse de réception des alertes
            <input id="notifyEmail" value="${esc((rows[0] && rows[0].destinataire) || '')}" placeholder="info@globalsolutions.one">
            <small>Modifiable ici, enregistrée dans les réglages du site.</small>
          </label>
        </div>
        <div class="a-form-foot" style="justify-content:flex-start"><button class="a-btn primary" id="saveNotifyEmail">Enregistrer l'adresse</button></div>
      </div>
      <div class="a-card">
        <h2>Journal (${rows.length})</h2>
        ${rows.length ? `<table class="a-table"><thead><tr><th>Date</th><th>Destinataire</th><th>Sujet</th><th>Fournisseur</th><th>État</th></tr></thead><tbody>
          ${rows.map((n) => `<tr>
            <td>${n.created_at ? new Date(n.created_at).toLocaleString('fr-FR') : ''}</td>
            <td>${esc(n.destinataire || '—')}</td>
            <td style="max-width:320px">${esc(n.sujet || '—')}</td>
            <td>${esc(n.provider || '—')}</td>
            <td><span class="a-badge ${state(n.statut)}">${esc(label[n.statut] || n.statut || '')}</span></td>
          </tr>`).join('')}
        </tbody></table>` : `<div class="a-empty"><strong>Aucune notification pour l'instant</strong>
          Le journal se remplit à chaque nouvelle demande de contact.</div>`}
      </div>`;
    },

    // ---------------------------------------------------------- Réglages
    reglages: async () => {
      const [settings, admins] = await Promise.all([
        api('site_settings?select=*').catch(() => []),
        api('admins?select=email,created_at').catch(() => [])
      ]);
      const get = (k) => { const r = settings.find((s) => s.cle === k); return r ? r.valeur : ''; };
      const fields = [
        ['email_contact', 'E-mail de contact', 'text'],
        ['telephone_1', 'Téléphone principal', 'text'],
        ['telephone_2', 'Téléphone secondaire', 'text'],
        ['whatsapp', 'WhatsApp (format international)', 'text'],
        ['adresse', 'Adresse', 'text'],
        ['facebook', 'Page Facebook (URL)', 'text'],
        ['linkedin', 'Page LinkedIn (URL)', 'text']
      ];
      return `<div class="a-card"><h2>Coordonnées & réseaux</h2>
        <p class="a-sub">Ces valeurs alimentent les liens du site (WhatsApp, e-mails, pied de page).</p>
        <div class="a-form">
          ${fields.map(([k, label]) => `<label class="${k === 'adresse' ? 'full' : ''}">${label}<input data-setting="${k}" value="${esc(get(k))}"></label>`).join('')}
        </div>
        <div class="a-form-foot"><button class="a-btn primary" id="saveSettings">Enregistrer</button></div>
      </div>
      <div class="a-card"><h2>Sécurité — changer mon mot de passe</h2>
        <p class="a-sub">Connecté en tant que <strong>${esc(admin.email || '')}</strong>. Utilisez au moins 10 caractères.</p>
        <div class="a-form">
          <label>Nouveau mot de passe<input type="password" id="newPassword" autocomplete="new-password" minlength="8" placeholder="••••••••"></label>
          <label>Confirmer<input type="password" id="newPassword2" autocomplete="new-password" minlength="8" placeholder="••••••••"></label>
        </div>
        <div class="a-form-foot" style="justify-content:flex-start"><button class="a-btn primary" id="changePassword">Mettre à jour le mot de passe</button></div>
      </div>
      <div class="a-card"><h2>Comptes administrateurs</h2>
        <p class="a-sub">Seules les personnes inscrites avec le code d'invitation figurent ici.</p>
        <table class="a-table"><tbody>
        ${admins.length ? admins.map((a) => `<tr><td>${esc(a.email)}</td><td>${a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : ''}</td></tr>`).join('') : '<tr><td>Aucun compte listé</td></tr>'}
        </tbody></table>
      </div>`;
    }
  };

  // --------------------------- Interactions -------------------------------
  const TITLES = {
    dashboard: 'Tableau de bord', messages: 'Demandes de contact', realisations: 'Réalisations',
    actualites: 'Actualités', expertises: 'Expertises', equipe: 'Équipe',
    contenus: 'Textes du site', stats: 'Indicateurs', notifications: 'Notifications e-mail', reglages: 'Réglages'
  };

  async function show(view) {
    $$('.admin-nav button').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
    $('#viewTitle').textContent = TITLES[view] || 'Administration';
    $('#adminLoading').hidden = false;
    $('#adminContent').innerHTML = '';
    try {
      $('#adminContent').innerHTML = await views[view]();
      bindView(view);
      window.GS && window.GS.clearCache && window.GS.clearCache();
    } catch (e) {
      $('#adminContent').innerHTML = `<div class="a-card"><div class="a-empty"><strong>Erreur de chargement</strong>${esc(e.message)}</div></div>`;
    } finally {
      $('#adminLoading').hidden = true;
    }
  }

  function bindView(view) {
    // Navigation interne (cartes du dashboard)
    $$('#adminContent [data-goto]').forEach((b) => b.addEventListener('click', () => show(b.dataset.goto)));

    // ---------- Messages
    $$('#adminContent [data-msg-done]').forEach((b) => b.addEventListener('click', async () => {
      await api('contact_messages?id=eq.' + b.dataset.msgDone, { method: 'PATCH', body: { statut: 'traite' } });
      toast('Message marqué comme traité'); show('messages');
    }));
    $$('#adminContent [data-msg-reopen]').forEach((b) => b.addEventListener('click', async () => {
      await api('contact_messages?id=eq.' + b.dataset.msgReopen, { method: 'PATCH', body: { statut: 'nouveau' } });
      show('messages');
    }));
    $$('#adminContent [data-msg-del]').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm('Supprimer définitivement cette demande ?')) return;
      await api('contact_messages?id=eq.' + b.dataset.msgDel, { method: 'DELETE' });
      toast('Demande supprimée'); show('messages');
    }));

    // ---------- Suppressions génériques
    $$('#adminContent [data-del]').forEach((b) => b.addEventListener('click', async () => {
      const [table, id] = b.dataset.del.split(':');
      if (!confirm('Supprimer définitivement cet élément ?')) return;
      await api(`${table}?id=eq.${id}`, { method: 'DELETE' });
      toast('Élément supprimé'); show(view);
    }));

    // ---------- Bascule publier / masquer
    $$('#adminContent [data-toggle]').forEach((b) => b.addEventListener('click', async () => {
      const [table, id, field] = b.dataset.toggle.split(':');
      let body;
      if (field === 'actif') body = null;
      const isActive = field === 'actif';
      if (isActive) {
        // lire l'état courant depuis le bouton (Masquer => actif true)
        body = { actif: b.textContent.trim() === 'Masquer' ? false : true };
      } else {
        body = { statut: field };
      }
      await api(`${table}?id=eq.${id}`, { method: 'PATCH', body });
      toast('Mise à jour effectuée'); show(view);
    }));

    // ---------- Statistiques
    $$('#adminContent [data-save-stat]').forEach((b) => b.addEventListener('click', async () => {
      const tr = b.closest('[data-stat]');
      await api('stats?id=eq.' + b.dataset.saveStat, {
        method: 'PATCH',
        body: { valeur: $('.stat-v', tr).value, label: $('.stat-l', tr).value, ordre: Number($('.stat-o', tr).value) || 0 }
      });
      toast('Indicateur enregistré');
    }));

    // ---------- Contenus
    const saveContent = $('#saveContent');
    if (saveContent) saveContent.addEventListener('click', async () => {
      const fields = $$('#adminContent [data-content-id]');
      const changed = fields.filter((f) => f.value !== f.dataset.original);
      if (!changed.length) { toast('Aucune modification'); return; }
      saveContent.disabled = true;
      try {
        for (const f of changed) {
          await api('pages_contenu?id=eq.' + f.dataset.contentId, { method: 'PATCH', body: { valeur: f.value }, prefer: 'return=minimal' });
        }
        toast(changed.length + ' texte(s) mis à jour');
        show('contenus');
      } catch (e) { toast(e.message, true); }
      finally { saveContent.disabled = false; }
    });

    // ---------- Réglages
    const saveSettings = $('#saveSettings');
    if (saveSettings) saveSettings.addEventListener('click', async () => {
      saveSettings.disabled = true;
      try {
        for (const input of $$('#adminContent [data-setting]')) {
          const cle = input.dataset.setting;
          await fetch(API + 'site_settings?on_conflict=cle', {
            method: 'POST',
            headers: { apikey: cfg.anonKey, Authorization: 'Bearer ' + admin.access_token, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify({ cle, valeur: input.value })
          });
        }
        toast('Réglages enregistrés');
      } catch (e) { toast(e.message, true); }
      finally { saveSettings.disabled = false; }
    });

    // ---------- Changement de mot de passe
    const changePwd = $('#changePassword');
    if (changePwd) changePwd.addEventListener('click', async () => {
      const a = $('#newPassword').value, b = $('#newPassword2').value;
      if (a.length < 8) { toast('8 caractères minimum', true); return; }
      if (a !== b) { toast('Les deux mots de passe diffèrent', true); return; }
      changePwd.disabled = true;
      try {
        const res = await fetch(cfg.url + '/auth/v1/user', {
          method: 'PUT',
          headers: { apikey: cfg.anonKey, Authorization: 'Bearer ' + admin.access_token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: a })
        });
        if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.msg || j.message || 'Modification refusée'); }
        toast('Mot de passe mis à jour');
        $('#newPassword').value = ''; $('#newPassword2').value = '';
      } catch (e) { toast(e.message, true); }
      finally { changePwd.disabled = false; }
    });

    // ---------- Adresse de réception des notifications
    const saveNotify = $('#saveNotifyEmail');
    if (saveNotify) saveNotify.addEventListener('click', async () => {
      const val = $('#notifyEmail').value.trim();
      if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { toast('Adresse e-mail invalide', true); return; }
      saveNotify.disabled = true;
      try {
        await fetch(API + 'site_settings?on_conflict=cle', {
          method: 'POST',
          headers: { apikey: cfg.anonKey, Authorization: 'Bearer ' + admin.access_token, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify({ cle: 'notify_email', valeur: val })
        });
        toast('Adresse de réception enregistrée');
      } catch (e) { toast(e.message, true); }
      finally { saveNotify.disabled = false; }
    });

    // ---------- Televersement (fiche nouvelle realisation)
    bindUploader();

    // ---------- Formulaires de création
    const forms = {
      formRealisation: { table: 'realisations', map: (f) => ({ ...f, annee: f.annee ? Number(f.annee) : null }) },
      formActualite: { table: 'actualites', map: (f) => f },
      formExpertise: { table: 'expertises', map: (f) => ({ ...f, tags: f.tags ? f.tags.split(',').map((t) => t.trim()).filter(Boolean) : [], ordre: Number(f.ordre) || 0, actif: true }) },
      formEquipe: { table: 'equipe', map: (f) => ({ ...f, ordre: Number(f.ordre) || 0, actif: true }) }
    };
    Object.entries(forms).forEach(([id, conf]) => {
      const form = $('#' + id);
      if (!form) return;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const label = btn.textContent;
        btn.disabled = true;
        const data = Object.fromEntries(new FormData(form).entries());
        // nettoyage des champs vides
        Object.keys(data).forEach((k) => { if (data[k] === '') data[k] = k === 'annee' ? null : data[k]; });
        const isRealisation = conf.table === 'realisations';
        const isEquipe = conf.table === 'equipe';
        try {
          if (isEquipe) {
            if (pickedPortrait) {
              btn.textContent = 'Envoi du portrait…';
              data.photo_url = await uploadSingle('equipe', pickedPortrait.file);
            } else {
              delete data.photo_url;
            }
          }
          if (isRealisation) {
            const photos = picked.slice();
            let url = [];
            if (photos.length) {
              btn.textContent = 'Envoi des photos… 0/' + photos.length;
              const files = photos.map((p) => p.file);
              url = await uploadAll(files, (done, total) => {
                btn.textContent = 'Envoi des photos… ' + done + '/' + total;
              });
              data.image_url = url[0];
              data.galerie = url;
            }
            if (!data.image_url) {
              toast('Ajoutez au moins une photographie : elle est obligatoire pour le catalogue.', true);
              btn.disabled = false; btn.textContent = label;
              return;
            }
            if (!data.galerie) data.galerie = data.image_url ? [data.image_url] : [];
          }
          await api(conf.table, { method: 'POST', body: conf.map(data), prefer: 'return=minimal' });
          toast(isRealisation ? 'Réalisation publiée avec ses photos' : 'Enregistré avec succès');
          if (isRealisation && window.__gsResetPicked) window.__gsResetPicked();
          if (isEquipe && window.__gsResetPortrait) window.__gsResetPortrait();
          show(view);
        } catch (err) {
          toast(err.message, true);
          btn.disabled = false; btn.textContent = label;
        }
      });
    });

    // ---------- Édition en ligne (expertises / équipe)
    $$('#adminContent [data-edit]').forEach((b) => b.addEventListener('click', () => openEdit(b.dataset.edit)));

    // ---------- Portraits de l'equipe (formulaire d'ajout)
    bindPortraitPicker();

    // ---------- Fiches realisations : photos, galerie et presentation
    $$('#adminContent [data-edit-real]').forEach((b) =>
      b.addEventListener('click', () => openRealisation(b.dataset.editReal)));

    // ---------- Membres de l'equipe : portrait et fiche
    $$('#adminContent [data-edit-membre]').forEach((b) =>
      b.addEventListener('click', () => openMembre(b.dataset.editMembre)));

    $$('#adminContent [data-del-real]').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm('Supprimer cette réalisation et toutes ses photos ?')) return;
      try {
        await removeRealisation(b.dataset.delReal);
        toast('Réalisation supprimée');
        show('realisations');
      } catch (e) { toast(e.message, true); }
    }));
  }

  // ------------------- Edition d'une realisation ---------------------------
  async function removeRealisation(id) {
    const rows = await api('realisations?select=galerie,image_url&id=eq.' + id);
    const row = rows[0] || {};
    const files = []
      .concat(row.galerie || [], row.image_url ? [row.image_url] : [])
      .map(storageKeyFromUrl).filter(Boolean);
    if (files.length) {
      try {
        await fetch(cfg.url + '/storage/v1/object/' + BUCKET, {
          method: 'DELETE',
          headers: {
            apikey: cfg.anonKey,
            Authorization: 'Bearer ' + admin.access_token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prefixes: files })
        });
      } catch (e) { /* les fichiers orphelins ne bloquent pas la suppression */ }
    }
    await api('realisations?id=eq.' + id, { method: 'DELETE' });
  }

  // Retrouve le chemin du fichier dans le bucket a partir de son URL publique
  function storageKeyFromUrl(url, bucket) {
    if (!url) return null;
    const b = bucket || BUCKET;
    const marker = '/object/public/' + b + '/';
    const i = url.indexOf(marker);
    return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
  }

  // ------------------- Portrait d'un membre de l'equipe --------------------
  // Fichier choisi dans le formulaire d'ajout (un seul portrait)
  let pickedPortrait = null;

  function bindPortraitPicker() {
    const input = $('#fileEquipe');
    const drop = $('#dropEquipe');
    const box = $('#previewEquipe') || document.createElement('div');
    if (!input || !drop) return;
    if (input.dataset.bound) return;
    input.dataset.bound = '1';

    function paint() {
      box.innerHTML = pickedPortrait ? `
        <figure class="gs-preview">
          <img src="${pickedPortrait.preview}" alt="">
          <figcaption><span class="gs-cover">Portrait</span>
            <button type="button" data-drop-portrait title="Retirer">×</button></figcaption>
        </figure>` : '';
      const btn = box.querySelector('[data-drop-portrait]');
      if (btn) btn.addEventListener('click', () => {
        if (pickedPortrait) URL.revokeObjectURL(pickedPortrait.preview);
        pickedPortrait = null; paint();
      });
    }

    function add(file) {
      if (!file) return;
      if (!/^image\//.test(file.type)) { toast('Ce fichier n\u2019est pas une image', true); return; }
      if (file.size > MAX_INPUT) { toast('« ' + file.name + ' » dépasse 25 Mo', true); return; }
      if (pickedPortrait) URL.revokeObjectURL(pickedPortrait.preview);
      pickedPortrait = { file, preview: URL.createObjectURL(file) };
      paint();
    }

    input.addEventListener('change', () => { add(input.files && input.files[0]); input.value = ''; });
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', (e) => { if (e.dataTransfer && e.dataTransfer.files[0]) add(e.dataTransfer.files[0]); });

    window.__gsResetPortrait = () => {
      if (pickedPortrait) URL.revokeObjectURL(pickedPortrait.preview);
      pickedPortrait = null; paint();
    };
  }

  // Modale d'edition d'un membre : portrait (ajout / remplacement) + fiche
  async function openMembre(id) {
    const rows = await api('equipe?select=*&id=eq.' + id);
    const row = rows[0];
    if (!row) return;
    let nouveau = null;
    const actuel = row.photo_url || '';

    const modal = document.createElement('div');
    modal.className = 'article-modal open';
    modal.style.display = 'flex';
    modal.innerHTML = `<div class="article-modal__panel" style="max-width:680px;background:#fff;padding:26px;border-radius:18px;max-height:90vh;overflow:auto">
      <h2 style="margin-bottom:6px">Portrait et présentation</h2>
      <p class="a-sub" style="margin-bottom:16px">Remplacez la photo officielle ou modifiez la fiche du membre.</p>

      <div class="gs-portrait-edit">
        <div class="gs-portrait-slot" id="portraitActuel"></div>
        <div style="flex:1">
          <label class="gs-upload" id="dropPortraitEdit">
            <input type="file" id="portraitEdit" accept="image/*" hidden>
            <span class="gs-upload__icon" aria-hidden="true">🖼️</span>
            <strong>Choisir une nouvelle photo</strong>
            <small>Depuis la galerie de l'appareil · le portrait actuel sera remplacé à l'enregistrement</small>
          </label>
          <button type="button" class="a-btn danger" id="retirerPortrait" style="margin-top:10px"${actuel ? '' : ' hidden'}>Retirer la photo</button>
        </div>
      </div>

      <div class="a-form" style="margin-top:20px;grid-template-columns:1fr 1fr">
        <label class="full">Nom complet<input data-membre="nom" value="${esc(row.nom || '')}"></label>
        <label>Fonction<input data-membre="fonction" value="${esc(row.fonction || '')}"></label>
        <label>Initiales<input data-membre="initiales" maxlength="3" value="${esc(row.initiales || '')}"></label>
        <label>Ordre<input data-membre="ordre" type="number" value="${esc(row.ordre == null ? 0 : row.ordre)}"></label>
        <label>État
          <select data-membre="actif">
            <option value="true"${row.actif ? ' selected' : ''}>Actif (visible)</option>
            <option value="false"${!row.actif ? ' selected' : ''}>Masqué</option>
          </select>
        </label>
        <label class="full">Biographie<textarea data-membre="bio">${esc(row.bio || '')}</textarea></label>
      </div>

      <div class="a-form-foot" style="margin-top:20px">
        <button class="a-btn" data-cancel>Fermer</button>
        <button class="a-btn primary" data-save>Enregistrer</button>
      </div>
    </div>`;
    document.body.appendChild(modal);

    const slot = modal.querySelector('#portraitActuel');
    const retirer = modal.querySelector('#retirerPortrait');
    let supprimerActuel = false;

    function paintSlot() {
      if (nouveau) {
        slot.innerHTML = `<img src="${nouveau.preview}" alt=""><span class="gs-portrait-tag">Nouveau</span>`;
        retirer.hidden = false;
        retirer.textContent = 'Annuler le changement';
        return;
      }
      if (actuel && !supprimerActuel) {
        slot.innerHTML = `<img src="${esc(actuel)}" alt=""><span class="gs-portrait-tag">Actuel</span>`;
      } else {
        slot.innerHTML = `<span class="a-avatar a-avatar--init a-avatar--big">${esc(row.initiales || (row.nom || '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase())}</span>`;
      }
      retirer.textContent = 'Retirer la photo';
      retirer.hidden = !actuel || supprimerActuel;
    }
    paintSlot();

    const input = modal.querySelector('#portraitEdit');
    const zone = modal.querySelector('#dropPortraitEdit');
    input.addEventListener('change', () => {
      const f = input.files && input.files[0];
      if (!f) return;
      if (!/^image\//.test(f.type)) { toast('Ce fichier n\u2019est pas une image', true); return; }
      if (f.size > MAX_INPUT) { toast('« ' + f.name + ' » dépasse 25 Mo', true); return; }
      if (nouveau) URL.revokeObjectURL(nouveau.preview);
      nouveau = { file: f, preview: URL.createObjectURL(f) };
      supprimerActuel = false;
      input.value = '';
      paintSlot();
    });
    ['dragenter', 'dragover'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove('over'); }));
    zone.addEventListener('drop', (e) => {
      const f = e.dataTransfer && e.dataTransfer.files[0];
      if (!f) return;
      if (!/^image\//.test(f.type) || f.size > MAX_INPUT) { toast('Image refusée (format ou taille)', true); return; }
      if (nouveau) URL.revokeObjectURL(nouveau.preview);
      nouveau = { file: f, preview: URL.createObjectURL(f) };
      supprimerActuel = false;
      paintSlot();
    });

    retirer.addEventListener('click', () => {
      if (nouveau) { URL.revokeObjectURL(nouveau.preview); nouveau = null; paintSlot(); return; }
      supprimerActuel = true;
      paintSlot();
    });

    modal.querySelector('[data-cancel]').onclick = () => modal.remove();
    modal.querySelector('[data-save]').onclick = async () => {
      const save = modal.querySelector('[data-save]');
      const label = save.textContent;
      save.disabled = true;
      try {
        const body = {};
        modal.querySelectorAll('[data-membre]').forEach((f) => {
          const k = f.dataset.membre;
          if (k === 'ordre') body[k] = f.value ? Number(f.value) : 0;
          else if (k === 'actif') body[k] = f.value === 'true';
          else body[k] = f.value;
        });

        if (nouveau) {
          save.textContent = 'Envoi du portrait…';
          const url = await uploadSingle('equipe', nouveau.file);
          body.photo_url = url;
          // L'ancien fichier est retire du stockage pour ne pas accumuler d'orphelins
          const ancienne = storageKeyFromUrl(actuel, 'equipe');
          if (ancienne) {
            try {
              await fetch(cfg.url + '/storage/v1/object/equipe', {
                method: 'DELETE',
                headers: { apikey: cfg.anonKey, Authorization: 'Bearer ' + admin.access_token, 'Content-Type': 'application/json' },
                body: JSON.stringify({ prefixes: [ancienne] })
              });
            } catch (e) { /* sans consequence sur la fiche */ }
          }
          URL.revokeObjectURL(nouveau.preview);
        } else if (supprimerActuel) {
          body.photo_url = null;
          const ancienne = storageKeyFromUrl(actuel, 'equipe');
          if (ancienne) {
            try {
              await fetch(cfg.url + '/storage/v1/object/equipe', {
                method: 'DELETE',
                headers: { apikey: cfg.anonKey, Authorization: 'Bearer ' + admin.access_token, 'Content-Type': 'application/json' },
                body: JSON.stringify({ prefixes: [ancienne] })
              });
            } catch (e) { /* sans consequence */ }
          }
        }

        await api('equipe?id=eq.' + id, { method: 'PATCH', body, prefer: 'return=minimal' });
        modal.remove();
        toast(nouveau ? 'Portrait mis à jour' : 'Fiche enregistrée');
        show('equipe');
      } catch (e) {
        toast(e.message, true);
        save.disabled = false; save.textContent = label;
      }
    };
  }

  async function openRealisation(id) {
    const rows = await api('realisations?select=*&id=eq.' + id);
    const row = rows[0];
    if (!row) return;
    let galerie = Array.isArray(row.galerie) ? row.galerie.slice() : (row.image_url ? [row.image_url] : []);
    let nouveau = [];

    const modal = document.createElement('div');
    modal.className = 'article-modal open';
    modal.style.display = 'flex';
    modal.innerHTML = `<div class="article-modal__panel" style="max-width:760px;background:#fff;padding:26px;border-radius:18px;max-height:90vh;overflow:auto">
      <h2 style="margin-bottom:6px">Photos et présentation</h2>
      <p class="a-sub" style="margin-bottom:16px">Ajoutez, retirez ou réordonnez les photographies de ce projet. La première sert de couverture dans le catalogue public.</p>

      <div class="gs-gallery-edit" id="editGallery"></div>
      <label class="gs-upload" id="addToGallery" style="margin-top:14px">
        <input type="file" id="addGalleryFiles" accept="image/*" multiple hidden>
        <span class="gs-upload__icon" aria-hidden="true">＋</span>
        <strong>Ajouter des photos</strong>
        <small>Depuis la galerie de l'appareil · JPG, PNG, WEBP, AVIF</small>
      </label>

      <div class="a-form" style="margin-top:20px;grid-template-columns:1fr 1fr">
        <label class="full">Titre<input data-real="titre" value="${esc(row.titre || '')}"></label>
        <label>Catégorie
          <select data-real="categorie">
            ${[['batiments','Bâtiments'],['hydraulique','Hydraulique'],['forages','Forages'],['aeps',"Adduction d'eau potable"],['amenagements','Aménagements'],['solaire','Énergie solaire'],['genie-civil','Génie civil'],['metal','Construction métallique']]
              .map(([v, l]) => `<option value="${v}"${row.categorie === v ? ' selected' : ''}>${l}</option>`).join('')}
          </select>
        </label>
        <label>Localisation<input data-real="localisation" value="${esc(row.localisation || '')}"></label>
        <label>Année<input data-real="annee" type="number" min="2000" max="2100" value="${esc(row.annee || '')}"></label>
        <label>Statut
          <select data-real="statut">
            <option value="publie"${row.statut === 'publie' ? ' selected' : ''}>Publié (visible)</option>
            <option value="brouillon"${row.statut !== 'publie' ? ' selected' : ''}>Brouillon (masqué)</option>
          </select>
        </label>
        <label class="full">Description<textarea data-real="description">${esc(row.description || '')}</textarea></label>
      </div>

      <div class="a-form-foot" style="margin-top:20px">
        <button class="a-btn" data-cancel>Fermer</button>
        <button class="a-btn primary" data-save>Enregistrer</button>
      </div>
    </div>`;
    document.body.appendChild(modal);

    const galleryBox = modal.querySelector('#editGallery');

    function paintGallery() {
      if (!galerie.length && !nouveau.length) {
        galleryBox.innerHTML = '<p class="a-sub">Aucune photo. Ajoutez-en au moins une.</p>';
        return;
      }
      galleryBox.innerHTML =
        galerie.map((u, i) => `
          <figure class="gs-photo">
            <img src="${esc(u)}" alt="">
            <figcaption>
              ${i === 0 ? '<span class="gs-cover">Couverture</span>' : `<button type="button" data-make-cover="${i}" title="Mettre en couverture">★</button>`}
              <button type="button" data-remove="${i}" title="Retirer">×</button>
            </figcaption>
          </figure>`).join('') +
        nouveau.map((p, i) => `
          <figure class="gs-photo pending">
            <img src="${p.preview}" alt="">
            <figcaption><span class="gs-cover">À envoyer</span><button type="button" data-drop-new="${i}" title="Annuler">×</button></figcaption>
          </figure>`).join('');

      galleryBox.querySelectorAll('[data-remove]').forEach((b) => b.addEventListener('click', () => {
        galerie.splice(Number(b.dataset.remove), 1); paintGallery();
      }));
      galleryBox.querySelectorAll('[data-make-cover]').forEach((b) => b.addEventListener('click', () => {
        const i = Number(b.dataset.makeCover);
        galerie.unshift(galerie.splice(i, 1)[0]); paintGallery();
      }));
      galleryBox.querySelectorAll('[data-drop-new]').forEach((b) => b.addEventListener('click', () => {
        const i = Number(b.dataset.dropNew);
        URL.revokeObjectURL(nouveau[i].preview);
        nouveau.splice(i, 1); paintGallery();
      }));
    }
    paintGallery();

    const addInput = modal.querySelector('#addGalleryFiles');
    const addZone = modal.querySelector('#addToGallery');
    addInput.addEventListener('change', () => {
      Array.from(addInput.files).forEach((file) => {
        if (!/^image\//.test(file.type)) { toast('Fichier ignoré : ' + file.name, true); return; }
        if (file.size > MAX_INPUT) { toast('« ' + file.name + ' » dépasse 25 Mo', true); return; }
        nouveau.push({ file, preview: URL.createObjectURL(file) });
      });
      addInput.value = '';
      paintGallery();
    });
    ['dragenter', 'dragover'].forEach((ev) => addZone.addEventListener(ev, (e) => { e.preventDefault(); addZone.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((ev) => addZone.addEventListener(ev, (e) => { e.preventDefault(); addZone.classList.remove('over'); }));
    addZone.addEventListener('drop', (e) => {
      if (!e.dataTransfer || !e.dataTransfer.files) return;
      Array.from(e.dataTransfer.files).forEach((file) => {
        if (/^image\//.test(file.type) && file.size <= MAX_INPUT) {
          nouveau.push({ file, preview: URL.createObjectURL(file) });
        }
      });
      paintGallery();
    });

    modal.querySelector('[data-cancel]').onclick = () => modal.remove();
    modal.querySelector('[data-save]').onclick = async () => {
      const save = modal.querySelector('[data-save]');
      const label = save.textContent;
      save.disabled = true;
      try {
        if (nouveau.length) {
          save.textContent = 'Envoi des photos… 0/' + nouveau.length;
          const urls = await uploadAll(nouveau.map((p) => p.file), (done, total) => {
            save.textContent = 'Envoi des photos… ' + done + '/' + total;
          });
          galerie = galerie.concat(urls);
          nouveau.forEach((p) => URL.revokeObjectURL(p.preview));
          nouveau = [];
          paintGallery();
        }
        const body = { galerie };
        modal.querySelectorAll('[data-real]').forEach((f) => {
          const k = f.dataset.real;
          body[k] = k === 'annee' ? (f.value ? Number(f.value) : null) : f.value;
        });
        body.image_url = galerie[0] || null;
        await api('realisations?id=eq.' + id, { method: 'PATCH', body, prefer: 'return=minimal' });
        modal.remove();
        toast('Fiche et photos enregistrées');
        show('realisations');
      } catch (e) {
        toast(e.message, true);
        save.disabled = false; save.textContent = label;
      }
    };
  }

  async function openEdit(compound) {
    const [table, id] = compound.split(':');
    const rows = await api(`${table}?select=*&id=eq.${id}`);
    const row = rows[0];
    if (!row) return;
    const labels = {
      titre: 'Titre', slug: 'Ancre', description: 'Description', tags: 'Mots-clés (virgules)',
      secteurs: 'Secteurs', image_url: 'Image (URL)', ordre: 'Ordre',
      nom: 'Nom', fonction: 'Fonction', initiales: 'Initiales', bio: 'Biographie'
    };
    const modal = document.createElement('div');
    modal.className = 'article-modal open';
    modal.style.display = 'flex';
    modal.innerHTML = `<div class="article-modal__panel" style="max-width:620px;background:#fff;padding:26px;border-radius:18px;max-height:88vh;overflow:auto">
      <h2 style="margin-bottom:16px">Modifier</h2>
      <div class="a-form">
      ${Object.keys(labels).filter((k) => k in row).map((k) => `
        <label class="${['description', 'bio', 'titre', 'nom', 'image_url', 'photo_url'].includes(k) ? 'full' : ''}">${labels[k]}
        ${['description', 'bio'].includes(k)
          ? `<textarea data-edit-field="${k}">${esc(row[k] || '')}</textarea>`
          : `<input data-edit-field="${k}" value="${esc(k === 'tags' && Array.isArray(row[k]) ? row[k].join(', ') : (row[k] || ''))}">`}
        </label>`).join('')}
      </div>
      <div class="a-form-foot" style="margin-top:18px">
        <button class="a-btn" data-cancel>Annuler</button>
        <button class="a-btn primary" data-save>Enregistrer</button>
      </div></div>`;
    document.body.appendChild(modal);
    modal.querySelector('[data-cancel]').onclick = () => modal.remove();
    modal.querySelector('[data-save]').onclick = async () => {
      const body = {};
      modal.querySelectorAll('[data-edit-field]').forEach((f) => {
        const k = f.dataset.editField;
        let v = f.value;
        if (k === 'tags') v = v ? v.split(',').map((t) => t.trim()).filter(Boolean) : [];
        if (k === 'ordre') v = Number(v) || 0;
        body[k] = v;
      });
      try {
        await api(`${table}?id=eq.${id}`, { method: 'PATCH', body, prefer: 'return=minimal' });
        modal.remove(); toast('Modifications enregistrées');
        show(table === 'expertises' ? 'expertises' : 'equipe');
      } catch (e) { toast(e.message, true); }
    };
  }

  // ------------------------------ Démarrage -------------------------------
  async function enterAdmin() {
    $('#authView').hidden = true;
    $('#authView').style.display = 'none';
    $('#adminView').hidden = false;
    $('#adminEmail').textContent = admin.email || '';
    show('dashboard');
    // Badge des nouvelles demandes
    try {
      const rows = await api('contact_messages?select=id&statut=eq.nouveau');
      if (rows.length) { const b = $('#msgBadge'); b.textContent = rows.length; b.hidden = false; }
    } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!cfg.url) {
      document.body.innerHTML = '<p style="padding:40px;font-family:sans-serif">Configuration Supabase manquante (js/supabase-config.js).</p>';
      return;
    }

    // Onglets connexion / inscription
    $$('.auth-tab').forEach((tab) => tab.addEventListener('click', () => {
      $$('.auth-tab').forEach((t) => t.classList.toggle('active', t === tab));
      $('#loginForm').hidden = tab.dataset.tab !== 'login';
      $('#signupForm').hidden = tab.dataset.tab !== 'signup';
    }));

    // Connexion
    $('#loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = $('#loginMsg');
      msg.className = 'auth-msg'; msg.textContent = 'Connexion…';
      try {
        const session = await login($('#loginEmail').value.trim(), $('#loginPassword').value);
        saveSession(session);
        msg.textContent = '';
        enterAdmin();
      } catch (err) {
        msg.className = 'auth-msg error';
        msg.textContent = err.message;
      }
    });

    // Inscription
    $('#signupForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = $('#signupMsg');
      msg.className = 'auth-msg'; msg.textContent = 'Création du compte…';
      try {
        await signup($('#signupEmail').value.trim(), $('#signupPassword').value, $('#signupCode').value.trim());
        msg.className = 'auth-msg success';
        msg.textContent = 'Compte créé. Connectez-vous avec vos identifiants.';
        setTimeout(() => { $$('.auth-tab')[0].click(); $('#loginEmail').value = $('#signupEmail').value; }, 1200);
      } catch (err) {
        msg.className = 'auth-msg error';
        msg.textContent = err.message;
      }
    });

    // Navigation
    $$('.admin-nav button').forEach((b) => b.addEventListener('click', () => show(b.dataset.view)));
    $('#logoutBtn').addEventListener('click', logout);

    // Reprise de session
    admin = loadSession();
    if (admin) { enterAdmin(); }
  });
})();
