interface HistoryEntry {
  date: string;
  xpGained: number;
  xpRemaining: number;
  totalXP?: number;
  source?: string;
}

interface SmartHistoryCardProps {
  history: HistoryEntry[];
  currentXP: number;
  theme: {
    card: string;
    muted: string;
    text: string;
  };
}

function formatXP(value: number) {
  return value.toLocaleString("pt-BR");
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getStartOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function getActivityName(entry: HistoryEntry) {
  if (!entry.source) return "Progresso manual";

  return entry.source.replace(/^\d+x\s*/, "");
}

const LEVEL_UP_RUN_OPTIONS = [
  { label: "Cripta 1 ate nivel 30", detail: "4 jogadores", xp: 53942 },
  { label: "Cripta 1 ate nivel 31", detail: "4 jogadores", xp: 58290 },
  { label: "Cripta 1 ate nivel 32", detail: "4 jogadores", xp: 62942 },
  { label: "Cripta 1 ate nivel 33", detail: "4 jogadores", xp: 67990 },
  { label: "Cripta 1 ate nivel 30", detail: "5 jogadores", xp: 53942 },
  { label: "Cripta 1 ate nivel 31", detail: "5 jogadores", xp: 58290 },
  { label: "Masmorra Deserto", detail: "4 jogadores", xp: 9737 },
  { label: "Masmorra Deserto", detail: "5 jogadores", xp: 7890 },
  { label: "Masmorra Cemiterio", detail: "4 jogadores", xp: 8537 },
  { label: "Masmorra Pantano", detail: "4 jogadores", xp: 2937 },
];

export function SmartHistoryCard({
  history,
  currentXP,
  theme,
}: SmartHistoryCardProps) {
  const now = new Date();
  const todayEntries = history.filter((entry) =>
    isSameDay(new Date(entry.date), now)
  );
  const sevenDaysAgo = getStartOfDay(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const weekEntries = history.filter((entry) => new Date(entry.date) >= sevenDaysAgo);
  const xpToday = todayEntries.reduce((sum, entry) => sum + entry.xpGained, 0);
  const xpWeek = weekEntries.reduce((sum, entry) => sum + entry.xpGained, 0);
  const bestEntry = history.reduce<HistoryEntry | null>(
    (best, entry) => (!best || entry.xpGained > best.xpGained ? entry : best),
    null
  );
  const averagePerEntry =
    history.length > 0
      ? Math.round(history.reduce((sum, entry) => sum + entry.xpGained, 0) / history.length)
      : 0;
  const weekAverage = weekEntries.length > 0 ? Math.round(xpWeek / 7) : 0;
  const daysByWeekAverage =
    weekAverage > 0 && currentXP > 0 ? Math.ceil(currentXP / weekAverage) : null;

  const activityTotals = history.reduce<Record<string, number>>((totals, entry) => {
    const activityName = getActivityName(entry);
    totals[activityName] = (totals[activityName] ?? 0) + entry.xpGained;
    return totals;
  }, {});

  const favoriteActivity = Object.entries(activityTotals).sort((a, b) => b[1] - a[1])[0];
  const levelUpSuggestions = LEVEL_UP_RUN_OPTIONS
    .map((activity) => {
      const runs = currentXP > 0 ? Math.ceil(currentXP / activity.xp) : 0;
      const totalXP = runs * activity.xp;

      return {
        ...activity,
        runs,
        totalXP,
        overflowXP: Math.max(0, totalXP - currentXP),
      };
    })
    .filter((activity) => activity.runs > 0)
    .sort((a, b) => a.runs - b.runs || a.overflowXP - b.overflowXP)
    .slice(0, 4);

  return (
    <section className={`${theme.card} border rounded-3xl p-5 md:p-8 mb-6 md:mb-8`}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="lg:max-w-xs">
          <p className="text-sky-400 text-sm font-black mb-2">
            Histórico inteligente
          </p>

          <h2 className="text-2xl md:text-3xl font-black text-sky-300">
            Ritmo de evolução
          </h2>

          <p className={`${theme.muted} mt-3 leading-relaxed`}>
            Um resumo rápido do seu farm recente, melhores registros e previsão baseada nos últimos 7 dias.
          </p>
        </div>

        {history.length === 0 ? (
          <div className="flex-1 rounded-3xl border border-sky-500/15 bg-black/20 p-6">
            <p className={`${theme.muted} leading-relaxed`}>
              Registre runs ou salve progresso para começar a gerar estatísticas inteligentes.
            </p>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className={`${theme.muted} text-xs font-bold uppercase`}>
                XP hoje
              </p>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {formatXP(xpToday)}
              </p>
              <p className={`${theme.muted} text-xs mt-2`}>
                {todayEntries.length} registro{todayEntries.length === 1 ? "" : "s"} hoje.
              </p>
            </div>

            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
              <p className={`${theme.muted} text-xs font-bold uppercase`}>
                Últimos 7 dias
              </p>
              <p className="text-2xl font-black text-sky-300 mt-1">
                {formatXP(xpWeek)}
              </p>
              <p className={`${theme.muted} text-xs mt-2`}>
                Média de {formatXP(weekAverage)} XP/dia.
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
              <p className={`${theme.muted} text-xs font-bold uppercase`}>
                Melhor registro
              </p>
              <p className="text-2xl font-black text-indigo-300 mt-1">
                {formatXP(bestEntry?.xpGained ?? 0)}
              </p>
              <p className={`${theme.muted} text-xs mt-2 line-clamp-2`}>
                {bestEntry?.source ?? "Progresso manual"}
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
              <p className={`${theme.muted} text-xs font-bold uppercase`}>
                Previsão recente
              </p>
              <p className="text-2xl font-black text-cyan-300 mt-1">
                {daysByWeekAverage ? `${daysByWeekAverage} dias` : "--"}
              </p>
              <p className={`${theme.muted} text-xs mt-2`}>
                Pela média dos últimos 7 dias.
              </p>
            </div>

            <div className="sm:col-span-2 xl:col-span-4 rounded-2xl border border-sky-500/15 bg-black/20 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className={`${theme.muted} text-xs font-bold uppercase`}>
                    Média por registro
                  </p>
                  <p className={`${theme.text} text-lg font-black mt-1`}>
                    {formatXP(averagePerEntry)} XP
                  </p>
                </div>

                <div>
                  <p className={`${theme.muted} text-xs font-bold uppercase`}>
                    Atividade mais forte
                  </p>
                  <p className={`${theme.text} text-lg font-black mt-1`}>
                    {favoriteActivity?.[0] ?? "Sem atividade"}
                  </p>
                </div>

                <div>
                  <p className={`${theme.muted} text-xs font-bold uppercase`}>
                    XP nessa atividade
                  </p>
                  <p className={`${theme.text} text-lg font-black mt-1`}>
                    {formatXP(favoriteActivity?.[1] ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 xl:col-span-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
              <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-emerald-300 text-sm font-black">
                    Plano rapido para upar
                  </p>
                  <p className={`${theme.muted} text-xs`}>
                    Com base no XP restante atual: {formatXP(currentXP)} XP.
                  </p>
                </div>
              </div>

              {levelUpSuggestions.length === 0 ? (
                <p className={`${theme.muted} text-sm`}>
                  Configure seu XP restante para gerar sugestões de cripta e masmorra.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
                  {levelUpSuggestions.map((suggestion) => (
                    <div
                      key={`${suggestion.label}-${suggestion.detail}`}
                      className="rounded-2xl border border-emerald-500/15 bg-black/20 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`${theme.text} text-sm font-black leading-tight`}>
                            {suggestion.label}
                          </p>
                          <p className={`${theme.muted} text-xs leading-tight`}>
                            {suggestion.detail}
                          </p>
                        </div>
                        <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-black text-emerald-300">
                          {suggestion.runs}x
                        </span>
                      </div>

                      <p className={`${theme.muted} mt-3 text-xs`}>
                        Fecha com {formatXP(suggestion.totalXP)} XP
                        {suggestion.overflowXP > 0
                          ? ` e sobra ${formatXP(suggestion.overflowXP)} XP.`
                          : "."}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
