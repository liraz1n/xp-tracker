import { useMemo, useState } from "react";

interface FarmPlannerCardProps {
  currentXP: number;
  dailyGoal: number;
  theme: {
    card: string;
    input: string;
    muted: string;
    text: string;
  };
}

type PlannerMode = "all" | "cripta" | "masmorra";

const PLANNER_ACTIVITIES = [
  { type: "cripta", name: "Cripta 1 até 30", detail: "4 jogadores", xp: 53942, minutes: 18 },
  { type: "cripta", name: "Cripta 1 até 31", detail: "4 jogadores", xp: 58290, minutes: 19 },
  { type: "cripta", name: "Cripta 1 até 32", detail: "4 jogadores", xp: 62942, minutes: 20 },
  { type: "cripta", name: "Cripta 1 até 33", detail: "4 jogadores", xp: 67990, minutes: 22 },
  { type: "masmorra", name: "Deserto", detail: "4 jogadores", xp: 9737, minutes: 6 },
  { type: "masmorra", name: "Cemitério", detail: "4 jogadores", xp: 8537, minutes: 6 },
  { type: "masmorra", name: "Deserto", detail: "5 jogadores", xp: 7890, minutes: 6 },
  { type: "masmorra", name: "Templo do Oásis", detail: "1 jogador", xp: 15789, minutes: 6 },
  { type: "masmorra", name: "Templo do Oásis", detail: "2 jogadores", xp: 15789, minutes: 6 },
] as const;

function formatXP(value: number) {
  return Math.round(value).toLocaleString("pt-BR");
}

export function FarmPlannerCard({
  currentXP,
  dailyGoal,
  theme,
}: FarmPlannerCardProps) {
  const [mode, setMode] = useState<PlannerMode>("all");
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [deadlineDays, setDeadlineDays] = useState(7);

  const plans = useMemo(() => {
    const maxMinutesPerDay = Math.max(30, hoursPerDay * 60);
    const activities = PLANNER_ACTIVITIES.filter(
      (activity) => mode === "all" || activity.type === mode
    );

    return activities
      .map((activity) => {
        const runsToLevel = currentXP > 0 ? Math.ceil(currentXP / activity.xp) : 0;
        const runsPerDay = Math.max(1, Math.floor(maxMinutesPerDay / activity.minutes));
        const daysByTime = runsToLevel > 0 ? Math.ceil(runsToLevel / runsPerDay) : 0;
        const xpPerDay = runsPerDay * activity.xp;
        const dailyGoalRuns = dailyGoal > 0 ? Math.ceil(dailyGoal / activity.xp) : null;

        return {
          ...activity,
          runsToLevel,
          runsPerDay,
          daysByTime,
          xpPerDay,
          dailyGoalRuns,
          fitsDeadline: daysByTime > 0 && daysByTime <= deadlineDays,
        };
      })
      .sort((a, b) => a.daysByTime - b.daysByTime || b.xp - a.xp)
      .slice(0, 4);
  }, [currentXP, dailyGoal, deadlineDays, hoursPerDay, mode]);

  return (
    <section className={`${theme.card} border rounded-3xl p-4 md:p-5 mb-4 md:mb-5`}>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-emerald-300 text-xs md:text-sm font-black mb-1">
            Planejador de farm
          </p>
          <h2 className="text-xl md:text-2xl font-black text-emerald-300">
            Rota para upar
          </h2>
          <p className={`${theme.muted} mt-1.5 text-xs md:text-sm`}>
            Monte uma estimativa por tempo diário, tipo de farm e prazo desejado.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <label className="block">
            <span className={`${theme.muted} mb-1 block text-[11px] font-black uppercase`}>
              Modo
            </span>
            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as PlannerMode)}
              className={`${theme.input} w-full rounded-xl border px-3 py-2 text-sm font-bold outline-none`}
            >
              <option value="all">Tudo</option>
              <option value="cripta">Só cripta</option>
              <option value="masmorra">Só masmorra</option>
            </select>
          </label>

          <label className="block">
            <span className={`${theme.muted} mb-1 block text-[11px] font-black uppercase`}>
              Horas/dia
            </span>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={hoursPerDay}
              onChange={(event) => setHoursPerDay(Math.max(0.5, Number(event.target.value)))}
              className={`${theme.input} w-full rounded-xl border px-3 py-2 text-sm font-bold outline-none`}
            />
          </label>

          <label className="block">
            <span className={`${theme.muted} mb-1 block text-[11px] font-black uppercase`}>
              Prazo
            </span>
            <input
              type="number"
              min={1}
              value={deadlineDays}
              onChange={(event) => setDeadlineDays(Math.max(1, Math.floor(Number(event.target.value))))}
              className={`${theme.input} w-full rounded-xl border px-3 py-2 text-sm font-bold outline-none`}
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <div
            key={`${plan.type}-${plan.name}-${plan.detail}`}
            className={`rounded-2xl border p-3 ${
              plan.fitsDeadline
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-yellow-500/15 bg-black/20"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`${theme.text} text-sm font-black leading-tight`}>
                  {plan.name}
                </p>
                <p className={`${theme.muted} text-xs`}>
                  {plan.detail}
                </p>
              </div>
              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[11px] font-black text-emerald-300">
                {plan.runsToLevel}x
              </span>
            </div>

            <div className="mt-3 space-y-1 text-xs">
              <p className={theme.muted}>
                Com {hoursPerDay}h/dia: <span className={theme.text}>{plan.daysByTime || "--"} dias</span>
              </p>
              <p className={theme.muted}>
                Ritmo diário: <span className={theme.text}>{plan.runsPerDay} runs</span> / {formatXP(plan.xpPerDay)} XP
              </p>
              <p className={theme.muted}>
                Meta diária: <span className={theme.text}>{plan.dailyGoalRuns ? `${plan.dailyGoalRuns} runs` : "sem meta"}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
