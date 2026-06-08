import { LegalPage } from "~/components/xp-tracker/LegalPage";

export function meta() {
  return [
    { title: "Política de Privacidade | XP Tracker" },
    {
      name: "description",
      content:
        "Política de Privacidade do XP Tracker, com informações sobre dados, fornecedores e direitos do usuário.",
    },
  ];
}

export default function PrivacyRoute() {
  return (
    <LegalPage
      eyebrow="Privacidade e dados"
      title="Política de Privacidade"
      updatedAt="08/06/2026"
      intro="Esta política explica, de forma simples, quais dados o XP Tracker usa para salvar seu progresso, manter sua assinatura e operar os recursos do painel."
      sections={[
        {
          title: "Dados que coletamos",
          items: [
            "Dados de login do Google fornecidos pelo Supabase Auth, como nome, e-mail e avatar quando disponíveis.",
            "Dados de progresso informados por você, como nível, XP restante, XP total, meta diária, histórico, runs, mortes e ajustes manuais.",
            "Dados de assinatura, cupons e eventos de pagamento necessários para liberar ou bloquear recursos Premium.",
            "Dados de convites, como código de indicação, usuário que convidou, usuário convidado, quantidade de convites qualificados e créditos usados no checkout.",
            "Sugestões enviadas pela Caixa de Sugestão, quando você decidir escrever uma mensagem.",
          ],
        },
        {
          title: "Por que usamos esses dados",
          items: [
            "Criar e proteger sua conta.",
            "Salvar e sincronizar seu progresso na nuvem.",
            "Calcular metas, histórico, gráficos, runs e estimativas de evolução.",
            "Processar assinatura, cupons e confirmação de pagamento.",
            "Controlar convites, créditos de indicação e descontos aplicados no checkout.",
            "Responder solicitações, corrigir problemas e melhorar o produto.",
          ],
        },
        {
          title: "Ferramentas e fornecedores",
          paragraphs: [
            "O XP Tracker usa fornecedores externos para operar o serviço. O Google pode ser usado para autenticação, o Supabase armazena autenticação e banco de dados, a Cloudflare hospeda o site e executa funções de backend, e o Mercado Pago processa pagamentos.",
            "Esses fornecedores podem processar dados fora do Brasil conforme seus próprios termos, políticas e contratos de processamento de dados.",
          ],
        },
        {
          title: "Cookies e analytics",
          paragraphs: [
            "No momento, o XP Tracker não usa cookies de publicidade, rastreamento comercial ou analytics de terceiros para criar perfil de navegação.",
            "Podemos usar apenas recursos técnicos necessários para login, sessão, segurança, preferência de tema e funcionamento do app. Se analytics, pixels ou cookies não essenciais forem adicionados no futuro, esta política deverá ser atualizada e o usuário será informado quando necessário.",
          ],
        },
        {
          title: "Registro de fornecedores",
          items: [
            "Google: autenticação e dados básicos do perfil usado no login.",
            "Supabase: autenticação, banco de dados, políticas de acesso e armazenamento do progresso.",
            "Cloudflare: hospedagem, entrega do site e execução das funções de backend.",
            "Mercado Pago: checkout, Pix, cartão, status de pagamento e confirmação por webhook.",
          ],
        },
        {
          title: "Pagamentos",
          paragraphs: [
            "O XP Tracker não armazena número de cartão, código de segurança, senha bancária ou chave Pix. O pagamento é processado pelo Mercado Pago em ambiente próprio.",
            "Nós armazenamos apenas informações necessárias para confirmar o acesso, como status do pagamento, plano, cupom aplicado, valor e identificadores técnicos do evento.",
          ],
        },
        {
          title: "Base legal",
          paragraphs: [
            "Tratamos dados para executar o serviço contratado ou solicitado por você, cumprir obrigações relacionadas a pagamento e segurança, e melhorar a experiência do produto dentro dos limites permitidos pela LGPD.",
          ],
        },
        {
          title: "Segurança",
          items: [
            "Usamos autenticação pelo Supabase e Google.",
            "As tabelas do Supabase devem operar com Row Level Security para isolar dados por usuário.",
            "Chaves privadas de Supabase e Mercado Pago ficam no backend, não no navegador.",
            "Pagamentos são validados por backend e webhook antes da liberação definitiva do plano.",
          ],
        },
        {
          title: "Seus direitos",
          paragraphs: [
            "Você pode solicitar acesso, correção ou exclusão dos seus dados pessoais. Também pode excluir a conta dentro do painel, quando a função estiver disponível para seu usuário.",
            "Enquanto um canal oficial de privacidade não estiver publicado, pedidos relacionados a dados podem ser enviados pela Caixa de Sugestão do app. Após a criação do contato oficial, esta política deverá ser atualizada com o endereço correto.",
          ],
        },
        {
          title: "Retenção",
          paragraphs: [
            "Mantemos os dados enquanto sua conta existir ou enquanto forem necessários para operação, segurança, suporte, histórico de pagamento e obrigações legais. Ao excluir a conta, os dados vinculados ao usuário devem ser removidos conforme as regras técnicas do banco.",
          ],
        },
      ]}
    />
  );
}
