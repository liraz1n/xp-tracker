interface SiteFooterProps {
  darkMode?: boolean;
}

const BUILD_LABEL = "1.1.14";
const BUILD_DATE = "01/06/2026";
const HOSTING_LABEL = "Cloudflare Pages";
const SITE_URL = "xp-tracker.pages.dev";
const BRAND_NAME = "Lira Labs";

export function SiteFooter({ darkMode = true }: SiteFooterProps) {
  const currentYear = 2026;

  return (
    <footer
      className={`mt-8 border-t px-4 py-6 text-xs ${
        darkMode
          ? "border-yellow-500/10 text-zinc-500"
          : "border-yellow-500/20 text-zinc-500"
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-black uppercase tracking-[0.2em] text-yellow-400">
            {BRAND_NAME}
          </p>
          <p className="mt-1">
            XP Tracker registrado em produção por {BRAND_NAME} para acompanhamento de progresso e runs.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <span className="rounded-full border border-yellow-500/20 px-3 py-1">
            Build: {BUILD_LABEL}
          </span>
          <span className="rounded-full border border-yellow-500/20 px-3 py-1">
            Hospedagem: {HOSTING_LABEL}
          </span>
          <span className="rounded-full border border-yellow-500/20 px-3 py-1">
            Site: {SITE_URL}
          </span>
        </div>
      </div>

      <div className="mx-auto mt-4 flex max-w-6xl flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>Dados protegidos por Google, Supabase e Row Level Security.</span>
          <a className="font-bold text-yellow-300 hover:text-yellow-200" href="/privacidade">
            Privacidade
          </a>
          <a className="font-bold text-yellow-300 hover:text-yellow-200" href="/termos">
            Termos
          </a>
        </div>
        <p className="flex flex-wrap items-center gap-2">
          <span>© {currentYear}</span>
          <span>{BUILD_DATE}</span>
          <span>{BRAND_NAME}. Todos os direitos reservados.</span>
        </p>
      </div>
    </footer>
  );
}
