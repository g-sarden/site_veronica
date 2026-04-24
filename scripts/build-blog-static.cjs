const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const postsPath = path.join(root, 'blog', 'posts.json');
const homePath = path.join(root, 'index.html');
const blogPath = path.join(root, 'blog', 'index.html');

const categoryColors = {
  Maternidade: ['#FEE2E2', '#B91C1C'],
  Ansiedade: ['#FEF3C7', '#92400E'],
  Autoconhecimento: ['#EDE9FE', '#5B21B6'],
  'Saúde Mental': ['#CCFBF1', '#0F766E'],
  Relacionamentos: ['#FCE7F3', '#9D174D'],
};

const categoryThemes = {
  Maternidade: 'theme-maternidade',
  Ansiedade: 'theme-ansiedade',
  Autoconhecimento: 'theme-autoconhecimento',
  'Saúde Mental': 'theme-saude-mental',
  Relacionamentos: 'theme-relacionamentos',
};

const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const longDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function formatDate(dateStr, formatter) {
  return formatter.format(new Date(`${dateStr}T12:00:00`));
}

function toHomeImageSrc(src) {
  if (!src) return 'assets/foto1.jpeg';
  if (/^https?:\/\//i.test(src)) return src;
  return src.replace(/^\.\.\//, '');
}

function toBlogImageSrc(src) {
  if (!src) return '../assets/foto1.jpeg';
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('../')) return src;
  return `../${src.replace(/^\.\//, '')}`;
}

function replaceBetween(content, startMarker, endMarker, replacement) {
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`Não encontrei os marcadores ${startMarker} / ${endMarker}`);
  }

  return `${content.slice(0, startIndex + startMarker.length)}\n${replacement}\n${content.slice(endIndex)}`;
}

function renderHomeCard(post) {
  const colors = categoryColors[post.category] || ['#FFF0F2', '#A25B6C'];
  const title = escapeHtml(post.title);
  const excerpt = escapeHtml(post.excerpt);
  const category = escapeHtml(post.category);
  const readTime = escapeHtml(post.readTime || '5 min');
  const imageSrc = escapeHtml(toHomeImageSrc(post.coverImage));
  const href = `/blog/${encodeURIComponent(post.slug)}.html`;
  const date = escapeHtml(formatDate(post.date, shortDateFormatter));

  return `            <a href="${href}"
                class="group bg-surface rounded-[28px] border border-outline-variant/20 overflow-hidden shadow-sm flex flex-col hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(162,91,108,0.13)] transition-all duration-400 cursor-pointer"
                style="text-decoration:none">
                <div class="overflow-hidden" style="aspect-ratio:16/9;background:#f5eaeb">
                    <img src="${imageSrc}" alt="${title}"
                        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy" onerror="this.src='assets/foto1.jpeg'" />
                </div>
                <div class="p-6 flex flex-col flex-1">
                    <div class="flex items-center gap-3 mb-3">
                        <span style="background:${colors[0]};color:${colors[1]};font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;font-weight:600;padding:3px 10px;border-radius:50px">
                            ${category}
                        </span>
                        <span style="font-size:.75rem;color:#9d7e82;font-weight:300">${readTime} de leitura</span>
                    </div>
                    <h3 class="font-headline text-lg text-on-surface mb-2 leading-snug group-hover:text-primary transition-colors" style="flex:1">
                        ${title}
                    </h3>
                    <p class="text-on-surface-variant text-sm font-light leading-relaxed mb-4"
                        style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">
                        ${excerpt}
                    </p>
                    <div class="flex items-center justify-between">
                        <span style="font-size:.75rem;color:#b09095">${date}</span>
                        <span class="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                            Ler <span class="material-symbols-outlined" style="font-size:1rem">arrow_forward</span>
                        </span>
                    </div>
                </div>
            </a>`;
}

function renderHomeSection(posts) {
  if (!posts.length) {
    return `            <div class="text-center py-16">
                <p class="text-on-surface-variant font-light">Em breve, novos artigos por aqui.</p>
            </div>`;
  }

  return `            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
${posts.map(renderHomeCard).join('\n')}
            </div>`;
}

function renderFeaturedPost(post) {
  if (!post) {
    return `          <p class="font-headline text-3xl md:text-4xl leading-tight mb-4">Novos artigos estão a caminho.</p>
          <p class="text-white/75 text-lg leading-relaxed font-light">Enquanto isso, você pode conhecer melhor o trabalho da Verônica e agendar sua sessão.</p>
          <a href="../#sobre"
            class="inline-flex items-center gap-2 border border-white/20 text-white px-6 py-3 rounded-full font-medium hover:bg-white/10 transition-all mt-6">
            Conheça a Verônica
            <span class="material-symbols-outlined text-base">arrow_forward</span>
          </a>`;
  }

  const category = escapeHtml(post.category || 'Reflexão');
  const theme = categoryThemes[post.category] || 'theme-default';
  const title = escapeHtml(post.title);
  const excerpt = escapeHtml(post.excerpt || '');
  const readTime = escapeHtml(post.readTime || '4 min');
  const href = `./${encodeURIComponent(post.slug)}.html`;
  const date = escapeHtml(formatDate(post.date, longDateFormatter));

  return `          <div class="flex flex-wrap items-center gap-3 mb-5">
            <span class="cat-pill font-medium px-3 py-1 rounded-full ${theme}">${category}</span>
            <span class="text-white/60 text-xs font-light">${readTime} de leitura</span>
          </div>
          <h2 class="font-headline text-3xl md:text-4xl leading-tight mb-4">${title}</h2>
          <p class="text-white/75 text-lg leading-relaxed font-light mb-6">${excerpt}</p>
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <span class="text-white/55 text-sm">${date}</span>
            <a href="${href}"
              class="inline-flex items-center gap-2 text-white border border-white/20 px-5 py-3 rounded-full font-medium hover:bg-white/10 transition-all w-fit">
              Ler artigo
              <span class="material-symbols-outlined text-base">arrow_forward</span>
            </a>
          </div>`;
}

function renderFilterButtons(categories) {
  const allButton = `            <button type="button" data-cat="all"
              class="cat-filter-btn px-5 py-2.5 rounded-full border border-primary/30 text-primary bg-primary/10 font-medium cat-pill transition-all hover:bg-primary/20">
              Todos
            </button>`;

  const categoryButtons = categories.map((category) => `            <button type="button" data-cat="${escapeHtml(category)}"
              class="cat-filter-btn px-5 py-2.5 rounded-full border border-transparent text-on-surface-variant bg-surface-container-low font-medium cat-pill transition-all hover:bg-primary/10 hover:text-primary">
              ${escapeHtml(category)}
            </button>`);

  return [allButton, ...categoryButtons].join('\n');
}

function renderBlogCard(post, index) {
  const category = escapeHtml(post.category || 'Reflexão');
  const theme = categoryThemes[post.category] || 'theme-default';
  const title = escapeHtml(post.title);
  const excerpt = escapeHtml(post.excerpt || '');
  const coverImage = escapeHtml(toBlogImageSrc(post.coverImage));
  const readTime = escapeHtml(post.readTime || '4 min');
  const date = escapeHtml(formatDate(post.date, longDateFormatter));
  const slug = encodeURIComponent(post.slug);

  return `        <a href="./${slug}.html" data-category="${category}"
          class="blog-card group bg-surface-container-low rounded-[32px] border border-outline-variant/20 overflow-hidden shadow-sm h-full flex flex-col"
          style="animation: pageLoad 0.6s ease ${index * 0.08}s both;">
          <div class="card-media overflow-hidden bg-surface">
            <img src="${coverImage}"
              alt="${title}"
              class="card-cover w-full h-full object-cover"
              loading="lazy"
              onerror="this.src='../assets/foto1.jpeg'" />
          </div>
          <div class="p-7 flex flex-col flex-1">
            <div class="flex flex-wrap items-center gap-3 mb-4">
              <span class="cat-pill font-medium px-3 py-1 rounded-full ${theme}">${category}</span>
              <span class="text-outline/70 text-xs font-light">${readTime} de leitura</span>
            </div>
            <h3 class="font-headline text-2xl text-on-surface mb-3 leading-snug group-hover:text-primary transition-colors">
              ${title}
            </h3>
            <p class="post-excerpt text-on-surface-variant text-sm font-light leading-relaxed">
              ${excerpt}
            </p>
            <div class="mt-6 pt-6 border-t border-outline-variant/20 flex items-center justify-between gap-4">
              <span class="text-xs text-outline">${date}</span>
              <span class="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Ler artigo
                <span class="material-symbols-outlined text-base">arrow_forward</span>
              </span>
            </div>
          </div>
        </a>`;
}

function main() {
  const posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const categories = [...new Set(posts.map((post) => post.category).filter(Boolean))];
  const featuredPost = posts[0] || null;
  const homeMarkup = renderHomeSection(posts.slice(0, 3));
  const blogGridMarkup = posts.length
    ? posts.map((post, index) => renderBlogCard(post, index)).join('\n')
    : '';
  const summaryText = `${posts.length} ${posts.length === 1 ? 'artigo disponível' : 'artigos disponíveis'} em todos os temas. Total publicado: ${posts.length}.`;

  let homeHtml = fs.readFileSync(homePath, 'utf8');
  homeHtml = replaceBetween(homeHtml, '<!-- BLOG_HOME_STATIC_START -->', '<!-- BLOG_HOME_STATIC_END -->', homeMarkup);
  fs.writeFileSync(homePath, homeHtml, 'utf8');

  let blogHtml = fs.readFileSync(blogPath, 'utf8');
  blogHtml = replaceBetween(blogHtml, '<!-- BLOG_FEATURED_START -->', '<!-- BLOG_FEATURED_END -->', renderFeaturedPost(featuredPost));
  blogHtml = replaceBetween(blogHtml, '<!-- BLOG_POST_COUNT_START -->', '<!-- BLOG_POST_COUNT_END -->', String(posts.length).padStart(2, '0'));
  blogHtml = replaceBetween(blogHtml, '<!-- BLOG_CATEGORY_COUNT_START -->', '<!-- BLOG_CATEGORY_COUNT_END -->', String(categories.length).padStart(2, '0'));
  blogHtml = replaceBetween(blogHtml, '<!-- BLOG_SUMMARY_START -->', '<!-- BLOG_SUMMARY_END -->', escapeHtml(summaryText));
  blogHtml = replaceBetween(blogHtml, '<!-- BLOG_FILTERS_START -->', '<!-- BLOG_FILTERS_END -->', renderFilterButtons(categories));
  blogHtml = replaceBetween(blogHtml, '<!-- BLOG_GRID_START -->', '<!-- BLOG_GRID_END -->', blogGridMarkup);
  fs.writeFileSync(blogPath, blogHtml, 'utf8');

  console.log(`Listagem estática atualizada com ${posts.length} post(s).`);
}

main();
