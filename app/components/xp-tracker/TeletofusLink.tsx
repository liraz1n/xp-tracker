import { GamepadIcon } from "~/components/xp-tracker/UiIcons";

const TELETOFUS_URL = "https://t.me/Teletofusbot?start=ref_756985380";

export function TeletofusLink() {
  return (
    <a
      href={TELETOFUS_URL}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-24 right-5 z-30 flex items-center gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/15 px-4 py-3 text-sm font-black text-yellow-200 shadow-[0_0_34px_rgba(234,179,8,0.18)] transition-all hover:border-yellow-400 hover:bg-yellow-500 hover:text-black md:bottom-24 md:right-7"
      aria-label="Abrir Teletofus"
    >
      <GamepadIcon className="h-5 w-5" />
      <span>Jogar Teletofus</span>
    </a>
  );
}
