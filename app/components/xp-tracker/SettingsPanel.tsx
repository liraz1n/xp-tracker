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

export function SettingsPanel({
  open,
  totalXP,
  currentXP,
  userTotalXP,
  dailyGoal,
  currentLevel,
  targetLevel,
  theme,
  onClose,
  onReset,
  onSave,
}: SettingsPanelProps) {
  const [draftTotalXP, setDraftTotalXP] = useState(totalXP);
  const [draftCurrentXP, setDraftCurrentXP] = useState(currentXP);
  const [draftUserTotalXP, setDraftUserTotalXP] = useState(userTotalXP);
  const [draftDailyGoal, setDraftDailyGoal] = useState(dailyGoal);
  const [draftCurrentLevel, setDraftCurrentLevel] = useState(currentLevel);
  const [draftTargetLevel, setDraftTargetLevel] = useState(targetLevel);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const autoSaveReady = useRef(false);
  const autoSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    if (!open) return;

    setDraftTotalXP(totalXP);
    setDraftCurrentXP(currentXP);
    setDraftUserTotalXP(userTotalXP);
    setDraftDailyGoal(dailyGoal);
    setDraftCurrentLevel(currentLevel);
    setDraftTargetLevel(targetLevel);
    setSettingsError(null);
    autoSaveReady.current = false;
  }, [open, totalXP, currentXP, userTotalXP, dailyGoal, currentLevel, targetLevel]);

  useEffect(() => {
    if (!open) return;

    if (!autoSaveReady.current) {
      autoSaveReady.current = true;
      return;
    }

    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }

    autoSaveTimeout.current = setTimeout(async () => {
      setSettingsError(null);
      await onSaveRef.current({
        totalXP: draftTotalXP,
        currentXP: Math.max(0, draftCurrentXP),
        userTotalXP: draftUserTotalXP,
        dailyGoal: draftDailyGoal,
        currentLevel: draftCurrentLevel,
        targetLevel: draftTargetLevel,
      });
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
    draftTargetLevel,
  ]);

  if (!open) return null;

  const draftCurrentXPValue = Math.max(0, draftCurrentXP);

  function updateDraftCurrentXP(value: number) {
    const nextCurrentXP = Math.max(0, value);

    setDraftCurrentXP(nextCurrentXP);
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
      targetLevel: draftTargetLevel,
    });

    setIsSavingSettings(false);

    if (saved !== false) {
      onClose();
      return;
    }

    setSettingsError(
      "Não foi possível salvar o XP total do usuário. Verifique se a coluna user_total_xp existe no Supabase."
    );
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
              Ajuste nível, XP restante, XP para upar e meta diária.
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
              value={draftCurrentLevel}
              onChange={(event) =>
                setDraftCurrentLevel(sanitizeLevel(Number(event.target.value)))
              }
              className={`w-full ${theme.input} border rounded-2xl px-4 py-3 outline-none focus:border-yellow-400`}
            />
          </div>

          <div className={`${theme.card} border rounded-3xl p-6 shadow-[0_0_30px_rgba(234,179,8,0.15)]`}>
            <label className="block text-yellow-400 text-sm mb-2">
              Nível alvo
            </label>
            <input
              type="number"
              min={draftCurrentLevel + 1}
              value={draftTargetLevel}
              onChange={(event) =>
                setDraftTargetLevel(sanitizeLevel(Number(event.target.value)))
              }
              className={`w-full ${theme.input} border rounded-2xl px-4 py-3 outline-none focus:border-yellow-400`}
            />
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
              Os ajustes s�o salvos automaticamente e tamb�m podem ser confirmados aqui.
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
            Zona de reset
          </h3>
          <p className={`${theme.muted} mt-2 mb-5`}>
            Volta para os valores padrão e apaga histórico, conquistas e progresso.
          </p>

          <button
            type="button"
            onClick={onReset}
            className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-700 hover:scale-105 transition-all duration-300 px-5 py-3 md:px-6 md:py-4 rounded-2xl font-bold shadow-lg text-white"
          >
            Resetar progresso
          </button>
        </div>
      </div>
    </div>
  );
}
