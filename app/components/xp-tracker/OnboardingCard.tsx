import { useState } from "react";

interface OnboardingCardProps {
  guestMode: boolean;
  theme: {
    card: string;
    input: string;
    muted: string;
    text: string;
  };
  onStart: (values: {
    totalXP: number;
    currentXP: number;
    dailyGoal: number;
    currentLevel: number;
    targetLevel: number;
  }) => void;
}

function sanitizeNumber(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function sanitizeLevel(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function formatInputValue(value: number) {
  return value === 0 ? "" : value;
}

export function OnboardingCard({
  guestMode,
  theme,
  onStart,
}: OnboardingCardProps) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [targetLevel, setTargetLevel] = useState(1);
  const [totalXP, setTotalXP] = useState(0);
  const [currentXP, setCurrentXP] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(0);

  const currentXPValue = Math.min(currentXP, totalXP);
  const userXP = Math.max(0, totalXP - currentXPValue);
  const canStart = totalXP > 0 && currentXPValue > 0 && targetLevel > currentLevel;

  function updateUserXP(value: number) {
    const sanitizedUserXP = Math.min(sanitizeNumber(value), totalXP);

    setCurrentXP(Math.max(0, totalXP - sanitizedUserXP));
  }

  function submitSetup() {
    if (!canStart) return;

    onStart({
      totalXP,
      currentXP: currentXPValue,
      dailyGoal,
      currentLevel,
      targetLevel,
    });
  }

  return (
    <section className={`${theme.card} border rounded-3xl p-5 md:p-8 mb-6 md:mb-8 shadow-[0_0_50px_rgba(234,179,8,0.14)]`}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6 lg:gap-10 items-start">
        <div>
          <p className="text-yellow-400 text-sm font-black mb-2">
            Primeiro passo
          </p>

          <h2 className="text-2xl md:text-3xl font-black text-yellow-300">
            Configure seu próximo nível
          </h2>

          <p className={`${theme.muted} mt-3 leading-relaxed`}>
            Informe seu nível atual, o nível alvo e quanto XP ainda falta. No primeiro contato, seja visitante ou Google, o nível sempre começa em 0.
          </p>

          {guestMode && (
            <p className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
              Você está testando como visitante. Nada será salvo na nuvem até você entrar com Google.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
          <label className="block">
            <span className="block text-yellow-400 text-sm mb-2">
              Nível atual
            </span>
            <input
              type="number"
              min={0}
              value={currentLevel}
              onChange={(event) =>
                setCurrentLevel(sanitizeLevel(Number(event.target.value)))
              }
              className={`w-full ${theme.input} border rounded-2xl px-4 py-3 outline-none focus:border-yellow-400`}
            />
          </label>

          <label className="block">
            <span className="block text-yellow-400 text-sm mb-2">
              Nível alvo
            </span>
            <input
              type="number"
              min={currentLevel + 1}
              value={targetLevel}
              onChange={(event) =>
                setTargetLevel(sanitizeLevel(Number(event.target.value)))
              }
              className={`w-full ${theme.input} border rounded-2xl px-4 py-3 outline-none focus:border-yellow-400`}
            />
          </label>

          <label className="block">
            <span className="block text-yellow-400 text-sm mb-2">
              XP para upar
            </span>
            <input
              type="number"
              min={0}
              value={formatInputValue(totalXP)}
              onChange={(event) =>
                setTotalXP(
                  event.target.value === ""
                    ? 0
                    : sanitizeNumber(Number(event.target.value))
                )
              }
              className={`w-full ${theme.input} border rounded-2xl px-4 py-3 outline-none focus:border-yellow-400`}
            />
          </label>

          <label className="block">
            <span className="block text-yellow-400 text-sm mb-2">
              XP restante
            </span>
            <input
              type="number"
              min={0}
              max={totalXP}
              value={formatInputValue(currentXP)}
              onChange={(event) =>
                setCurrentXP(
                  event.target.value === ""
                    ? 0
                    : sanitizeNumber(Number(event.target.value))
                )
              }
              className={`w-full ${theme.input} border rounded-2xl px-4 py-3 outline-none focus:border-yellow-400`}
            />
          </label>

          <label className="block">
            <span className="block text-yellow-400 text-sm mb-2">
              XP atual do usuário
            </span>
            <input
              type="number"
              min={0}
              max={totalXP}
              value={formatInputValue(userXP)}
              onChange={(event) =>
                updateUserXP(
                  event.target.value === ""
                    ? 0
                    : sanitizeNumber(Number(event.target.value))
                )
              }
              className={`w-full ${theme.input} border rounded-2xl px-4 py-3 outline-none focus:border-yellow-400`}
            />
          </label>

          <label className="block">
            <span className="block text-yellow-400 text-sm mb-2">
              Meta diária
            </span>
            <input
              type="number"
              min={0}
              value={formatInputValue(dailyGoal)}
              onChange={(event) =>
                setDailyGoal(
                  event.target.value === ""
                    ? 0
                    : sanitizeNumber(Number(event.target.value))
                )
              }
              className={`w-full ${theme.input} border rounded-2xl px-4 py-3 outline-none focus:border-yellow-400`}
            />
          </label>

          <div className="sm:col-span-2 xl:col-span-6 flex flex-col sm:flex-row gap-3 sm:items-center mt-1">
            <button
              type="button"
              onClick={submitSetup}
              disabled={!canStart}
              className="bg-gradient-to-r from-yellow-300 to-amber-600 text-black px-6 py-4 rounded-2xl font-black shadow-lg hover:scale-[1.02] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Começar acompanhamento
            </button>

            <p className={`${theme.muted} text-sm`}>
              Se já souber seu nível real, ajuste os campos antes de começar.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
