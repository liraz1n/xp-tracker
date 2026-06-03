import { useMemo } from "react";

const ACHIEVEMENT_VARIANTS_STORAGE_KEY = "xpTrackerAchievementVariants";

const ACHIEVEMENTS = [
  {
    milestone: 25,
    tier: "I",
    message: "Primeiro quarto concluido!",
    accent: "from-amber-300 to-yellow-600",
    variants: [
      { title: "Primeiro Impulso", description: "Você saiu da largada e já construiu ritmo." },
      { title: "Chama Inicial", description: "A primeira marca acendeu o caminho da meta." },
      { title: "Passo Firme", description: "O progresso começou a ganhar corpo de verdade." },
      { title: "Início de Jornada", description: "A rota foi aberta e o avanço já apareceu." },
      { title: "Ritmo Nascente", description: "A consistência começou a vencer a distância." },
      { title: "Marca do Começo", description: "A primeira etapa ficou para trás." },
      { title: "Sinal de Força", description: "O caminho ainda é longo, mas você já entrou no jogo." },
      { title: "Primeira Faixa", description: "A meta ganhou seu primeiro marco importante." },
      { title: "Arranque Limpo", description: "O avanço inicial foi concluído com firmeza." },
      { title: "Base Construída", description: "A fundação da meta está pronta para crescer." },
      { title: "Pulso de XP", description: "O progresso já mostrou que está vivo." },
      { title: "Estopim da Meta", description: "A jornada ganhou tração no primeiro trecho." },
    ],
  },
  {
    milestone: 50,
    tier: "II",
    message: "Metade do caminho!",
    accent: "from-cyan-300 to-blue-600",
    variants: [
      { title: "Meio Caminho", description: "A meta já deixou de ser promessa e virou consistência." },
      { title: "Trilha Dominada", description: "Metade da estrada ficou sob controle." },
      { title: "Fôlego de Campeão", description: "Você cruzou o centro da meta com ritmo forte." },
      { title: "Marco Central", description: "O progresso chegou ao ponto que separa tentativa de compromisso." },
      { title: "Ponto de Virada", description: "Daqui para frente, a conquista fica cada vez mais concreta." },
      { title: "Metade Conquistada", description: "O objetivo já tem peso real no histórico." },
      { title: "Ritmo Estável", description: "A caminhada deixou de oscilar e ganhou direção." },
      { title: "Núcleo da Meta", description: "O centro da jornada foi alcançado com consistência." },
      { title: "Avanço Sólido", description: "A metade concluída prova que o plano está funcionando." },
      { title: "Linha do Meio", description: "Você chegou ao ponto onde a meta olha de volta." },
      { title: "XP em Marcha", description: "O progresso se manteve firme ate a metade." },
      { title: "Controle da Rota", description: "A jornada ja esta bem encaminhada." },
    ],
  },
  {
    milestone: 75,
    tier: "III",
    message: "Reta final!",
    accent: "from-fuchsia-300 to-violet-700",
    variants: [
      { title: "Reta Final", description: "Falta pouco. Agora é acabamento e foco." },
      { title: "Pressão Boa", description: "A meta entrou na fase em que cada run pesa mais." },
      { title: "Quase Lá", description: "O destino já está perto o bastante para ser sentido." },
      { title: "Zona de Decisão", description: "O último quarto começou e a conquista está no alcance." },
      { title: "Marcha Alta", description: "O progresso acelerou para fechar o ciclo." },
      { title: "Foco de Fechamento", description: "Agora e manter a rota e transformar avanco em vitoria." },
      { title: "Último Trecho", description: "A maior parte ficou para trás; resta concluir com precisão." },
      { title: "Impulso Final", description: "O caminho já está desenhado para terminar bem." },
      { title: "Vantagem Criada", description: "Você abriu espaço suficiente para buscar o fechamento." },
      { title: "Meta no Radar", description: "A chegada está visível e o ritmo está pronto." },
      { title: "Força de Chegada", description: "O progresso entrou no trecho que separa esforço de conquista." },
      { title: "Sprint de XP", description: "A etapa final ganhou velocidade." },
    ],
  },
  {
    milestone: 100,
    tier: "IV",
    message: "Meta atingida!",
    accent: "from-emerald-300 to-green-700",
    variants: [
      { title: "Meta Dominada", description: "Objetivo fechado. Progresso transformado em conquista." },
      { title: "Nível Fechado", description: "A meta foi concluída com sucesso." },
      { title: "Conquista Suprema", description: "O ciclo foi encerrado com progresso completo." },
      { title: "XP Consagrado", description: "Cada avanco virou resultado no fim da jornada." },
      { title: "Missão Cumprida", description: "O objetivo saiu do plano e entrou no histórico." },
      { title: "Topo da Meta", description: "Você chegou ao ponto mais alto deste ciclo." },
      { title: "Fechamento Perfeito", description: "A barra completou e a conquista ficou registrada." },
      { title: "Vitória de Progresso", description: "A meta foi vencida com constância e foco." },
      { title: "Coroa do XP", description: "A jornada terminou com status de conquista total." },
      { title: "Destino Alcançado", description: "O caminho foi completado até o último ponto." },
      { title: "Marco Final", description: "O progresso fechou a conta e confirmou a evolução." },
      { title: "Lenda da Meta", description: "O ciclo foi dominado do início ao fim." },
    ],
  },
];

function readAchievementVariantIndexes() {
  if (typeof window === "undefined") return {};

  const storedValue = window.localStorage.getItem(ACHIEVEMENT_VARIANTS_STORAGE_KEY);

  if (storedValue) {
    try {
      return JSON.parse(storedValue) as Record<string, number>;
    } catch {
      window.localStorage.removeItem(ACHIEVEMENT_VARIANTS_STORAGE_KEY);
    }
  }

  const indexes = ACHIEVEMENTS.reduce<Record<string, number>>((result, achievement) => {
    result[String(achievement.milestone)] = Math.floor(
      Math.random() * achievement.variants.length
    );
    return result;
  }, {});

  window.localStorage.setItem(
    ACHIEVEMENT_VARIANTS_STORAGE_KEY,
    JSON.stringify(indexes)
  );

  return indexes;
}

interface ProgressCardProps {
  completedXP: number;
  percentageValue: number;
  percentageDisplay: string;
  activeMilestone: number | null;
  barPulsing: boolean;
  theme: {
    card: string;
    muted: string;
    text: string;
  };
}

export function ProgressCard({
  completedXP,
  percentageValue,
  percentageDisplay,
  activeMilestone,
  barPulsing,
  theme,
}: ProgressCardProps) {
  const achievements = useMemo(() => {
    const indexes = readAchievementVariantIndexes();

    return ACHIEVEMENTS.map((achievement) => {
      const variantIndex =
        indexes[String(achievement.milestone)] % achievement.variants.length;
      const variant = achievement.variants[variantIndex] ?? achievement.variants[0];

      return {
        ...achievement,
        title: variant.title,
        description: variant.description,
      };
    });
  }, []);

  const activeAchievement = achievements.find(
    (achievement) => achievement.milestone === activeMilestone
  );

  return (
    <div className={`${theme.card} border rounded-3xl p-4 md:p-5 shadow-[0_0_34px_rgba(234,179,8,0.1)] mb-4 md:mb-5`}>
      <div className="flex flex-col gap-2 md:gap-3 md:flex-row md:justify-between md:items-start mb-4">
        <div>
          <span className={`${theme.muted} text-xs md:text-sm`}>Progresso da Meta</span>
          <h2 className="text-lg md:text-xl font-black text-yellow-300 mt-0.5">
            Jornada de Conquistas
          </h2>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 md:gap-3">
          {activeAchievement && (
            <div className="relative overflow-hidden border border-yellow-400/40 bg-yellow-500/10 rounded-2xl px-4 py-3 shadow-[0_0_35px_rgba(234,179,8,0.22)] animate-pulse">
              <div className="absolute inset-y-0 -left-12 w-12 rotate-12 bg-white/20 blur-md" />
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${activeAchievement.accent} text-black flex items-center justify-center font-black shadow-[0_0_22px_rgba(234,179,8,0.35)]`}>
                  {activeAchievement.tier}
                </div>
                <div>
                  <p className="text-yellow-200 text-xs font-bold uppercase tracking-wide">
                    Nova conquista desbloqueada
                  </p>
                  <p className="text-yellow-50 font-black">
                    {activeAchievement.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          <span className="font-black text-yellow-300 text-lg md:text-xl">
            {percentageDisplay}%
          </span>
        </div>
      </div>

      <div className="relative w-full bg-black rounded-full h-5 md:h-7 overflow-hidden border border-yellow-500/20">
        <div
          className={`bg-gradient-to-r from-yellow-300 via-yellow-500 to-amber-700 h-full rounded-full transition-all duration-700 shadow-[0_0_20px_rgba(234,179,8,0.5)] ${barPulsing ? "animate-pulse" : ""}`}
          style={{ width: `${percentageValue}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 md:gap-3 mt-4">
        {achievements.map((achievement) => {
          const unlocked = percentageValue >= achievement.milestone;

          return (
            <div
              key={achievement.milestone}
              className={`relative overflow-hidden border rounded-2xl p-3 transition-all duration-300 ${
                unlocked
                  ? "border-yellow-400/40 bg-yellow-500/10 shadow-[0_0_30px_rgba(234,179,8,0.16)]"
                  : "border-zinc-700/40 bg-black/25 opacity-70"
              }`}
            >
              {unlocked && (
                <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br ${achievement.accent} opacity-20 blur-2xl`} />
              )}

              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className={`text-[11px] md:text-xs font-black uppercase tracking-wide ${unlocked ? "text-yellow-300" : theme.muted}`}>
                    {achievement.milestone}% concluído
                  </p>
                  <h3 className={`text-sm md:text-base font-black mt-1 ${unlocked ? theme.text : theme.muted}`}>
                    {achievement.title}
                  </h3>
                </div>

                <div className={`shrink-0 w-9 h-9 rounded-full border flex items-center justify-center font-black text-sm ${
                  unlocked
                    ? `bg-gradient-to-br ${achievement.accent} border-white/20 text-black shadow-[0_0_22px_rgba(234,179,8,0.25)]`
                    : "bg-zinc-900 border-zinc-700 text-zinc-600"
                }`}>
                  {achievement.tier}
                </div>
              </div>

              <p className={`${unlocked ? "text-zinc-300" : theme.muted} relative text-xs md:text-sm mt-2 leading-relaxed`}>
                {unlocked ? achievement.description : "Bloqueada até este marco ser alcançado."}
              </p>

              <div className="relative mt-3 h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${achievement.accent} transition-all duration-700`}
                  style={{
                    width: `${Math.min(100, (percentageValue / achievement.milestone) * 100)}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className={`mt-4 ${theme.muted} text-sm md:text-base`}>
        XP Completo:{" "}
        <span className={`${theme.text} font-bold`}>
          {completedXP.toLocaleString("pt-BR")}
        </span>
      </div>
    </div>
  );
}
