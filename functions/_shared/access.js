const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store'
};

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {status, headers: JSON_HEADERS});
}

export function accessErrorResponse(error) {
  const status = error instanceof HttpError ? error.status : 500;
  const message = error instanceof Error ? error.message : 'Erro inesperado.';
  return json({ok: false, error: message}, status);
}

export async function requireAccess(request, env) {
  const teamDomain = normalizeTeamDomain(env.CF_ACCESS_TEAM_DOMAIN || env.CLOUDFLARE_ACCESS_TEAM_DOMAIN);
  const audience = splitList(env.CF_ACCESS_AUD || env.CLOUDFLARE_ACCESS_AUD);

  if (env.ALLOW_LOCAL_ADMIN === 'true' && (!teamDomain || audience.length === 0)) {
    return {email: 'local-dev@example.local', payload: {sub: 'local-dev'}};
  }

  if (!teamDomain || audience.length === 0) {
    throw new HttpError(500, 'Cloudflare Access não está configurado no backend.');
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion') || getCookie(request, 'CF_Authorization');
  if (!token) {
    throw new HttpError(401, 'Sessão do Cloudflare Access ausente.');
  }

  const payload = await verifyAccessJwt(token, teamDomain, audience);
  const email = String(payload.email || request.headers.get('Cf-Access-Authenticated-User-Email') || '').toLowerCase();
  const allowedEmails = splitList(env.ADMIN_ALLOWED_EMAILS).map(item => item.toLowerCase());

  if (allowedEmails.length > 0 && (!email || !allowedEmails.includes(email))) {
    throw new HttpError(403, 'Este usuário não está autorizado a publicar.');
  }

  return {email, payload};
}

async function verifyAccessJwt(token, teamDomain, audience) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new HttpError(401, 'Token do Cloudflare Access inválido.');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeBase64UrlJson(encodedHeader);
  const payload = decodeBase64UrlJson(encodedPayload);

  if (header.alg !== 'RS256' || !header.kid) {
    throw new HttpError(401, 'Assinatura do Cloudflare Access inválida.');
  }

  validateClaims(payload, teamDomain, audience);

  const certs = await fetchAccessCerts(teamDomain);
  const jwk = certs.keys?.find(key => key.kid === header.kid);
  if (!jwk) {
    throw new HttpError(401, 'Chave de assinatura do Cloudflare Access não encontrada.');
  }

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'},
    false,
    ['verify']
  );

  const signature = decodeBase64UrlBytes(encodedSignature);
  const signedData = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signedData);

  if (!valid) {
    throw new HttpError(401, 'Assinatura do Cloudflare Access não confere.');
  }

  return payload;
}

function validateClaims(payload, teamDomain, audience) {
  const issuer = `https://${teamDomain}`;
  if (payload.iss !== issuer) {
    throw new HttpError(401, 'Emissor do Cloudflare Access não confere.');
  }

  const tokenAudiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud].filter(Boolean);
  if (!audience.some(item => tokenAudiences.includes(item))) {
    throw new HttpError(401, 'Audience do Cloudflare Access não confere.');
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now - 60) {
    throw new HttpError(401, 'Sessão expirada.');
  }

  if (payload.nbf && payload.nbf > now + 60) {
    throw new HttpError(401, 'Sessão ainda não é válida.');
  }
}

async function fetchAccessCerts(teamDomain) {
  const response = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`, {
    headers: {'Accept': 'application/json'}
  });

  if (!response.ok) {
    throw new HttpError(502, 'Não foi possível consultar as chaves do Cloudflare Access.');
  }

  return response.json();
}

function normalizeTeamDomain(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
}

function getCookie(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  return cookie
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${name}=`))
    ?.slice(name.length + 1) || '';
}

function splitList(value) {
  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function decodeBase64UrlJson(value) {
  return JSON.parse(new TextDecoder().decode(decodeBase64UrlBytes(value)));
}

function decodeBase64UrlBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
