import { useState } from "react";
import { supabase } from "~/supabase";
import type { BillingState } from "~/hooks/useBilling";
import type { HistoryEntry } from "~/hooks/useXpTracker";

interface AdminPanelCardProps {
  userName?: string;
  userEmail?: string;
  billing: BillingState;
  history: HistoryEntry[];
  currentXP: number;
  totalXP: number;
  isSuperAdmin: boolean;
  adminUsers?: AdminUserOverview[];
  theme: {
    card: string;
    muted: string;
    text: string;
  };
}

export interface AdminUserOverview {
  user_id: string;
  email: string;
  display_name: string | null;
  subscription_status: string | null;
  plan: string | null;
  coupon_code: string | null;
  current_period_ends_at: string | null;
  payment_events_count: number;
  last_payment_status: string | null;
  progress_updated_at: string | null;
  total_xp: number | null;
  current_xp: number | null;
  user_total_xp: number | null;
}

function formatXP(value: number) {
  return Math.round(value).toLocaleString("pt-BR");
}

function maskEmail(email?: string) {
  if (!email) return "Sem email";

  const [name, domain] = email.split("@");
  if (!domain) return email;

  return `${name.slice(0, 2)}***@${domain}`;
}

export function AdminPanelCard({
  userName,
  userEmail,
  billing,
  history,
  currentXP,
  totalXP,
  isSuperAdmin,
  adminUsers = [],
  theme,
}: AdminPanelCardProps) {
  const [reconcileInput, setReconcileInput] = useState("");
  const [reconcileLoading, setReconcileLoading] = useState(false);
  const [reconcileResult, setReconcileResult] = useState("");
  const totalHistoryXP = history.reduce((sum, entry) => sum + entry.xpGained, 0);
  const paymentsStatus =
    billing.accessStatus === "active"
      ? "Assinatura ativa"
      : billing.accessStatus === "trialing"
        ? "Teste grátis"
        : billing.accessStatus === "locked"
          ? "Acesso bloqueado"
          : billing.accessStatus === "setup_pending"
            ? "Banco pendente"
        : billing.accessStatus;

  async function reconcilePayments() {
    const payments = reconcileInput
      .split(/\n|;/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [paymentId, email] = line.split(",").map((part) => part.trim());

        return { paymentId, email };
      })
      .filter((payment) => payment.paymentId);

    if (payments.length === 0) {
      setReconcileResult("Informe pelo menos uma transação.");
      return;
    }

    setReconcileLoading(true);
    setReconcileResult("");

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      setReconcileResult("Sessão expirada. Entre novamente.");
      setReconcileLoading(false);
      return;
    }

    const response = await fetch("/api/billing/mercadopago/admin-reconcile", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ payments }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      error?: string;
      results?: Array<{
        ok: boolean;
        paymentId: string;
        email?: string | null;
        couponCode?: string | null;
        amountCents?: number | null;
        error?: string;
      }>;
    };

    setReconcileLoading(false);

    if (!response.ok) {
      setReconcileResult(result.error ?? "Não foi possível reconciliar.");
      return;
    }

    const summary = (result.results ?? [])
      .map((item) =>
        item.ok
          ? `${item.paymentId}: ${item.email ?? "sem email"} -> ${
              item.couponCode ?? "sem cupom"
            }`
          : `${item.paymentId}: erro - ${item.error ?? "falhou"}`
      )
      .join("\n");

    setReconcileResult(summary || "Nenhum resultado retornado.");
  }

  return (
    <section className={`${theme.card} border rounded-3xl p-4 md:p-5 mb-4 md:mb-5`}>
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-yellow-400 text-xs md:text-sm font-black mb-1">
            Painel admin
          </p>
          <h2 className="text-xl md:text-2xl font-black text-yellow-300">
            Operação do usuário
          </h2>
          <p className={`${theme.muted} mt-1.5 text-xs md:text-sm`}>
            Visão rápida para suporte, plano, cupons e saúde do progresso.
          </p>
        </div>
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
          {isSuperAdmin ? "Superadmin" : "Local seguro"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-yellow-500/15 bg-black/20 p-4">
          <p className={`${theme.muted} text-xs font-black uppercase`}>
            Usuário
          </p>
          <p className={`${theme.text} mt-1 text-sm font-black`}>
            {userName ?? "Sem nome"}
          </p>
          <p className={`${theme.muted} mt-1 text-xs`}>
            {maskEmail(userEmail)}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
          <p className={`${theme.muted} text-xs font-black uppercase`}>
            Plano
          </p>
          <p className="mt-1 text-sm font-black text-emerald-300">
            {paymentsStatus}
          </p>
          <p className={`${theme.muted} mt-1 text-xs`}>
            {billing.subscription?.coupon_code
              ? `Cupom ${billing.subscription.coupon_code}`
              : "Sem cupom vinculado"}
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-4">
          <p className={`${theme.muted} text-xs font-black uppercase`}>
            Progresso
          </p>
          <p className="mt-1 text-sm font-black text-cyan-300">
            {formatXP(currentXP)} XP restante
          </p>
          <p className={`${theme.muted} mt-1 text-xs`}>
            Total para upar: {formatXP(totalXP)}
          </p>
        </div>

        <div className="rounded-2xl border border-indigo-500/15 bg-indigo-500/5 p-4">
          <p className={`${theme.muted} text-xs font-black uppercase`}>
            Histórico
          </p>
          <p className="mt-1 text-sm font-black text-indigo-300">
            {history.length} registros
          </p>
          <p className={`${theme.muted} mt-1 text-xs`}>
            {formatXP(totalHistoryXP)} XP salvo
          </p>
        </div>
      </div>

      {isSuperAdmin && adminUsers.length > 0 && (
        <div className="mt-3 rounded-2xl border border-yellow-500/15 bg-black/20 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-black text-yellow-300">
              Usuários do XP Tracker
            </p>
            <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-300">
              {adminUsers.length}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {adminUsers.slice(0, 6).map((row) => (
              <div
                key={row.user_id}
                className="grid grid-cols-1 gap-2 rounded-xl border border-yellow-500/10 bg-black/20 p-3 md:grid-cols-[1.4fr_1fr_1fr_auto]"
              >
                <div>
                  <p className={`${theme.text} text-sm font-black`}>
                    {row.display_name ?? row.email}
                  </p>
                  <p className={`${theme.muted} text-xs`}>
                    {row.email}
                  </p>
                </div>
                <p className="text-sm font-black text-emerald-300">
                  {row.subscription_status ?? "sem plano"}
                </p>
                <p className={`${theme.muted} text-sm`}>
                  {row.coupon_code ? `Cupom ${row.coupon_code}` : "Sem cupom"}
                </p>
                <p className="text-sm font-black text-cyan-300">
                  {formatXP(row.current_xp ?? 0)} XP
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isSuperAdmin && (
        <div className="mt-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
          <div className="mb-3">
            <p className="font-black text-emerald-300">
              Reconciliar Mercado Pago
            </p>
            <p className={`${theme.muted} mt-1 text-xs leading-relaxed`}>
              Cole uma transação por linha. Use apenas o ID ou ID,email quando o pagamento não veio do checkout logado.
            </p>
          </div>

          <textarea
            value={reconcileInput}
            onChange={(event) => setReconcileInput(event.target.value)}
            placeholder={"163193888630\n163193024228,email@exemplo.com"}
            className="min-h-24 w-full rounded-2xl border border-emerald-500/20 bg-black/35 p-3 text-sm font-bold text-white outline-none transition-all focus:border-emerald-400"
          />

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <button
              type="button"
              onClick={reconcilePayments}
              disabled={reconcileLoading}
              className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-black transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {reconcileLoading ? "Reconciliando..." : "Reconciliar transações"}
            </button>

            {reconcileResult && (
              <pre className="max-h-32 flex-1 overflow-auto whitespace-pre-wrap rounded-2xl border border-emerald-500/15 bg-black/30 p-3 text-xs leading-relaxed text-emerald-200">
                {reconcileResult}
              </pre>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
