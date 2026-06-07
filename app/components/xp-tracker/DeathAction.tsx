import { useState } from "react";
import { FLOATING_GLYPHS } from "~/components/xp-tracker/StableGlyphs";
import { XIcon } from "~/components/xp-tracker/UiIcons";

type DeathPenaltyMode = "peace-necklace" | "no-necklace";

interface DeathActionProps {
  userTotalXP: number;
  disabled: boolean;
  theme: {
    card: string;
    muted: string;
    text: string;
  };
  onConfirm: (mode: DeathPenaltyMode) => void;
}

const deathModes: Array<{
  id: DeathPenaltyMode;
  title: string;
  description: string;
  percent: number;
}> = [
  {
    id: "peace-necklace",
    title: "Com Colar da Paz",
    description: "Perda reduzida pelo Huaguilli.",
    percent: 2,
  },
  {
    id: "no-necklace",
    title: "Sem Colar da Paz",
    description: "Perda cheia aplicada na morte.",
    percent: 10,
  },
];

function formatXP(value: number) {
  return Math.round(value).toLocaleString("pt-BR");
}

export function DeathAction({
  userTotalXP,
  disabled,
  theme,
  onConfirm,
}: DeathActionProps) {
  const [open, setOpen] = useState(false);
  const [selectedMode, setSelectedMode] =
    useState<DeathPenaltyMode>("peace-necklace");

  const selectedPenalty =
    deathModes.find((mode) => mode.id === selectedMode) ?? deathModes[0];
  const xpLost = Math.floor(userTotalXP * (selectedPenalty.percent / 100));
  const canConfirm = !disabled && userTotalXP > 0 && xpLost > 0;
  const floatingIconClass = "text-2xl leading-none";

  function confirmDeath() {
    if (!canConfirm) return;

    onConfirm(selectedMode);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/40 bg-red-500/15 text-red-300 shadow-[0_0_34px_rgba(239,68,68,0.24)] transition-all hover:bg-red-500 hover:text-white disabled:pointer-events-none disabled:opacity-40"
        aria-label="Registrar morte"
      >
        <span className={floatingIconClass}>{FLOATING_GLYPHS.death}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className={`${theme.card} w-full max-w-lg rounded-3xl border border-red-500/30 p-5 shadow-[0_0_60px_rgba(239,68,68,0.22)] md:p-6`}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-red-300">
                  Evento de perda
                </p>
                <h2 className="mt-1 text-2xl font-black text-red-200">
                  Registrar morte
                </h2>
                <p className={`${theme.muted} mt-2 text-sm leading-relaxed`}>
                  A perda entra no histórico e aumenta o XP restante para upar.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-500/25 bg-red-500/10 text-red-300 transition-all hover:bg-red-500 hover:text-white"
                aria-label="Fechar morte"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {deathModes.map((mode) => {
                const active = selectedMode === mode.id;
                const modeLoss = Math.floor(userTotalXP * (mode.percent / 100));

                return (
                  <button
                    type="button"
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      active
                        ? "border-red-400 bg-red-500/15"
                        : "border-red-500/15 bg-black/20 hover:border-red-400/60"
                    }`}
                  >
                    <p className="font-black text-red-200">{mode.title}</p>
                    <p className={`${theme.muted} mt-1 text-xs`}>
                      {mode.description}
                    </p>
                    <p className="mt-3 text-sm font-black text-red-300">
                      -{mode.percent}% | -{formatXP(modeLoss)} XP
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
              <p className={`${theme.muted} text-xs font-black uppercase`}>
                Perda calculada
              </p>
              <p className="mt-1 text-2xl font-black text-red-300">
                -{formatXP(xpLost)} XP
              </p>
              <p className={`${theme.muted} mt-1 text-xs`}>
                Base atual: {formatXP(userTotalXP)} XP total do usuário.
              </p>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-2xl bg-zinc-800 px-5 py-3 font-bold text-white transition-all hover:bg-zinc-700"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmDeath}
                disabled={!canConfirm}
                className="flex-1 rounded-2xl bg-gradient-to-r from-red-500 to-red-700 px-5 py-3 font-black text-white transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                Confirmar morte
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
