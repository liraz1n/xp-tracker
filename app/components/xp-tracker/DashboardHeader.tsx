import { useEffect, useState } from "react";
import {
  NotificationDropdown,
  type AppNotification,
} from "~/components/xp-tracker/NotificationCenter";
import type { ProfileBadge } from "~/components/xp-tracker/ProfileBadgesCard";
import { HEADER_GLYPHS } from "~/components/xp-tracker/StableGlyphs";
import { PencilIcon, XIcon } from "~/components/xp-tracker/UiIcons";

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
  onOpenCommunity: () => void;
  onOpenCommunityChat: (userId: string) => void;
  onOpenSettings: () => void;
  onRenameUser: (displayName: string) => Promise<boolean>;
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
  onOpenCommunity,
  onOpenCommunityChat,
  onOpenSettings,
  onRenameUser,
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
  const [renameOpen, setRenameOpen] = useState(false);
  const [displayNameDraft, setDisplayNameDraft] = useState(userName ?? "");
  const [renameSaving, setRenameSaving] = useState(false);
  const [renameError, setRenameError] = useState("");

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

  useEffect(() => {
    if (renameOpen) return;

    setDisplayNameDraft(userName ?? "");
  }, [renameOpen, userName]);

  async function submitRename() {
    const nextName = displayNameDraft.trim().replace(/\s+/g, " ");

    if (!nextName) {
      setRenameError("Informe um apelido.");
      return;
    }

    if (nextName.length > 32) {
      setRenameError("Use até 32 caracteres.");
      return;
    }

    setRenameSaving(true);
    setRenameError("");

    const saved = await onRenameUser(nextName);

    setRenameSaving(false);

    if (!saved) {
      setRenameError("Não foi possível salvar agora.");
      return;
    }

    setRenameOpen(false);
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6 md:flex-row md:justify-between md:items-start mb-6 md:mb-10">
      <div>
        <a
          href="/"
          aria-label="Voltar para o início"
          className="inline-block transition-all hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 focus-visible:ring-offset-4 focus-visible:ring-offset-black"
        >
          <img
            src="/assets/xp-tracker-logo-header.jpg"
            alt="XP Tracker"
            className="h-auto w-[300px] max-w-full sm:w-[390px] md:w-[520px]"
          />
        </a>

        <p className={`${theme.muted} mt-2 text-base md:text-lg`}>
          Acompanhe XP, runs e evolução do seu personagem
        </p>
      </div>

      <div className="flex flex-col md:items-end gap-3">
        <div className="flex flex-col md:items-end gap-2">
          <div className="flex items-center gap-2 md:justify-end">
            <p className="text-yellow-300 font-bold text-base md:text-lg">
              Bem-vindo, {userName}
            </p>
            {!guestMode && (
              <button
                type="button"
                aria-label="Editar apelido"
                onClick={() => {
                  setRenameError("");
                  setDisplayNameDraft(userName ?? "");
                  setRenameOpen(true);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-yellow-500/20 bg-yellow-500/10 text-yellow-300 transition-all hover:bg-yellow-500 hover:text-black"
              >
                <PencilIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

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
            onOpenCommunity={onOpenCommunity}
            onOpenCommunityChat={onOpenCommunityChat}
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

      {renameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className={`${theme.card} w-full max-w-sm rounded-3xl border p-5 shadow-[0_0_50px_rgba(234,179,8,0.14)]`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-yellow-400">
                  Perfil
                </p>
                <h2 className="text-xl font-black text-yellow-300">
                  Editar apelido
                </h2>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setRenameOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-red-500/25 bg-red-500/10 text-red-300 transition-all hover:bg-red-500 hover:text-white"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <label className="mb-1 block text-xs font-black uppercase text-zinc-500">
              Como quer aparecer
            </label>
            <input
              value={displayNameDraft}
              maxLength={32}
              onChange={(event) => {
                setDisplayNameDraft(event.target.value);
                setRenameError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitRename();
                }
              }}
              className="w-full rounded-2xl border border-yellow-500/20 bg-black px-4 py-3 font-bold text-white outline-none transition-all focus:border-yellow-300"
            />
            <p className={`${theme.muted} mt-2 text-xs`}>
              Esse nome aparece no topo do site. O login Google continua o mesmo.
            </p>
            {renameError && (
              <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300">
                {renameError}
              </p>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setRenameOpen(false)}
                className="flex-1 rounded-2xl border border-zinc-700 px-4 py-3 text-sm font-black text-zinc-300 transition-all hover:border-zinc-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={renameSaving}
                onClick={submitRename}
                className="flex-1 rounded-2xl bg-gradient-to-r from-yellow-300 to-amber-600 px-4 py-3 text-sm font-black text-black transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {renameSaving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
