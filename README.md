# XP Tracker

Aplicacao web para acompanhar progresso de XP, runs de farm, metas diarias, historico e assinatura premium. O projeto usa React Router em modo SPA, Supabase para autenticacao/dados e Cloudflare Pages Functions para checkout e webhooks do Mercado Pago.

## O que existe hoje

- Login com Google via Supabase Auth e modo visitante.
- Onboarding para configurar XP total, XP atual, meta diaria e niveis.
- Dashboard com progresso, estimativas, ranking de metas, marcos de uso e historico inteligente.
- Registro rapido de runs, duplicacao de registros, desfazer ultimo progresso e penalidade de morte.
- Persistencia em nuvem para usuarios autenticados com acesso liberado.
- Trial de 3 dias, bloqueio apos trial, checkout Mercado Pago, cupons e webhook de pagamento.
- Painel superadmin com visao de usuarios, plano, cupons, pagamentos e progresso.
- Scripts SQL versionados em `supabase/sql`.

## Stack

- React 19 + React Router 7
- Vite 6
- Tailwind CSS 4
- Supabase
- Cloudflare Pages Functions / Wrangler
- Mercado Pago Checkout
- Recharts

## Desenvolvimento local

Instale dependencias:

```bash
npm install
```

Rode o app:

```bash
npm run dev
```

Valide tipos e build:

```bash
npm run typecheck
npm run build
```

## Deploy

Deploy para Cloudflare Pages:

```bash
npm run deploy
```

O script faz build, remove configuracoes geradas que atrapalham Pages e publica `build/client` no projeto `xp-tracker`.

## Variaveis e segredos

Configure os segredos no ambiente da Cloudflare:

- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_BASE_URL` opcional, usado para montar URLs absolutas de retorno e webhook

A chave publica do Supabase fica no cliente em `app/supabase.ts`. A service role deve ficar somente no ambiente seguro da Cloudflare.

## Banco de dados

Aplique os SQLs em ordem:

1. `supabase/sql/001_xp_progress_rls.sql`
2. `supabase/sql/002_billing_subscriptions.sql`
3. `supabase/sql/003_user_total_xp.sql`
4. `supabase/sql/004_security_audit.sql`
5. `supabase/sql/005_admin_payment_logs_badges.sql`

## Documentos de apoio

- `docs/pagamentos-assinaturas.md`
- `docs/dados-criptas.md`
- `docs/xp-tracker-apresentacao-lira-labs.html`

## Estado tecnico

Ultima verificacao local:

- `npm run typecheck`
- `npm run build`

Avisos conhecidos: React Router mostra future flags da v8 e o bundle principal passa de 500 kB. Isso nao impede o build.
