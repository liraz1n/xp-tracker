import { useState } from "react";
import { FLOATING_GLYPHS } from "~/components/xp-tracker/StableGlyphs";
import { ReferralInviteCard } from "~/components/xp-tracker/ReferralInviteCard";
import type { ReferralSummary } from "~/hooks/useBilling";

interface ReferralInviteActionProps {
  summary: ReferralSummary | null;
  loading: boolean;
  error: string | null;
  guestMode: boolean;
  theme: {
    card: string;
    input: string;
    muted: string;
    text: string;
  };
}

export function ReferralInviteAction({
  summary,
  loading,
  error,
  guestMode,
  theme,
}: ReferralInviteActionProps) {
  const [open, setOpen] = useState(false);

  if (guestMode) return null;

  return (
    <div className="fixed bottom-[15.75rem] right-5 z-30">
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-0 cursor-default"
            aria-label="Fechar convites"
            onClick={() => setOpen(false)}
          />

          <div className="absolute bottom-16 right-0 z-10 w-[min(22rem,calc(100vw-2.5rem))]">
            <ReferralInviteCard
              summary={summary}
              loading={loading}
              error={error}
              guestMode={guestMode}
              theme={theme}
            />
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-200 shadow-[0_0_34px_rgba(16,185,129,0.22)] transition-all hover:border-emerald-300 hover:bg-emerald-400 hover:text-black"
        aria-expanded={open}
        aria-label="Abrir convites"
      >
        <span className="text-2xl leading-none">
          {FLOATING_GLYPHS.invite}
        </span>
      </button>
    </div>
  );
}
