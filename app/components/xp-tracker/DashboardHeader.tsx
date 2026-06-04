import { useEffect, useState } from "react";
import {
  NotificationDropdown,
  type AppNotification,
} from "~/components/xp-tracker/NotificationCenter";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface DashboardHeaderProps {
  userName?: string;
  darkMode: boolean;
  saveStatus: SaveStatus;
  historyCount: number;
  guestMode: boolean;
  notifications: AppNotification[];
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
        ? "bg-sky-500/10 text-sky-300 border-sky-500/30"
        : "bg-sky-50 text-sky-700 border-sky-300",
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

  const iconButtonClass = `${theme.card} border rounded-2xl w-12 h-12 md:w-14 md:h-14 flex flex-col items-center justify-center gap-0.5 hover:border-sky-400 transition-all`;
  const iconLabelClass = "text-[9px] md:text-[10px] font-bold leading-none text-zinc-400";

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
          className="inline-block text-4xl sm:text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-sky-300 via-sky-500 to-blue-700 bg-clip-text text-transparent transition-all hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-4 focus-visible:ring-offset-black"
        >
          XP TRACKER
        </a>

        <p className={`${theme.muted} mt-1.5 md:mt-2 text-base md:text-lg`}>
          Acompanhe XP, runs e evolução do seu personagem
        </p>
      </div>

      <div className="flex flex-col md:items-end gap-3">
        <div className="flex flex-col md:items-end gap-2">
          <p className="text-sky-300 font-bold text-base md:text-lg">
            Bem-vindo, {userName}
          </p>

          {showSaveStatus && (
            <span
              className={`border rounded-full px-3 py-1 text-xs font-bold ${saveStatusInfo.className}`}
            >
              {saveStatusInfo.label}
            </span>
          )}
        </div>

        <div className="flex gap-2.5 md:gap-3 flex-wrap justify-start md:justify-end">
          <button
            type="button"
            aria-label="Alternar tema"
            onClick={onToggleDarkMode}
            className={iconButtonClass}
          >
            <span className="text-base md:text-lg leading-none">{darkMode ? "🌙" : "☀️"}</span>
            <span className={iconLabelClass}>Tema</span>
          </button>

          <button
            type="button"
            aria-label="Abrir histórico"
            onClick={onToggleSidebar}
            className={`${iconButtonClass} relative`}
          >
            <span className="text-base md:text-lg leading-none">📜</span>
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
            buttonClassName={iconButtonClass}
            labelClassName={iconLabelClass}
            theme={theme}
          />

          <button
            type="button"
            aria-label="Abrir assinatura"
            onClick={onOpenSubscription}
            className={iconButtonClass}
          >
            <span className="text-base md:text-lg leading-none">💳</span>
            <span className={iconLabelClass}>Plano</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className={iconButtonClass}
          >
            <span className="text-base md:text-lg leading-none">⚙️</span>
            <span className={iconLabelClass}>Config.</span>
          </button>

          {guestMode && (
            <button
              type="button"
              onClick={onLoginWithGoogle}
              className={iconButtonClass}
            >
              <span className="text-base md:text-lg leading-none">☁️</span>
              <span className={iconLabelClass}>Salvar</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            className={iconButtonClass}
          >
            <span className="text-base md:text-lg leading-none">⏻</span>
            <span className={iconLabelClass}>Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
}
