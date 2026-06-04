import { useEffect, useState } from "react";
import type { HistoryEntry } from "~/hooks/useXpTracker";

interface EditHistoryEntryModalProps {
  entry: HistoryEntry | null;
  fallbackTotalXP: number;
  onCancel: () => void;
  onSave: (entry: HistoryEntry) => void;
}

function sanitizeNumber(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function formatInputValue(value: number) {
  return value === 0 ? "" : value;
}

export function EditHistoryEntryModal({
  entry,
  fallbackTotalXP,
  onCancel,
  onSave,
}: EditHistoryEntryModalProps) {
  const [xpGained, setXpGained] = useState(0);
  const [xpRemaining, setXpRemaining] = useState(0);
  const [entryTotalXP, setEntryTotalXP] = useState(fallbackTotalXP);

  useEffect(() => {
    if (!entry) return;

    setXpGained(entry.xpGained);
    setXpRemaining(entry.xpRemaining);
    setEntryTotalXP(entry.totalXP ?? fallbackTotalXP);
  }, [entry, fallbackTotalXP]);

  if (!entry) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-950 border border-sky-500/30 rounded-3xl p-8 max-w-md w-full shadow-[0_0_60px_rgba(56,189,248,0.18)]">
        <h2 className="text-2xl font-black text-white mb-2">
          Editar registro
        </h2>

        <p className="text-zinc-400 mb-6">
          Corrija os dados deste ponto do histórico. A alteração será salva automaticamente.
        </p>

        <div className="space-y-4">
          <label className="block">
            <span className="block text-sky-400 text-sm mb-2">
              XP ganho
            </span>
            <input
              type="number"
              min={0}
              value={formatInputValue(xpGained)}
              onChange={(event) =>
                setXpGained(
                  event.target.value === ""
                    ? 0
                    : sanitizeNumber(Number(event.target.value))
                )
              }
              className="w-full bg-black border border-sky-500/20 text-white rounded-2xl px-4 py-3 outline-none focus:border-sky-400"
            />
          </label>

          <label className="block">
            <span className="block text-sky-400 text-sm mb-2">
              XP restante após o registro
            </span>
            <input
              type="number"
              min={0}
              value={formatInputValue(xpRemaining)}
              onChange={(event) =>
                setXpRemaining(
                  event.target.value === ""
                    ? 0
                    : sanitizeNumber(Number(event.target.value))
                )
              }
              className="w-full bg-black border border-sky-500/20 text-white rounded-2xl px-4 py-3 outline-none focus:border-sky-400"
            />
          </label>

          <label className="block">
            <span className="block text-sky-400 text-sm mb-2">
              Meta total usada neste ponto
            </span>
            <input
              type="number"
              min={0}
              value={formatInputValue(entryTotalXP)}
              onChange={(event) =>
                setEntryTotalXP(
                  event.target.value === ""
                    ? 0
                    : sanitizeNumber(Number(event.target.value))
                )
              }
              className="w-full bg-black border border-sky-500/20 text-white rounded-2xl px-4 py-3 outline-none focus:border-sky-400"
            />
          </label>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 transition-all px-6 py-3 rounded-2xl font-bold text-white"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() =>
              onSave({
                ...entry,
                xpGained,
                xpRemaining,
                totalXP: entryTotalXP,
              })
            }
            className="flex-1 bg-gradient-to-r from-sky-400 to-blue-600 hover:scale-105 transition-all px-6 py-3 rounded-2xl font-bold text-black"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
