import { useMemo, useState } from "react";
import { formatCurrencyCents, type ReferralSummary } from "~/hooks/useBilling";

interface ReferralInviteCardProps {
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

export function ReferralInviteCard({
  summary,
  loading,
  error,
  guestMode,
  theme,
}: ReferralInviteCardProps) {
  const [copied, setCopied] = useState(false);
  const inviteLink = useMemo(() => {
    if (!summary?.code || typeof window === "undefined") return "";

    return `${window.location.origin}/?ref=${summary.code}`;
  }, [summary?.code]);
  const progress = summary?.nextCreditProgress ?? 0;
  const creditsAvailable = summary?.creditsAvailable ?? 0;
  const availableCents = summary?.availableCents ?? 0;

  async function copyInviteLink() {
    if (!inviteLink) return;

    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (guestMode) return null;

  return (
    <section className={`${theme.card} rounded-3xl border p-4 md:p-5 shadow-[0_0_34px_rgba(234,179,8,0.08)]`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-yellow-400">
            Convide amigos
          </p>
          <h2 className="mt-1 text-xl font-black text-yellow-300 md:text-2xl">
            Ganhe créditos para o Premium
          </h2>
          <p className={`${theme.muted} mt-2 max-w-2xl text-sm leading-relaxed`}>
            A cada 5 amigos convidados, você ganha 1 crédito. Cada crédito vale R$ 0,50 de desconto no checkout.
          </p>
        </div>

        <div className="grid min-w-0 gap-2 sm:grid-cols-3 lg:min-w-[420px]">
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-3">
            <p className={`${theme.muted} text-xs font-black uppercase`}>
              Convites
            </p>
            <p className="mt-1 text-lg font-black text-yellow-300">
              {loading ? "..." : summary?.qualifiedReferrals ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className={`${theme.muted} text-xs font-black uppercase`}>
              Créditos
            </p>
            <p className="mt-1 text-lg font-black text-emerald-300">
              {loading ? "..." : creditsAvailable}
            </p>
          </div>
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-3">
            <p className={`${theme.muted} text-xs font-black uppercase`}>
              Saldo
            </p>
            <p className="mt-1 text-lg font-black text-cyan-300">
              {loading ? "..." : formatCurrencyCents(availableCents)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
        <div className={`${theme.input} min-w-0 rounded-2xl border px-4 py-3`}>
          <p className={`${theme.muted} text-xs font-black uppercase`}>
            Seu link
          </p>
          <p className={`${theme.text} mt-1 break-all text-sm font-bold`}>
            {error
              ? "Rode o SQL de convites para ativar este recurso."
              : loading
                ? "Carregando link..."
                : inviteLink || "Link indisponível"}
          </p>
        </div>

        <button
          type="button"
          onClick={copyInviteLink}
          disabled={!inviteLink || loading || Boolean(error)}
          className="rounded-2xl bg-gradient-to-r from-yellow-300 to-amber-600 px-5 py-3 text-sm font-black text-black transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {copied ? "Link copiado" : "Copiar link"}
        </button>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3 text-xs font-black uppercase">
          <span className={theme.muted}>Próximo crédito</span>
          <span className="text-yellow-300">{progress}/5 convites</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-zinc-900">
          <div
            className="h-full rounded-full bg-gradient-to-r from-yellow-300 to-amber-600 transition-all"
            style={{ width: `${Math.min((progress / 5) * 100, 100)}%` }}
          />
        </div>
      </div>
    </section>
  );
}
