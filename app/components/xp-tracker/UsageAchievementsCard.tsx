import { useMemo, useState } from "react";
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

type AchievementTab = "pending" | "completed";

interface Achievement {
  groupKey: string;
  title: string;
  description: string;
  current: number;
  target: number;
  value: string;
  tone: "yellow" | "emerald" | "cyan" | "violet";
}

function isSameDay(date: Date, reference: Date) {
  return date.toDateString() === reference.toDateString();
}

function getRunCountFromSource(source?: string) {
  if (!source) return 0;

  const matches = [...source.matchAll(/(\d+)x/g)];
  if (matches.length === 0) return /Cripta|Masmorra|Plano de farm/i.test(source) ? 1 : 0;

  return matches.reduce((sum, match) => sum + Number(match[1]), 0);
}

function isFarmEntry(entry: HistoryEntry) {
  return /Cripta|Masmorra|Plano de farm/i.test(entry.source ?? "");
}

function isCriptaEntry(entry: HistoryEntry) {
  return /Cripta/i.test(entry.source ?? "");
}

function isMasmorraEntry(entry: HistoryEntry) {
  return /Masmorra/i.test(entry.source ?? "");
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

function buildThresholdAchievements({
  groupKey,
  prefix,
  description,
  current,
  thresholds,
  suffix,
  tone,
}: {
  groupKey: string;
  prefix: string;
  description: string;
  current: number;
  thresholds: number[];
  suffix: string;
  tone: Achievement["tone"];
}) {
  return thresholds.map((target) => ({
    groupKey,
    title: `${prefix} ${suffix === "XP" ? formatXP(target) : target} ${suffix}`,
    description,
    current,
    target,
    value: `${formatXP(Math.min(current, target))}/${formatXP(target)} ${suffix}`,
    tone,
  }));
}

export function UsageAchievementsCard({
  history,
  dailyGoal,
  theme,
}: UsageAchievementsCardProps) {
  const [activeTab, setActiveTab] = useState<AchievementTab>("pending");
  const [isExpanded, setIsExpanded] = useState(false);

  const today = new Date();
  const todayXP = history
    .filter((entry) => isSameDay(new Date(entry.date), today))
    .reduce((sum, entry) => sum + entry.xpGained, 0);
  const farmEntries = history.filter(isFarmEntry);
  const criptaEntries = history.filter(isCriptaEntry);
  const masmorraEntries = history.filter(isMasmorraEntry);
  const farmXP = farmEntries.reduce((sum, entry) => sum + entry.xpGained, 0);
  const criptaXP = criptaEntries.reduce((sum, entry) => sum + entry.xpGained, 0);
  const masmorraXP = masmorraEntries.reduce((sum, entry) => sum + entry.xpGained, 0);
  const farmRuns = farmEntries.reduce(
    (sum, entry) => sum + getRunCountFromSource(entry.source),
    0
  );
  const criptaRuns = criptaEntries.reduce(
    (sum, entry) => sum + getRunCountFromSource(entry.source),
    0
  );
  const masmorraRuns = masmorraEntries.reduce(
    (sum, entry) => sum + getRunCountFromSource(entry.source),
    0
  );
  const totalXP = history.reduce((sum, entry) => sum + entry.xpGained, 0);
  const bestRunXP = history.reduce(
    (best, entry) => Math.max(best, entry.xpGained),
    0
  );
  const activeDays = new Set(
    history.map((entry) => getDateKey(new Date(entry.date)))
  ).size;
  const currentStreak = getCurrentStreak(history);

  const achievements = useMemo<Achievement[]>(() => {
    return [
      ...buildThresholdAchievements({
        groupKey: "farm-runs",
        prefix: "Farmador",
        description: "Acumule runs registradas por atalhos, criptas, masmorras ou plano.",
        current: farmRuns,
        thresholds: [1, 5, 10, 25, 50, 100, 150, 250, 500, 1000],
        suffix: "runs",
        tone: "emerald",
      }),
      ...buildThresholdAchievements({
        groupKey: "total-xp",
        prefix: "XP acumulado",
        description: "Some XP registrado em qualquer fonte do histórico.",
        current: totalXP,
        thresholds: [50000, 100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000],
        suffix: "XP",
        tone: "yellow",
      }),
      ...buildThresholdAchievements({
        groupKey: "cripta-runs",
        prefix: "Cripta dominada",
        description: "Registre runs de cripta e avance nos marcos de exploração.",
        current: criptaRuns,
        thresholds: [1, 5, 10, 25, 50, 100, 250],
        suffix: "runs",
        tone: "cyan",
      }),
      ...buildThresholdAchievements({
        groupKey: "cripta-xp",
        prefix: "XP de cripta",
        description: "Some XP vindo especificamente de criptas.",
        current: criptaXP,
        thresholds: [100000, 250000, 500000, 1000000, 2500000, 5000000],
        suffix: "XP",
        tone: "cyan",
      }),
      ...buildThresholdAchievements({
        groupKey: "masmorra-runs",
        prefix: "Masmorra limpa",
        description: "Registre masmorras para criar uma rotina de farm consistente.",
        current: masmorraRuns,
        thresholds: [1, 5, 10, 25, 50, 100, 250],
        suffix: "runs",
        tone: "violet",
      }),
      ...buildThresholdAchievements({
        groupKey: "masmorra-xp",
        prefix: "XP de masmorra",
        description: "Some XP vindo especificamente de masmorras.",
        current: masmorraXP,
        thresholds: [50000, 100000, 250000, 500000, 1000000, 2500000],
        suffix: "XP",
        tone: "violet",
      }),
      ...buildThresholdAchievements({
        groupKey: "streak-days",
        prefix: "Sequência",
        description: "Registre progresso em dias seguidos.",
        current: currentStreak,
        thresholds: [2, 3, 5, 7, 14, 21, 30],
        suffix: "dias",
        tone: "emerald",
      }),
      ...buildThresholdAchievements({
        groupKey: "active-days",
        prefix: "Dias ativos",
        description: "Volte ao XP Tracker em dias diferentes e mantenha o hábito vivo.",
        current: activeDays,
        thresholds: [2, 5, 10, 20, 30, 60, 100],
        suffix: "dias",
        tone: "yellow",
      }),
      ...buildThresholdAchievements({
        groupKey: "best-run",
        prefix: "Melhor registro",
        description: "Faça um registro grande de XP em uma única entrada.",
        current: bestRunXP,
        thresholds: [10000, 25000, 50000, 100000, 250000, 500000],
        suffix: "XP",
        tone: "cyan",
      }),
      {
        groupKey: "daily-goal",
        title: "Meta diária batida",
        description: "Alcance a meta diária usando registros de hoje.",
        current: dailyGoal > 0 ? todayXP : 0,
        target: dailyGoal > 0 ? dailyGoal : 1,
        value:
          dailyGoal > 0
            ? `${formatXP(Math.min(todayXP, dailyGoal))}/${formatXP(dailyGoal)} XP`
            : "Sem meta diária",
        tone: "emerald",
      },
    ];
  }, [
    activeDays,
    bestRunXP,
    criptaRuns,
    criptaXP,
    currentStreak,
    dailyGoal,
    farmRuns,
    masmorraRuns,
    masmorraXP,
    todayXP,
    totalXP,
  ]);

  const completedAchievements = achievements.filter(
    (achievement) => achievement.current >= achievement.target
  );
  const nextPendingAchievements = achievements.reduce<Achievement[]>(
    (nextAchievements, achievement) => {
      if (achievement.current >= achievement.target) return nextAchievements;

      const alreadyHasGroup = nextAchievements.some(
        (item) => item.groupKey === achievement.groupKey
      );
      if (!alreadyHasGroup) nextAchievements.push(achievement);

      return nextAchievements;
    },
    []
  );
  const visibleAchievements =
    activeTab === "completed" ? completedAchievements : nextPendingAchievements;

  const toneClass = {
    yellow: "border-yellow-500/20 bg-yellow-500/5 text-yellow-300",
    emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
    cyan: "border-cyan-500/20 bg-cyan-500/5 text-cyan-300",
    violet: "border-violet-500/20 bg-violet-500/5 text-violet-300",
  } as const;

  return (
    <section className={`${theme.card} border rounded-3xl p-4 md:p-5 mb-4 md:mb-5`}>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-yellow-400 text-xs md:text-sm font-black mb-1">
            Conquistas de uso
          </p>
          <h2 className="text-xl md:text-2xl font-black text-yellow-300">
            Marcos do seu farm
          </h2>
          <p className={`${theme.muted} mt-1.5 text-xs md:text-sm`}>
            Pendentes mostram apenas o próximo objetivo de cada trilha.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
            <p className="text-[11px] font-black uppercase text-emerald-300">
              Runs
            </p>
            <p className="text-xl font-black text-emerald-300">
              {farmRuns}
            </p>
          </div>
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-3 py-2">
            <p className="text-[11px] font-black uppercase text-yellow-300">
              Feitos
            </p>
            <p className="text-xl font-black text-yellow-300">
              {completedAchievements.length}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="col-span-2 rounded-2xl border border-yellow-500/25 bg-yellow-500/10 px-4 py-2 text-xs font-black text-yellow-200 transition-all hover:bg-yellow-500 hover:text-black sm:col-span-1"
          >
            {isExpanded ? "Reduzir" : "Expandir"}
          </button>
        </div>
      </div>

      {!isExpanded ? (
        <div className="rounded-2xl border border-yellow-500/10 bg-black/20 p-4">
          <p className="text-sm font-black text-yellow-200">
            {nextPendingAchievements.length} próximos marcos na fila
          </p>
          <p className={`${theme.muted} mt-1 text-xs`}>
            Expanda para acompanhar os objetivos mais próximos e os marcos já concluídos.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {[
              { id: "pending" as const, label: "Marcos Pendentes", count: nextPendingAchievements.length },
              { id: "completed" as const, label: "Marcos concluídos", count: completedAchievements.length },
            ].map((tab) => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-2xl border px-3 py-2 text-xs font-black transition-all ${
                  activeTab === tab.id
                    ? "border-yellow-400 bg-yellow-500/15 text-yellow-200"
                    : "border-yellow-500/10 bg-black/20 text-zinc-500 hover:text-yellow-200"
                }`}
              >
                {tab.label}
                <span className="ml-2 rounded-full border border-yellow-500/20 px-2 py-0.5 text-[10px]">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {visibleAchievements.length === 0 ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="font-black text-emerald-300">
                Nenhum marco nesta guia.
              </p>
              <p className={`${theme.muted} mt-1 text-sm`}>
                Continue registrando runs para movimentar sua jornada.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 md:gap-3">
              {visibleAchievements.map((achievement) => {
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
                    className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-black ${
                      unlocked
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : toneClass[achievement.tone]
                    }`}
                  >
                    {unlocked ? "Feita" : "Em rota"}
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
      )}
        </>
      )}
    </section>
  );
}
