import { useEffect, useMemo, useState } from "react";

interface FarmRunsCardProps {
  currentXP: number;
  currentLevel: number;
  totalXP: number;
  theme: {
    card: string;
    input: string;
    muted: string;
    text: string;
  };
  onApplyFarmProgress: (values: {
    xpGained: number;
    source: string;
  }) => void;
}

interface FarmActivity {
  id: string;
  category: "Cripta" | "Masmorra";
  name: string;
  detail: string;
  players?: number;
  xp?: number;
  xpByLevel?: LevelXpValue[];
}

interface LevelXpValue {
  minLevel: number;
  maxLevel?: number;
  xp: number;
  label: string;
}

interface ResolvedFarmActivity extends FarmActivity {
  xp: number;
  levelRangeLabel: string;
}

interface FarmPlanItem {
  activity: ResolvedFarmActivity;
  runs: number;
}

function xpForLevel28Plus(xp: number): LevelXpValue[] {
  return [{ minLevel: 28, xp, label: "Nível 28+" }];
}

const FARM_ACTIVITIES: FarmActivity[] = [
  {
    id: "cripta-n1-30-4",
    category: "Cripta",
    name: "Cripta Nível 1 até 30",
    detail: "4 jogadores",
    players: 4,
    xpByLevel: xpForLevel28Plus(53942),
  },
  {
    id: "cripta-n1-16-4",
    category: "Cripta",
    name: "Cripta Nível 1 até 16",
    detail: "4 jogadores",
    players: 4,
    xpByLevel: xpForLevel28Plus(14347),
  },
  {
    id: "cripta-n1-17-4",
    category: "Cripta",
    name: "Cripta Nível 1 até 17",
    detail: "4 jogadores",
    players: 4,
    xpByLevel: xpForLevel28Plus(17608),
  },
  {
    id: "cripta-n1-18-4",
    category: "Cripta",
    name: "Cripta Nível 1 até 18",
    detail: "4 jogadores",
    players: 4,
    xpByLevel: xpForLevel28Plus(19412),
  },
  {
    id: "cripta-n1-19-4",
    category: "Cripta",
    name: "Cripta Nível 1 até 19",
    detail: "4 jogadores",
    players: 4,
    xpByLevel: xpForLevel28Plus(21342),
  },
  {
    id: "cripta-n1-20-4",
    category: "Cripta",
    name: "Cripta Nível 1 até 20",
    detail: "4 jogadores",
    players: 4,
    xpByLevel: xpForLevel28Plus(23407),
  },
  {
    id: "cripta-n1-21-4",
    category: "Cripta",
    name: "Cripta Nível 1 até 21",
    detail: "4 jogadores",
    players: 4,
    xpByLevel: xpForLevel28Plus(25617),
  },
  {
    id: "cripta-n1-22-4",
    category: "Cripta",
    name: "Cripta Nível 1 até 22",
    detail: "4 jogadores",
    players: 4,
    xpByLevel: xpForLevel28Plus(27982),
  },
  {
    id: "cripta-n1-23-4",
    category: "Cripta",
    name: "Cripta Nível 1 até 23",
    detail: "4 jogadores",
    players: 4,
    xpByLevel: xpForLevel28Plus(30512),
  },
  {
    id: "cripta-n1-24-4",
    category: "Cripta",
    name: "Cripta Nível 1 até 24",
    detail: "4 jogadores",
    players: 4,
    xpByLevel: xpForLevel28Plus(33219),
  },
  {
    id: "cripta-n1-25-4",
    category: "Cripta",
    name: "Cripta Nível 1 até 25",
    detail: "4 jogadores",
    players: 4,
    xpByLevel: xpForLevel28Plus(36116),
  },
  {
    id: "cripta-n1-26-4",
    category: "Cripta",
    name: "Cripta Nível 1 até 26",
    detail: "4 jogadores",
    players: 4,
    xpByLevel: xpForLevel28Plus(39216),
  },
  {
    id: "cripta-n1-25-5",
    category: "Cripta",
    name: "Cripta Nível 1 até 25",
    detail: "5 jogadores",
    players: 5,
    xpByLevel: xpForLevel28Plus(36116),
  },
  {
    id: "cripta-n1-26-5",
    category: "Cripta",
    name: "Cripta Nível 1 até 26",
    detail: "5 jogadores",
    players: 5,
    xpByLevel: xpForLevel28Plus(39216),
  },
  {
    id: "cripta-n1-27-4",
    category: "Cripta",
    name: "Cripta Nível 1 até 27",
    detail: "4 jogadores",
    players: 4,
    xpByLevel: xpForLevel28Plus(42533),
  },
  {
    id: "cripta-n1-28-4",
    category: "Cripta",
    name: "Cripta Nível 1 até 28",
    detail: "4 jogadores",
    players: 4,
    xpByLevel: xpForLevel28Plus(46082),
  },
  {
    id: "cripta-n1-29-4",
    category: "Cripta",
    name: "Cripta Nível 1 até 29",
    detail: "4 jogadores",
    players: 4,
    xpByLevel: xpForLevel28Plus(49859),
  },
  {
    id: "cripta-n3-7",
    category: "Cripta",
    name: "Cripta Nível 3 até 7",
    detail: "Dado parcial",
    xp: 18832,
  },
  {
    id: "cripta-n3-9",
    category: "Cripta",
    name: "Cripta Nível 3 até 9",
    detail: "Dado parcial",
    xp: 26065,
  },
  {
    id: "cripta-n3-10",
    category: "Cripta",
    name: "Cripta Nível 3 até 10",
    detail: "4 jogadores",
    players: 4,
    xp: 35371,
  },
  {
    id: "cripta-n3-11",
    category: "Cripta",
    name: "Cripta Nível 3 até 11",
    detail: "4 jogadores",
    players: 4,
    xp: 40407,
  },
  {
    id: "cripta-n3-12",
    category: "Cripta",
    name: "Cripta Nível 3 até 12",
    detail: "4 jogadores",
    players: 4,
    xp: 45796,
  },
  {
    id: "cripta-n3-13",
    category: "Cripta",
    name: "Cripta Nível 3 até 13",
    detail: "4 jogadores",
    players: 4,
    xp: 51561,
  },
  {
    id: "planicie-4",
    category: "Masmorra",
    name: "Planície",
    detail: "4 jogadores",
    xp: 1262,
  },
  {
    id: "planicie-5",
    category: "Masmorra",
    name: "Planície",
    detail: "5 jogadores",
    xp: 1010,
  },
  {
    id: "floresta-4",
    category: "Masmorra",
    name: "Floresta",
    detail: "4 jogadores",
    xp: 2000,
  },
  {
    id: "floresta-5",
    category: "Masmorra",
    name: "Floresta",
    detail: "5 jogadores",
    xp: 1600,
  },
  {
    id: "pantano-4",
    category: "Masmorra",
    name: "Pântano",
    detail: "4 jogadores",
    xp: 2937,
  },
  {
    id: "pantano-5",
    category: "Masmorra",
    name: "Pântano",
    detail: "5 jogadores",
    xp: 2350,
  },
  {
    id: "cemiterio-4",
    category: "Masmorra",
    name: "Cemitério",
    detail: "4 jogadores",
    xp: 8537,
  },
  {
    id: "cemiterio-5",
    category: "Masmorra",
    name: "Cemitério",
    detail: "5 jogadores",
    xp: 6830,
  },
  {
    id: "deserto-4",
    category: "Masmorra",
    name: "Deserto",
    detail: "4 jogadores",
    xp: 9737,
  },
  {
    id: "deserto-5",
    category: "Masmorra",
    name: "Deserto",
    detail: "5 jogadores",
    xp: 7890,
  },
];

const FARM_CATEGORIES = [
  "Todas",
  "Cripta",
  "Masmorra",
] as const;

type FarmCategoryFilter = (typeof FARM_CATEGORIES)[number];

const FARM_PLAN_MODES = [
  { id: "fewest-runs", label: "Menos runs" },
  { id: "highest-xp", label: "Maior XP" },
  { id: "only-cripta", label: "Só cripta" },
  { id: "only-masmorra", label: "Só masmorra" },
] as const;

type FarmPlanMode = (typeof FARM_PLAN_MODES)[number]["id"];

const QUICK_RUN_TABS = [
  { id: "cripta-1", label: "Cripta 1" },
  { id: "cripta-2", label: "Cripta 2" },
  { id: "cripta-3", label: "Cripta 3" },
  { id: "masmorras", label: "Masmorras" },
] as const;

type QuickRunTab = (typeof QUICK_RUN_TABS)[number]["id"];

const QUICK_RUN_ORDER: Partial<Record<QuickRunTab, Partial<Record<number, string[]>>>> = {
  "cripta-1": {
    4: [
      "cripta-n1-25-4",
      "cripta-n1-26-4",
      "cripta-n1-27-4",
      "cripta-n1-28-4",
      "cripta-n1-29-4",
      "cripta-n1-30-4",
    ],
    5: [
      "cripta-n1-25-5",
      "cripta-n1-26-5",
    ],
  },
  "cripta-3": {
    4: [
      "cripta-n3-10",
      "cripta-n3-11",
      "cripta-n3-12",
      "cripta-n3-13",
    ],
  },
  masmorras: {
    4: [
      "planicie-4",
      "floresta-4",
      "pantano-4",
      "cemiterio-4",
      "deserto-4",
    ],
    5: [
      "planicie-5",
      "floresta-5",
      "pantano-5",
      "cemiterio-5",
      "deserto-5",
    ],
  },
};

// Dados mantidos na base interna, mas ocultos temporariamente do site.
const HIDDEN_SITE_ACTIVITY_IDS = new Set([
  "cripta-n1-16-4",
  "cripta-n1-17-4",
  "cripta-n1-18-4",
  "cripta-n1-19-4",
  "cripta-n1-20-4",
  "cripta-n1-21-4",
  "cripta-n1-22-4",
  "cripta-n1-23-4",
  "cripta-n1-24-4",
]);

const SITE_FARM_ACTIVITIES = FARM_ACTIVITIES.filter(
  (activity) => !HIDDEN_SITE_ACTIVITY_IDS.has(activity.id)
);

function sanitizeRuns(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function formatInputValue(value: number) {
  return value === 0 ? "" : value;
}

function formatXP(value: number) {
  return value.toLocaleString("pt-BR");
}

function getActivityLabel(activity: FarmActivity) {
  return `${activity.name} (${activity.detail})`;
}

function resolveActivityForLevel(
  activity: FarmActivity,
  currentLevel: number
): ResolvedFarmActivity | null {
  if (activity.xpByLevel) {
    const levelXp = activity.xpByLevel.find(
      (entry) =>
        currentLevel >= entry.minLevel &&
        (entry.maxLevel === undefined || currentLevel <= entry.maxLevel)
    );

    if (!levelXp) return null;

    return {
      ...activity,
      xp: levelXp.xp,
      levelRangeLabel: levelXp.label,
    };
  }

  if (typeof activity.xp !== "number") return null;

  return {
    ...activity,
    xp: activity.xp,
    levelRangeLabel: "XP fixo",
  };
}

function resolveActivitiesForLevel(
  activities: FarmActivity[],
  currentLevel: number
) {
  return activities
    .map((activity) => resolveActivityForLevel(activity, currentLevel))
    .filter((activity): activity is ResolvedFarmActivity => Boolean(activity));
}

function getActivitiesById(activityIds: string[]) {
  return activityIds
    .map((activityId) =>
      SITE_FARM_ACTIVITIES.find((activity) => activity.id === activityId)
    )
    .filter((activity): activity is FarmActivity => Boolean(activity));
}

function matchesQuickRunTab(activity: FarmActivity, tab: QuickRunTab) {
  if (tab === "masmorras") return activity.category === "Masmorra";

  if (activity.category !== "Cripta") return false;

  const levelByTab: Record<Exclude<QuickRunTab, "masmorras">, string> = {
    "cripta-1": "Cripta Nível 1",
    "cripta-2": "Cripta Nível 2",
    "cripta-3": "Cripta Nível 3",
  };

  return activity.name.includes(levelByTab[tab]);
}

function addPlanItem(plan: FarmPlanItem[], activity: FarmActivity, runs: number) {
  const existingItem = plan.find((item) => item.activity.id === activity.id);

  if (existingItem) {
    existingItem.runs += runs;
    return;
  }

  plan.push({ activity, runs });
}

function buildFarmPlan(currentXP: number, activities: ResolvedFarmActivity[]) {
  if (currentXP <= 0 || activities.length === 0) {
    return {
      items: [],
      totalXP: 0,
      totalRuns: 0,
      overflowXP: 0,
    };
  }

  const sortedActivities = [...activities].sort((a, b) => b.xp - a.xp);
  const smallestActivity = [...activities].sort((a, b) => a.xp - b.xp)[0];
  const plan: FarmPlanItem[] = [];
  let remainingXP = currentXP;
  let guard = 0;

  while (remainingXP > 0 && guard < 30) {
    const activity =
      sortedActivities.find((candidate) => candidate.xp <= remainingXP) ??
      smallestActivity;
    const runs =
      activity.xp <= remainingXP ? Math.max(1, Math.floor(remainingXP / activity.xp)) : 1;

    addPlanItem(plan, activity, runs);
    remainingXP = Math.max(0, remainingXP - activity.xp * runs);
    guard += 1;
  }

  const totalXP = plan.reduce(
    (sum, item) => sum + item.activity.xp * item.runs,
    0
  );
  const totalRuns = plan.reduce((sum, item) => sum + item.runs, 0);

  return {
    items: plan,
    totalXP,
    totalRuns,
    overflowXP: Math.max(0, totalXP - currentXP),
  };
}

function buildSingleActivityPlan(
  currentXP: number,
  activities: ResolvedFarmActivity[]
) {
  if (currentXP <= 0 || activities.length === 0) {
    return {
      items: [],
      totalXP: 0,
      totalRuns: 0,
      overflowXP: 0,
    };
  }

  const bestActivity = [...activities].sort((a, b) => {
    const runsA = Math.ceil(currentXP / a.xp);
    const runsB = Math.ceil(currentXP / b.xp);
    const overflowA = runsA * a.xp - currentXP;
    const overflowB = runsB * b.xp - currentXP;

    return runsA - runsB || overflowA - overflowB || b.xp - a.xp;
  })[0];
  const runs = Math.ceil(currentXP / bestActivity.xp);
  const totalXP = bestActivity.xp * runs;

  return {
    items: [{ activity: bestActivity, runs }],
    totalXP,
    totalRuns: runs,
    overflowXP: Math.max(0, totalXP - currentXP),
  };
}

export function FarmRunsCard({
  currentXP,
  currentLevel,
  totalXP,
  theme,
  onApplyFarmProgress,
}: FarmRunsCardProps) {
  const [categoryFilter, setCategoryFilter] =
    useState<FarmCategoryFilter>("Todas");
  const [selectedActivityId, setSelectedActivityId] = useState(
    SITE_FARM_ACTIVITIES[0].id
  );
  const [runs, setRuns] = useState(1);
  const [planMode, setPlanMode] = useState<FarmPlanMode>("fewest-runs");
  const [quickRunTab, setQuickRunTab] = useState<QuickRunTab>("cripta-1");
  const [quickPlayerCount, setQuickPlayerCount] = useState(4);

  const resolvedSiteActivities = useMemo(
    () => resolveActivitiesForLevel(SITE_FARM_ACTIVITIES, currentLevel),
    [currentLevel]
  );

  const visibleActivities = useMemo(() => {
    if (categoryFilter === "Todas") return resolvedSiteActivities;

    return resolvedSiteActivities.filter(
      (activity) => activity.category === categoryFilter
    );
  }, [categoryFilter, resolvedSiteActivities]);

  useEffect(() => {
    if (visibleActivities.some((activity) => activity.id === selectedActivityId)) {
      return;
    }

    setSelectedActivityId(
      visibleActivities[0]?.id ?? ""
    );
  }, [selectedActivityId, visibleActivities]);

  const selectedActivity =
    visibleActivities.find((activity) => activity.id === selectedActivityId) ??
    visibleActivities[0];

  const xpTotal = (selectedActivity?.xp ?? 0) * runs;
  const xpApplied = Math.min(currentXP, xpTotal);
  const remainingAfterRun = Math.max(0, currentXP - xpTotal);
  const canApply = Boolean(selectedActivity) && totalXP > 0 && currentXP > 0 && xpApplied > 0;
  const canApplyQuickRun = totalXP > 0 && currentXP > 0;

  const planActivities = useMemo(() => {
    if (planMode === "only-cripta") {
      return resolvedSiteActivities.filter(
        (activity) => activity.category === "Cripta"
      );
    }

    if (planMode === "only-masmorra") {
      return resolvedSiteActivities.filter(
        (activity) => activity.category === "Masmorra"
      );
    }

    return visibleActivities;
  }, [planMode, resolvedSiteActivities, visibleActivities]);

  const recommendedRuns = useMemo(() => {
    if (currentXP <= 0) return [];

    return [...planActivities]
      .sort((a, b) => {
        if (planMode === "highest-xp") return b.xp - a.xp;

        const runsA = Math.ceil(currentXP / a.xp);
        const runsB = Math.ceil(currentXP / b.xp);

        return runsA - runsB || b.xp - a.xp;
      })
      .slice(0, 5);
  }, [currentXP, planActivities, planMode]);

  const farmPlan = useMemo(() => {
    if (planMode === "fewest-runs") {
      return buildSingleActivityPlan(currentXP, planActivities);
    }

    return buildFarmPlan(currentXP, planActivities);
  }, [currentXP, planActivities, planMode]);

  const availableQuickPlayerCounts = useMemo(() => {
    const orderedPlayers = QUICK_RUN_ORDER[quickRunTab];

    if (orderedPlayers) {
      return Object.keys(orderedPlayers)
        .map(Number)
        .sort((a, b) => a - b);
    }

    const players = SITE_FARM_ACTIVITIES.filter((activity) =>
      matchesQuickRunTab(activity, quickRunTab)
    )
      .map((activity) => activity.players)
      .filter((players): players is number => typeof players === "number");

    return Array.from(new Set(players)).sort((a, b) => a - b);
  }, [quickRunTab]);

  useEffect(() => {
    if (availableQuickPlayerCounts.length === 0) return;
    if (availableQuickPlayerCounts.includes(quickPlayerCount)) return;

    setQuickPlayerCount(availableQuickPlayerCounts[0]);
  }, [availableQuickPlayerCounts, quickPlayerCount]);

  const quickBaseActivities = useMemo(() => {
    const orderedActivityIds = QUICK_RUN_ORDER[quickRunTab]?.[quickPlayerCount];

    if (orderedActivityIds) {
      return getActivitiesById(orderedActivityIds);
    }

    return SITE_FARM_ACTIVITIES.filter(
      (activity) =>
        matchesQuickRunTab(activity, quickRunTab) &&
        (availableQuickPlayerCounts.length === 0 ||
          activity.players === quickPlayerCount)
    );
  }, [availableQuickPlayerCounts.length, quickPlayerCount, quickRunTab]);

  const quickActivities = useMemo(
    () => resolveActivitiesForLevel(quickBaseActivities, currentLevel),
    [currentLevel, quickBaseActivities]
  );

  function applyFarmProgress() {
    if (!canApply || !selectedActivity) return;

    onApplyFarmProgress({
      xpGained: xpTotal,
      source: `${runs}x ${getActivityLabel(selectedActivity)} - ${selectedActivity.levelRangeLabel}`,
    });
  }

  function applyQuickActivity(activity: ResolvedFarmActivity) {
    if (!canApplyQuickRun) return;

    onApplyFarmProgress({
      xpGained: activity.xp,
      source: `1x ${getActivityLabel(activity)} - ${activity.levelRangeLabel}`,
    });
  }

  function applyFarmPlan() {
    if (farmPlan.totalXP <= 0) return;

    const source = farmPlan.items
      .map((item) => `${item.runs}x ${item.activity.name} (${item.activity.levelRangeLabel})`)
      .join(" + ");

    onApplyFarmProgress({
      xpGained: farmPlan.totalXP,
      source: `Plano de farm: ${source}`,
    });
  }

  return (
    <section className={`${theme.card} border rounded-3xl p-4 md:p-5 mb-4 md:mb-5 shadow-[0_0_34px_rgba(16,185,129,0.1)]`}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <div className="max-w-2xl">
            <p className="text-emerald-300 text-xs md:text-sm font-black mb-1">
              Runs e farm
            </p>

            <h2 className="text-xl md:text-2xl font-black text-emerald-300">
              Registro rápido de run
            </h2>

            <p className={`${theme.muted} mt-1.5 text-sm leading-relaxed`}>
              Criptas consideram seu nível atual: {currentLevel}. Masmorras usam XP fixo por quantidade de jogadores.
            </p>
          </div>

        </div>

        <div className="flex flex-col gap-4">
          <div className="hidden self-start rounded-3xl border border-yellow-500/15 bg-black/20 p-4 md:p-5">
            <div className="grid grid-cols-1 md:grid-cols-[150px_minmax(0,1fr)_110px] gap-3">
              <label className="block">
                <span className="block text-yellow-400 text-xs font-black mb-1.5">
                  Tipo
                </span>
                <select
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(event.target.value as FarmCategoryFilter)
                  }
                  className={`w-full ${theme.input} border rounded-2xl px-4 py-3 outline-none focus:border-yellow-400`}
                >
                  {FARM_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 flex items-center justify-between gap-2 text-yellow-400 text-xs font-black">
                  <span>Atividade</span>
                  <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-[10px] text-yellow-300">
                    {visibleActivities.length} opções
                  </span>
                </span>
                <select
                  value={selectedActivityId}
                  onChange={(event) => setSelectedActivityId(event.target.value)}
                  disabled={visibleActivities.length === 0}
                  className={`w-full ${theme.input} border rounded-2xl px-4 py-3 outline-none focus:border-yellow-400`}
                >
                  {visibleActivities.map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.category} - {getActivityLabel(activity)} - {activity.levelRangeLabel}
                    </option>
                  ))}
                </select>
                {visibleActivities.length === 0 && (
                  <p className={`${theme.muted} mt-2 text-xs`}>
                    Sem dados de XP para o nível {currentLevel} nesta categoria.
                  </p>
                )}
              </label>

              <label className="block">
                <span className="block text-yellow-400 text-xs font-black mb-1.5">
                  Runs
                </span>
                <input
                  type="number"
                  min={1}
                  value={formatInputValue(runs)}
                  onChange={(event) =>
                    setRuns(
                      event.target.value === ""
                        ? 0
                        : sanitizeRuns(Number(event.target.value))
                    )
                  }
                  className={`w-full ${theme.input} border rounded-2xl px-4 py-3 outline-none focus:border-yellow-400`}
                />
              </label>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
                <p className={`${theme.muted} text-[11px] font-black uppercase`}>
                  XP por run
                </p>
                <p className="text-2xl font-black text-yellow-300">
                  {formatXP(selectedActivity?.xp ?? 0)}
                </p>
                <p className={`${theme.muted} text-[11px] font-bold`}>
                  {selectedActivity?.levelRangeLabel ?? `Nível ${currentLevel}`}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                <p className={`${theme.muted} text-[11px] font-black uppercase`}>
                  XP total
                </p>
                <p className="text-2xl font-black text-emerald-400">
                  {formatXP(xpTotal)}
                </p>
              </div>

              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                <p className={`${theme.muted} text-[11px] font-black uppercase`}>
                  Restará
                </p>
                <p className="text-2xl font-black text-red-300">
                  {formatXP(remainingAfterRun)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className={`${theme.text} text-sm font-black`}>
                  {selectedActivity
                    ? getActivityLabel(selectedActivity)
                    : "Sem atividade disponível"}
                </p>
                <p className={`${theme.muted} text-xs`}>
                  {selectedActivity
                    ? `${selectedActivity.category} selecionada para ${selectedActivity.levelRangeLabel}. O registro entra automaticamente no histórico.`
                    : `Aguardando dados de XP para o nível ${currentLevel}.`}
                </p>
              </div>

              <button
                type="button"
                onClick={applyFarmProgress}
                disabled={!canApply}
                className="md:min-w-56 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:scale-[1.02] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Adicionar XP
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-500/15 bg-emerald-500/5 p-3 md:p-4">
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-emerald-300 font-black">
                  Atalhos disponíveis
                </p>
                <p className={`${theme.muted} text-xs`}>
                  Escolha uma aba, ajuste jogadores quando existir e registre 1 run direto no histórico.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                {QUICK_RUN_TABS.map((tab) => (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => setQuickRunTab(tab.id)}
                    className={`rounded-2xl border px-3 py-2 text-xs font-black transition-all ${
                      quickRunTab === tab.id
                        ? "border-emerald-400 bg-emerald-500/15 text-emerald-200"
                        : "border-emerald-500/10 bg-black/20 text-zinc-500 hover:text-emerald-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {availableQuickPlayerCounts.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className={`${theme.muted} text-xs font-bold`}>
                  Jogadores
                </span>
                {availableQuickPlayerCounts.map((players) => (
                  <button
                    type="button"
                    key={players}
                    onClick={() => setQuickPlayerCount(players)}
                    className={`rounded-full border px-3 py-1 text-xs font-black transition-all ${
                      quickPlayerCount === players
                        ? "border-emerald-400 bg-emerald-500/15 text-emerald-200"
                        : "border-emerald-500/10 bg-black/20 text-zinc-500 hover:text-emerald-200"
                    }`}
                  >
                    {players} jogadores
                  </button>
                ))}
              </div>
            )}

            {quickActivities.length === 0 ? (
              <div className="rounded-2xl border border-emerald-500/10 bg-black/20 p-4">
                <p className={`${theme.text} text-sm font-black`}>
                  Dados em coleta
                </p>
                <p className={`${theme.muted} mt-1 text-xs`}>
                  Ainda não temos dados cadastrados para esta aba no nível {currentLevel}.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-3">
                  <p className={`${theme.muted} text-xs`}>
                    {quickActivities.length} atalhos disponíveis para {quickActivities[0]?.levelRangeLabel}.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                  {quickActivities.map((activity) => (
                    <button
                      type="button"
                      key={activity.id}
                      onClick={() => applyQuickActivity(activity)}
                      disabled={!canApplyQuickRun}
                      className="rounded-2xl border border-emerald-500/15 bg-black/25 p-3 text-left transition-all hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="block text-sm font-black text-white">
                        +{formatXP(activity.xp)} XP
                      </span>
                      <span className="mt-1 block text-xs text-zinc-400">
                        {activity.name}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-zinc-500">
                        {activity.category} - {activity.detail}
                      </span>
                      <span className="mt-1 inline-flex rounded-full border border-emerald-500/15 bg-emerald-500/5 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                        {activity.levelRangeLabel}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="hidden grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-3xl border border-yellow-500/15 bg-black/20 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-yellow-300 font-black">
                  Runs para upar
                </p>
                <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-300">
                  {recommendedRuns.length} melhores
                </span>
              </div>

              {recommendedRuns.length === 0 ? (
                <p className={`${theme.muted} text-sm`}>
                  Configure seu XP restante para calcular as melhores opções.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-2.5">
                  {recommendedRuns.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-yellow-500/10 bg-yellow-500/[0.03] p-3"
                    >
                      <div>
                        <p className={`${theme.text} text-sm font-bold leading-tight`}>
                          {activity.name}
                        </p>
                        <p className={`${theme.muted} text-xs leading-tight`}>
                          {activity.category} - {activity.detail}
                        </p>
                        <p className={`${theme.muted} text-[11px] leading-tight`}>
                          {activity.levelRangeLabel}
                        </p>
                      </div>

                      <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-300">
                        {Math.ceil(currentXP / activity.xp)}x
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-emerald-500/15 bg-emerald-500/5 p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-emerald-300 font-black">
                  Plano sugerido
                </p>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-200">
                  {farmPlan.totalRuns} runs
                </span>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
                {FARM_PLAN_MODES.map((mode) => (
                  <button
                    type="button"
                    key={mode.id}
                    onClick={() => setPlanMode(mode.id)}
                    className={`rounded-2xl border px-3 py-2 text-xs font-black transition-all ${
                      planMode === mode.id
                        ? "border-emerald-400 bg-emerald-500/15 text-emerald-200"
                        : "border-emerald-500/10 bg-black/20 text-zinc-500 hover:text-emerald-200"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {farmPlan.items.length === 0 ? (
                <p className={`${theme.muted} text-sm`}>
                  Configure seu XP restante para montar um plano.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-2.5">
                    {farmPlan.items.map((item) => (
                      <div
                        key={item.activity.id}
                        className="flex items-start justify-between gap-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.04] p-3"
                      >
                        <div>
                          <p className={`${theme.text} text-sm font-bold leading-tight`}>
                            {item.activity.name}
                          </p>
                          <p className={`${theme.muted} text-xs leading-tight`}>
                            {item.activity.category} - {item.activity.detail}
                          </p>
                          <p className={`${theme.muted} text-[11px] leading-tight`}>
                            {item.activity.levelRangeLabel}
                          </p>
                        </div>

                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-200">
                          {item.runs}x
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-2 md:grid-cols-[1fr_1fr_auto] gap-3 md:items-end">
                    <div>
                      <p className={`${theme.muted} text-[11px] font-black uppercase`}>
                        XP plano
                      </p>
                      <p className="text-lg font-black text-emerald-300">
                        {formatXP(farmPlan.totalXP)}
                      </p>
                    </div>

                    <div>
                      <p className={`${theme.muted} text-[11px] font-black uppercase`}>
                        Sobra
                      </p>
                      <p className="text-lg font-black text-yellow-300">
                        {formatXP(farmPlan.overflowXP)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={applyFarmPlan}
                      className="col-span-2 md:col-span-1 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white px-5 py-3 rounded-2xl font-black shadow-lg hover:scale-[1.02] transition-all"
                    >
                      Aplicar plano
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
