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
  return value;
}

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
  const fields = [
    { label: "XP para Upar", value: totalXP, setter: onTotalXPChange },
    { label: "XP Total do Usuário", value: userXP, setter: onUserXPChange },
    { label: "XP Restante", value: currentXP, setter: onCurrentXPChange },
    { label: "Meta Diária de XP", value: dailyGoal, setter: onDailyGoalChange },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
      {fields.map(({ label, value, setter }) => (
        <div
          key={label}
          className={`${theme.card} border rounded-3xl p-6 shadow-[0_0_30px_rgba(234,179,8,0.15)]`}
        >
          <label className="block text-yellow-400 text-sm mb-2">
            {label}
          </label>

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
