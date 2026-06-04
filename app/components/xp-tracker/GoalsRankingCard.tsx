import type { HistoryEntry } from "~/hooks/useXpTracker";

interface GoalsRankingCardProps {
  history: HistoryEntry[];
  currentXP: number;
  dailyGoal: number;
  averageDailyXP: number | null;
  theme: {
    card: string;
    muted: string;
    text: string;
  };
}

function formatXP(value: number) {
  return Math.round(value).toLocaleString("pt-BR");
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getStartOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function sumXP(entries: HistoryEntry[]) {
  return entries.reduce((sum, entry) => sum + entry.xpGained, 0);
}

function getRunCount(source?: string) {
  if (!source) return 0;

  const matches = [...source.matchAll(/(\d+)x/g)];
  if (matches.length === 0) return /Cripta|Masmorra/i.test(source) ? 1 : 0;

  return matches.reduce((sum, match) => sum + Number(match[1]), 0);
}

function isFarmEntry(entry: HistoryEntry) {
  return /Cripta|Masmorra|farm/i.test(entry.source ?? "");
}

export function GoalsRankingCard({
  history,
  currentXP,
  dailyGoal,
  averageDailyXP,
  theme,
}: GoalsRankingCardProps) {
  const now = new Date();
  const todayKey = getDateKey(now);
  const monthKey = todayKey.slice(0, 7);
  const weekStart = getStartOfDay(now);
  weekStart.setDate(weekStart.getDate() - 6);

  const todayEntries = history.filter((entry) => getDateKey(new Date(entry.date)) === todayKey);
  const weekEntries = history.filter((entry) => new Date(entry.date) >= weekStart);
  const monthEntries = history.filter((entry) => getDateKey(new Date(entry.date)).startsWith(monthKey));
  const farmEntries = history.filter(isFarmEntry);

  const xpToday = sumXP(todayEntries);
  const xpWeek = sumXP(weekEntries);
  const xpMonth = sumXP(monthEntries);
  const weeklyGoal = dailyGoal > 0 ? dailyGoal * 7 : 0;
  const monthlyGoal = dailyGoal > 0 ? dailyGoal * 30 : 0;
  const bestEntry = history.reduce<HistoryEntry | null>(
    (best, entry) => (!best || entry.xpGained > best.xpGained ? entry : best),
    null
  );
  const farmRuns = farmEntries.reduce((sum, entry) => sum + getRunCount(entry.source), 0);
  const bestDay = Object.entries(
    history.reduce<Record<string, number>>((days, entry) => {
      const key = getDateKey(new Date(entry.date));
      days[key] = (days[key] ?? 0) + entry.xpGained;
      return days;
    }, {})
  ).sort((a, b) => b[1] - a[1])[0];

  const avg = averageDailyXP ?? (weekEntries.length > 0 ? xpWeek / 7 : 0);
  const projectedDays = avg > 0 && currentXP > 0 ? Math.ceil(currentXP / avg) : null;
  const remainingDailyGoal = Math.max(0, dailyGoal - xpToday);
  const goalCards = [
    {
      label: "Meta diária",
      value: dailyGoal > 0 ? `${formatXP(xpToday)} / ${formatXP(dailyGoal)}` : "Sem meta",
      progress: dailyGoal > 0 ? Math.min(100, (xpToday / dailyGoal) * 100) : 0,
      note: dailyGoal > 0 && remainingDailyGoal > 0
        ? `Faltam ${formatXP(remainingDailyGoal)} XP hoje.`
        : dailyGoal > 0
          ? "Meta diária concluída."
          : "Defina uma meta nas configurações.",
    },
    {
      label: "Meta semanal",
      value: weeklyGoal > 0 ? `${formatXP(xpWeek)} / ${formatXP(weeklyGoal)}` : "Sem meta",
      progress: weeklyGoal > 0 ? Math.min(100, (xpWeek / weeklyGoal) * 100) : 0,
      note: weeklyGoal > 0 ? "Baseada em 7 dias de meta diária." : "Depende da meta diária.",
    },
    {
      label: "Meta mensal",
      value: monthlyGoal > 0 ? `${formatXP(xpMonth)} / ${formatXP(monthlyGoal)}` : "Sem meta",
      progress: monthlyGoal > 0 ? Math.min(100, (xpMonth / monthlyGoal) * 100) : 0,
      note: monthlyGoal > 0 ? "Baseada em 30 dias de meta diária." : "Depende da meta diária.",
    },
  ];

  return (
    <section className={`${theme.card} border rounded-3xl p-4 md:p-5 mb-4 md:mb-5`}>
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sky-400 text-xs md:text-sm font-black mb-1">
            Metas e ranking
          </p>
          <h2 className="text-xl md:text-2xl font-black text-sky-300">
            Painel pessoal
          </h2>
          <p className={`${theme.muted} mt-1.5 text-xs md:text-sm`}>
            Acompanhe metas por período e seus melhores resultados.
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2">
          <p className="text-[11px] font-black uppercase text-cyan-300">
            Previsao atual
          </p>
          <p className="text-xl font-black text-cyan-300">
            {projectedDays ? `${projectedDays} dias` : "--"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {goalCards.map((goal) => (
          <div key={goal.label} className="rounded-2xl border border-sky-500/15 bg-black/20 p-4">
            <p className={`${theme.muted} text-xs font-black uppercase`}>
              {goal.label}
            </p>
            <p className={`${theme.text} mt-1 text-lg font-black`}>
              {goal.value}
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-900">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-300 to-emerald-500 transition-all"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
            <p className={`${theme.muted} mt-2 text-xs`}>
              {goal.note}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
          <p className={`${theme.muted} text-xs font-black uppercase`}>
            Melhor registro
          </p>
          <p className="mt-1 text-xl font-black text-emerald-300">
            {formatXP(bestEntry?.xpGained ?? 0)} XP
          </p>
        </div>

        <div className="rounded-2xl border border-sky-500/15 bg-sky-500/5 p-4">
          <p className={`${theme.muted} text-xs font-black uppercase`}>
            Melhor dia
          </p>
          <p className="mt-1 text-xl font-black text-sky-300">
            {formatXP(bestDay?.[1] ?? 0)} XP
          </p>
        </div>

        <div className="rounded-2xl border border-indigo-500/15 bg-indigo-500/5 p-4">
          <p className={`${theme.muted} text-xs font-black uppercase`}>
            Runs registradas
          </p>
          <p className="mt-1 text-xl font-black text-indigo-300">
            {farmRuns}
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-4">
          <p className={`${theme.muted} text-xs font-black uppercase`}>
            Melhor fonte
          </p>
          <p className={`${theme.text} mt-1 text-sm font-black line-clamp-2`}>
            {bestEntry?.source ?? "Sem histórico"}
          </p>
        </div>
      </div>
    </section>
  );
}
