import {HttpError, NO_STORE_HEADERS, accessErrorResponse, json, requireAccess} from '../_shared/access.js';

const SITE_URL = 'https://veronicagrijo.psc.br';
const MAX_IMAGE_BYTES = 80 * 1024;
const MAX_POST_HTML_BYTES = 650 * 1024;

export async function onRequestPost({request, env}) {
  try {
    await requireAccess(request, env);
    assertSameOrigin(request, env);

    const github = getGithubConfig(env);
    const payload = await readJson(request);
    const publication = normalizePublication(payload);

    const postsFile = await getContent(github, 'blog/posts.json');
    const posts = postsFile
      ? JSON.parse(decodeBase64Utf8(postsFile.content.replace(/\n/g, '')))
      : [];

    const nextPosts = posts
      .filter(post => post.slug !== publication.slug)
      .concat(publication.post)
      .sort((a, b) => new Date(b.dateModified || b.date) - new Date(a.dateModified || a.date));

    await putContent(
      github,
      `assets/${publication.imageName}`,
      `Asset: ${publication.imageName}`,
      publication.imageBase64,
      await getSha(github, `assets/${publication.imageName}`)
    );

    await putContent(
      github,
      `blog/${publication.slug}.html`,
      `Post: ${publication.title}`,
      publication.postHtml,
      await getSha(github, `blog/${publication.slug}.html`)
    );

    await putContent(
      github,
      'blog/posts.json',
      `Index: add ${publication.slug}`,
      encodeBase64Utf8(JSON.stringify(nextPosts, null, 2)),
      postsFile?.sha || null
    );

    await putContent(
      github,
      'sitemap.xml',
      `Sitemap: add ${publication.slug}`,
      encodeBase64Utf8(buildSitemap(nextPosts, env.SITE_URL || SITE_URL)),
      await getSha(github, 'sitemap.xml')
    );

    return json({
      ok: true,
      slug: publication.slug,
      url: `/blog/${publication.slug}.html`,
      image: `/assets/${publication.imageName}`
    });
  } catch (error) {
    return accessErrorResponse(error);
  }
}

export function onRequestOptions() {
  return new Response(null, {status: 204, headers: NO_STORE_HEADERS});
}

function normalizePublication(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new HttpError(400, 'Payload inválido.');
  }

  const slug = cleanString(payload.slug);
  const title = cleanString(payload.title);
  const imageName = cleanString(payload.imageName);
  const imageBase64 = cleanBase64(payload.imageBase64);
  const postHtml = cleanBase64(payload.postHtml);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 90) {
    throw new HttpError(400, 'Slug inválido.');
  }

  if (!title || title.length > 180) {
    throw new HttpError(400, 'Título inválido.');
  }

  if (imageName !== `${slug}-cover.webp`) {
    throw new HttpError(400, 'Nome da imagem inválido.');
  }

  if (base64ByteLength(imageBase64) > MAX_IMAGE_BYTES) {
    throw new HttpError(400, 'A imagem precisa ter no máximo 80 KB.');
  }

  if (base64ByteLength(postHtml) > MAX_POST_HTML_BYTES) {
    throw new HttpError(400, 'O HTML do post ficou grande demais.');
  }

  const post = normalizePost(payload.post, {slug, title, imageName});
  return {slug, title, imageName, imageBase64, postHtml, post};
}

function normalizePost(rawPost, {slug, title, imageName}) {
  if (!rawPost || typeof rawPost !== 'object') {
    throw new HttpError(400, 'Metadados do post ausentes.');
  }

  const date = normalizeDate(rawPost.date);
  const dateModified = normalizeDate(rawPost.dateModified || rawPost.date);

  return {
    slug,
    title,
    seoTitle: clamp(rawPost.seoTitle || title, 58),
    excerpt: clamp(rawPost.excerpt, 240),
    metaDescription: clamp(rawPost.metaDescription || rawPost.excerpt, 155),
    date,
    dateModified,
    category: clamp(rawPost.category || 'Reflexão', 60),
    readTime: clamp(rawPost.readTime || '5 min', 20),
    coverImage: `../assets/${imageName}`,
    coverAlt: clamp(rawPost.coverAlt || title, 140),
    references: normalizeStringArray(rawPost.references, 20, 300).filter(isHttpUrl),
    faq: normalizeFaq(rawPost.faq),
    ctaVariant: slug.replace(/-/g, '_')
  };
}

function getGithubConfig(env) {
  const token = env.GITHUB_TOKEN;
  const owner = env.GITHUB_OWNER || 'g-sarden';
  const repo = env.GITHUB_REPO || 'site_veronica';
  const branch = env.GITHUB_BRANCH || '';

  if (!token) {
    throw new HttpError(500, 'GITHUB_TOKEN não está configurado.');
  }

  return {token, owner, repo, branch};
}

async function readJson(request) {
  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.includes('application/json')) {
    throw new HttpError(415, 'Envie application/json.');
  }

  try {
    return await request.json();
  } catch {
    throw new HttpError(400, 'JSON inválido.');
  }
}

function assertSameOrigin(request, env) {
  const origin = request.headers.get('Origin');
  if (!origin) return;

  const requestOrigin = new URL(request.url).origin;
  const allowed = [requestOrigin, ...splitList(env.ADMIN_ALLOWED_ORIGINS)];

  if (!allowed.includes(origin)) {
    throw new HttpError(403, 'Origem não autorizada.');
  }
}

async function getContent(github, path) {
  const response = await fetch(contentUrl(github, path), {
    headers: githubHeaders(github.token)
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new HttpError(response.status, await githubError(response));
  }

  return response.json();
}

async function getSha(github, path) {
  const file = await getContent(github, path);
  return file?.sha || null;
}

async function putContent(github, path, message, content, sha) {
  const body = {message, content};
  if (sha) body.sha = sha;
  if (github.branch) body.branch = github.branch;

  const response = await fetch(contentUrl(github, path, false), {
    method: 'PUT',
    headers: {
      ...githubHeaders(github.token),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new HttpError(response.status, await githubError(response));
  }

  return response.json();
}

function contentUrl(github, path, withRef = true) {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const url = new URL(`https://api.github.com/repos/${github.owner}/${github.repo}/contents/${encodedPath}`);
  if (withRef && github.branch) url.searchParams.set('ref', github.branch);
  return url.toString();
}

function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'veronica-blog-admin'
  };
}

async function githubError(response) {
  try {
    const body = await response.json();
    return body.message || 'Erro no GitHub.';
  } catch {
    return await response.text();
  }
}

function buildSitemap(posts, siteUrl) {
  const newestPostDate = posts
    .map(post => post.dateModified || post.date)
    .sort((a, b) => new Date(b) - new Date(a))[0] || new Date().toISOString().split('T')[0];
  const staticUrls = [
    {loc: `${siteUrl}/`, lastmod: '2026-04-24', changefreq: 'monthly', priority: '1.0'},
    {loc: `${siteUrl}/blog/`, lastmod: newestPostDate, changefreq: 'weekly', priority: '0.8'},
    {loc: `${siteUrl}/psicologa-online.html`, lastmod: '2026-04-24', changefreq: 'monthly', priority: '0.9'}
  ];
  const postUrls = posts.map(post => ({
    loc: `${siteUrl}/blog/${encodeURIComponent(post.slug)}.html`,
    lastmod: post.dateModified || post.date,
    changefreq: 'monthly',
    priority: '0.7'
  }));
  const entries = [...staticUrls, ...postUrls].map(({loc, lastmod, changefreq, priority}) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

function cleanString(value) {
  return String(value || '').trim();
}

function cleanBase64(value) {
  const clean = String(value || '').replace(/\s+/g, '');
  if (!clean || !/^[A-Za-z0-9+/]+={0,2}$/.test(clean)) {
    throw new HttpError(400, 'Conteúdo base64 inválido.');
  }
  return clean;
}

function base64ByteLength(value) {
  const clean = String(value || '').replace(/\s+/g, '');
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  return Math.floor(clean.length * 3 / 4) - padding;
}

function encodeBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function decodeBase64Utf8(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function normalizeDate(value) {
  const clean = cleanString(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(clean) ? clean : new Date().toISOString().split('T')[0];
}

function normalizeStringArray(value, maxItems, maxLength) {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => clamp(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeFaq(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => ({
      question: clamp(item?.question, 180),
      answer: clamp(item?.answer, 500)
    }))
    .filter(item => item.question && item.answer)
    .slice(0, 6);
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function splitList(value) {
  return String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function clamp(value, max) {
  const clean = cleanString(value).replace(/\s+/g, ' ');
  return clean.length > max ? `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}...` : clean;
}
