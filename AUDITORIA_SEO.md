# Auditoria de SEO

Data da auditoria: 2026-04-29  
Projeto: `site_veronica`  
Domínio observado no projeto: `veronicagrijo.psc.br`

## Registro de Correções

- 2026-04-30: F8 corrigido com Twitter Card completo em `blog/index.html`, incluindo `twitter:image`.
- 2026-04-30: F9 tratado com expansão de `psicologa-online.html`, adicionando conteúdo sobre adequação do formato online, processo terapêutico, privacidade, limites de segurança e novas perguntas frequentes.
- 2026-04-30: F12 corrigido removendo a URL curta do Google dos sinais `sameAs` e da lista de perfis externos. Como o Place ID disponível representa a cidade de Macaé, e não a entidade profissional, ele não foi usado como `sameAs`.

## Escopo e Assunções

Como o contexto de negócio não foi detalhado na solicitação, esta auditoria assume:

- Tipo de site: site profissional/local de psicóloga clínica, com páginas de serviço e blog.
- Objetivo primário de SEO: captação orgânica de leads qualificados para atendimento psicológico presencial em Macaé/RJ e online.
- Mercado e idioma: Brasil, PT-BR.
- Escopo: auditoria completa do projeto local, cobrindo crawlabilidade, indexação, fundamentos técnicos, on-page, conteúdo/E-E-A-T e sinais de autoridade.
- Dispositivos: desktop e mobile, com maior peso prático para mobile porque o arquivo `seo_data/Devices.csv` mostra 43 de 54 impressões em mobile.
- Dados disponíveis: arquivos estáticos do projeto, `robots.txt`, `sitemap.xml`, `_headers` e exportações em `seo_data`.

Não foram executados PageSpeed Insights, validação de rich results em produção, consulta direta ao Google Search Console, análise de logs do servidor ou crawl externo em produção.

## Resumo Executivo

O site tem uma base SEO boa: sitemap presente, canonicals nas páginas principais, blog estruturado, schema em JSON-LD, conteúdo com foco claro em temas de ansiedade, maternidade, terapia online e autoridade profissional reforçada por CRP, CFP, Doctoralia e Instagram.

O maior risco identificado é de indexação indevida de arquivos que não deveriam competir nos resultados: `blog/post-template.html`, com placeholders `EDITAR_*`, e `assets/5 sinais.html`, uma página antiga/avulsa sobre tema já coberto por um post publicado. Esses arquivos não aparecem no sitemap, mas estão acessíveis no projeto e não estão bloqueados por `robots.txt`; no caso do template, há ainda `meta robots` com `index, follow`.

O segundo grupo de oportunidades está em performance e estabilidade visual: há imagens públicas sem dimensões explícitas e vídeos de fundo grandes carregados nas páginas de entrada. O uso de posters e lazy loading reduz o risco, mas ainda vale tratar isso como otimização de Core Web Vitals.

O site ainda tem baixa amostra orgânica nos dados exportados: 5 cliques, 55 impressões e apenas 3 consultas no período analisado. Isso limita conclusões de ranking, mas não invalida os achados técnicos.

## SEO Health Index

- Overall Score: 89 / 100
- Health Status: Good

### Category Breakdown

| Category | Score | Weight | Weighted Contribution |
| --- | ---: | ---: | ---: |
| Crawlability & Indexation | 80 | 30 | 24.0 |
| Technical Foundations | 91 | 25 | 22.8 |
| On-Page Optimization | 94 | 20 | 18.8 |
| Content Quality & E-E-A-T | 93 | 15 | 14.0 |
| Authority & Trust Signals | 96 | 10 | 9.6 |
| Total |  | 100 | 89.2 |

### O que limita a nota

A nota não é maior por três motivos principais:

- Existem páginas indexáveis que parecem ser arquivo de trabalho ou conteúdo legado.
- Parte das páginas tem imagens sem `width`/`height`, o que aumenta risco de CLS.
- Os dados orgânicos ainda têm amostra pequena, então autoridade e performance em SERP não podem ser validadas com alta confiança.

Nenhum achado foi classificado como Critical. Portanto, a pontuação não é invalidada por bloqueador crítico não resolvido.

## Evidências Coletadas

- `robots.txt` permite o site inteiro e bloqueia apenas `/admin/`.
- `sitemap.xml` contém 9 URLs e todas apontam para arquivos existentes no projeto.
- Todas as páginas públicas pretendidas no sitemap têm canonical próprio.
- O parser local encontrou 2 arquivos indexáveis fora do sitemap: `assets/5 sinais.html` e `blog/post-template.html`.
- Não foram encontrados títulos ou meta descriptions duplicados entre os HTMLs analisados.
- Páginas públicas principais têm um H1 por página.
- Dados exportados em `seo_data/Google_organic_search_traffic_Landing_page_+_query_string.csv`: 5 cliques, 55 impressões, CTR de 9,09% e posição média 9,29 entre 2026-03-27 e 2026-04-23.
- Dados exportados em `seo_data/Pages.csv`: a home HTTPS recebeu 4 cliques/54 impressões; a home HTTP apareceu com 1 clique/1 impressão.
- Dados exportados em `seo_data/Queries.csv`: apenas 3 consultas registradas, todas relacionadas a "psicóloga" e "Macaé".

## Pontos Fortes

- `robots.txt` inclui referência ao sitemap e bloqueia `/admin/`.
- `_headers` aplica `X-Robots-Tag: noindex, nofollow` em `/admin/*` e `/api/*`.
- Sitemap usa URLs HTTPS canônicas e inclui home, blog, página de serviço e posts publicados.
- Páginas principais usam `lang="pt-BR"`, viewport responsivo, title, description, canonical e `meta robots`.
- Blog posts incluem `BlogPosting`, `BreadcrumbList` e, em vários casos, `FAQPage`.
- Conteúdo do blog tem boa profundidade, com posts entre aproximadamente 1.600 e 1.900 palavras.
- Artigos incluem fontes externas e o site informa CRP, políticas e perfis externos relevantes.

## Findings

### F1. Template de post está indexável

Issue: O arquivo `blog/post-template.html` está configurado como indexável mesmo sendo um template com placeholders.

Category: Crawlability & Indexation

Evidence: `blog/post-template.html:9` usa `EDITAR_TITULO_DO_POST`, `blog/post-template.html:10` usa `EDITAR_META_DESCRIPTION_ATE_160_CARACTERES`, `blog/post-template.html:11` define `meta name="robots" content="index, follow"` e `blog/post-template.html:13` aponta canonical para `https://veronicagrijo.psc.br/blog/EDITAR_SLUG.html`.

Severity: High

Confidence: High

Why It Matters: Uma URL de template indexável pode gerar soft 404, conteúdo de baixa qualidade, sinais incorretos de canonical e ruído de indexação.

Score Impact: -10 pontos em Crawlability & Indexation.

Recommendation: Impedir que o template seja publicado como página indexável ou aplicar exclusão clara de indexação enquanto ele existir no deploy.

### F2. Página avulsa em `assets/` está potencialmente indexável e fora do sitemap

Issue: `assets/5 sinais.html` é uma página HTML pública sem canonical, sem robots e fora do sitemap.

Category: Crawlability & Indexation

Evidence: `assets/5 sinais.html:6` contém title de página real e `assets/5 sinais.html:7` contém meta description, mas a varredura local não encontrou canonical, `meta robots`, Open Graph ou Twitter Card nesse arquivo. `robots.txt:3` define `Allow: /`, e o sitemap lista o post oficial `blog/sinais-que-precisa-de-terapia.html`, não o arquivo em `assets/`.

Severity: High

Confidence: High

Why It Matters: Uma página antiga ou avulsa pode competir com o post oficial, diluir sinais de intenção e criar uma URL de baixa governança fora da arquitetura editorial.

Score Impact: -10 pontos em Crawlability & Indexation.

Recommendation: Definir se a página deve existir publicamente; se não for uma URL estratégica, remover da publicação ou consolidar com a URL oficial.

### F3. Há sinal residual de URL HTTP nos dados de busca

Issue: A exportação de páginas mostra uma versão `http://` da home com impressão e clique.

Category: Crawlability & Indexation

Evidence: `seo_data/Pages.csv` contém `http://veronicagrijo.psc.br/` com 1 clique, 1 impressão, CTR de 100% e posição 4; a versão canônica no projeto é `https://veronicagrijo.psc.br/`.

Severity: Low

Confidence: Low

Why It Matters: Se a versão HTTP não redirecionar sempre para HTTPS, sinais podem se dividir entre protocolos. Como a evidência vem de exportação e não de teste de cabeçalho em produção, a confiança é baixa.

Score Impact: -0.5 ponto em Crawlability & Indexation.

Recommendation: Validar em produção se HTTP redireciona diretamente para HTTPS e se a propriedade canônica está consistente nas ferramentas de busca.

### F4. Imagens públicas sem dimensões explícitas aumentam risco de CLS

Issue: Várias imagens em páginas públicas não têm `width` e `height` explícitos no HTML.

Category: Technical Foundations

Evidence: A varredura local encontrou imagens sem dimensões em páginas relevantes: `index.html` com 6 ocorrências, `blog/index.html` com 7, cada post publicado com 1 e `psicologa-online.html` com 1. Exemplos incluem a imagem hero da home em `index.html:530` e a imagem hero da página online em `psicologa-online.html:547`.

Severity: Medium

Confidence: High

Why It Matters: Sem dimensões intrínsecas, o navegador pode recalcular layout quando a imagem carrega, prejudicando CLS e experiência mobile.

Score Impact: -5 pontos em Technical Foundations.

Recommendation: Garantir dimensões ou proporções estáveis para imagens editoriais, cards e imagens hero.

### F5. Vídeos de fundo grandes podem pressionar performance em páginas de entrada

Issue: A home e o blog usam vídeos de fundo grandes como elementos visuais.

Category: Technical Foundations

Evidence: `assets/lavanda.mp4` tem 4.883.368 bytes e é usado em `index.html:492` e `blog/index.html:437`; `assets/textura.mp4` tem 5.084.510 bytes e é usado em `index.html:603`. Os vídeos usam `preload="none"` e poster, o que reduz o impacto inicial, mas ainda há payload relevante em páginas de entrada.

Severity: Medium

Confidence: Medium

Why It Matters: Em conexões móveis, vídeos decorativos podem competir com recursos críticos e piorar LCP/INP percebido quando passam a carregar.

Score Impact: -2.5 pontos em Technical Foundations.

Recommendation: Validar impacto real em mobile e manter vídeos decorativos condicionados a orçamento de performance.

### F6. Headers públicos de cache e segurança não estão declarados no arquivo `_headers`

Issue: `_headers` define regras apenas para `/admin/*` e `/api/*`, sem política explícita para páginas públicas e assets.

Category: Technical Foundations

Evidence: `_headers:1` cobre `/admin/*`; `_headers:8` cobre `/api/*`; não há regra global para cache de assets, `Strict-Transport-Security`, `X-Content-Type-Options` ou política pública equivalente.

Severity: Low

Confidence: Medium

Why It Matters: Dependendo da plataforma de deploy, a falta de regras explícitas pode reduzir cacheabilidade de assets e deixar sinais técnicos de segurança inconsistentes.

Score Impact: -2 pontos em Technical Foundations.

Recommendation: Definir política pública de cache e cabeçalhos de segurança coerente com o ambiente de hospedagem.

### F7. Home concentra muitos intents no title, description e H1

Issue: A home tenta cobrir muitos termos estratégicos ao mesmo tempo no title, meta description e H1.

Category: On-Page Optimization

Evidence: `index.html` tem title com 74 caracteres e description com 160 caracteres. O H1 extraído da home foi: "Psicóloga em Macaé, Verônica Grijó, com atendimento para ansiedade, maternidade e exaustão feminina. Onde a ansiedade e a exaustão feminina encontram o acolhimento."

Severity: Medium

Confidence: High

Why It Matters: Uma página local precisa deixar a intenção principal muito clara. Um H1 muito carregado pode diluir foco entre localização, ansiedade, maternidade, exaustão e marca.

Score Impact: -5 pontos em On-Page Optimization.

Recommendation: Priorizar uma intenção principal para a home e distribuir temas secundários em seções internas ou páginas específicas.

### F8. Blog index não possui Twitter Card completo

Status: Corrigido em 2026-04-30.

Issue: `blog/index.html` tem Open Graph, mas a varredura local não encontrou `twitter:image`.

Category: On-Page Optimization

Evidence: O parser local registrou `og:image` em `blog/index.html`, mas `twitterImage` vazio. As demais páginas principais têm Twitter Card mais completo.

Severity: Low

Confidence: High

Why It Matters: Isso não bloqueia SEO orgânico, mas reduz consistência de compartilhamento e pode afetar CTR social/indireta quando a página do blog é compartilhada.

Score Impact: -1 ponto em On-Page Optimization.

Recommendation: Padronizar metadados sociais da página de blog com o mesmo nível das páginas principais.

### F9. Página `psicologa-online.html` tem profundidade textual menor que os artigos

Status: Tratado em 2026-04-30.

Issue: A página comercial de psicóloga online tem conteúdo visível relativamente curto para uma intenção competitiva e sensível.

Category: Content Quality & E-E-A-T

Evidence: A varredura local contou aproximadamente 476 palavras e 3 H2 em `psicologa-online.html`, enquanto os posts publicados têm cerca de 1.600 a 1.900 palavras e estrutura editorial mais profunda.

Severity: Medium

Confidence: Medium

Why It Matters: Para buscas de saúde mental e terapia online, conteúdo mais completo tende a demonstrar melhor experiência, segurança, critérios de escolha, dúvidas comuns e adequação do serviço.

Score Impact: -2.5 pontos em Content Quality & E-E-A-T.

Recommendation: Expandir a página com profundidade útil, mantendo linguagem clara e foco em segurança, processo terapêutico, adequação e critérios de confiança.

### F10. Página avulsa em `assets/` não demonstra os mesmos sinais de E-E-A-T do blog

Issue: `assets/5 sinais.html` não apresenta a mesma estrutura de autoria, atualização, referências, schema e integração editorial dos posts publicados.

Category: Content Quality & E-E-A-T

Evidence: O arquivo possui title e description, mas não tem JSON-LD, canonical, `og:image`, `twitter:image` ou GA segundo a varredura local. O post oficial relacionado, `blog/sinais-que-precisa-de-terapia.html`, tem `BlogPosting`, `BreadcrumbList`, `FAQPage`, canonical e metadados completos.

Severity: Medium

Confidence: High

Why It Matters: Em conteúdo de saúde mental, páginas órfãs ou antigas com menos sinais de autoria e governança podem reduzir confiança percebida e qualidade geral do conjunto indexável.

Score Impact: -5 pontos em Content Quality & E-E-A-T.

Recommendation: Consolidar o conteúdo na versão editorial oficial ou garantir que qualquer versão pública siga os mesmos padrões de E-E-A-T do blog.

### F11. A amostra orgânica ainda é pequena

Issue: Os dados exportados mostram baixa cobertura de consultas e páginas com tráfego orgânico.

Category: Authority & Trust Signals

Evidence: `seo_data/Google_organic_search_traffic_Landing_page_+_query_string.csv` registra 5 cliques e 55 impressões no período 2026-03-27 a 2026-04-23. `seo_data/Queries.csv` lista apenas 3 consultas: "psicóloga", "psicóloga macaé" e "psicólogo macaé".

Severity: Medium

Confidence: Medium

Why It Matters: A estrutura técnica pode estar correta, mas a baixa amostra dificulta validar autoridade, cobertura de tópicos e ganho real de rankings.

Score Impact: -2.5 pontos em Authority & Trust Signals.

Recommendation: Acompanhar evolução por página e consulta após limpeza de indexação e publicação consistente de conteúdo estratégico.

### F12. Um `sameAs` usa URL curta do Google em vez de perfil canônico

Status: Corrigido em 2026-04-30.

Issue: O schema usa `https://share.google/YX2GveHrzfAnZdOaW` como sinal de entidade.

Category: Authority & Trust Signals

Evidence: O JSON-LD da home e de páginas relacionadas inclui `sameAs` com Instagram, CFP, Doctoralia e `https://share.google/YX2GveHrzfAnZdOaW`.

Severity: Low

Confidence: Medium

Why It Matters: URLs curtas/redirecionadoras podem ser menos claras como identificação de entidade do que perfis canônicos e estáveis.

Score Impact: -1.5 pontos em Authority & Trust Signals.

Recommendation: Preferir URLs canônicas e estáveis nos sinais de entidade sempre que disponíveis.

## Prioritized Action Plan

### 1. Critical Blockers

Não foram encontrados bloqueadores Critical.

Expected score recovery range: 0 pontos diretos, porque não há issue crítica registrada.

### 2. High-Impact Improvements

Related findings: F1, F2, F10.

- Tratar o template indexável `blog/post-template.html`.
- Consolidar ou remover a página avulsa `assets/5 sinais.html`.
- Evitar que páginas fora da arquitetura editorial fiquem indexáveis.

Expected score recovery range: +5 a +7 pontos no score geral, principalmente por recuperar Crawlability & Indexation e Content Quality.

### 3. Quick Wins

Related findings: F3, F4, F6, F8, F12.

- Validar redirecionamento HTTP para HTTPS em produção.
- Completar dimensões de imagens em páginas públicas.
- Padronizar metadados sociais do blog index.
- Revisar headers públicos de cache/segurança no ambiente de deploy.
- Trocar URLs curtas em `sameAs` por perfis canônicos quando possível.

Expected score recovery range: +2 a +4 pontos no score geral.

### 4. Longer-Term Opportunities

Related findings: F5, F7, F9, F11.

- Medir impacto real dos vídeos de fundo em mobile.
- Refinar foco semântico da home.
- Aprofundar a página `psicologa-online.html` para intenção comercial e YMYL.
- Monitorar crescimento por consulta/página usando Search Console e Analytics.

Expected score recovery range: +2 a +5 pontos no score geral, com maior impacto esperado em tráfego e conversão do que no score técnico.

## Apêndice: Inventário de Páginas Relevantes

| Página | Status observado | Sitemap | Canonical | H1 | Schema |
| --- | --- | --- | --- | ---: | --- |
| `index.html` | index, follow | Sim | Sim | 1 | Psychologist, WebSite, ItemList, FAQPage, VideoObject |
| `psicologa-online.html` | index, follow | Sim | Sim | 1 | WebPage, Service, FAQPage, BreadcrumbList |
| `blog/index.html` | index, follow | Sim | Sim | 1 | CollectionPage, Blog, BreadcrumbList |
| `blog/culpa-materna-o-que-e-por-que-acontece-e-como-lidar.html` | index, follow | Sim | Sim | 1 | BlogPosting, BreadcrumbList, FAQPage |
| `blog/por-que-voce-nunca-se-acha-boa-o-suficiente.html` | index, follow | Sim | Sim | 1 | BlogPosting, BreadcrumbList, FAQPage |
| `blog/afinal-de-contas-o-que-e-burnout.html` | index, follow | Sim | Sim | 1 | BlogPosting, BreadcrumbList, FAQPage |
| `blog/sinais-que-precisa-de-terapia.html` | index, follow | Sim | Sim | 1 | BlogPosting, BreadcrumbList, FAQPage |
| `blog/terapia-online-funciona.html` | index, follow | Sim | Sim | 1 | BlogPosting, BreadcrumbList, FAQPage |
| `blog/por-que-mulheres-tem-mais-ansiedade.html` | index, follow | Sim | Sim | 1 | BlogPosting, BreadcrumbList |
| `politica-de-privacidade.html` | noindex, follow | Não | Sim | 1 | Não identificado |
| `admin/index.html` | noindex, nofollow | Não | Não aplicável | 3 | Excluído do escopo público |
| `blog/post-template.html` | index, follow | Não | Placeholder | 1 | BlogPosting, BreadcrumbList com placeholders |
| `assets/5 sinais.html` | Sem robots declarado | Não | Não | 1 | Não identificado |

## Limitações

- O score reflete prontidão SEO, não garantia de rankings.
- Fatores externos como concorrência, backlinks, avaliações locais, histórico de domínio e atualizações de algoritmo não foram pontuados de forma exaustiva.
- A categoria Authority & Trust Signals é direcional porque não houve auditoria de backlinks, Google Business Profile ou reputação externa.
- Core Web Vitals não foram medidos com dados de campo ou Lighthouse; os achados técnicos são baseados em evidências do código e tamanho dos assets.
- Cabeçalhos HTTP e redirecionamentos foram avaliados pelo arquivo `_headers` e dados exportados, não por teste live em produção.
