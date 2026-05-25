type SaveStatus = "idle" | "saving" | "saved" | "error";

interface DashboardHeaderProps {
  userName?: string;
  darkMode: boolean;
  saveStatus: SaveStatus;
  historyCount: number;
  guestMode: boolean;
  theme: {
    card: string;
    muted: string;
  };
  onToggleDarkMode: () => void;
  onToggleSidebar: () => void;
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
  theme,
  onToggleDarkMode,
  onToggleSidebar,
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

  const iconButtonClass = `${theme.card} border rounded-2xl w-12 h-12 md:w-14 md:h-14 flex flex-col items-center justify-center gap-0.5 hover:border-yellow-400 transition-all`;
  const iconLabelClass = "text-[9px] md:text-[10px] font-bold leading-none text-zinc-400";

  return (
    <div className="flex flex-col gap-4 md:gap-6 md:flex-row md:justify-between md:items-start mb-6 md:mb-10">
      <div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-yellow-300 via-yellow-500 to-amber-700 bg-clip-text text-transparent">
          XP TRACKER
        </h1>

        <p className={`${theme.muted} mt-1.5 md:mt-2 text-base md:text-lg`}>
          Dashboard de progresso premium
        </p>
      </div>

      <div className="flex flex-col md:items-end gap-3">
        <div className="flex flex-col md:items-end gap-2">
          <p className="text-yellow-300 font-bold text-base md:text-lg">
            Bem-vindo, {userName}
          </p>

          <span
            className={`border rounded-full px-3 py-1 text-xs font-bold ${saveStatusInfo.className}`}
          >
            {saveStatusInfo.label}
          </span>
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
