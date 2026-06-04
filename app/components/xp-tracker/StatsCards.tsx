interface StatsCardsProps {
  totalXP: number;
  currentXP: number;
  userTotalXP: number;
  percentageDisplay: string;
  currentLevel: number;
  targetLevel: number;
  theme: {
    card: string;
    muted: string;
  };
}

const statValueClass =
  "text-2xl md:text-[1.7rem] font-bold leading-tight whitespace-nowrap tabular-nums";

export function StatsCards({
  totalXP,
  currentXP,
  userTotalXP,
  percentageDisplay,
  currentLevel,
  targetLevel,
  theme,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-4 md:mb-5">
      <div className={`${theme.card} border rounded-2xl p-4 md:p-5 min-w-0`}>
        <p className={`${theme.muted} text-xs md:text-sm mb-1.5`}>Nível</p>
        <h2 className={`${statValueClass} flex items-baseline gap-2 text-sky-300`}>
          <span>{currentLevel}</span>
          <span className={`${theme.muted} text-base md:text-lg font-bold`}>-&gt;</span>
          <span>{targetLevel}</span>
        </h2>
      </div>

      <div className={`${theme.card} border rounded-2xl p-4 md:p-5 min-w-0`}>
        <p className={`${theme.muted} text-xs md:text-sm mb-1.5`}>XP do Usuário</p>
        <h2 className={`${statValueClass} text-cyan-300`}>
          {userTotalXP.toLocaleString("pt-BR")}
        </h2>
      </div>

      <div className={`${theme.card} border rounded-2xl p-4 md:p-5 min-w-0`}>
        <p className={`${theme.muted} text-xs md:text-sm mb-1.5`}>XP para Upar</p>
        <h2 className={`${statValueClass} text-sky-300`}>
          {totalXP.toLocaleString("pt-BR")}
        </h2>
      </div>

      <div className={`${theme.card} border rounded-2xl p-4 md:p-5 min-w-0`}>
        <p className={`${theme.muted} text-xs md:text-sm mb-1.5`}>XP Restante</p>
        <h2 className={`${statValueClass} text-red-400`}>
          {currentXP.toLocaleString("pt-BR")}
        </h2>
      </div>

      <div className={`${theme.card} border rounded-2xl p-4 md:p-5 min-w-0 col-span-2 lg:col-span-1`}>
        <p className={`${theme.muted} text-xs md:text-sm mb-1.5`}>Progresso</p>
        <h2 className={`${statValueClass} text-emerald-400`}>
          {percentageDisplay}%
        </h2>
      </div>
    </div>
  );
}
