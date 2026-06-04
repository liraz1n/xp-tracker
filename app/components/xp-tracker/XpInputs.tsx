import { useState } from "react";

interface XpInputsProps {
  totalXP: number;
  userXP: number;
  currentXP: number;
  dailyGoal: number;
  theme: {
    card: string;
    input: string;
  };
  onTotalXPChange: (value: number) => void;
  onUserXPChange: (value: number) => void;
  onCurrentXPChange: (value: number) => void;
  onDailyGoalChange: (value: number) => void;
}

function sanitizeNumber(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function formatInputValue(value: number) {
  return value === 0 ? "" : value;
}

export const XP_FIELD_HELP = {
  totalXP: "Adicione abaixo o XP que falta para você upar de nível.",
  userXP: "Adicione abaixo o XP total do seu personagem.",
  currentXP: "Adicione abaixo o XP restante para você upar de nível.",
  dailyGoal: "Adicione abaixo o XP que você almeja fazer diariamente.",
} as const;

export function XpInputs({
  totalXP,
  userXP,
  currentXP,
  dailyGoal,
  theme,
  onTotalXPChange,
  onUserXPChange,
  onCurrentXPChange,
  onDailyGoalChange,
}: XpInputsProps) {
  const [activeHelp, setActiveHelp] = useState<string | null>(null);
  const fields = [
    {
      label: "XP para Upar",
      value: totalXP,
      setter: onTotalXPChange,
      help: XP_FIELD_HELP.totalXP,
    },
    {
      label: "XP Total do Usuário",
      value: userXP,
      setter: onUserXPChange,
      help: XP_FIELD_HELP.userXP,
    },
    {
      label: "XP Restante",
      value: currentXP,
      setter: onCurrentXPChange,
      help: XP_FIELD_HELP.currentXP,
    },
    {
      label: "Meta diária de XP",
      value: dailyGoal,
      setter: onDailyGoalChange,
      help: XP_FIELD_HELP.dailyGoal,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
      {fields.map(({ label, value, setter, help }) => (
        <div
          key={label}
          className={`${theme.card} relative border rounded-3xl p-6 shadow-[0_0_30px_rgba(234,179,8,0.15)]`}
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-yellow-400 text-sm">
              {label}
            </label>

            <button
              type="button"
              aria-label={`Ajuda sobre ${label}`}
              onClick={() =>
                setActiveHelp((current) => current === label ? null : label)
              }
              className="flex h-6 w-6 items-center justify-center rounded-full border border-yellow-500/30 bg-yellow-500/10 text-xs font-black text-yellow-300 transition-all hover:bg-yellow-500 hover:text-black"
            >
              ?
            </button>
          </div>

          {activeHelp === label && (
            <div className="absolute right-4 top-14 z-20 max-w-60 rounded-2xl border border-yellow-500/25 bg-zinc-950 p-3 text-xs leading-relaxed text-yellow-100 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
              {help}
            </div>
          )}

          <input
            type="number"
            min={0}
            value={formatInputValue(value)}
            onChange={(event) =>
              setter(
                event.target.value === ""
                  ? 0
                  : sanitizeNumber(Number(event.target.value))
              )
            }
            className={`w-full ${theme.input} border rounded-2xl px-4 py-3 outline-none focus:border-yellow-400`}
          />
        </div>
      ))}
    </div>
  );
}
