import {
  formatXP,
  getNearbyLevelRequirements,
  getXpForLevelRange,
} from "~/lib/xp-levels";

interface LevelPlannerCardProps {
  currentLevel: number;
  targetLevel: number;
  totalXP: number;
  currentXP: number;
  theme: {
    card: string;
    muted: string;
    text: string;
  };
  onApplyLevelXP: (value: number) => void;
}

export function LevelPlannerCard({
  currentLevel,
  targetLevel,
  totalXP,
  currentXP,
  theme,
  onApplyLevelXP,
}: LevelPlannerCardProps) {
  const levelRange = getXpForLevelRange(currentLevel, targetLevel);
  const nearbyRequirements = getNearbyLevelRequirements(currentLevel);
  const completedXP = Math.max(0, totalXP - currentXP);
  const canApplyTableXP = levelRange.totalXP > 0 && levelRange.totalXP !== totalXP;

  return (
    <section className={`${theme.card} border rounded-3xl p-5 md:p-8 mb-6 md:mb-8 shadow-[0_0_40px_rgba(234,179,8,0.12)]`}>
      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6 xl:gap-8">
        <div>
          <p className="text-yellow-400 text-sm font-black mb-2">
            Tabela de XP
          </p>

          <h2 className="text-2xl md:text-3xl font-black text-yellow-300">
            Nível {levelRange.currentLevel} → {levelRange.targetLevel}
          </h2>

          <p className={`${theme.muted} mt-3 leading-relaxed`}>
            Use a tabela como base para preencher o XP necessário do próximo nível. Quando você tiver os números oficiais do bot, dá para substituir os valores estimados.
          </p>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
              <p className={`${theme.muted} text-xs font-bold uppercase`}>
                XP da tabela
              </p>
              <p className="text-2xl font-black text-yellow-300">
                {formatXP(levelRange.totalXP)}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <p className={`${theme.muted} text-xs font-bold uppercase`}>
                Já feito
              </p>
              <p className="text-2xl font-black text-emerald-400">
                {formatXP(completedXP)}
              </p>
            </div>

            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3">
              <p className={`${theme.muted} text-xs font-bold uppercase`}>
                Falta
              </p>
              <p className="text-2xl font-black text-red-300">
                {formatXP(currentXP)}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center">
            <button
              type="button"
              onClick={() => onApplyLevelXP(levelRange.totalXP)}
              disabled={!canApplyTableXP}
              className="bg-gradient-to-r from-yellow-300 to-amber-600 text-black px-6 py-4 rounded-2xl font-black shadow-lg hover:scale-[1.02] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Usar XP da tabela
            </button>

            <p className={`${theme.muted} text-sm`}>
              {levelRange.hasEstimatedValues
                ? "Alguns níveis ainda usam estimativa."
                : "Valor confirmado para este intervalo."}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-yellow-500/15 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-yellow-300 font-black">
              Níveis próximos
            </p>
            <span className="text-xs font-bold text-yellow-300 border border-yellow-500/20 bg-yellow-500/10 rounded-full px-3 py-1">
              XP para o próximo
            </span>
          </div>

          <div className="space-y-3">
            {nearbyRequirements.map((requirement) => (
              <div
                key={requirement.level}
                className="flex items-center justify-between gap-4 border-b border-yellow-500/10 pb-3 last:border-b-0 last:pb-0"
              >
                <div>
                  <p className={`${theme.text} text-sm font-bold`}>
                    Nível {requirement.level} → {requirement.nextLevel}
                  </p>
                  <p className={`${theme.muted} text-xs`}>
                    {requirement.source === "confirmed"
                      ? "Valor confirmado"
                      : "Valor estimado"}
                  </p>
                </div>

                <p className="text-sm font-black text-yellow-300">
                  {formatXP(requirement.xp)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
