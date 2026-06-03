type PaymentReturnStatus = "success" | "pending" | "failure";

interface PaymentReturnCardProps {
  status: PaymentReturnStatus | null;
  theme: {
    card: string;
    muted: string;
    text: string;
  };
}

const PAYMENT_COPY = {
  success: {
    title: "Pagamento aprovado",
    message: "Recebemos a confirmação do Mercado Pago. Seu acesso Premium será mantido enquanto o plano estiver em dia.",
    tone: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  },
  pending: {
    title: "Pagamento pendente",
    message: "O Mercado Pago ainda está processando o pagamento. Se for Pix, a confirmação pode levar alguns instantes.",
    tone: "border-yellow-500/25 bg-yellow-500/10 text-yellow-300",
  },
  failure: {
    title: "Pagamento não concluído",
    message: "O pagamento não foi aprovado. Você pode tentar novamente pelo botão Plano.",
    tone: "border-red-500/25 bg-red-500/10 text-red-300",
  },
};

export function PaymentReturnCard({ status, theme }: PaymentReturnCardProps) {
  if (!status) return null;

  const copy = PAYMENT_COPY[status];

  return (
    <section className={`${theme.card} mb-4 md:mb-5 rounded-3xl border p-4 md:p-5`}>
      <div className={`rounded-2xl border p-4 ${copy.tone}`}>
        <p className="text-lg font-black">
          {copy.title}
        </p>
        <p className={`${theme.muted} mt-1 text-sm leading-relaxed`}>
          {copy.message}
        </p>
      </div>
    </section>
  );
}
