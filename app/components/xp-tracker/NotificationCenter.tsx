import type { BillingState } from "~/hooks/useBilling";

export interface AppNotification {
  title: string;
  message: string;
  tone: "yellow" | "emerald" | "cyan" | "red";
}

interface NotificationDropdownProps {
  notifications: AppNotification[];
  unreadCount: number;
  open: boolean;
  onToggle: () => void;
  buttonClassName: string;
  labelClassName: string;
  theme: {
    card: string;
    muted: string;
  };
}

function formatXP(value: number) {
  return Math.round(value).toLocaleString("pt-BR");
}

export function buildNotifications({
  billing,
  currentXP,
  totalXP,
  dailyGoal,
  xpToday,
  saveStatus,
}: {
  billing: BillingState;
  currentXP: number;
  totalXP: number;
  dailyGoal: number;
  xpToday: number;
  saveStatus: "idle" | "saving" | "saved" | "error";
}) {
  const progress =
    totalXP > 0
      ? Math.max(0, Math.min(100, ((totalXP - currentXP) / totalXP) * 100))
      : 0;

  return [
    billing.accessStatus === "trialing" && billing.trialDaysRemaining !== null
      ? {
          title: "Teste grátis ativo",
          message: `Restam ${billing.trialDaysRemaining} dia${billing.trialDaysRemaining === 1 ? "" : "s"} para manter o salvamento na nuvem sem assinatura.`,
          tone: "yellow" as const,
        }
      : null,
    billing.accessStatus === "locked"
      ? {
          title: "Acesso premium pendente",
          message: "Assine para liberar salvamento contínuo, runs e histórico inteligente.",
          tone: "red" as const,
        }
      : null,
    billing.subscription?.coupon_code
      ? {
          title: "Cupom aplicado",
          message: `${billing.subscription.coupon_code} está vinculado ao seu plano.`,
          tone: "emerald" as const,
        }
      : null,
    currentXP > 0 && progress >= 85
      ? {
          title: "Você está perto de upar",
          message: `Faltam ${formatXP(currentXP)} XP para fechar o nível atual.`,
          tone: "emerald" as const,
        }
      : null,
    dailyGoal > 0
      ? {
          title: xpToday >= dailyGoal ? "Meta diária concluída" : "Meta diária em andamento",
          message:
            xpToday >= dailyGoal
              ? `Hoje você já registrou ${formatXP(xpToday)} XP.`
              : `Faltam ${formatXP(Math.max(0, dailyGoal - xpToday))} XP para bater a meta de hoje.`,
          tone: xpToday >= dailyGoal ? ("emerald" as const) : ("cyan" as const),
        }
      : null,
    saveStatus === "error"
      ? {
          title: "Erro ao salvar",
          message: "Revise sua conexão ou tente novamente depois.",
          tone: "red" as const,
        }
      : null,
  ].filter((notification): notification is AppNotification => Boolean(notification));
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  open,
  onToggle,
  buttonClassName,
  labelClassName,
  theme,
}: NotificationDropdownProps) {
  const toneClass = {
    yellow: "border-yellow-500/20 bg-yellow-500/5 text-yellow-300",
    emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
    cyan: "border-cyan-500/20 bg-cyan-500/5 text-cyan-300",
    red: "border-red-500/20 bg-red-500/5 text-red-300",
  } as const;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Abrir notificações"
        onClick={onToggle}
        className={`${buttonClassName} relative`}
      >
        <span className="text-base md:text-lg leading-none">!</span>
        <span className={labelClassName}>Avisos</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs font-black min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={`${theme.card} fixed left-4 right-4 top-24 z-50 max-h-[70vh] overflow-y-auto rounded-2xl border p-3 shadow-[0_0_40px_rgba(234,179,8,0.18)] md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-80 md:max-h-none md:overflow-visible`}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-black text-yellow-300">
              Notificações
            </p>
            <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-[11px] font-black text-yellow-300">
              {notifications.length}
            </span>
          </div>

          {notifications.length === 0 ? (
            <p className={`${theme.muted} rounded-xl border border-yellow-500/10 bg-black/20 p-3 text-xs`}>
              Nenhum aviso no momento.
            </p>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={`${notification.title}-${notification.message}`}
                  className={`rounded-xl border p-3 ${toneClass[notification.tone]}`}
                >
                  <p className="text-sm font-black">
                    {notification.title}
                  </p>
                  <p className={`${theme.muted} mt-1 text-xs leading-relaxed`}>
                    {notification.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
