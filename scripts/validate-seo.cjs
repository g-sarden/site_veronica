const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function getHtmlFiles() {
  const rootFiles = ['index.html', 'psicologa-online.html', 'politica-de-privacidade.html']
    .filter((f) => fs.existsSync(path.join(root, f)));
  const blogDir = path.join(root, 'blog');
  const blogFiles = fs.readdirSync(blogDir)
    .filter((f) => f.endsWith('.html'))
    .map((f) => `blog/${f}`);
  return [...rootFiles, ...blogFiles];
}

function checkJsonLd() {
  console.log('--- Validando JSON-LD em TODOS os arquivos HTML ---');
  const htmlFiles = getHtmlFiles();
  let errors = 0;
  let validCount = 0;

  for (const file of htmlFiles) {
    const filePath = path.join(root, file);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf8');
    const regex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = regex.exec(content)) !== null) {
      try {
        JSON.parse(match[1]);
        validCount++;
      } catch (err) {
        console.error(`[ERRO] JSON-LD inválido em: ${file} -> ${err.message}`);
        errors++;
      }
    }
  }
  console.log(`[OK] ${validCount} blocos de JSON-LD verificados e válidos em ${htmlFiles.length} páginas.`);
  return errors;
}

function checkRedirects() {
  console.log('\n--- Validando arquivo _redirects ---');
  const redirectsPath = path.join(root, '_redirects');
  if (!fs.existsSync(redirectsPath)) {
    console.error('[ERRO] _redirects não encontrado!');
    return 1;
  }
  const lines = fs.readFileSync(redirectsPath, 'utf8').split('\n');
  let validCount = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 3 && (parts[2] === '301' || parts[2] === '302' || parts[2] === '200')) {
      validCount++;
    } else {
      console.warn(`[AVISO] Linha de redirect suspeita: ${line}`);
    }
  }
  console.log(`[OK] _redirects possui ${validCount} regra(s) válida(s).`);
  return 0;
}

function checkSitemap() {
  console.log('\n--- Validando sitemap.xml ---');
  const sitemapPath = path.join(root, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    console.error('[ERRO] sitemap.xml não encontrado!');
    return 1;
  }
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const locRegex = /<loc>(https:\/\/veronicagrijo\.psc\.br\/([^<]*))<\/loc>/g;
  let match;
  let count = 0;
  while ((match = locRegex.exec(sitemap)) !== null) {
    const relPath = match[2] || 'index.html';
    const filePath = path.join(root, relPath.endsWith('/') ? `${relPath}index.html` : relPath);
    if (fs.existsSync(filePath)) {
      count++;
    } else {
      console.warn(`[AVISO] URL do sitemap não encontrada no disco: ${match[1]} (${filePath})`);
    }
  }
  console.log(`[OK] sitemap.xml possui ${count} URLs verificadas e existentes.`);
  return 0;
}

const totalErrors = checkJsonLd() + checkRedirects() + checkSitemap();
if (totalErrors === 0) {
  console.log('\n✅ TODAS AS VALIDAÇÕES PASSARAM COM SUCESSO!');
  process.exit(0);
} else {
  console.error(`\n❌ Foram encontrados ${totalErrors} erro(s).`);
  process.exit(1);
}
