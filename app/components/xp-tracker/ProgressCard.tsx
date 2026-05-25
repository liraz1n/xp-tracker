const ACHIEVEMENTS = [
  {
    milestone: 25,
    tier: "I",
    title: "Primeiro Impulso",
    message: "Primeiro quarto concluído!",
    description: "Você saiu da largada e já construiu ritmo.",
    accent: "from-amber-300 to-yellow-600",
  },
  {
    milestone: 50,
    tier: "II",
    title: "Meio Caminho",
    message: "Metade do caminho!",
    description: "A meta já deixou de ser promessa e virou consistência.",
    accent: "from-cyan-300 to-blue-600",
  },
  {
    milestone: 75,
    tier: "III",
    title: "Reta Final",
    message: "Reta final!",
    description: "Falta pouco. Agora é acabamento e foco.",
    accent: "from-fuchsia-300 to-violet-700",
  },
  {
    milestone: 100,
    tier: "IV",
    title: "Meta Dominada",
    message: "Meta atingida!",
    description: "Objetivo fechado. Progresso transformado em conquista.",
    accent: "from-emerald-300 to-green-700",
  },
];

interface ProgressCardProps {
  completedXP: number;
  percentageValue: number;
  percentageDisplay: string;
  activeMilestone: number | null;
  barPulsing: boolean;
  theme: {
    card: string;
    muted: string;
    text: string;
  };
}

export function ProgressCard({
  completedXP,
  percentageValue,
  percentageDisplay,
  activeMilestone,
  barPulsing,
  theme,
}: ProgressCardProps) {
  const activeAchievement = ACHIEVEMENTS.find(
    (achievement) => achievement.milestone === activeMilestone
  );

  return (
    <div className={`${theme.card} border rounded-3xl p-5 md:p-8 shadow-[0_0_40px_rgba(234,179,8,0.12)] mb-6 md:mb-8`}>
      <div className="flex flex-col gap-3 md:gap-4 md:flex-row md:justify-between md:items-start mb-5 md:mb-6">
        <div>
          <span className={`${theme.muted} text-sm md:text-base`}>Progresso da Meta</span>
          <h2 className="text-xl md:text-2xl font-black text-yellow-300 mt-1">
            Jornada de Conquistas
          </h2>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 md:gap-3">
          {activeAchievement && (
            <div className="relative overflow-hidden border border-yellow-400/40 bg-yellow-500/10 rounded-2xl px-4 py-3 shadow-[0_0_35px_rgba(234,179,8,0.22)] animate-pulse">
              <div className="absolute inset-y-0 -left-12 w-12 rotate-12 bg-white/20 blur-md" />
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${activeAchievement.accent} text-black flex items-center justify-center font-black shadow-[0_0_22px_rgba(234,179,8,0.35)]`}>
                  {activeAchievement.tier}
                </div>
                <div>
                  <p className="text-yellow-200 text-xs font-bold uppercase tracking-wide">
                    Nova conquista desbloqueada
                  </p>
                  <p className="text-yellow-50 font-black">
                    {activeAchievement.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          <span className="font-black text-yellow-300 text-xl md:text-2xl">
            {percentageDisplay}%
          </span>
        </div>
      </div>

      <div className="relative w-full bg-black rounded-full h-8 md:h-10 overflow-hidden border border-yellow-500/20">
        <div
          className={`bg-gradient-to-r from-yellow-300 via-yellow-500 to-amber-700 h-full rounded-full transition-all duration-700 shadow-[0_0_20px_rgba(234,179,8,0.5)] ${barPulsing ? "animate-pulse" : ""}`}
          style={{ width: `${percentageValue}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mt-5 md:mt-6">
        {ACHIEVEMENTS.map((achievement) => {
          const unlocked = percentageValue >= achievement.milestone;

          return (
            <div
              key={achievement.milestone}
              className={`relative overflow-hidden border rounded-2xl p-3.5 md:p-4 transition-all duration-300 ${
                unlocked
                  ? "border-yellow-400/40 bg-yellow-500/10 shadow-[0_0_30px_rgba(234,179,8,0.16)]"
                  : "border-zinc-700/40 bg-black/25 opacity-70"
              }`}
            >
              {unlocked && (
                <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br ${achievement.accent} opacity-20 blur-2xl`} />
              )}

              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className={`text-[11px] md:text-xs font-black uppercase tracking-wide ${unlocked ? "text-yellow-300" : theme.muted}`}>
                    {achievement.milestone}% concluído
                  </p>
                  <h3 className={`text-base md:text-lg font-black mt-1 ${unlocked ? theme.text : theme.muted}`}>
                    {achievement.title}
                  </h3>
                </div>

                <div className={`shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-full border flex items-center justify-center font-black ${
                  unlocked
                    ? `bg-gradient-to-br ${achievement.accent} border-white/20 text-black shadow-[0_0_22px_rgba(234,179,8,0.25)]`
                    : "bg-zinc-900 border-zinc-700 text-zinc-600"
                }`}>
                  {achievement.tier}
                </div>
              </div>

              <p className={`${unlocked ? "text-zinc-300" : theme.muted} relative text-sm mt-2.5 md:mt-3 leading-relaxed`}>
                {unlocked ? achievement.description : "Bloqueada até este marco ser alcançado."}
              </p>

              <div className="relative mt-3 md:mt-4 h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${achievement.accent} transition-all duration-700`}
                  style={{
                    width: `${Math.min(100, (percentageValue / achievement.milestone) * 100)}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className={`mt-5 md:mt-6 ${theme.muted} text-base md:text-lg`}>
        XP Completo:{" "}
        <span className={`${theme.text} font-bold`}>
          {completedXP.toLocaleString("pt-BR")}
        </span>
      </div>
    </div>
  );
}
