# Pagamentos e assinaturas

Build 1.4.7 documenta o estado atual da base comercial do XP Tracker: trial, plano Premium, checkout Mercado Pago, cupons ativos, webhook assinado e painel superadmin.

## Plano inicial

- Trial: 3 dias gratis para usuarios autenticados.
- Premium: R$ 5,99 por mes.
- Visitante: pode testar a ferramenta, mas nao salva na nuvem de forma permanente.

## Cupons ativos

- BETA50: 50% de desconto por 6 meses.
- TOFUS: 50% de desconto para os 10 primeiros usos.
- FOUNDERS: R$ 2,50 por mes para os 10 primeiros assinantes.

## O que ja existe nesta etapa

- Script SQL para tabelas de assinaturas, cupons e resgates.
- Criacao automatica de trial quando um usuario novo e criado no Supabase Auth.
- Backfill para usuarios ja existentes.
- RLS para leitura segura da propria assinatura.
- Card visual e painel do plano no site para comunicar trial, Premium e cupom.
- Endpoint seguro de checkout em `functions/api/billing/mercadopago/checkout.ts`.
- Webhook Mercado Pago com verificacao de assinatura em `functions/api/billing/mercadopago/webhook.ts`.
- Registro de eventos de pagamento em `payment_events`.
- Atualizacao de assinatura ativa quando o pagamento aprovado chega pelo webhook.
- Painel superadmin para suporte, plano, cupons e saude do progresso.

## Proxima etapa

- Validar o fluxo completo no ambiente real/sandbox do Mercado Pago.
- Conferir se `APP_BASE_URL`, `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET` e `SUPABASE_SERVICE_ROLE_KEY` estao configurados na Cloudflare.
- Revisar os textos com acento que aparecem com mojibake no terminal Windows, caso o problema tambem apareca no navegador.
