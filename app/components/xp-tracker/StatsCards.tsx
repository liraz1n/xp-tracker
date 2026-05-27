interface StatsCardsProps {
  totalXP: number;
  currentXP: number;
  percentageDisplay: string;
  currentLevel: number;
  targetLevel: number;
  theme: {
    card: string;
    muted: string;
  };
}

export function StatsCards({
  totalXP,
  currentXP,
  percentageDisplay,
  currentLevel,
  targetLevel,
  theme,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-4 md:mb-5">
      <div className={`${theme.card} border rounded-2xl p-4 md:p-5 min-w-0`}>
        <p className={`${theme.muted} text-xs md:text-sm mb-1.5`}>Nível Atual</p>
        <h2 className="text-2xl md:text-3xl font-bold text-yellow-300 break-words">
          {currentLevel}
        </h2>
      </div>

      <div className={`${theme.card} border rounded-2xl p-4 md:p-5 min-w-0`}>
        <p className={`${theme.muted} text-xs md:text-sm mb-1.5`}>Próximo Nível</p>
        <h2 className="text-2xl md:text-3xl font-bold text-yellow-300 break-words">
          {targetLevel}
        </h2>
      </div>

      <div className={`${theme.card} border rounded-2xl p-4 md:p-5 min-w-0`}>
        <p className={`${theme.muted} text-xs md:text-sm mb-1.5`}>XP para Upar</p>
        <h2 className="text-2xl md:text-3xl font-bold text-yellow-300 break-words">
          {totalXP.toLocaleString("pt-BR")}
        </h2>
      </div>

      <div className={`${theme.card} border rounded-2xl p-4 md:p-5 min-w-0`}>
        <p className={`${theme.muted} text-xs md:text-sm mb-1.5`}>XP Restante</p>
        <h2 className="text-2xl md:text-3xl font-bold text-red-400 break-words">
          {currentXP.toLocaleString("pt-BR")}
        </h2>
      </div>

      <div className={`${theme.card} border rounded-2xl p-4 md:p-5 min-w-0 col-span-2 lg:col-span-1`}>
        <p className={`${theme.muted} text-xs md:text-sm mb-1.5`}>Progresso</p>
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-400 break-words">
          {percentageDisplay}%
        </h2>
      </div>
    </div>
  );
}
