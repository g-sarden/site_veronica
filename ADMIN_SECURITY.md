# Admin seguro do blog

O admin agora depende de Cloudflare Pages Functions + Cloudflare Access.
Nenhuma senha local e nenhum token do GitHub ficam no HTML do navegador.

## Variáveis e secrets

Configure no Cloudflare Pages, em `Settings > Variables and Secrets`:

- `GITHUB_TOKEN` como secret criptografado, com permissão para editar o repositório.
- `GITHUB_OWNER`: `g-sarden`
- `GITHUB_REPO`: `site_veronica`
- `GITHUB_BRANCH`: branch de publicação, se quiser fixar uma branch.
- `CF_ACCESS_TEAM_DOMAIN`: domínio do time no Access, por exemplo `meutime.cloudflareaccess.com`.
- `CF_ACCESS_AUD`: Application Audience Tag do app protegido no Access.
- `ADMIN_ALLOWED_EMAILS`: e-mails autorizados, separados por vírgula.
- `SITE_URL`: `https://veronicagrijo.psc.br`

Para desenvolvimento local, crie um `.dev.vars` fora do git. Esse arquivo está ignorado.

## Cloudflare Access

Crie uma aplicação `Self-hosted` no Cloudflare Zero Trust protegendo:

- `/admin/*`
- `/api/*`

Use uma política `Allow` restrita ao e-mail da Verônica ou ao grupo desejado.
Depois copie o `Application Audience (AUD) Tag` para `CF_ACCESS_AUD`.

## Deploy no Cloudflare Pages

Conecte este repositório ao Cloudflare Pages.

- Build command: `npm run build:blog`
- Build output directory: `.` (raiz do projeto)
- Production branch: a branch usada para publicar o site

As Functions em `functions/api` serão publicadas junto com o site.

## Fluxo

1. A pessoa acessa `/admin/`.
2. Cloudflare Access exige login.
3. A página chama `/api/session` para confirmar o JWT do Access.
4. A publicação chama `/api/publish`.
5. A Function valida o JWT, valida origem, confere tamanho da imagem e publica no GitHub usando o secret `GITHUB_TOKEN`.
