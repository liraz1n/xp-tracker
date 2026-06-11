import { useEffect, useState } from "react";
import { FLOATING_GLYPHS } from "~/components/xp-tracker/StableGlyphs";
import type { DoubleXpMode } from "~/hooks/useXpTracker";

interface DoubleXpActionProps {
  mode: DoubleXpMode;
  wisdomElixirActive: boolean;
  wisdomElixirEndsAt: number | null;
  onChange: (mode: DoubleXpMode) => void;
  onActivateWisdomElixir: () => void;
  onDeactivateWisdomElixir: () => void;
}

const options: Array<{
  id: DoubleXpMode;
  title: string;
  description: string;
}> = [
  {
    id: "hunt",
    title: "2XP Caçada",
    description: "Preparado para runs de caçada solo quando forem cadastradas.",
  },
  {
    id: "dungeon",
    title: "2XP Masmorras",
    description: "Dobra o XP cadastrado nas masmorras.",
  },
];

function formatRemainingTime(endsAt: number | null) {
  if (!endsAt) return "30 min";

  const remainingMs = Math.max(0, endsAt - Date.now());
  const minutes = Math.ceil(remainingMs / 60000);

  return `${minutes} min`;
}

export function DoubleXpAction({
  mode,
  wisdomElixirActive,
  wisdomElixirEndsAt,
  onChange,
  onActivateWisdomElixir,
  onDeactivateWisdomElixir,
}: DoubleXpActionProps) {
  const [open, setOpen] = useState(false);
  const [timeTick, setTimeTick] = useState(0);
  const active = mode !== "off" || wisdomElixirActive;
  const floatingIconClass = "text-xl leading-none";

  useEffect(() => {
    if (!wisdomElixirActive) return;

    const interval = setInterval(() => {
      setTimeTick((current) => current + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [wisdomElixirActive]);

  function selectMode(nextMode: DoubleXpMode) {
    onChange(mode === nextMode ? "off" : nextMode);
    setOpen(false);
  }

  const remainingLabel = formatRemainingTime(wisdomElixirEndsAt);
  void timeTick;

  return (
    <div className="fixed bottom-[9.5rem] right-5 z-30">
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-0 cursor-default"
            aria-label="Fechar menu Double XP"
            onClick={() => setOpen(false)}
          />

          <div className="absolute bottom-14 right-0 z-10 w-72 rounded-3xl border border-yellow-500/30 bg-zinc-950/95 p-3 shadow-[0_0_42px_rgba(234,179,8,0.2)] backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-3 pb-2">
              <p className="text-xs font-black uppercase text-yellow-400">
                Boosters de XP
              </p>
              {active && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("off");
                    onDeactivateWisdomElixir();
                  }}
                  className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-black text-red-300 transition-all hover:bg-red-500 hover:text-white"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="space-y-2">
              {options.map((option) => {
                const selected = mode === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => selectMode(option.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                      selected
                        ? "border-yellow-300 bg-yellow-500/20 text-yellow-100"
                        : "border-yellow-500/15 bg-black/35 text-zinc-200 hover:border-yellow-400 hover:text-yellow-100"
                    }`}
                  >
                    <span className="block text-sm font-black">{option.title}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                      {option.description}
                    </span>
                  </button>
                );
              })}

              <div
                className={`rounded-2xl border px-4 py-3 transition-all ${
                  wisdomElixirActive
                    ? "border-emerald-300 bg-emerald-500/15 text-emerald-100"
                    : "border-yellow-500/15 bg-black/35 text-zinc-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="block text-sm font-black">
                      Elixir da Sabedoria
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                      +10% de XP por 30 minutos em criptas, masmorras e caçada solo.
                    </span>
                  </div>
                  {wisdomElixirActive && (
                    <span className="shrink-0 rounded-full border border-emerald-300/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-200">
                      {remainingLabel}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={onActivateWisdomElixir}
                    className="flex-1 rounded-xl border border-emerald-400/25 bg-emerald-500/15 px-3 py-2 text-xs font-black text-emerald-100 transition-all hover:bg-emerald-400 hover:text-black"
                  >
                    {wisdomElixirActive ? "Reativar 30min" : "Ativar 30min"}
                  </button>
                  {wisdomElixirActive && (
                    <button
                      type="button"
                      onClick={onDeactivateWisdomElixir}
                      className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-black text-red-300 transition-all hover:bg-red-500 hover:text-white"
                    >
                      Desativar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border shadow-[0_0_30px_rgba(234,179,8,0.2)] transition-all ${
          active
            ? "border-yellow-300 bg-yellow-400 text-black"
            : "border-yellow-500/40 bg-yellow-500/15 text-yellow-200 hover:border-yellow-400 hover:bg-yellow-500 hover:text-black"
        }`}
        aria-expanded={open}
        aria-label="Abrir menu Double XP"
      >
        <span className={floatingIconClass}>{FLOATING_GLYPHS.doubleXp}</span>
      </button>
    </div>
  );
}
