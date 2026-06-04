import { CalendarIcon, ChartIcon } from "~/components/xp-tracker/UiIcons";

interface EstimateCardsProps {
  daysGoal: number | null;
  daysAvg: number | null;
  dailyGoal: number;
  averageDailyXP: number | null;
  formatDate: (days: number) => string;
  theme: {
    card: string;
    muted: string;
    text: string;
  };
}

export function EstimateCards({
  daysGoal,
  daysAvg,
  dailyGoal,
  averageDailyXP,
  formatDate,
  theme,
}: EstimateCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className={`${theme.card} border rounded-3xl p-6`}>
        <p className={`${theme.muted} mb-1 flex items-center gap-2 text-sm`}>
          <CalendarIcon className="h-4 w-4 text-yellow-300" />
          Estimativa - Meta diária
        </p>

        {daysGoal ? (
          <>
            <h2 className="text-3xl font-bold text-yellow-300 mb-1">
              {daysGoal} dias
            </h2>
            <p className={`${theme.muted} text-sm`}>
              Conclusão em{" "}
              <span className={theme.text}>{formatDate(daysGoal)}</span>{" "}
              — {dailyGoal.toLocaleString("pt-BR")} XP/dia
            </p>
          </>
        ) : (
          <p className={`${theme.muted} text-sm mt-2`}>
            Defina uma meta diária acima.
          </p>
        )}
      </div>

      <div className={`${theme.card} border rounded-3xl p-6`}>
        <p className={`${theme.muted} mb-1 flex items-center gap-2 text-sm`}>
          <ChartIcon className="h-4 w-4 text-emerald-300" />
          Estimativa - Média histórica
        </p>

        {daysAvg && averageDailyXP ? (
          <>
            <h2 className="text-3xl font-bold text-emerald-400 mb-1">
              {daysAvg} dias
            </h2>
            <p className={`${theme.muted} text-sm`}>
              Conclusão em{" "}
              <span className={theme.text}>{formatDate(daysAvg)}</span>{" "}
              — {Math.round(averageDailyXP).toLocaleString("pt-BR")} XP/dia em média
            </p>
          </>
        ) : (
          <p className={`${theme.muted} text-sm mt-2`}>
            Salve pelo menos 2 atualizações para calcular a média.
          </p>
        )}
      </div>
    </div>
  );
}
