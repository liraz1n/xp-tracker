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
    </section>
  );
}
