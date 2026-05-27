import { useMemo, useState } from "react";
import {
  findCouponPreview,
  type BillingState,
} from "~/hooks/useBilling";

interface SubscriptionCardProps {
  billing: BillingState;
  alwaysShow?: boolean;
  theme: {
    card: string;
    input: string;
    muted: string;
    text: string;
  };
}

export function SubscriptionCard({
  billing,
  alwaysShow = false,
  theme,
}: SubscriptionCardProps) {
  const [couponCode, setCouponCode] = useState("");
  const couponPreview = useMemo(
    () => findCouponPreview(couponCode),
    [couponCode]
  );

  if (
    !alwaysShow &&
    (billing.accessStatus === "guest" ||
      billing.accessStatus === "loading" ||
      billing.accessStatus === "setup_pending")
  ) {
    return null;
  }

  const isLocked = billing.accessStatus === "locked";
  const isActive = billing.accessStatus === "active";
  const isGuest = billing.accessStatus === "guest";
  const isSetupPending = billing.accessStatus === "setup_pending";
  const trialDays =
    billing.trialDaysRemaining === null ? 0 : billing.trialDaysRemaining;

  const statusLabel = isActive
    ? "Premium ativo"
    : isLocked
      ? "Teste encerrado"
      : isGuest
        ? "Modo visitante"
        : isSetupPending
          ? "Banco pendente"
          : `${trialDays} dias grátis restantes`;

  return (
    <section
      className={`${theme.card} mb-4 md:mb-5 border rounded-3xl p-4 md:p-5 shadow-[0_0_34px_rgba(234,179,8,0.08)]`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-yellow-400">
            Plano e acesso
          </p>

          <h2 className="mt-1 text-xl md:text-2xl font-black text-yellow-300">
            Premium por {billing.priceLabel}/mês
          </h2>

          <p className={`${theme.muted} mt-2 max-w-2xl text-sm leading-relaxed`}>
            {isLocked
              ? "Seu teste grátis terminou. Assine para liberar registro rápido de runs, conquistas de uso, histórico inteligente e salvamento contínuo na nuvem."
              : isActive
                ? "Sua assinatura está ativa. O acesso completo permanece liberado enquanto o plano estiver em dia."
                : isGuest
                  ? "Entre com Google para iniciar o teste grátis e salvar seu progresso na nuvem."
                  : isSetupPending
                    ? "Rode o script SQL de assinaturas no Supabase para ativar trial, cupons e controle de plano."
                    : "Durante o teste grátis, você usa os recursos completos. Depois, o plano Premium continua por R$ 5,00/mês."}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-3 rounded-2xl border border-yellow-500/20 bg-black/30 p-3">
          <span
            className={`rounded-full border px-3 py-1 text-center text-xs font-black ${
              isLocked
                ? "border-red-500/30 bg-red-500/10 text-red-300"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            }`}
          >
            {statusLabel}
          </span>

          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder="Cupom"
              className={`${theme.input} h-10 w-28 rounded-xl border px-3 text-sm font-bold uppercase outline-none focus:border-yellow-400`}
            />

            <button
              type="button"
              className="h-10 rounded-xl border border-yellow-500/30 px-3 text-xs font-black text-yellow-300 transition-all hover:border-yellow-400"
            >
              Aplicar
            </button>
          </div>

          {couponCode.trim() && (
            <p
              className={`max-w-56 text-xs leading-relaxed ${
                couponPreview ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {couponPreview
                ? `${couponPreview.code}: ${couponPreview.title}`
                : "Cupom não encontrado nesta prévia."}
            </p>
          )}

          <button
            type="button"
            disabled
            className="rounded-xl bg-gradient-to-r from-yellow-300 to-amber-600 px-4 py-3 text-sm font-black text-black opacity-70"
            title="O checkout real será conectado na próxima etapa."
          >
            Checkout em implantação
          </button>
        </div>
      </div>
    </section>
  );
}
