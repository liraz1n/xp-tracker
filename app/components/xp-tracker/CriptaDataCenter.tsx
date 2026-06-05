interface CriptaDataCenterProps {
  theme: {
    card: string;
    muted: string;
    text: string;
  };
}

const CRIPTA_DATA = [
  { cripta: "Cripta 1", players: 3, level: 22, xp: 23780 },
  { cripta: "Cripta 1", players: 3, level: 24, xp: 28232 },
  { cripta: "Cripta 1", players: 3, level: 25, xp: 30694 },
  { cripta: "Cripta 1", players: 4, level: 25, xp: 36116 },
  { cripta: "Cripta 1", players: 4, level: 26, xp: 39216 },
  { cripta: "Cripta 1", players: 4, level: 27, xp: 42533 },
  { cripta: "Cripta 1", players: 4, level: 28, xp: 46082 },
  { cripta: "Cripta 1", players: 4, level: 29, xp: 49859 },
  { cripta: "Cripta 1", players: 4, level: 30, xp: 53942 },
  { cripta: "Cripta 1", players: 4, level: 31, xp: 58290 },
  { cripta: "Cripta 1", players: 4, level: 32, xp: 62942 },
  { cripta: "Cripta 1", players: 4, level: 33, xp: 67990 },
  { cripta: "Cripta 1", players: 5, level: 27, xp: 42533 },
  { cripta: "Cripta 1", players: 5, level: 28, xp: 46082 },
  { cripta: "Cripta 1", players: 5, level: 29, xp: 49879 },
  { cripta: "Cripta 1", players: 5, level: 30, xp: 53942 },
  { cripta: "Cripta 1", players: 5, level: 31, xp: 58290 },
  { cripta: "Cripta 2", players: 4, level: 10, xp: 19164 },
  { cripta: "Cripta 2", players: 4, level: 11, xp: 22106 },
  { cripta: "Cripta 2", players: 4, level: 12, xp: 25253 },
  { cripta: "Cripta 2", players: 4, level: 13, xp: 28621 },
  { cripta: "Cripta 2", players: 4, level: 14, xp: 32225 },
  { cripta: "Cripta 2", players: 4, level: 15, xp: 36081 },
  { cripta: "Cripta 2", players: 4, level: 16, xp: 40207 },
  { cripta: "Cripta 2", players: 4, level: 17, xp: 44621 },
  { cripta: "Cripta 2", players: 5, level: 15, xp: 28138 },
  { cripta: "Cripta 2", players: 5, level: 16, xp: 31227 },
  { cripta: "Cripta 3", players: 4, level: 10, xp: 35371 },
  { cripta: "Cripta 3", players: 4, level: 11, xp: 40407 },
  { cripta: "Cripta 3", players: 4, level: 12, xp: 45796 },
  { cripta: "Cripta 3", players: 4, level: 13, xp: 51561 },
  { cripta: "Cripta 3", players: 4, level: 14, xp: 57730 },
  { cripta: "Cripta 3", players: 4, level: 15, xp: 64331 },
];

function formatXP(value: number) {
  return value.toLocaleString("pt-BR");
}

export function CriptaDataCenter({ theme }: CriptaDataCenterProps) {
  return (
    <section className={`${theme.card} border rounded-3xl p-4 md:p-5 mb-4 md:mb-5`}>
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-cyan-300 text-xs md:text-sm font-black mb-1">
            Central de dados
          </p>
          <h2 className="text-xl md:text-2xl font-black text-cyan-300">
            XP das criptas
          </h2>
          <p className={`${theme.muted} mt-1.5 text-xs md:text-sm`}>
            Consulta administrativa dos valores cadastrados por cripta, jogadores e nível.
          </p>
        </div>
        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-300">
          {CRIPTA_DATA.length} registros
        </span>
      </div>

      <div className="max-h-80 overflow-y-auto rounded-2xl border border-cyan-500/15 bg-black/20">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="sticky top-0 bg-zinc-950/95 text-xs uppercase text-cyan-300">
            <tr>
              <th className="px-4 py-3">Cripta</th>
              <th className="px-4 py-3">Jogadores</th>
              <th className="px-4 py-3">Nível</th>
              <th className="px-4 py-3">XP</th>
            </tr>
          </thead>
          <tbody>
            {CRIPTA_DATA.map((row) => (
              <tr
                key={`${row.cripta}-${row.players}-${row.level}`}
                className="border-t border-cyan-500/10"
              >
                <td className={`${theme.text} px-4 py-3 font-bold`}>{row.cripta}</td>
                <td className={`${theme.muted} px-4 py-3`}>{row.players}</td>
                <td className={`${theme.muted} px-4 py-3`}>{row.level}</td>
                <td className="px-4 py-3 font-black text-cyan-300">{formatXP(row.xp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
