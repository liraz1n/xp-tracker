interface SiteFooterProps {
  darkMode?: boolean;
}

const BUILD_LABEL = "1.4.6";
const BUILD_DATE = "27/05/2026";
const HOSTING_LABEL = "Cloudflare Pages";
const SITE_URL = "xp-tracker.pages.dev";
const BRAND_NAME = "Lira Labs";
const PRODUCT_NAME = "XP Tracker";

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
            {PRODUCT_NAME} registrado em produção por {BRAND_NAME} para acompanhamento de progresso e runs.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <span className="rounded-full border border-yellow-500/20 px-3 py-1">
            Produto: {PRODUCT_NAME}
          </span>
          <span className="rounded-full border border-yellow-500/20 px-3 py-1">
            Build: {BUILD_LABEL}
          </span>
          <span className="rounded-full border border-yellow-500/20 px-3 py-1">
            Data: {BUILD_DATE}
          </span>
          <span className="rounded-full border border-yellow-500/20 px-3 py-1">
            Ambiente: Produção
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
        <p>
          Dados protegidos por login Google, Supabase e Row Level Security.
        </p>
        <p>
          © {currentYear} {BRAND_NAME}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
