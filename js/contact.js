// GLOBAL SOLUTIONS — contact.js (validation + envoi Supabase avec fallback mailto)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const msg = document.getElementById('formMsg');
  const showMsg = (text, type) => { if (msg) { msg.textContent = text; msg.className = 'form-msg ' + type; } };

  const validate = () => {
    let ok = true;
    const checks = [
      { id: 'nom', test: v => v.trim().length >= 2, err: 'Veuillez saisir votre nom et prénom.' },
      { id: 'email', test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), err: 'Adresse e-mail invalide.' },
      { id: 'telephone', test: v => v.trim().length >= 6, err: 'Numéro de téléphone requis.' },
      { id: 'domaine', test: v => v !== '', err: 'Veuillez choisir un domaine.' },
      { id: 'objet', test: v => v.trim().length >= 3, err: 'Objet requis.' },
      { id: 'message', test: v => v.trim().length >= 10, err: 'Décrivez votre besoin (10 caractères minimum).' }
    ];
    checks.forEach(c => {
      const input = document.getElementById(c.id);
      const field = input.closest('.field');
      const valid = c.test(input.value);
      field.classList.toggle('invalid', !valid);
      if (!valid) ok = false;
    });
    return ok;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) { showMsg('Veuillez corriger les champs indiqués en rouge.', 'error'); return; }
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.disabled = true; btn.textContent = 'Envoi en cours…';
    const payload = {
      nom: document.getElementById('nom').value.trim(),
      email: document.getElementById('email').value.trim(),
      telephone: document.getElementById('telephone').value.trim(),
      entreprise: document.getElementById('entreprise').value.trim(),
      domaine: document.getElementById('domaine').value,
      objet: document.getElementById('objet').value.trim(),
      message: document.getElementById('message').value.trim()
    };
    try {
      const cfg = window.GS_SUPABASE;
      if (!cfg || !cfg.url) throw new Error('Supabase non configuré');
      const res = await fetch(`${cfg.url}/rest/v1/contact_messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}`, Prefer: 'return=minimal' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Envoi impossible');
      showMsg('Merci ! Votre demande a bien été transmise à GLOBAL SOLUTIONS. Notre équipe vous recontactera rapidement.', 'success');
      form.reset();
    } catch (err) {
      // Fallback : ouverture mailto (ne simule pas un envoi serveur)
      const subject = encodeURIComponent(`[Site GS] ${payload.objet}`);
      const body = encodeURIComponent(`Nom : ${payload.nom}\nE-mail : ${payload.email}\nTéléphone : ${payload.telephone}\nEntreprise : ${payload.entreprise}\nDomaine : ${payload.domaine}\n\n${payload.message}`);
      showMsg('Le service d\'envoi est momentanément indisponible. Votre messagerie va s\'ouvrir pour envoyer votre demande à info@globalsolutions.one.', 'error');
      window.location.href = `mailto:info@globalsolutions.one?subject=${subject}&body=${body}`;
    } finally {
      btn.disabled = false; btn.textContent = original;
    }
  });
  // Validation en temps réel
  form.querySelectorAll('input,select,textarea').forEach(el => {
    el.addEventListener('blur', () => el.closest('.field')?.classList.remove('invalid'));
  });
});
