import { useEffect, useRef, useState } from "react";
import { XpInputs } from "~/components/xp-tracker/XpInputs";
import { XIcon } from "~/components/xp-tracker/UiIcons";

interface SettingsPanelProps {
  open: boolean;
  totalXP: number;
  currentXP: number;
  userTotalXP: number;
  dailyGoal: number;
  currentLevel: number;
  targetLevel: number;
  theme: {
    card: string;
    input: string;
    muted: string;
    text: string;
  };
  onClose: () => void;
  onReset: () => void;
  onDeleteAccount: () => void | Promise<boolean | void>;
  onSave: (values: {
    totalXP: number;
    currentXP: number;
    userTotalXP: number;
    dailyGoal: number;
    currentLevel: number;
    targetLevel: number;
  }) => void | Promise<boolean | void>;
}

function sanitizeLevel(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function formatInputValue(value: number) {
  return value === 0 ? "" : value;
}

const SETTINGS_DRAFT_STORAGE_KEY = "xpTrackerSettingsDraft";

interface SettingsDraft {
  totalXP: number;
  currentXP: number;
  userTotalXP: number;
  dailyGoal: number;
  currentLevel: number;
}

function readSettingsDraft(): SettingsDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const rawDraft = window.localStorage.getItem(SETTINGS_DRAFT_STORAGE_KEY);
    if (!rawDraft) return null;

    const draft = JSON.parse(rawDraft) as Partial<SettingsDraft>;
    return {
      totalXP: Math.max(0, Number(draft.totalXP) || 0),
      currentXP: Math.max(0, Number(draft.currentXP) || 0),
      userTotalXP: Math.max(0, Number(draft.userTotalXP) || 0),
      dailyGoal: Math.max(0, Number(draft.dailyGoal) || 0),
      currentLevel: sanitizeLevel(Number(draft.currentLevel) || 0),
    };
  } catch {
    window.localStorage.removeItem(SETTINGS_DRAFT_STORAGE_KEY);
    return null;
  }
}

function writeSettingsDraft(draft: SettingsDraft) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    SETTINGS_DRAFT_STORAGE_KEY,
    JSON.stringify(draft)
  );
}

function clearSettingsDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SETTINGS_DRAFT_STORAGE_KEY);
}

export function SettingsPanel({
  open,
  totalXP,
  currentXP,
  userTotalXP,
  dailyGoal,
  currentLevel,
  theme,
  onClose,
  onReset,
  onDeleteAccount,
  onSave,
}: SettingsPanelProps) {
  const [draftTotalXP, setDraftTotalXP] = useState(totalXP);
  const [draftCurrentXP, setDraftCurrentXP] = useState(currentXP);
  const [draftUserTotalXP, setDraftUserTotalXP] = useState(userTotalXP);
  const [draftDailyGoal, setDraftDailyGoal] = useState(dailyGoal);
  const [draftCurrentLevel, setDraftCurrentLevel] = useState(currentLevel);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const autoSaveReady = useRef(false);
  const autoSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    if (!open) return;

    const savedDraft = readSettingsDraft();

    setDraftTotalXP(savedDraft?.totalXP ?? totalXP);
    setDraftCurrentXP(savedDraft?.currentXP ?? currentXP);
    setDraftUserTotalXP(savedDraft?.userTotalXP ?? userTotalXP);
    setDraftDailyGoal(savedDraft?.dailyGoal ?? dailyGoal);
    setDraftCurrentLevel(savedDraft?.currentLevel ?? currentLevel);
    setSettingsError(null);
    setConfirmDeleteOpen(false);
    autoSaveReady.current = false;
  }, [open]);

  useEffect(() => {
    if (!open) return;

    writeSettingsDraft({
      totalXP: draftTotalXP,
      currentXP: Math.max(0, draftCurrentXP),
      userTotalXP: draftUserTotalXP,
      dailyGoal: draftDailyGoal,
      currentLevel: draftCurrentLevel,
    });

    if (!autoSaveReady.current) {
      autoSaveReady.current = true;
      return;
    }

    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }

    autoSaveTimeout.current = setTimeout(async () => {
      setSettingsError(null);
      const saved = await onSaveRef.current({
        totalXP: draftTotalXP,
        currentXP: Math.max(0, draftCurrentXP),
        userTotalXP: draftUserTotalXP,
        dailyGoal: draftDailyGoal,
        currentLevel: draftCurrentLevel,
        targetLevel: draftCurrentLevel + 1,
      });

      if (saved !== false) {
        clearSettingsDraft();
      }
    }, 900);

    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
    };
  }, [
    open,
    draftTotalXP,
    draftCurrentXP,
    draftUserTotalXP,
    draftDailyGoal,
    draftCurrentLevel,
  ]);

  if (!open) return null;

  const draftCurrentXPValue = Math.max(0, draftCurrentXP);

  function updateDraftCurrentXP(value: number) {
    setDraftCurrentXP(Math.max(0, value));
  }

  async function saveSettings() {
    setIsSavingSettings(true);
    setSettingsError(null);

    const saved = await onSave({
      totalXP: draftTotalXP,
      currentXP: draftCurrentXPValue,
      userTotalXP: draftUserTotalXP,
      dailyGoal: draftDailyGoal,
      currentLevel: draftCurrentLevel,
      targetLevel: draftCurrentLevel + 1,
    });

    setIsSavingSettings(false);

    if (saved !== false) {
      clearSettingsDraft();
      onClose();
      return;
    }

    setSettingsError(
      "Não foi possível salvar o XP total do usuário. Verifique se a coluna user_total_xp existe no Supabase."
    );
  }

  async function confirmDeleteAccount() {
    setIsDeletingAccount(true);
    setSettingsError(null);

    const deleted = await onDeleteAccount();

    setIsDeletingAccount(false);

    if (deleted === false) {
      setSettingsError("Não foi possível deletar seus dados agora. Tente novamente em instantes.");
      return;
    }

    clearSettingsDraft();
    setConfirmDeleteOpen(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-4">
      <div className={`${theme.card} relative border rounded-3xl p-4 md:p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_60px_rgba(234,179,8,0.18)]`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-yellow-300">
              Configurações
            </h2>
            <p className={`${theme.muted} mt-2`}>
              Ajuste nível atual, XP restante, XP para upar e meta diária.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`${theme.muted} absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-yellow-500/20 hover:text-yellow-300 transition-all md:static`}
            aria-label="Fechar configurações"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className={`${theme.card} border rounded-3xl p-6 shadow-[0_0_30px_rgba(234,179,8,0.15)]`}>
            <label className="block text-yellow-400 text-sm mb-2">
              Nível atual
            </label>
            <input
              type="number"
              min={0}
              value={formatInputValue(draftCurrentLevel)}
              onChange={(event) =>
                setDraftCurrentLevel(
                  event.target.value === ""
                    ? 0
                    : sanitizeLevel(Number(event.target.value))
                )
              }
              className={`w-full ${theme.input} border rounded-2xl px-4 py-3 outline-none focus:border-yellow-400`}
            />
            <p className={`${theme.muted} mt-2 text-xs`}>
              Próximo nível: {draftCurrentLevel + 1}
            </p>
          </div>
        </div>

        <XpInputs
          totalXP={draftTotalXP}
          userXP={draftUserTotalXP}
          currentXP={draftCurrentXPValue}
          dailyGoal={draftDailyGoal}
          theme={theme}
          onTotalXPChange={setDraftTotalXP}
          onUserXPChange={setDraftUserTotalXP}
          onCurrentXPChange={updateDraftCurrentXP}
          onDailyGoalChange={setDraftDailyGoal}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-emerald-500/20 bg-emerald-500/5 rounded-3xl p-4 md:p-6 mb-8">
          <div>
            <h3 className="text-xl font-black text-emerald-300">
              Salvar ajustes
            </h3>
            <p className={`${theme.muted} mt-2`}>
              Os ajustes são salvos automaticamente e também podem ser confirmados aqui.
            </p>
            {settingsError && (
              <p className="mt-2 text-sm font-bold text-red-300">
                {settingsError}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={saveSettings}
            disabled={isSavingSettings}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-700 hover:scale-105 transition-all duration-300 px-5 py-3 md:px-6 md:py-4 rounded-2xl font-bold shadow-lg text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSavingSettings ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>

        <div className="border border-red-500/20 bg-red-500/5 rounded-3xl p-4 md:p-6">
          <h3 className="text-xl font-black text-red-300">
            Zona de risco
          </h3>
          <p className={`${theme.muted} mt-2 mb-5`}>
            Você pode resetar seu progresso ou deletar os dados da sua conta no XP Tracker.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                clearSettingsDraft();
                onReset();
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-700 hover:scale-105 transition-all duration-300 px-5 py-3 md:px-6 md:py-4 rounded-2xl font-bold shadow-lg text-white"
            >
              Resetar progresso
            </button>

            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              className="w-full sm:w-auto rounded-2xl border border-red-500/35 bg-red-500/10 px-5 py-3 md:px-6 md:py-4 font-bold text-red-200 transition-all hover:bg-red-500 hover:text-white"
            >
              Deletar conta
            </button>
          </div>
        </div>

        {confirmDeleteOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-zinc-950 p-6 shadow-[0_0_60px_rgba(239,68,68,0.22)]">
              <h3 className="text-2xl font-black text-red-200">
                Deletar conta?
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Isso apaga seus dados de progresso salvos no XP Tracker e encerra sua sessão. Essa ação não pode ser desfeita.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOpen(false)}
                  className="flex-1 rounded-2xl bg-zinc-800 px-5 py-3 font-bold text-white transition-all hover:bg-zinc-700"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={confirmDeleteAccount}
                  disabled={isDeletingAccount}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-red-500 to-red-700 px-5 py-3 font-black text-white transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isDeletingAccount ? "Deletando..." : "Sim, deletar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
