import { ACTIVE_COUPON_PREVIEWS, type BillingState } from "~/hooks/useBilling";
import { SubscriptionCard } from "~/components/xp-tracker/SubscriptionCard";
import { XIcon } from "~/components/xp-tracker/UiIcons";

interface SubscriptionPanelProps {
  open: boolean;
  billing: BillingState;
  theme: {
    card: string;
    input: string;
    muted: string;
    text: string;
  };
  onClose: () => void;
}

export function SubscriptionPanel({
  open,
  billing,
  theme,
  onClose,
}: SubscriptionPanelProps) {
  if (!open) return null;

  const subscription = billing.subscription;
  const isLifetimePlan = subscription?.plan === "premium_lifetime";
  const renewalDate = subscription?.current_period_ends_at
    ? new Date(subscription.current_period_ends_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;
  const trialDate = billing.trialEndsAt
    ? new Date(billing.trialEndsAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className={`${theme.card} relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border p-5 md:p-8 shadow-[0_0_60px_rgba(234,179,8,0.18)]`}>
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-yellow-400">
              Assinatura
            </p>
            <h2 className="mt-1 text-3xl font-black text-yellow-300">
              Painel do plano
            </h2>
            <p className={`${theme.muted} mt-2 max-w-2xl`}>
              Acompanhe seu acesso, teste grátis, cupons e checkout Premium.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`${theme.muted} absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-red-500/35 bg-red-500/10 text-red-200 transition-all hover:border-red-400 hover:bg-red-500/20 hover:text-red-100 md:right-6 md:top-6`}
            aria-label="Fechar painel do plano"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <SubscriptionCard
          billing={billing}
          alwaysShow
          checkoutLoading={billing.checkoutLoading}
          theme={theme}
          onCheckout={billing.startCheckout}
        />

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className={`${theme.muted} text-xs font-black uppercase`}>
              Plano atual
            </p>
            <p className="mt-1 font-black text-emerald-300">
              {billing.planLabel}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
            <p className={`${theme.muted} text-xs font-black uppercase`}>
              {isLifetimePlan ? "Valor vitalício" : "Valor mensal"}
            </p>
            <p className="mt-1 font-black text-yellow-300">
              {isLifetimePlan ? "R$ 20,00" : billing.priceLabel}
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <p className={`${theme.muted} text-xs font-black uppercase`}>
              Teste grátis
            </p>
            <p className="mt-1 font-black text-cyan-300">
              {trialDate ?? "Não ativo"}
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
            <p className={`${theme.muted} text-xs font-black uppercase`}>
              {isLifetimePlan ? "Acesso" : "Renovação"}
            </p>
            <p className="mt-1 font-black text-indigo-300">
              {isLifetimePlan ? "Vitalício" : renewalDate ?? "Aguardando"}
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-yellow-500/15 bg-black/20 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <p className={`${theme.muted} text-xs font-black uppercase`}>
                Cupom aplicado
              </p>
              <p className={`${theme.text} mt-1 font-black`}>
                {subscription?.coupon_code ?? "Nenhum"}
              </p>
            </div>
            <div>
              <p className={`${theme.muted} text-xs font-black uppercase`}>
                Desconto
              </p>
              <p className={`${theme.text} mt-1 font-black`}>
                {subscription?.discount_percent
                  ? `${subscription.discount_percent}%`
                  : subscription?.discount_amount_cents
                    ? `${(subscription.discount_amount_cents / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}`
                    : "Sem desconto"}
              </p>
            </div>
            <div>
              <p className={`${theme.muted} text-xs font-black uppercase`}>
                Checkout
              </p>
              <p className={`${theme.text} mt-1 font-black`}>
                Pix ou cartão seguro
              </p>
            </div>
          </div>
        </div>

        {billing.checkoutError && (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm font-bold text-red-300">
            {billing.checkoutError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {ACTIVE_COUPON_PREVIEWS.map((coupon) => (
            <div
              key={coupon.code}
              className="rounded-2xl border border-yellow-500/20 bg-black/25 p-4"
            >
              <p className="text-xs font-black uppercase tracking-wide text-yellow-400">
                {coupon.code}
              </p>
              <h3 className="mt-1 font-black text-white">{coupon.title}</h3>
              <p className={`${theme.muted} mt-2 text-sm leading-relaxed`}>
                {coupon.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <h3 className="font-black text-emerald-300">
            Pagamento seguro
          </h3>
          <p className={`${theme.muted} mt-2 text-sm leading-relaxed`}>
            O pagamento é processado em ambiente seguro por uma instituição de pagamentos regulada. Seus dados de cartão e Pix não ficam expostos nem são armazenados pelo XP Tracker.
          </p>
        </div>
      </div>
    </div>
  );
}
