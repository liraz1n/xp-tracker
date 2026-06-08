import { LegalPage } from "~/components/xp-tracker/LegalPage";

export function meta() {
  return [
    { title: "Termos de Uso | XP Tracker" },
    {
      name: "description",
      content:
        "Termos de Uso do XP Tracker para acesso, assinatura, teste grátis, cupons e uso do painel.",
    },
  ];
}

export default function TermsRoute() {
  return (
    <LegalPage
      eyebrow="Regras do produto"
      title="Termos de Uso"
      updatedAt="08/06/2026"
      intro="Estes termos explicam as regras básicas para usar o XP Tracker. Ao acessar o painel, entrar com Google ou contratar o plano Premium, você concorda com estas condições."
      sections={[
        {
          title: "O que é o XP Tracker",
          paragraphs: [
            "O XP Tracker é uma ferramenta de acompanhamento de progresso, runs, metas, histórico e estimativas de XP. O app ajuda na organização do jogador, mas não substitui informações oficiais do jogo.",
          ],
        },
        {
          title: "Conta e acesso",
          items: [
            "Você pode testar como visitante sem salvar dados na nuvem.",
            "Ao entrar com Google, seu progresso pode ser salvo e sincronizado pelo Supabase.",
            "Você é responsável por manter sua conta Google segura.",
            "O uso indevido, tentativa de burlar pagamento, explorar falhas ou acessar dados de terceiros pode levar ao bloqueio da conta.",
          ],
        },
        {
          title: "Teste grátis e plano Premium",
          paragraphs: [
            "O teste grátis permite usar o salvamento na nuvem por 3 dias. Após esse período, pode ser necessário assinar o plano Premium para manter recursos de sincronização e acesso completo.",
            "As condições comerciais, valores, cupons e benefícios podem mudar ao longo do tempo, respeitando os acessos já confirmados quando aplicável.",
          ],
        },
        {
          title: "Pagamentos e cupons",
          items: [
            "Os pagamentos são processados pelo Mercado Pago.",
            "O XP Tracker não armazena dados completos de cartão ou dados bancários.",
            "Cupons podem ter limite de uso, validade, desconto específico ou condição especial.",
            "O acesso Premium é liberado após confirmação do pagamento pelo backend/webhook.",
          ],
        },
        {
          title: "Convites e créditos",
          paragraphs: [
            "Usuários logados podem receber um link de convite. A cada 5 amigos convidados e qualificados, o usuário ganha 1 crédito, equivalente a R$ 0,50 de desconto no checkout Premium.",
            "Créditos não são dinheiro, não podem ser sacados e só podem ser usados como desconto dentro do XP Tracker. Convites próprios, duplicados, fraudulentos ou criados para abuso podem ser bloqueados.",
          ],
        },
        {
          title: "Dados inseridos pelo usuário",
          paragraphs: [
            "Você é responsável pelos valores de XP, níveis, runs e ajustes manuais informados no painel. O XP Tracker calcula resultados com base nesses dados e nos valores cadastrados no sistema.",
          ],
        },
        {
          title: "Disponibilidade",
          paragraphs: [
            "Faremos o possível para manter o app disponível, mas podem ocorrer instabilidades de internet, Cloudflare, Supabase, Mercado Pago, Google ou manutenção do próprio XP Tracker.",
          ],
        },
        {
          title: "Limitação de responsabilidade",
          paragraphs: [
            "O XP Tracker é uma ferramenta auxiliar. Não garantimos ganho de XP, resultado no jogo, disponibilidade permanente, ausência total de erros ou compatibilidade com alterações futuras do jogo.",
          ],
        },
        {
          title: "Privacidade",
          paragraphs: [
            "O uso de dados pessoais é explicado na Política de Privacidade. Ela faz parte destes termos e deve ser lida junto com este documento.",
          ],
        },
      ]}
    />
  );
}
