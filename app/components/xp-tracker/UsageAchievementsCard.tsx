import type { HistoryEntry } from "~/hooks/useXpTracker";

interface UsageAchievementsCardProps {
  history: HistoryEntry[];
  dailyGoal: number;
  theme: {
    card: string;
    muted: string;
    text: string;
  };
}

function isSameDay(date: Date, reference: Date) {
  return date.toDateString() === reference.toDateString();
}

function getRunCountFromSource(source?: string) {
  if (!source) return 0;

  const matches = [...source.matchAll(/(\d+)x/g)];
  if (matches.length === 0) return 0;

  return matches.reduce((sum, match) => sum + Number(match[1]), 0);
}

function isFarmEntry(entry: HistoryEntry) {
  return /Cripta|Masmorra|Plano de farm/i.test(entry.source ?? "");
}

function formatXP(value: number) {
  return value.toLocaleString("pt-BR");
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getCurrentStreak(history: HistoryEntry[]) {
  const days = new Set(history.map((entry) => getDateKey(new Date(entry.date))));
  let streak = 0;
  const cursor = new Date();

  while (days.has(getDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function UsageAchievementsCard({
  history,
  dailyGoal,
  theme,
}: UsageAchievementsCardProps) {
  const today = new Date();
  const todayXP = history
    .filter((entry) => isSameDay(new Date(entry.date), today))
    .reduce((sum, entry) => sum + entry.xpGained, 0);
  const farmEntries = history.filter(isFarmEntry);
  const farmXP = farmEntries.reduce((sum, entry) => sum + entry.xpGained, 0);
  const farmRuns = farmEntries.reduce(
    (sum, entry) => sum + getRunCountFromSource(entry.source),
    0
  );
  const totalXP = history.reduce((sum, entry) => sum + entry.xpGained, 0);
  const currentStreak = getCurrentStreak(history);

  const achievements = [
    {
      title: "Primeira run registrada",
      description: "Registre qualquer cripta ou masmorra pela calculadora.",
      current: farmRuns,
      target: 1,
      value: `${farmRuns}/1`,
    },
    {
      title: "10 runs no histórico",
      description: "Acumule runs registradas no histórico inteligente.",
      current: farmRuns,
      target: 10,
      value: `${farmRuns}/10`,
    },
    {
      title: "100k XP farmado",
      description: "Some XP vindo de criptas, masmorras ou planos de farm.",
      current: farmXP,
      target: 100000,
      value: `${formatXP(farmXP)}/100.000`,
    },
    {
      title: "500k XP no histórico",
      description: "Some meio milhão de XP registrado em qualquer fonte.",
      current: totalXP,
      target: 500000,
      value: `${formatXP(totalXP)}/500.000`,
    },
    {
      title: "1M XP acumulado",
      description: "Transforme o histórico em um marco de longo prazo.",
      current: totalXP,
      target: 1000000,
      value: `${formatXP(totalXP)}/1.000.000`,
    },
    {
      title: "7 dias em sequência",
      description: "Registre progresso por uma semana seguida.",
      current: currentStreak,
      target: 7,
      value: `${currentStreak}/7 dias`,
    },
    {
      title: "50 runs no farm",
      description: "Acumule cinquenta runs registradas no histórico.",
      current: farmRuns,
      target: 50,
      value: `${farmRuns}/50`,
    },
    {
      title: "Meta diária batida",
      description: "Alcance a meta diária usando registros de hoje.",
      current: dailyGoal > 0 ? todayXP : 0,
      target: dailyGoal > 0 ? dailyGoal : 1,
      value:
        dailyGoal > 0
          ? `${formatXP(todayXP)}/${formatXP(dailyGoal)}`
          : "Sem meta",
    },
  ];

  return (
    <section className={`${theme.card} border rounded-3xl p-4 md:p-5 mb-4 md:mb-5`}>
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-yellow-400 text-xs md:text-sm font-black mb-1">
            Conquistas de uso
          </p>
          <h2 className="text-xl md:text-2xl font-black text-yellow-300">
            Marcos do seu farm
          </h2>
          <p className={`${theme.muted} mt-1.5 text-xs md:text-sm`}>
            Objetivos automáticos baseados nas runs e no XP registrado.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
          <p className="text-[11px] font-black uppercase text-emerald-300">
            Runs registradas
          </p>
          <p className="text-xl font-black text-emerald-300">
            {farmRuns}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 md:gap-3">
        {achievements.map((achievement) => {
          const unlocked = achievement.current >= achievement.target;
          const progress = Math.min(
            100,
            (achievement.current / achievement.target) * 100
          );

          return (
            <div
              key={achievement.title}
              className={`rounded-2xl border p-3 transition-all ${
                unlocked
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-zinc-800/80 bg-black/20"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={unlocked ? "text-emerald-300 font-black" : `${theme.text} font-black`}>
                    {achievement.title}
                  </p>
                  <p className={`${theme.muted} mt-1.5 text-xs leading-relaxed`}>
                    {achievement.description}
                  </p>
                </div>

                <span
                  className={`rounded-full border px-2 py-1 text-[11px] font-black ${
                    unlocked
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : "border-zinc-700 bg-zinc-900 text-zinc-500"
                  }`}
                >
                  {unlocked ? "Feita" : "Bloq."}
                </span>
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-900">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-emerald-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className={`${theme.muted} mt-2 text-xs font-bold`}>
                {achievement.value}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
