import { useMemo, useState } from "react";
import {
  findCouponPreview,
  formatCurrencyCents,
  type BillingState,
  type CheckoutPaymentMode,
} from "~/hooks/useBilling";

interface SubscriptionCardProps {
  billing: BillingState;
  alwaysShow?: boolean;
  checkoutLoading?: boolean;
  theme: {
    card: string;
    input: string;
    muted: string;
    text: string;
  };
  onCheckout?: (
    couponCode: string,
    paymentMode?: CheckoutPaymentMode,
    useReferralCredits?: boolean
  ) => void;
}

export function SubscriptionCard({
  billing,
  alwaysShow = false,
  checkoutLoading = false,
  theme,
  onCheckout,
}: SubscriptionCardProps) {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [couponFeedback, setCouponFeedback] = useState("");
  const [useReferralCredits, setUseReferralCredits] = useState(false);
  const couponPreview = useMemo(
    () => findCouponPreview(couponCode),
    [couponCode]
  );
  const appliedCouponPreview = useMemo(
    () => findCouponPreview(appliedCouponCode),
    [appliedCouponCode]
  );
  const typedCouponCode = couponCode.trim().toUpperCase();
  const checkoutCouponCode =
    appliedCouponCode || (findCouponPreview(typedCouponCode) ? typedCouponCode : "");

  if (
    !alwaysShow &&
    (billing.accessStatus === "guest" ||
      billing.accessStatus === "loading" ||
      billing.accessStatus === "setup_pending" ||
      billing.accessStatus === "active")
  ) {
    return null;
  }

  const isLocked = billing.accessStatus === "locked";
  const isActive = billing.accessStatus === "active";
  const isGuest = billing.accessStatus === "guest";
  const isSetupPending = billing.accessStatus === "setup_pending";
  const isFoundersLifetime = checkoutCouponCode === "FOUNDERS";
  const referralAvailableCents = billing.referralSummary?.availableCents ?? 0;
  const canUseReferralCredits = referralAvailableCents > 0 && !isFoundersLifetime;
  const trialDays =
    billing.trialDaysRemaining === null ? 0 : billing.trialDaysRemaining;

  const statusLabel = isActive
    ? billing.isSuperAdmin
      ? "Superadmin"
      : "Premium ativo"
    : isLocked
      ? "Teste encerrado"
      : isGuest
        ? "Modo visitante"
        : isSetupPending
          ? "Tem um cupom?"
          : `${trialDays} dias grátis restantes`;

  function handleCouponChange(value: string) {
    setCouponCode(value);
    setAppliedCouponCode("");
    setCouponFeedback("");
  }

  function applyCoupon() {
    const normalizedCode = couponCode.trim().toUpperCase();
    const preview = findCouponPreview(normalizedCode);

    if (!normalizedCode) {
      setAppliedCouponCode("");
      setCouponFeedback("Digite um cupom para aplicar.");
      return;
    }

    if (!preview) {
      setAppliedCouponCode("");
      setCouponFeedback("Cupom não encontrado.");
      return;
    }

    setCouponCode(normalizedCode);
    setAppliedCouponCode(normalizedCode);
    setCouponFeedback(`Cupom ${preview.code} aplicado. Ele será enviado ao checkout.`);
  }

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
                    ? "Entre no teste grátis de 3 dias e assine para manter o salvamento na nuvem após o período inicial."
                    : "Durante o teste grátis de 3 dias, você usa os recursos completos e salva na nuvem. Depois, assine para continuar sincronizando o progresso."}
          </p>

          {billing.accessStatus === "trialing" && (
            <p className="mt-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm font-bold text-yellow-200">
              O login com Google não mantém a nuvem grátis para sempre: seu progresso sincroniza durante o teste de 3 dias. Após o teste, a assinatura mantém o acesso e o salvamento contínuo.
            </p>
          )}
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
              onChange={(event) => handleCouponChange(event.target.value)}
              placeholder="Cupom"
              className={`${theme.input} h-10 w-28 rounded-xl border px-3 text-sm font-bold uppercase outline-none focus:border-yellow-400`}
            />

            <button
              type="button"
              onClick={applyCoupon}
              className="h-10 rounded-xl border border-yellow-500/30 px-3 text-xs font-black text-yellow-300 transition-all hover:border-yellow-400"
            >
              Aplicar
            </button>
          </div>

          {(couponFeedback || couponCode.trim()) && (
            <p
              className={`max-w-56 text-xs leading-relaxed ${
                appliedCouponPreview
                  ? "text-emerald-300"
                  : couponPreview
                    ? "text-yellow-300"
                    : "text-red-300"
              }`}
            >
              {couponFeedback ||
                (couponPreview
                  ? `${couponPreview.code}: clique em Aplicar para usar este cupom.`
                  : "Cupom não encontrado.")}
            </p>
          )}

          {!isGuest && (
            <label
              className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs leading-relaxed ${
                canUseReferralCredits
                  ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-200"
                  : "border-yellow-500/10 bg-black/20 text-zinc-500"
              }`}
            >
              <input
                type="checkbox"
                checked={useReferralCredits && canUseReferralCredits}
                onChange={(event) => setUseReferralCredits(event.target.checked)}
                disabled={!canUseReferralCredits}
                className="mt-0.5 accent-emerald-400"
              />
              <span>
                Usar créditos de convite
                <strong className="block text-emerald-300">
                  {canUseReferralCredits
                    ? `${formatCurrencyCents(referralAvailableCents)} disponíveis`
                    : "Sem créditos disponíveis"}
                </strong>
              </span>
            </label>
          )}

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() =>
                onCheckout?.(
                  checkoutCouponCode,
                  "pix",
                  useReferralCredits && canUseReferralCredits
                )
              }
              disabled={!onCheckout || checkoutLoading || isActive || isGuest}
              className="rounded-xl bg-gradient-to-r from-yellow-300 to-amber-600 px-4 py-3 text-sm font-black text-black transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              {checkoutLoading
                ? "Abrindo checkout..."
                : isActive
                  ? "Premium ativo"
                  : isFoundersLifetime
                    ? "Pagar vitalício com Pix"
                    : "Assinar com Pix"}
            </button>

            <button
              type="button"
              onClick={() =>
                onCheckout?.(
                  checkoutCouponCode,
                  "card",
                  useReferralCredits && canUseReferralCredits
                )
              }
              disabled={!onCheckout || checkoutLoading || isActive || isGuest}
              className="rounded-xl border border-yellow-500/35 bg-yellow-400/10 px-4 py-3 text-sm font-black text-yellow-300 transition-all hover:border-yellow-400 hover:bg-yellow-400/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkoutLoading
                ? "Abrindo cartão..."
                : isFoundersLifetime
                  ? "Pagar vitalício com Cartão"
                  : "Assinar com Cartão"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
