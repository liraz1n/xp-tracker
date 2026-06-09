import { XIcon } from "~/components/xp-tracker/UiIcons";
import { HEADER_GLYPHS } from "~/components/xp-tracker/StableGlyphs";
import type { BillingState } from "~/hooks/useBilling";

export interface AppNotification {
  title: string;
  message: string;
  tone: "yellow" | "emerald" | "cyan" | "red";
  action?: "subscription";
  actionLabel?: string;
}

interface NotificationDropdownProps {
  notifications: AppNotification[];
  unreadCount: number;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onOpenSubscription: () => void;
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
  const trialDays = billing.trialDaysRemaining ?? 0;
  const trialEndingSoon =
    billing.accessStatus === "trialing" &&
    billing.trialDaysRemaining !== null &&
    billing.trialDaysRemaining <= 1;

  const notifications: Array<AppNotification | null> = [
    billing.accessStatus === "trialing" && billing.trialDaysRemaining !== null
      ? {
          title: trialEndingSoon
            ? "Seu teste termina em breve"
            : "Teste grátis ativo",
          message: trialEndingSoon
            ? "Assine agora para manter seu progresso salvo na nuvem, sem perder acesso aos recursos Premium."
            : `Restam ${trialDays} dia${
                trialDays === 1 ? "" : "s"
              } de teste grátis. Assine antes do prazo acabar para continuar salvando na nuvem.`,
          tone: trialEndingSoon ? ("red" as const) : ("yellow" as const),
          action: "subscription" as const,
          actionLabel: "Assinar agora",
        }
      : null,
    billing.accessStatus === "locked"
      ? {
          title: "Seu teste grátis terminou",
          message:
            "Assine agora para recuperar o salvamento na nuvem, runs, conquistas e histórico inteligente.",
          tone: "red" as const,
          action: "subscription" as const,
          actionLabel: "Ver planos",
        }
      : null,
    billing.accessStatus === "setup_pending"
      ? {
          title: "Ative seu acesso Premium",
          message:
            "Você ainda não iniciou seu plano. Assine para garantir o salvamento contínuo do seu progresso.",
          tone: "yellow" as const,
          action: "subscription" as const,
          actionLabel: "Conhecer plano",
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
          title:
            xpToday >= dailyGoal
              ? "Meta diária concluída"
              : "Meta diária em andamento",
          message:
            xpToday >= dailyGoal
              ? `Hoje você já registrou ${formatXP(xpToday)} XP.`
              : `Faltam ${formatXP(
                  Math.max(0, dailyGoal - xpToday)
                )} XP para bater a meta de hoje.`,
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
  ];

  return notifications.filter((notification): notification is AppNotification =>
    Boolean(notification)
  );
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  open,
  onToggle,
  onClose,
  onOpenSubscription,
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
        <span className="text-base md:text-lg leading-none">
          {HEADER_GLYPHS.notifications}
        </span>
        <span className={labelClassName}>Avisos</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-500 px-1 text-xs font-black text-black">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar avisos"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            onClick={onClose}
          />
          <div
            className={`${theme.card} fixed left-4 right-4 top-24 z-50 max-h-[70vh] overflow-y-auto rounded-2xl border p-3 shadow-[0_0_40px_rgba(234,179,8,0.18)] md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-80 md:max-h-none md:overflow-visible`}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-black text-yellow-300">
                Notificações
              </p>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-[11px] font-black text-yellow-300">
                  {notifications.length}
                </span>
                <button
                  type="button"
                  aria-label="Fechar avisos"
                  onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-red-500/25 bg-red-500/10 text-red-300 transition-all hover:bg-red-500 hover:text-white"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <p
                className={`${theme.muted} rounded-xl border border-yellow-500/10 bg-black/20 p-3 text-xs`}
              >
                Nenhum aviso no momento.
              </p>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={`${notification.title}-${notification.message}`}
                    className={`rounded-xl border p-3 ${
                      toneClass[notification.tone]
                    }`}
                  >
                    <p className="text-sm font-black">{notification.title}</p>
                    <p
                      className={`${theme.muted} mt-1 text-xs leading-relaxed`}
                    >
                      {notification.message}
                    </p>
                    {notification.action === "subscription" && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSubscription();
                        }}
                        className="mt-3 rounded-xl bg-gradient-to-r from-yellow-300 to-amber-600 px-3 py-2 text-xs font-black text-black transition-all hover:scale-[1.02]"
                      >
                        {notification.actionLabel ?? "Abrir plano"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
