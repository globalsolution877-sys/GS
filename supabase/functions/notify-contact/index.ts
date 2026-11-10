// GLOBAL SOLUTIONS — Edge Function notify-contact
// Envoie un e-mail à l'entreprise à chaque nouvelle demande de contact.
// Appelée par le trigger Postgres (pg_net) après insertion dans contact_messages.
// Fournisseurs : Resend (prioritaire) ou Brevo. Aucune clé secrète côté client.
//
// Secrets à définir dans Supabase → Edge Functions → Secrets :
//   RESEND_API_KEY  (ou BREVO_API_KEY)
//   MAIL_TO         adresse de réception        (défaut : info@globalsolutions.one)
//   MAIL_FROM       expéditeur vérifié          (défaut : GLOBAL SOLUTIONS <onboarding@resend.dev>)

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const BREVO_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const FROM = Deno.env.get("MAIL_FROM") ?? "GLOBAL SOLUTIONS <onboarding@resend.dev>";
const DEFAULT_TO = Deno.env.get("MAIL_TO") ?? "info@globalsolutions.one";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildHtml(m: Record<string, unknown>, destinataire: string): string {
  const row = (label: string, value: unknown) =>
    value
      ? `<tr><td style="padding:8px 14px;border-bottom:1px solid #E9EFF3;color:#5C5C5C;font-size:13px;width:150px">${label}</td><td style="padding:8px 14px;border-bottom:1px solid #E9EFF3;color:#1B1B1B;font-size:14px;font-weight:600">${esc(value)}</td></tr>`
      : "";
  const date = new Date().toLocaleString("fr-FR", { timeZone: "Africa/Niamey" });

  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;background:#F3FBFF;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:26px 12px"><tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:14px;overflow:hidden;border:1px solid #D7D7D7">
      <tr><td style="background:#04293B;padding:22px 26px">
        <div style="color:#52C6F9;font-size:19px;font-weight:bold;letter-spacing:.5px">GLOBAL SOLUTIONS</div>
        <div style="color:#D7D7D7;font-size:12px;margin-top:4px">Nouvelle demande reçue depuis le site</div>
      </td></tr>
      <tr><td style="padding:22px 26px 6px">
        <h1 style="margin:0 0 4px;font-size:18px;color:#04293B">${esc(m.objet) || "Demande de contact"}</h1>
        <p style="margin:0;color:#5C5C5C;font-size:13px">Reçue le ${date} (heure de Niamey)</p>
      </td></tr>
      <tr><td style="padding:14px 12px"><table width="100%" cellpadding="0" cellspacing="0">
        ${row("Nom", m.nom)}${row("E-mail", m.email)}${row("Téléphone", m.telephone)}
        ${row("Entreprise", m.entreprise)}${row("Domaine", m.domaine)}
      </table></td></tr>
      <tr><td style="padding:6px 26px 22px">
        <div style="background:#F3FBFF;border-left:4px solid #52C6F9;border-radius:6px;padding:14px 16px;color:#1B1B1B;font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(m.message)}</div>
        <p style="margin:18px 0 0"><a href="mailto:${esc(m.email)}" style="background:#52C6F9;color:#04293B;text-decoration:none;font-weight:bold;font-size:14px;padding:11px 20px;border-radius:999px;display:inline-block">Répondre à ${esc(m.nom)}</a></p>
      </td></tr>
      <tr><td style="background:#F3FBFF;padding:14px 26px;color:#7E7E7E;font-size:11.5px">
        Notifications envoyées à ${esc(destinataire)} — gérez-les depuis /admin.html
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

async function sendResend(to: string, subject: string, html: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  return { ok: r.ok, provider: "resend", detail: (await r.text()).slice(0, 500) };
}

async function sendBrevo(to: string, subject: string, html: string) {
  const m = FROM.match(/<(.+)>/);
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { email: m ? m[1] : FROM, name: "GLOBAL SOLUTIONS" },
      to: [{ email: to }], subject, htmlContent: html,
    }),
  });
  return { ok: r.ok, provider: "brevo", detail: (await r.text()).slice(0, 500) };
}

async function log(payload: Record<string, unknown>) {
  if (!SUPABASE_URL || !SERVICE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json", Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });
  } catch { /* journalisation best-effort */ }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
      status: 405, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  let body: { record?: Record<string, unknown> } = {};
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "JSON invalide" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const m = body.record ?? {};
  if (!m.id || !m.email) {
    return new Response(JSON.stringify({ error: "Enregistrement incomplet" }), {
      status: 400, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  let destinataire = DEFAULT_TO;
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/site_settings?select=valeur&cle=eq.notify_email`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
    );
    const rows = await r.json();
    if (Array.isArray(rows) && rows[0]?.valeur) destinataire = rows[0].valeur;
  } catch { /* garde la valeur par défaut */ }

  const sujet = `[Site] ${m.objet || "Nouvelle demande"} — ${m.nom || "Visiteur"}`;
  const html = buildHtml(m, destinataire);

  if (!RESEND_KEY && !BREVO_KEY) {
    await log({
      message_id: m.id, destinataire, sujet, provider: null, statut: "non_configure",
      detail: "Aucune clé API e-mail configurée (RESEND_API_KEY ou BREVO_API_KEY).",
    });
    return new Response(JSON.stringify({ ok: false, reason: "no_provider", destinataire }), {
      status: 200, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  let result = { ok: false, provider: "", detail: "" };
  try {
    result = RESEND_KEY ? await sendResend(destinataire, sujet, html)
                        : await sendBrevo(destinataire, sujet, html);
  } catch (e) {
    result = { ok: false, provider: RESEND_KEY ? "resend" : "brevo", detail: String(e) };
  }

  await log({
    message_id: m.id, destinataire, sujet, provider: result.provider,
    statut: result.ok ? "envoye" : "echec", detail: result.detail,
  });

  return new Response(JSON.stringify({ ok: result.ok, provider: result.provider }), {
    status: 200, headers: { ...cors, "Content-Type": "application/json" },
  });
});
