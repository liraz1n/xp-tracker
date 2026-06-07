import { useState } from "react";
import { FLOATING_GLYPHS } from "~/components/xp-tracker/StableGlyphs";
import type { DoubleXpMode } from "~/hooks/useXpTracker";

interface DoubleXpActionProps {
  mode: DoubleXpMode;
  onChange: (mode: DoubleXpMode) => void;
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

export function DoubleXpAction({ mode, onChange }: DoubleXpActionProps) {
  const [open, setOpen] = useState(false);
  const active = mode !== "off";
  const floatingIconClass = "text-2xl leading-none";

  function selectMode(nextMode: DoubleXpMode) {
    onChange(mode === nextMode ? "off" : nextMode);
    setOpen(false);
  }

  return (
    <div className="fixed bottom-[10.75rem] right-5 z-30">
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-0 cursor-default"
            aria-label="Fechar menu Double XP"
            onClick={() => setOpen(false)}
          />

          <div className="absolute bottom-16 right-0 z-10 w-72 rounded-3xl border border-yellow-500/30 bg-zinc-950/95 p-3 shadow-[0_0_42px_rgba(234,179,8,0.2)] backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-3 pb-2">
              <p className="text-xs font-black uppercase text-yellow-400">
                Evento Double XP
              </p>
              {active && (
                <button
                  type="button"
                  onClick={() => selectMode("off")}
                  className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-black text-red-300 transition-all hover:bg-red-500 hover:text-white"
                >
                  Desativar
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
            </div>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-full border shadow-[0_0_34px_rgba(234,179,8,0.22)] transition-all ${
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
