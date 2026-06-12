import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  ChartIcon,
  CheckCircleIcon,
  CopyIcon,
  PencilIcon,
  ScrollIcon,
  TrashIcon,
  XIcon,
} from "~/components/xp-tracker/UiIcons";

interface HistoryEntry {
  date: string;
  xpGained: number;
  xpRemaining: number;
  totalXP?: number;
  source?: string;
}

type SidebarTab = "historico" | "grafico" | "resultado";
type ChartFilter = "all" | "7d" | "30d" | "month";
type ChartView = "daily" | "remaining";
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

interface DailyChartPoint {
  dateKey: string;
  name: string;
  label: string;
  netXP: number;
  gainedXP: number;
  farmedXP: number;
  adjustmentGainXP: number;
  adjustmentLossXP: number;
  lostXP: number;
  runs: number;
  bestXP: number;
}

const tabs = [
  { id: "historico", label: "Histórico", icon: ScrollIcon },
  { id: "grafico", label: "Gráfico", icon: ChartIcon },
  { id: "resultado", label: "Resultado", icon: CheckCircleIcon },
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

function formatSignedXP(value: number) {
  const absoluteValue = Math.abs(value).toLocaleString("pt-BR");

  if (value > 0) return `+${absoluteValue}`;
  if (value < 0) return `-${absoluteValue}`;

  return "0";
}

function getHistoryEntryDisplay(entry: HistoryEntry) {
  if (entry.xpGained < 0 && isManualAdjustment(entry)) {
    return {
      label: `Correção ${Math.abs(entry.xpGained).toLocaleString("pt-BR")}`,
      className: "text-yellow-300",
    };
  }

  return {
    label: formatSignedXP(entry.xpGained),
    className: entry.xpGained < 0 ? "text-red-400" : "text-emerald-400",
  };
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function formatFullDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatBrazilianDateInput(dateKey: string) {
  const [year, month, day] = dateKey.split("-");

  if (!year || !month || !day) return "";

  return `${day}/${month}/${year}`;
}

function BrazilianDatePicker({
  value,
  onChange,
  tone = "yellow",
}: {
  value: string;
  onChange: (value: string) => void;
  tone?: "yellow" | "cyan";
}) {
  const borderClass =
    tone === "cyan"
      ? "border-cyan-500/20 text-cyan-100 focus-within:border-cyan-300"
      : "border-yellow-500/20 text-yellow-100 focus-within:border-yellow-300";

  return (
    <div className={`relative rounded-xl border bg-black/30 px-3 py-2 ${borderClass}`}>
      <span className="pointer-events-none block pr-8 text-sm font-bold">
        {formatBrazilianDateInput(value)}
      </span>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-80">
        ◱
      </span>
      <input
        type="date"
        value={value}
        onChange={(event) => {
          const nextValue = event.target.value;
          if (!nextValue) return;

          onChange(nextValue);
        }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-label="Consultar data"
      />
    </div>
  );
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

function isManualAdjustment(entry: HistoryEntry) {
  return /Ajuste manual|Configura/i.test(entry.source ?? "");
}

function isDeathEntry(entry: HistoryEntry) {
  return /Morte/i.test(entry.source ?? "");
}

function getEntrySignedResultXP(entry: HistoryEntry) {
  if (entry.xpGained > 0) return entry.xpGained;
  if (isDeathEntry(entry)) return entry.xpGained;

  return 0;
}

function normalizeSource(source?: string) {
  return (source ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isMasmorraSource(source?: string) {
  const normalized = normalizeSource(source);

  return /masmorra|planicie|floresta|pantano|cemiterio|deserto|altheryn|hydra|zul'?gor|fenda solar|templo do oasis|oasis/.test(
    normalized
  );
}

function isCriptaSource(source?: string) {
  return /cripta/.test(normalizeSource(source));
}

function isFarmEntry(entry: HistoryEntry) {
  const source = entry.source ?? "";

  return (
    entry.xpGained > 0 &&
    !isManualAdjustment(entry) &&
    !isDeathEntry(entry) &&
    (/plano de farm|cacada/.test(normalizeSource(source)) ||
      isCriptaSource(source) ||
      isMasmorraSource(source) ||
      source === "")
  );
}

function isCriptaEntry(entry: HistoryEntry) {
  return entry.xpGained > 0 && !isManualAdjustment(entry) && isCriptaSource(entry.source);
}

function isMasmorraEntry(entry: HistoryEntry) {
  return entry.xpGained > 0 && !isManualAdjustment(entry) && isMasmorraSource(entry.source);
}

function isResultDayEntry(entry: HistoryEntry, dateKey: string) {
  const entryDate = new Date(entry.date);
  const entryMinutes = entryDate.getHours() * 60 + entryDate.getMinutes();

  return getDateKey(entryDate) === dateKey && entryMinutes >= 1 && entryMinutes <= 1439;
}

function ChartTooltip({
  active,
  payload,
  darkMode,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint | DailyChartPoint }>;
  darkMode: boolean;
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  if ("netXP" in point) {
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
            <span className="text-zinc-500">Saldo: </span>
            <span className={`font-bold ${point.netXP < 0 ? "text-red-400" : "text-emerald-400"}`}>
              {formatSignedXP(point.netXP)} XP
            </span>
          </p>
          <p>
            <span className="text-zinc-500">Farm registrado: </span>
            <span className="font-bold text-emerald-400">
              +{point.farmedXP.toLocaleString("pt-BR")} XP
            </span>
          </p>
          <p>
            <span className="text-zinc-500">Farm avulso: </span>
            <span className="font-bold text-cyan-300">
              +{point.adjustmentGainXP.toLocaleString("pt-BR")} XP
            </span>
          </p>
          <p>
            <span className="text-zinc-500">Perdas por morte: </span>
            <span className="font-bold text-red-400">
              -{point.lostXP.toLocaleString("pt-BR")} XP
            </span>
          </p>
          <p>
            <span className="text-zinc-500">Correções manuais: </span>
            <span className="font-bold text-yellow-300">
              {point.adjustmentLossXP.toLocaleString("pt-BR")} XP
            </span>
          </p>
          <p>
            <span className="text-zinc-500">Registros: </span>
            <span className="font-bold text-yellow-300">{point.runs}</span>
          </p>
        </div>
      </div>
    );
  }

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
          <span className={`font-bold ${point.xpGained < 0 ? "text-red-400" : "text-emerald-400"}`}>
            {formatSignedXP(point.xpGained)} XP
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
  const [chartView, setChartView] = useState<ChartView>("daily");
  const [selectedDate, setSelectedDate] = useState(() => getDateKey(new Date()));
  const [historyTypeFilter, setHistoryTypeFilter] = useState<HistoryTypeFilter>("all");
  const [historySort, setHistorySort] = useState<HistorySort>("recent");

  const displayHistory = useMemo(() => {
    return history
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => {
        if (historyTypeFilter === "all") return true;

        const source = entry.source ?? "";

        if (historyTypeFilter === "manual") {
          return !isCriptaSource(source) && !isMasmorraSource(source);
        }

        if (historyTypeFilter === "cripta") return isCriptaSource(source);
        if (historyTypeFilter === "masmorra") return isMasmorraSource(source);

        return normalizeSource(source).includes(historyTypeFilter);
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

  const dailyChartData = useMemo<DailyChartPoint[]>(() => {
    const filteredHistory = filterHistoryByPeriod(history, chartFilter);
    const dayTotals = filteredHistory.reduce<Record<string, DailyChartPoint>>(
      (totals, entry) => {
        const dateKey = getDateKey(new Date(entry.date));
        const current = totals[dateKey] ?? {
          dateKey,
          name: formatDateLabel(dateKey),
          label: formatDateLabel(dateKey),
          netXP: 0,
          gainedXP: 0,
          farmedXP: 0,
          adjustmentGainXP: 0,
          adjustmentLossXP: 0,
          lostXP: 0,
          runs: 0,
          bestXP: 0,
        };

        current.netXP += getEntrySignedResultXP(entry);
        current.gainedXP += Math.max(0, entry.xpGained);
        if (isFarmEntry(entry)) {
          current.farmedXP += entry.xpGained;
        } else if (isManualAdjustment(entry) && entry.xpGained > 0) {
          current.adjustmentGainXP += entry.xpGained;
        } else if (isManualAdjustment(entry) && entry.xpGained < 0) {
          current.adjustmentLossXP += Math.abs(entry.xpGained);
        } else if (isDeathEntry(entry)) {
          current.lostXP += Math.abs(Math.min(0, entry.xpGained));
        }
        current.runs += 1;
        current.bestXP = Math.max(current.bestXP, entry.xpGained);
        totals[dateKey] = current;

        return totals;
      },
      {}
    );

    return Object.values(dayTotals).sort((left, right) =>
      left.dateKey.localeCompare(right.dateKey)
    );
  }, [chartFilter, history]);

  const selectedDayEntries = useMemo(() => {
    return history.filter(
      (entry) => getDateKey(new Date(entry.date)) === selectedDate
    );
  }, [history, selectedDate]);
  const resultDayEntries = useMemo(() => {
    return history
      .filter((entry) => isResultDayEntry(entry, selectedDate))
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  }, [history, selectedDate]);

  const totalFilteredXp = chartData.reduce(
    (sum, point) => sum + point.xpGained,
    0
  );
  const totalDailyGainedXP = dailyChartData.reduce(
    (sum, point) => sum + point.gainedXP,
    0
  );
  const selectedDayRegisteredFarmXP = selectedDayEntries.reduce(
    (sum, entry) => sum + (isFarmEntry(entry) ? entry.xpGained : 0),
    0
  );
  const selectedDayAdjustmentGainXP = selectedDayEntries.reduce(
    (sum, entry) =>
      sum + (isManualAdjustment(entry) && entry.xpGained > 0 ? entry.xpGained : 0),
    0
  );
  const selectedDayAdjustmentLossXP = selectedDayEntries.reduce(
    (sum, entry) =>
      sum +
      (isManualAdjustment(entry) && entry.xpGained < 0
        ? Math.abs(entry.xpGained)
        : 0),
    0
  );
  const selectedDayLostXP = selectedDayEntries.reduce(
    (sum, entry) =>
      sum +
      (isDeathEntry(entry) && entry.xpGained < 0
        ? Math.abs(entry.xpGained)
        : 0),
    0
  );
  const selectedDayNetXP = selectedDayEntries.reduce(
    (sum, entry) => sum + getEntrySignedResultXP(entry),
    0
  );
  const selectedDayGainedXP =
    selectedDayRegisteredFarmXP + selectedDayAdjustmentGainXP;
  const selectedDayBestEntry = selectedDayEntries.reduce<HistoryEntry | null>(
    (best, entry) => (!best || entry.xpGained > best.xpGained ? entry : best),
    null
  );
  const resultRegisteredFarmXP = resultDayEntries.reduce(
    (sum, entry) => sum + (isFarmEntry(entry) ? entry.xpGained : 0),
    0
  );
  const resultCriptaEntries = resultDayEntries.filter(isCriptaEntry);
  const resultMasmorraEntries = resultDayEntries.filter(isMasmorraEntry);
  const resultManualEntries = resultDayEntries.filter(isManualAdjustment);
  const resultCriptaXP = resultCriptaEntries.reduce((sum, entry) => sum + entry.xpGained, 0);
  const resultMasmorraXP = resultMasmorraEntries.reduce((sum, entry) => sum + entry.xpGained, 0);
  const resultManualPositiveXP = resultManualEntries.reduce(
    (sum, entry) => sum + Math.max(0, entry.xpGained),
    0
  );
  const resultManualCorrectionXP = resultManualEntries.reduce(
    (sum, entry) => sum + Math.abs(Math.min(0, entry.xpGained)),
    0
  );
  const resultAdjustmentGainXP = resultDayEntries.reduce(
    (sum, entry) =>
      sum + (isManualAdjustment(entry) && entry.xpGained > 0 ? entry.xpGained : 0),
    0
  );
  const resultLossXP = resultDayEntries.reduce(
    (sum, entry) =>
      sum + (isDeathEntry(entry) && entry.xpGained < 0 ? Math.abs(entry.xpGained) : 0),
    0
  );
  const resultPositiveXP = resultRegisteredFarmXP + resultAdjustmentGainXP;
  const resultNetXP = resultDayEntries.reduce(
    (sum, entry) => sum + getEntrySignedResultXP(entry),
    0
  );
  const resultEndingXP = resultDayEntries[0]?.xpRemaining ?? null;
  const latestPoint = chartData[chartData.length - 1];

  return (
    <>
      <div
        className={`fixed top-0 right-0 h-full w-80 ${theme.sidebar} border-l transition-transform duration-300 z-40 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-3 pt-4 pb-0 border-b border-inherit">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setSidebarTab(tab.id)}
                  className={`px-2 py-2 rounded-t-xl text-[11px] font-bold border transition-all ${
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
            className="mb-2 ml-2 flex h-9 w-9 items-center justify-center rounded-full border border-red-500/25 bg-red-500/10 text-red-300 transition-all hover:bg-red-500 hover:text-white"
          >
            <XIcon className="h-4 w-4" />
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
                    const entryDisplay = getHistoryEntryDisplay(entry);

                    return (
                      <div
                        key={`${entry.date}-${index}`}
                        className={`py-4 border-b ${theme.histEntry}`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className={`${entryDisplay.className} font-bold`}>
                              {entryDisplay.label} XP
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
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-yellow-500/20 bg-yellow-500/10 text-yellow-300 transition-all hover:bg-yellow-500 hover:text-black"
                            >
                              <PencilIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label="Duplicar registro"
                              onClick={() => onDuplicateHistoryEntry(index)}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 transition-all hover:bg-cyan-500 hover:text-black"
                            >
                              <CopyIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label="Excluir registro"
                              onClick={() => onDeleteHistoryEntry(index)}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-400 transition-all hover:bg-red-500 hover:text-white"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
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

          {sidebarTab === "resultado" && (
            <div>
              <div className="mb-4">
                <p className="text-sm font-black text-yellow-300">
                  Resultado do dia
                </p>
                <p className={`${theme.muted} mt-1 text-xs`}>
                  Resumo local de 00:01 até 23:59.
                </p>
              </div>

              <div className="mb-4 rounded-2xl border border-yellow-500/15 bg-yellow-500/5 p-3">
                <label className={`${theme.muted} mb-1 block text-[10px] font-black uppercase`}>
                  Consultar data
                </label>
                <BrazilianDatePicker
                  value={selectedDate}
                  onChange={setSelectedDate}
                />
                <p className={`${theme.muted} mt-2 text-xs`}>
                  {formatFullDateLabel(selectedDate)}
                </p>
              </div>

              <div className="mb-4 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
                <p className={`${theme.muted} text-[10px] font-black uppercase`}>
                  Saldo do dia
                </p>
                <p className={`mt-1 text-2xl font-black ${resultNetXP < 0 ? "text-red-300" : "text-emerald-300"}`}>
                  {formatSignedXP(resultNetXP)} XP
                </p>
                <p className={`${theme.muted} mt-2 text-xs leading-relaxed`}>
                  No dia {formatFullDateLabel(selectedDate)}, você ficou com saldo de{" "}
                  <span className={resultNetXP < 0 ? "font-black text-red-300" : "font-black text-emerald-300"}>
                    {formatSignedXP(resultNetXP)} XP
                  </span>.
                </p>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-2">
                  <p className={`${theme.muted} text-[10px] font-bold uppercase`}>
                    Ganho
                  </p>
                  <p className="text-sm font-black text-emerald-300">
                    +{resultPositiveXP.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="rounded-xl border border-red-500/15 bg-red-500/5 px-3 py-2">
                  <p className={`${theme.muted} text-[10px] font-bold uppercase`}>
                    Perdas por morte
                  </p>
                  <p className="text-sm font-black text-red-300">
                    -{resultLossXP.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/5 px-3 py-2">
                  <p className={`${theme.muted} text-[10px] font-bold uppercase`}>
                    Registros
                  </p>
                  <p className="text-sm font-black text-cyan-200">
                    {resultDayEntries.length}
                  </p>
                </div>
                <div className="rounded-xl border border-yellow-500/15 bg-yellow-500/5 px-3 py-2">
                  <p className={`${theme.muted} text-[10px] font-bold uppercase`}>
                    XP restante
                  </p>
                  <p className="text-sm font-black text-yellow-300">
                    {resultEndingXP === null ? "--" : resultEndingXP.toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>

              <div className="mb-4 rounded-2xl border border-cyan-500/10 bg-cyan-500/5 p-3">
                <p className="text-xs font-black uppercase text-cyan-200">
                  Resumo por origem
                </p>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-cyan-500/10 bg-black/20 px-3 py-2">
                    <span className={theme.muted}>
                      {resultCriptaEntries.length} Criptas no dia
                    </span>
                    <span className="font-black text-emerald-300">
                      +{resultCriptaXP.toLocaleString("pt-BR")} XP
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-cyan-500/10 bg-black/20 px-3 py-2">
                    <span className={theme.muted}>
                      {resultMasmorraEntries.length} Masmorras no dia
                    </span>
                    <span className="font-black text-emerald-300">
                      +{resultMasmorraXP.toLocaleString("pt-BR")} XP
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-cyan-500/10 bg-black/20 px-3 py-2">
                    <span className={theme.muted}>
                      {resultManualEntries.length} ajustes manuais
                    </span>
                    <span className="font-black text-cyan-200">
                      +{resultManualPositiveXP.toLocaleString("pt-BR")} XP
                    </span>
                  </div>
                  {resultManualCorrectionXP > 0 && (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-yellow-500/10 bg-black/20 px-3 py-2">
                      <span className={theme.muted}>
                        Correções manuais sem perda
                      </span>
                      <span className="font-black text-yellow-300">
                        {resultManualCorrectionXP.toLocaleString("pt-BR")} XP
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-yellow-500/10 bg-black/20 p-3">
                <p className="text-xs font-black uppercase text-yellow-300">
                  Histórico reduzido
                </p>

                {resultDayEntries.length === 0 ? (
                  <p className={`${theme.muted} mt-3 text-sm`}>
                    Nenhum registro entre 00:01 e 23:59 nesta data.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {resultDayEntries.slice(0, 8).map((entry, index) => {
                      const entryDisplay = getHistoryEntryDisplay(entry);

                      return (
                        <div
                          key={`${entry.date}-resultado-${index}`}
                          className="rounded-xl border border-yellow-500/10 bg-black/25 px-3 py-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className={`text-sm font-black ${entryDisplay.className}`}>
                                {entryDisplay.label} XP
                              </p>
                              <p className={`${theme.muted} mt-0.5 text-[11px]`}>
                                {entry.source ?? "Progresso manual"}
                              </p>
                            </div>
                            <p className={`${theme.muted} shrink-0 text-[11px] font-bold`}>
                              {new Date(entry.date).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {resultDayEntries.length > 8 && (
                      <p className={`${theme.muted} pt-1 text-xs`}>
                        +{resultDayEntries.length - 8} registros no dia.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {sidebarTab === "grafico" && (
            history.length === 0 ? (
              <p className={`${theme.muted} text-sm text-center mt-12`}>
                Salve pelo menos 2 atualizações
                <br />
                para ver o gráfico.
              </p>
            ) : (
              <div>
                <div className="mb-3">
                  <p className="text-sm font-black text-yellow-300">
                    Análise de XP
                  </p>
                  <p className={`${theme.muted} mt-1 text-xs`}>
                    Ganhos, perdas e consultas por data.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-1 mb-3">
                  {[
                    { id: "daily" as const, label: "Diário" },
                    { id: "remaining" as const, label: "XP restante" },
                  ].map((view) => (
                    <button
                      key={view.id}
                      type="button"
                      onClick={() => setChartView(view.id)}
                      className={`rounded-xl border px-2 py-1.5 text-[11px] font-black transition-all ${
                        chartView === view.id ? theme.tabActive : theme.tabInactive
                      }`}
                    >
                      {view.label}
                    </button>
                  ))}
                </div>
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

                <div className="mb-4 rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-3">
                  <label className={`${theme.muted} mb-1 block text-[10px] font-black uppercase`}>
                    Consultar data
                  </label>
                  <BrazilianDatePicker
                    value={selectedDate}
                    onChange={setSelectedDate}
                    tone="cyan"
                  />
                  <p className={`${theme.muted} mt-1 text-[11px]`}>
                    Formato brasileiro: dia/mês/ano.
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <p className={`${theme.muted} text-[10px] font-black uppercase`}>
                        Saldo do dia
                      </p>
                      <p className={`text-sm font-black ${selectedDayNetXP < 0 ? "text-red-400" : "text-emerald-300"}`}>
                        {formatSignedXP(selectedDayNetXP)} XP
                      </p>
                    </div>
                    <div>
                      <p className={`${theme.muted} text-[10px] font-black uppercase`}>
                        Registros
                      </p>
                      <p className="text-sm font-black text-cyan-200">
                        {selectedDayEntries.length}
                      </p>
                    </div>
                    <div>
                      <p className={`${theme.muted} text-[10px] font-black uppercase`}>
                        Ganho
                      </p>
                      <p className="text-sm font-black text-emerald-300">
                        +{selectedDayGainedXP.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div>
                      <p className={`${theme.muted} text-[10px] font-black uppercase`}>
                        Ajuste manual
                      </p>
                      <p className="text-sm font-black text-cyan-200">
                        +{selectedDayAdjustmentGainXP.toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  {(selectedDayAdjustmentLossXP > 0 || selectedDayLostXP > 0) && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <p className={`${theme.muted} text-[10px] font-black uppercase`}>
                          Correções manuais
                        </p>
                        <p className="text-sm font-black text-yellow-300">
                          {selectedDayAdjustmentLossXP.toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <p className={`${theme.muted} text-[10px] font-black uppercase`}>
                          Perdas por morte
                        </p>
                        <p className="text-sm font-black text-red-300">
                          -{selectedDayLostXP.toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  )}

                  <p className={`${theme.muted} mt-3 text-xs`}>
                    Melhor registro:{" "}
                    <span className="font-black text-yellow-300">
                      {selectedDayBestEntry
                        ? `${formatSignedXP(selectedDayBestEntry.xpGained)} XP`
                        : "sem dados"}
                    </span>
                  </p>
                </div>

                {chartView === "daily" && dailyChartData.length < 1 ? (
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
                          {formatSignedXP(
                            chartView === "daily" ? totalDailyGainedXP : totalFilteredXp
                          )}
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
                    {chartView === "daily" ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart
                          data={dailyChartData}
                          margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
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
                          <ReferenceLine y={0} stroke="#71717a" strokeDasharray="3 3" />
                          <Tooltip
                            content={<ChartTooltip darkMode={darkMode} />}
                            cursor={{ fill: "rgba(234,179,8,0.08)" }}
                          />
                          <Bar
                            dataKey="gainedXP"
                            fill="#34d399"
                            radius={[8, 8, 4, 4]}
                            maxBarSize={34}
                          >
                            {dailyChartData.map((point) => (
                              <Cell
                                key={point.dateKey}
                                fill={point.gainedXP > 0 ? "#34d399" : "#3f3f46"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
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
                    )}
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
