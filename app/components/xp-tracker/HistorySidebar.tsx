import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ChartIcon, ScrollIcon } from "~/components/xp-tracker/UiIcons";

interface HistoryEntry {
  date: string;
  xpGained: number;
  xpRemaining: number;
  totalXP?: number;
  source?: string;
}

type SidebarTab = "historico" | "grafico";
type ChartFilter = "all" | "7d" | "30d" | "month";
type HistoryTypeFilter = "all" | "cripta" | "masmorra" | "manual";
type HistorySort = "recent" | "xp_desc" | "xp_asc";

interface HistorySidebarProps {
  open: boolean;
  darkMode: boolean;
  history: HistoryEntry[];
  totalXP: number;
  sidebarTab: SidebarTab;
  setSidebarTab: (tab: SidebarTab) => void;
  onClose: () => void;
  onDeleteHistoryEntry: (index: number) => void;
  onEditHistoryEntry: (index: number) => void;
  onDuplicateHistoryEntry: (index: number) => void;
  formatEntryDate: (iso: string) => string;
  theme: {
    sidebar: string;
    muted: string;
    histEntry: string;
    tabActive: string;
    tabInactive: string;
    chartGrid: string;
    chartText: string;
  };
}

interface ChartPoint {
  name: string;
  label: string;
  xpGained: number;
  xpRestante: number;
  progress: number;
}

const tabs = [
  { id: "historico", label: "Histórico", icon: ScrollIcon },
  { id: "grafico", label: "Gráfico", icon: ChartIcon },
] as const;

const chartFilters: { id: ChartFilter; label: string }[] = [
  { id: "all", label: "Tudo" },
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "month", label: "Mês" },
];

const historyTypeFilters: { id: HistoryTypeFilter; label: string }[] = [
  { id: "all", label: "Tudo" },
  { id: "cripta", label: "Cripta" },
  { id: "masmorra", label: "Masmorra" },
  { id: "manual", label: "Manual" },
];

const historySortOptions: { id: HistorySort; label: string }[] = [
  { id: "recent", label: "Recentes" },
  { id: "xp_desc", label: "Maior XP" },
  { id: "xp_asc", label: "Menor XP" },
];

function getEntryProgress(entry: HistoryEntry, fallbackTotalXP: number) {
  const entryTotalXP = entry.totalXP ?? fallbackTotalXP;
  const completedXP = Math.max(0, entryTotalXP - entry.xpRemaining);

  if (entryTotalXP <= 0) return 0;

  return Math.min(100, Math.max(0, (completedXP / entryTotalXP) * 100));
}

function filterHistoryByPeriod(history: HistoryEntry[], filter: ChartFilter) {
  if (filter === "all") return history;

  const now = new Date();

  return history.filter((entry) => {
    const entryDate = new Date(entry.date);

    if (filter === "month") {
      return (
        entryDate.getFullYear() === now.getFullYear() &&
        entryDate.getMonth() === now.getMonth()
      );
    }

    const days = filter === "7d" ? 7 : 30;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);

    return entryDate >= cutoff;
  });
}

function ChartTooltip({
  active,
  payload,
  darkMode,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
  darkMode: boolean;
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <div
      className={`rounded-2xl border p-3 shadow-xl ${
        darkMode
          ? "bg-zinc-950 border-yellow-500/20 text-white"
          : "bg-white border-yellow-300 text-zinc-900"
      }`}
    >
      <p className="text-xs font-bold text-yellow-400 mb-2">{point.label}</p>
      <div className="space-y-1 text-xs">
        <p>
          <span className="text-zinc-500">XP ganho: </span>
          <span className="font-bold text-emerald-400">
            +{point.xpGained.toLocaleString("pt-BR")} XP
          </span>
        </p>
        <p>
          <span className="text-zinc-500">XP restante: </span>
          <span className="font-bold text-red-400">
            {point.xpRestante.toLocaleString("pt-BR")} XP
          </span>
        </p>
        <p>
          <span className="text-zinc-500">Progresso: </span>
          <span className="font-bold text-yellow-300">
            {point.progress.toFixed(2)}%
          </span>
        </p>
      </div>
    </div>
  );
}

export function HistorySidebar({
  open,
  darkMode,
  history,
  totalXP,
  sidebarTab,
  setSidebarTab,
  onClose,
  onDeleteHistoryEntry,
  onEditHistoryEntry,
  onDuplicateHistoryEntry,
  formatEntryDate,
  theme,
}: HistorySidebarProps) {
  const [chartFilter, setChartFilter] = useState<ChartFilter>("all");
  const [historyTypeFilter, setHistoryTypeFilter] = useState<HistoryTypeFilter>("all");
  const [historySort, setHistorySort] = useState<HistorySort>("recent");

  const displayHistory = useMemo(() => {
    return history
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => {
        if (historyTypeFilter === "all") return true;

        const source = entry.source ?? "";

        if (historyTypeFilter === "manual") {
          return !/Cripta|Masmorra/i.test(source);
        }

        return source.toLowerCase().includes(historyTypeFilter);
      })
      .sort((left, right) => {
        if (historySort === "xp_desc") return right.entry.xpGained - left.entry.xpGained;
        if (historySort === "xp_asc") return left.entry.xpGained - right.entry.xpGained;

        return left.index - right.index;
      });
  }, [history, historySort, historyTypeFilter]);

  const chartData = useMemo(() => {
    const filteredHistory = filterHistoryByPeriod(history, chartFilter);

    return [...filteredHistory].reverse().map((entry, index) => ({
      name: `#${index + 1}`,
      label: formatEntryDate(entry.date),
      xpGained: entry.xpGained,
      xpRestante: entry.xpRemaining,
      progress: getEntryProgress(entry, totalXP),
    }));
  }, [chartFilter, formatEntryDate, history, totalXP]);

  const totalFilteredXp = chartData.reduce(
    (sum, point) => sum + point.xpGained,
    0
  );
  const latestPoint = chartData[chartData.length - 1];

  return (
    <>
      <div
        className={`fixed top-0 right-0 h-full w-80 ${theme.sidebar} border-l transition-transform duration-300 z-40 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-0 border-b border-inherit">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setSidebarTab(tab.id)}
                  className={`px-3 py-2 rounded-t-xl text-xs font-bold border transition-all ${
                    sidebarTab === tab.id ? theme.tabActive : theme.tabInactive
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            aria-label="Fechar histórico"
            onClick={onClose}
            className={`${theme.muted} text-lg mb-2 ml-2`}
          >
            X
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {sidebarTab === "historico" && (
            history.length === 0 ? (
              <p className={`${theme.muted} text-sm text-center mt-8`}>
                Nenhum registro ainda.
                <br />
                Salve o progresso para começar.
              </p>
            ) : (
              <>
                <div className="mb-3 space-y-2">
                  <div className="grid grid-cols-4 gap-1">
                    {historyTypeFilters.map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setHistoryTypeFilter(filter.id)}
                        className={`rounded-xl border px-2 py-1.5 text-[11px] font-black transition-all ${
                          historyTypeFilter === filter.id
                            ? theme.tabActive
                            : theme.tabInactive
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {historySortOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setHistorySort(option.id)}
                        className={`rounded-xl border px-2 py-1.5 text-[11px] font-black transition-all ${
                          historySort === option.id
                            ? theme.tabActive
                            : theme.tabInactive
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {displayHistory.length === 0 ? (
                  <p className={`${theme.muted} text-sm text-center mt-8`}>
                    Nenhum registro neste filtro.
                  </p>
                ) : (
                  displayHistory.map(({ entry, index }) => {
                    const entryProgress = getEntryProgress(entry, totalXP);

                    return (
                      <div
                        key={`${entry.date}-${index}`}
                        className={`py-4 border-b ${theme.histEntry}`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className="text-emerald-400 font-bold">
                              +{entry.xpGained.toLocaleString("pt-BR")} XP
                            </span>
                            <p className={`${theme.muted} text-xs mt-0.5`}>
                              {formatEntryDate(entry.date)}
                            </p>
                            {entry.source && (
                              <p className="text-yellow-300 text-xs font-bold mt-1">
                                {entry.source}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              aria-label="Editar registro"
                              onClick={() => onEditHistoryEntry(index)}
                              className="w-7 h-7 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 hover:bg-yellow-500 hover:text-black transition-all"
                            >
                              E
                            </button>
                            <button
                              type="button"
                              aria-label="Duplicar registro"
                              onClick={() => onDuplicateHistoryEntry(index)}
                              className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500 hover:text-black transition-all"
                            >
                              D
                            </button>
                            <button
                              type="button"
                              aria-label="Excluir registro"
                              onClick={() => onDeleteHistoryEntry(index)}
                              className="w-7 h-7 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                            >
                              X
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className="rounded-xl border border-red-500/15 bg-red-500/5 px-3 py-2">
                            <p className={`${theme.muted} text-[10px] font-bold uppercase`}>
                              Restante
                            </p>
                            <p className="text-sm font-black text-red-300">
                              {entry.xpRemaining.toLocaleString("pt-BR")} XP
                            </p>
                          </div>
                          <div className="rounded-xl border border-yellow-500/15 bg-yellow-500/5 px-3 py-2">
                            <p className={`${theme.muted} text-[10px] font-bold uppercase`}>
                              Progresso
                            </p>
                            <p className="text-sm font-black text-yellow-300">
                              {entryProgress.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )
          )}

          {sidebarTab === "grafico" && (
            history.length < 2 ? (
              <p className={`${theme.muted} text-sm text-center mt-12`}>
                Salve pelo menos 2 atualizações
                <br />
                para ver o gráfico.
              </p>
            ) : (
              <div>
                <p className={`${theme.muted} text-xs mb-3`}>
                  XP restante ao longo do tempo
                </p>
                <div className="grid grid-cols-4 gap-1 mb-4">
                  {chartFilters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setChartFilter(filter.id)}
                      className={`rounded-xl border px-2 py-1.5 text-[11px] font-black transition-all ${
                        chartFilter === filter.id ? theme.tabActive : theme.tabInactive
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {chartData.length < 2 ? (
                  <p className={`${theme.muted} text-sm text-center mt-12`}>
                    Sem dados suficientes para este período.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-2">
                        <p className={`${theme.muted} text-[10px] font-bold uppercase`}>
                          XP no período
                        </p>
                        <p className="text-sm font-black text-emerald-400">
                          +{totalFilteredXp.toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <div className="rounded-xl border border-yellow-500/15 bg-yellow-500/5 px-3 py-2">
                        <p className={`${theme.muted} text-[10px] font-bold uppercase`}>
                          Último progresso
                        </p>
                        <p className="text-sm font-black text-yellow-300">
                          {latestPoint?.progress.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart
                        data={chartData}
                        margin={{ top: 6, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.chartGrid} />
                        <XAxis
                          dataKey="name"
                          stroke={theme.chartText}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis
                          stroke={theme.chartText}
                          tick={{ fontSize: 10 }}
                          tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          content={<ChartTooltip darkMode={darkMode} />}
                          cursor={{
                            stroke: "#eab308",
                            strokeWidth: 1,
                            strokeDasharray: "4 4",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="xpRestante"
                          stroke="#eab308"
                          strokeWidth={3}
                          dot={{ fill: "#eab308", r: 4, strokeWidth: 0 }}
                          activeDot={{
                            r: 7,
                            fill: "#facc15",
                            stroke: "#fff7ad",
                            strokeWidth: 2,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
