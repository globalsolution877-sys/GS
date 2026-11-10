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
    realisations: async () => {
      const rows = await api('realisations?select=*&order=created_at.desc');
      return `
      <div class="a-card">
        <h2>Nouvelle réalisation</h2>
        <p class="a-sub">Publiez un projet réel avec sa photographie. N'inventez pas de références.</p>
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
          <label class="full">URL de la photographie<input name="image_url" type="url" placeholder="https://…"><small>Hébergez l'image sur Supabase Storage, Cloudinary ou tout autre hébergeur et collez le lien.</small></label>
          <label>Statut
            <select name="statut"><option value="publie">Publié (visible)</option><option value="brouillon">Brouillon (masqué)</option></select>
          </label>
          <div class="a-form-foot"><button type="submit" class="a-btn primary">Enregistrer</button></div>
        </form>
      </div>
      <div class="a-card">
        <h2>Réalisations existantes (${rows.length})</h2>
        ${rows.length ? `<table class="a-table"><thead><tr><th></th><th>Titre</th><th>Catégorie</th><th>Année</th><th>Statut</th><th></th></tr></thead><tbody>
        ${rows.map((r) => `<tr>
          <td><img src="${esc(r.image_url || IMG_FALLBACK)}" alt=""></td>
          <td><strong>${esc(r.titre)}</strong><br><small style="color:var(--grey-mid)">${esc(r.localisation || '')}</small></td>
          <td>${esc(r.categorie || '')}</td><td>${esc(r.annee || '')}</td>
          <td><span class="a-badge ${r.statut === 'publie' ? 'pub' : ''}">${esc(r.statut || 'brouillon')}</span></td>
          <td><div class="a-actions">
            <button class="a-btn" data-toggle="realisations:${r.id}:${r.statut === 'publie' ? 'brouillon' : 'publie'}">${r.statut === 'publie' ? 'Dépublier' : 'Publier'}</button>
            <button class="a-btn danger" data-del="realisations:${r.id}">Supprimer</button>
          </div></td></tr>`).join('')}
        </tbody></table>` : `<div class="a-empty"><strong>Aucune réalisation publiée</strong>Le site affiche pour l'instant les emplacements « À compléter ».</div>`}
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
      return `
      <div class="a-card"><h2>Ajouter un membre</h2>
        <p class="a-sub">Les initiales servent d'avatar tant qu'aucune photo officielle n'est fournie.</p>
        <form class="a-form" id="formEquipe">
          <label>Nom complet<input name="nom" required></label>
          <label>Fonction<input name="fonction" placeholder="Directeur Technique"></label>
          <label>Initiales<input name="initiales" maxlength="3" placeholder="MB"></label>
          <label>Ordre<input name="ordre" type="number" value="${rows.length + 1}"></label>
          <label class="full">Biographie<textarea name="bio"></textarea></label>
          <label class="full">Photo officielle (URL, optionnel)<input name="photo_url" type="url"><small>Laissez vide pour conserver l'avatar avec initiales.</small></label>
          <div class="a-form-foot"><button class="a-btn primary">Enregistrer</button></div>
        </form>
      </div>
      <div class="a-card"><h2>L'équipe (${rows.length})</h2>
        <table class="a-table"><thead><tr><th>Nom</th><th>Fonction</th><th>État</th><th></th></tr></thead><tbody>
        ${rows.map((m) => `<tr><td><strong>${esc(m.nom)}</strong></td><td>${esc(m.fonction || '')}</td>
          <td><span class="a-badge ${m.actif ? 'pub' : ''}">${m.actif ? 'active' : 'masqué'}</span></td>
          <td><div class="a-actions"><button class="a-btn" data-edit="equipe:${m.id}">Modifier</button>
          <button class="a-btn" data-toggle="equipe:${m.id}:actif">${m.actif ? 'Masquer' : 'Afficher'}</button></div></td></tr>`).join('')}
        </tbody></table>
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
        btn.disabled = true;
        const data = Object.fromEntries(new FormData(form).entries());
        // nettoyage des champs vides
        Object.keys(data).forEach((k) => { if (data[k] === '') data[k] = k === 'annee' ? null : data[k]; });
        try {
          await api(conf.table, { method: 'POST', body: conf.map(data), prefer: 'return=minimal' });
          toast('Enregistré avec succès');
          show(view);
        } catch (err) {
          toast(err.message, true);
          btn.disabled = false;
        }
      });
    });

    // ---------- Édition en ligne (expertises / équipe)
    $$('#adminContent [data-edit]').forEach((b) => b.addEventListener('click', () => openEdit(b.dataset.edit)));
  }

  async function openEdit(compound) {
    const [table, id] = compound.split(':');
    const rows = await api(`${table}?select=*&id=eq.${id}`);
    const row = rows[0];
    if (!row) return;
    const labels = {
      titre: 'Titre', slug: 'Ancre', description: 'Description', tags: 'Mots-clés (virgules)',
      secteurs: 'Secteurs', image_url: 'Image (URL)', ordre: 'Ordre',
      nom: 'Nom', fonction: 'Fonction', initiales: 'Initiales', bio: 'Biographie', photo_url: 'Photo (URL)'
    };
    const modal = document.createElement('div');
    modal.className = 'article-modal open';
    modal.style.display = 'flex';
    modal.innerHTML = `<div class="article-modal__panel" style="max-width:620px;background:#fff;padding:26px;border-radius:18px;max-height:88vh;overflow:auto">
      <h2 style="margin-bottom:16px">Modifier</h2>
      <div class="a-form">
      ${Object.keys(labels).filter((k) => k in row).map((k) => `
        <label class="${['description', 'bio', 'titre', 'nom', 'image_url', 'photo_url'].includes(k) ? 'full' : ''}">${labels[k]}
        ${['description', 'bio', 'bio'].includes(k)
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
