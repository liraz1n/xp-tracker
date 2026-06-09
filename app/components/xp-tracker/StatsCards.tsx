import { useState } from "react";
import { XP_FIELD_HELP } from "~/components/xp-tracker/XpInputs";

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

interface HelpButtonProps {
  id: string;
  label: string;
  help: string;
  activeHelp: string | null;
  onToggle: (id: string) => void;
}

function HelpButton({ id, label, help, activeHelp, onToggle }: HelpButtonProps) {
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Ajuda sobre ${label}`}
        onClick={() => onToggle(id)}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-yellow-500/30 bg-yellow-500/10 text-xs font-black text-yellow-300 transition-all hover:bg-yellow-500 hover:text-black"
      >
        ?
      </button>

      {activeHelp === id && (
        <div className="absolute right-0 top-8 z-20 w-56 rounded-2xl border border-yellow-500/25 bg-zinc-950 p-3 text-xs leading-relaxed text-yellow-100 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
          {help}
        </div>
      )}
    </div>
  );
}

export function StatsCards({
  totalXP,
  currentXP,
  userTotalXP,
  percentageDisplay,
  currentLevel,
  theme,
}: StatsCardsProps) {
  const [activeHelp, setActiveHelp] = useState<string | null>(null);
  const toggleHelp = (id: string) =>
    setActiveHelp((current) => current === id ? null : id);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-4 md:mb-5">
      <div className={`${theme.card} border rounded-2xl p-4 md:p-5 min-w-0`}>
        <p className={`${theme.muted} text-xs md:text-sm mb-1.5`}>Nível atual</p>
        <h2 className={`${statValueClass} text-yellow-300`}>
          {currentLevel}
        </h2>
      </div>

      <div className={`${theme.card} relative border rounded-2xl p-4 md:p-5 min-w-0`}>
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <p className={`${theme.muted} text-xs md:text-sm`}>XP do Usuário</p>
          <HelpButton id="userXP" label="XP do Usuário" help={XP_FIELD_HELP.userXP} activeHelp={activeHelp} onToggle={toggleHelp} />
        </div>
        <h2 className={`${statValueClass} text-cyan-300`}>
          {userTotalXP.toLocaleString("pt-BR")}
        </h2>
      </div>

      <div className={`${theme.card} relative border rounded-2xl p-4 md:p-5 min-w-0`}>
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <p className={`${theme.muted} text-xs md:text-sm`}>XP necessário para upar</p>
          <HelpButton id="totalXP" label="XP necessário para upar" help={XP_FIELD_HELP.totalXP} activeHelp={activeHelp} onToggle={toggleHelp} />
        </div>
        <h2 className={`${statValueClass} text-yellow-300`}>
          {totalXP.toLocaleString("pt-BR")}
        </h2>
      </div>

      <div className={`${theme.card} relative border rounded-2xl p-4 md:p-5 min-w-0`}>
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <p className={`${theme.muted} text-xs md:text-sm`}>XP Restante</p>
          <HelpButton id="currentXP" label="XP Restante" help={XP_FIELD_HELP.currentXP} activeHelp={activeHelp} onToggle={toggleHelp} />
        </div>
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
