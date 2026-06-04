interface ResetModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ResetModal({ open, onCancel, onConfirm }: ResetModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-950 border border-red-500/30 rounded-3xl p-8 max-w-md w-full shadow-[0_0_60px_rgba(239,68,68,0.2)]">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-2xl font-black text-red-300">
          !
        </div>

        <h2 className="text-2xl font-black text-white mb-2">
          Resetar tudo?
        </h2>

        <p className="text-zinc-400 mb-8">
          Todo o progresso, histórico e metas serão apagados.{' '}
          <span className="text-red-400 font-semibold">
            Essa ação não pode ser desfeita.
          </span>
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 transition-all px-6 py-3 rounded-2xl font-bold text-white"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-700 hover:scale-105 transition-all px-6 py-3 rounded-2xl font-bold text-white"
          >
            Sim, resetar
          </button>
        </div>
      </div>
    </div>
  );
}
