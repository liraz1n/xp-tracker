import { useEffect, useState } from "react";
import {
  NotificationDropdown,
  type AppNotification,
} from "~/components/xp-tracker/NotificationCenter";
import type { ProfileBadge } from "~/components/xp-tracker/ProfileBadgesCard";
import { HEADER_GLYPHS } from "~/components/xp-tracker/StableGlyphs";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface DashboardHeaderProps {
  userName?: string;
  darkMode: boolean;
  saveStatus: SaveStatus;
  historyCount: number;
  guestMode: boolean;
  notifications: AppNotification[];
  badges: ProfileBadge[];
  unreadNotificationsCount: number;
  notificationsOpen: boolean;
  theme: {
    card: string;
    muted: string;
  };
  onToggleDarkMode: () => void;
  onToggleSidebar: () => void;
  onToggleNotifications: () => void;
  onCloseNotifications: () => void;
  onOpenSubscription: () => void;
  onOpenSettings: () => void;
  onLoginWithGoogle: () => void;
  onLogout: () => void;
}

export function DashboardHeader({
  userName,
  darkMode,
  saveStatus,
  historyCount,
  guestMode,
  notifications,
  badges,
  unreadNotificationsCount,
  notificationsOpen,
  theme,
  onToggleDarkMode,
  onToggleSidebar,
  onToggleNotifications,
  onCloseNotifications,
  onOpenSubscription,
  onOpenSettings,
  onLoginWithGoogle,
  onLogout,
}: DashboardHeaderProps) {
  const saveStatusInfo = {
    idle: {
      label: "Aguardando",
      className: darkMode
        ? "bg-zinc-900 text-zinc-400 border-zinc-800"
        : "bg-zinc-100 text-zinc-500 border-zinc-200",
    },
    saving: {
      label: "Salvando...",
      className: darkMode
        ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/30"
        : "bg-yellow-50 text-yellow-700 border-yellow-300",
    },
    saved: {
      label: "Salvo",
      className: darkMode
        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
        : "bg-emerald-50 text-emerald-700 border-emerald-300",
    },
    error: {
      label: "Erro ao salvar",
      className: darkMode
        ? "bg-red-500/10 text-red-300 border-red-500/30"
        : "bg-red-50 text-red-700 border-red-300",
    },
  }[saveStatus];
  const [showSaveStatus, setShowSaveStatus] = useState(false);

  const iconButtonClass = `${theme.card} border rounded-2xl w-12 h-12 md:w-14 md:h-14 flex flex-col items-center justify-center gap-0.5 hover:border-yellow-400 transition-all`;
  const iconLabelClass = "text-[9px] md:text-[10px] font-bold leading-none text-zinc-400";
  const headerIconClass = "text-base md:text-lg leading-none";

  useEffect(() => {
    if (saveStatus === "idle") {
      setShowSaveStatus(false);
      return;
    }

    setShowSaveStatus(true);

    if (saveStatus !== "saved") return;

    const timer = window.setTimeout(() => {
      setShowSaveStatus(false);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [saveStatus]);

  return (
    <div className="flex flex-col gap-4 md:gap-6 md:flex-row md:justify-between md:items-start mb-6 md:mb-10">
      <div>
        <a
          href="/"
          aria-label="Voltar para o início"
          className="inline-block text-4xl sm:text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-yellow-300 via-yellow-500 to-amber-700 bg-clip-text text-transparent transition-all hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:ring-offset-4 focus-visible:ring-offset-black"
        >
          XP TRACKER
        </a>

        <p className={`${theme.muted} mt-1.5 md:mt-2 text-base md:text-lg`}>
          Acompanhe XP, runs e evolução do seu personagem
        </p>
      </div>

      <div className="flex flex-col md:items-end gap-3">
        <div className="flex flex-col md:items-end gap-2">
          <p className="text-yellow-300 font-bold text-base md:text-lg">
            Bem-vindo, {userName}
          </p>

          {badges.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
              <span className="text-[10px] font-black uppercase text-yellow-400">
                Selos:
              </span>
              {badges.map((badge) => (
                <span
                  key={badge.label}
                  title={badge.description}
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black ${badge.className}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}

          {showSaveStatus && (
            <span
              className={`border rounded-full px-3 py-1 text-xs font-bold ${saveStatusInfo.className}`}
            >
              {saveStatusInfo.label}
            </span>
          )}
        </div>

        <div className="flex gap-2.5 md:gap-3 flex-wrap justify-start md:justify-end">
          <button type="button" aria-label="Alternar tema" onClick={onToggleDarkMode} className={iconButtonClass}>
            <span className={headerIconClass}>
              {darkMode ? HEADER_GLYPHS.moon : HEADER_GLYPHS.sun}
            </span>
            <span className={iconLabelClass}>Tema</span>
          </button>

          <button type="button" aria-label="Abrir histórico" onClick={onToggleSidebar} className={`${iconButtonClass} relative`}>
            <span className={headerIconClass}>{HEADER_GLYPHS.history}</span>
            <span className={iconLabelClass}>Histórico</span>
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {historyCount}
              </span>
            )}
          </button>

          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadNotificationsCount}
            open={notificationsOpen}
            onToggle={onToggleNotifications}
            onClose={onCloseNotifications}
            onOpenSubscription={onOpenSubscription}
            buttonClassName={iconButtonClass}
            labelClassName={iconLabelClass}
            theme={theme}
          />

          <button type="button" aria-label="Abrir assinatura" onClick={onOpenSubscription} className={iconButtonClass}>
            <span className={headerIconClass}>{HEADER_GLYPHS.plan}</span>
            <span className={iconLabelClass}>Plano</span>
          </button>

          <button type="button" onClick={onOpenSettings} className={iconButtonClass}>
            <span className={headerIconClass}>{HEADER_GLYPHS.settings}</span>
            <span className={iconLabelClass}>Config.</span>
          </button>

          {guestMode && (
            <button type="button" onClick={onLoginWithGoogle} className={iconButtonClass}>
              <span className={headerIconClass}>{HEADER_GLYPHS.save}</span>
              <span className={iconLabelClass}>Salvar</span>
            </button>
          )}

          <button type="button" onClick={onLogout} className={iconButtonClass}>
            <span className={headerIconClass}>{HEADER_GLYPHS.logout}</span>
            <span className={iconLabelClass}>Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
}
