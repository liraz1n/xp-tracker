import { useState } from "react";
import { GamepadIcon } from "~/components/xp-tracker/UiIcons";

const TELETOFUS_URL = "https://t.me/Teletofusbot?start=ref_756985380";
const TELETOFUS_SITE_URL = "https://teletofus.com";

export function TeletofusLink() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-5 z-30 md:bottom-24 md:right-7">
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-0 cursor-default"
            aria-label="Fechar menu Teletofus"
            onClick={() => setOpen(false)}
          />

          <div className="absolute bottom-16 right-0 z-10 w-64 rounded-3xl border border-cyan-500/30 bg-zinc-950/95 p-3 shadow-[0_0_42px_rgba(34,211,238,0.16)] backdrop-blur">
            <p className="px-3 pb-2 text-xs font-black uppercase text-cyan-300">
              Teletofus
            </p>

            <div className="space-y-2">
              <a
                href={TELETOFUS_URL}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-100 transition-all hover:border-cyan-300 hover:bg-cyan-400 hover:text-black"
              >
                <span>Jogue Teletofus</span>
                <GamepadIcon className="h-5 w-5" />
              </a>

              <a
                href={TELETOFUS_SITE_URL}
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-cyan-500/15 bg-black/35 px-4 py-3 text-sm font-black text-zinc-200 transition-all hover:border-cyan-300 hover:text-cyan-200"
              >
                <span>Site oficial</span>
                <span className="text-lg leading-none">&gt;</span>
              </a>
            </div>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/15 text-cyan-200 shadow-[0_0_34px_rgba(34,211,238,0.2)] transition-all hover:border-cyan-300 hover:bg-cyan-400 hover:text-black"
        aria-expanded={open}
        aria-label="Abrir menu Teletofus"
      >
        <GamepadIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
