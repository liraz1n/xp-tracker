# Pagamentos e assinaturas

Build 1.4.2 mantém a base comercial do XP Tracker, adiciona o painel de assinatura no cabeçalho e reforça a compatibilidade de carregamento após refresh.

## Plano inicial

- Trial: 7 dias grátis para usuários autenticados.
- Premium: R$ 5,00 por mês.
- Visitante: pode testar a ferramenta, mas não salva na nuvem de forma permanente.

## Cupons iniciais

- BETA50: 50% de desconto por 3 meses.
- LIRA: primeiro mês grátis.
- FOUNDERS: R$ 2,50 por mês para os primeiros 20 apoiadores.

## O que já existe nesta etapa

- Script SQL para tabelas de assinaturas, cupons e resgates.
- Criação automática de trial quando um usuário novo é criado no Supabase Auth.
- Backfill para usuários já existentes.
- RLS para leitura segura da própria assinatura.
- Card visual e painel do plano no site para comunicar trial, Premium e cupom.

## Próxima etapa

Conectar o checkout real em uma camada segura de back-end, usando Cloudflare Worker ou Supabase Edge Function. A chave secreta do provedor de pagamento nunca deve ficar no front-end.
