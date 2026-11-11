/* E-post ut fra nettsiden (via Resend – https://resend.com).
   Krever hemmeligheten RESEND_API_KEY og variabelen MAIL_FROM (avsender på et verifisert domene).
   Mangler oppsettet, sendes ingenting – og admin viser tydelig at e-posten ikke gikk. */

const escHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[c]);

/** Enkel, pen HTML-versjon av en ren tekst (avsnitt og linjeskift beholdes). */
function toHtml(text) {
  const body = escHtml(text).split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px">${p.replace(/\n/g, "<br>")}</p>`).join("");
  return `<!doctype html><html lang="nb"><body style="margin:0;background:#fcf7f1;padding:24px 12px;font:16px/1.55 Georgia,serif;color:#2b1b1a">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #ecdccd;border-radius:14px;padding:28px 26px">
<div style="font:italic 26px Georgia,serif;color:#b5121b;margin-bottom:18px">Fjellhamar Bistro</div>${body}</div></body></html>`;
}

/** Sender én e-post. Returnerer { ok: true } eller { ok: false, error }. Kaster aldri. */
export async function sendMail(env, { to, subject, text, replyTo }) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return { ok: false, error: "E-post er ikke satt opp ennå" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: "Bearer " + env.RESEND_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({ from: env.MAIL_FROM, to: [to], subject, text, html: toHtml(text), ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    if (res.ok) return { ok: true };
    const data = await res.json().catch(() => ({}));
    console.error("Resend-feil", res.status, data);
    return { ok: false, error: "E-posttjenesten svarte med feil (" + res.status + (data.message ? ": " + data.message : "") + ")" };
  } catch (e) {
    console.error("E-post feilet", e);
    return { ok: false, error: "Fikk ikke kontakt med e-posttjenesten" };
  }
}
