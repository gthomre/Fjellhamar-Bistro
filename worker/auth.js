/* Innlogging til admin via Cloudflare Access.
   Access står foran /admin og /api/admin og sender en signert billett (JWT). Vi sjekker signaturen selv,
   så admin er låst selv om Access skulle bli slått av ved en feil. Mangler oppsettet, er admin stengt. */

let certCache = { url: "", at: 0, keys: [] };

const b64urlToBytes = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), (c) => c.charCodeAt(0));
const b64urlJson = (s) => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));

async function getKeys(team) {
  const url = `https://${team}/cdn-cgi/access/certs`;
  if (certCache.url === url && Date.now() - certCache.at < 3600_000) return certCache.keys;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Kunne ikke hente Access-nøkler");
  const { keys } = await res.json();
  certCache = { url, at: Date.now(), keys };
  return keys;
}

function readToken(request) {
  const h = request.headers.get("Cf-Access-Jwt-Assertion");
  if (h) return h;
  const m = (request.headers.get("Cookie") || "").match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  return m ? m[1] : "";
}

/** Returnerer { email } for innlogget bruker, { error, status } ellers. */
export async function authenticate(request, env) {
  if (env.DEV_NO_AUTH === "1") return { email: "utvikler@lokal" }; // kun lokal testing (wrangler dev)

  const team = (env.ACCESS_TEAM_DOMAIN || "").trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const auds = (env.ACCESS_AUD || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!team || !auds.length) return { status: 503, error: "Admin er ikke ferdig satt opp ennå (innlogging mangler)." };

  const token = readToken(request);
  if (!token) return { status: 401, error: "Du er ikke logget inn." };
  try {
    const [h64, p64, s64] = token.split(".");
    const header = b64urlJson(h64), payload = b64urlJson(p64);
    const jwk = (await getKeys(team)).find((k) => k.kid === header.kid);
    if (!jwk || header.alg !== "RS256") throw new Error("ukjent nøkkel");
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlToBytes(s64), new TextEncoder().encode(h64 + "." + p64));
    if (!ok) throw new Error("feil signatur");
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.some((a) => auds.includes(a))) throw new Error("feil mottaker");
    if (payload.iss !== `https://${team}`) throw new Error("feil utsteder");
    const now = Date.now() / 1000;
    if (!payload.exp || payload.exp < now || (payload.nbf && payload.nbf > now + 60)) throw new Error("utløpt");
    if (!payload.email) throw new Error("mangler e-post");
    return { email: payload.email };
  } catch (e) {
    return { status: 401, error: "Innloggingen er ugyldig eller utløpt. Last siden på nytt." };
  }
}
