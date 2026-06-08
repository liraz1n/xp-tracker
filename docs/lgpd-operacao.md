# LGPD - Rotina operacional do XP Tracker

Este documento e um guia interno para operar pedidos de privacidade no XP Tracker. Ele nao substitui revisao juridica, mas ajuda a manter um processo consistente.

## Dados tratados

- Conta: nome, e-mail, avatar e identificador do usuario pelo Supabase Auth/Google.
- Progresso: nivel, XP restante, XP total, meta diaria, historico, runs, mortes, boosts e ajustes manuais.
- Assinatura: plano, status, trial, cupom, datas de periodo e registros tecnicos de pagamento.
- Convites: codigo de indicacao, usuario que convidou, usuario convidado, convites qualificados e creditos usados no checkout.
- Sugestoes: texto enviado pelo usuario na Caixa de Sugestao.

## Fornecedores

- Google: login social e dados basicos do perfil.
- Supabase: autenticacao, banco de dados e Row Level Security.
- Cloudflare: hospedagem, entrega do site e backend por Pages Functions.
- Mercado Pago: checkout, Pix, cartao, status de pagamento e webhook.

## Cookies e analytics

- Nao usar cookies de publicidade, pixel ou analytics de terceiros sem atualizar a Politica de Privacidade.
- Se adicionar analytics no futuro, registrar finalidade, fornecedor, dados coletados, base legal e necessidade de consentimento.
- Recursos tecnicos de sessao, login, seguranca e preferencia do app podem ser tratados como necessarios ao funcionamento.

## Pedidos dos titulares

Quando um usuario pedir acesso, correcao ou exclusao:

1. Confirmar a identidade pelo e-mail da conta.
2. Registrar a data do pedido e o tipo de solicitacao.
3. Localizar dados vinculados ao `user_id` no Supabase.
4. Responder de forma clara, evitando expor dados de outro usuario.
5. Se for exclusao, usar a funcao de deletar conta ou remover os registros vinculados ao usuario conforme as politicas do banco.
6. Guardar apenas registro minimo da solicitacao quando necessario para seguranca ou obrigacao legal.

## Checklist antes do lancamento

- Politica de Privacidade publicada e linkada no rodape.
- Termos de Uso publicados e linkados no rodape.
- Aviso de privacidade visivel antes do login.
- RLS habilitado nas tabelas com dados pessoais.
- Service role e token do Mercado Pago apenas no Cloudflare, nunca no front-end.
- Webhook de pagamento validando assinatura antes de liberar plano.
- Convites e creditos controlados no Supabase/backend, sem depender de LocalStorage para saldo ou desconto.
- Canal oficial de privacidade definido quando o e-mail/domino estiverem prontos.

## Revisao periodica

Revisar este documento e as paginas publicas sempre que:

- adicionar novo fornecedor;
- adicionar analytics, cookies, pixel ou monitoramento;
- mudar o fluxo de pagamento;
- mudar os dados salvos no Supabase;
- criar recurso social entre usuarios;
- criar dominio/e-mail oficial de contato.
