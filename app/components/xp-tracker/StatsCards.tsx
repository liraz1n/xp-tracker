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
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 md:gap-6 mb-6 md:mb-8">
      <div className={`${theme.card} border rounded-3xl p-5 md:p-6`}>
        <p className={`${theme.muted} text-sm mb-2`}>Nível Atual</p>
        <h2 className="text-3xl md:text-4xl font-bold text-yellow-300">
          {currentLevel}
        </h2>
      </div>

      <div className={`${theme.card} border rounded-3xl p-5 md:p-6`}>
        <p className={`${theme.muted} text-sm mb-2`}>Próximo Nível</p>
        <h2 className="text-3xl md:text-4xl font-bold text-yellow-300">
          {targetLevel}
        </h2>
      </div>

      <div className={`${theme.card} border rounded-3xl p-5 md:p-6`}>
        <p className={`${theme.muted} text-sm mb-2`}>XP para Upar</p>
        <h2 className="text-3xl md:text-4xl font-bold text-yellow-300">
          {totalXP.toLocaleString("pt-BR")}
        </h2>
      </div>

      <div className={`${theme.card} border rounded-3xl p-5 md:p-6`}>
        <p className={`${theme.muted} text-sm mb-2`}>XP Restante</p>
        <h2 className="text-3xl md:text-4xl font-bold text-red-400">
          {currentXP.toLocaleString("pt-BR")}
        </h2>
      </div>

      <div className={`${theme.card} border rounded-3xl p-5 md:p-6`}>
        <p className={`${theme.muted} text-sm mb-2`}>Progresso</p>
        <h2 className="text-3xl md:text-4xl font-bold text-emerald-400">
          {percentageDisplay}%
        </h2>
      </div>
    </div>
  );
}
