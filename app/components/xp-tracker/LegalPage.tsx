import { SiteFooter } from "~/components/xp-tracker/SiteFooter";

interface LegalSection {
  title: string;
  paragraphs?: string[];
  items?: string[];
}

interface LegalPageProps {
  eyebrow: string;
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
}

export function LegalPage({
  eyebrow,
  title,
  updatedAt,
  intro,
  sections,
}: LegalPageProps) {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-12">
        <a
          href="/"
          className="inline-flex rounded-full border border-yellow-500/25 px-4 py-2 text-sm font-black text-yellow-300 transition hover:border-yellow-300 hover:text-yellow-200"
        >
          Voltar ao XP Tracker
        </a>

        <section className="mt-8 rounded-3xl border border-yellow-500/20 bg-zinc-950/80 p-6 shadow-[0_0_60px_rgba(234,179,8,0.12)] md:p-9">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-yellow-400">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-4xl font-black text-yellow-300 md:text-5xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            Atualizado em {updatedAt}
          </p>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-zinc-300">
            {intro}
          </p>
        </section>

        <div className="mt-6 space-y-4">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-3xl border border-yellow-500/15 bg-zinc-950/70 p-5 md:p-7"
            >
              <h2 className="text-xl font-black text-yellow-300">
                {section.title}
              </h2>

              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-3 leading-relaxed text-zinc-300"
                >
                  {paragraph}
                </p>
              ))}

              {section.items && (
                <ul className="mt-4 space-y-2 text-zinc-300">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-300" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
