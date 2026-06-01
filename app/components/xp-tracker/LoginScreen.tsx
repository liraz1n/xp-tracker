import { SiteFooter } from "~/components/xp-tracker/SiteFooter";
import {
  ChartIcon,
  CheckCircleIcon,
  ClockIcon,
  FlagIcon,
  ScrollIcon,
} from "~/components/xp-tracker/UiIcons";

interface LoginScreenProps {
  onLogin: () => void;
  onGuestLogin: () => void;
}

export function LoginScreen({ onLogin, onGuestLogin }: LoginScreenProps) {
  const trackedFeatures = [
    { label: "Marcos de progresso", icon: FlagIcon },
    { label: "Gráfico de evolução", icon: ChartIcon },
    { label: "Histórico de XP", icon: ScrollIcon },
    { label: "Estimativa de conclusão", icon: ClockIcon },
  ];

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6 md:p-8">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-yellow-400 font-bold mb-3">
              Bem-vindo ao seu painel de evolução
            </p>

            <h1 className="text-6xl font-black bg-gradient-to-r from-yellow-300 via-yellow-500 to-amber-700 bg-clip-text text-transparent mb-6">
              XP TRACKER
            </h1>

            <p className="text-zinc-400 text-lg mb-8">
              Acompanhe suas metas, histórico, progresso, marcos e estimativas em uma dashboard premium.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onGuestLogin}
                className="bg-gradient-to-r from-yellow-300 to-amber-600 text-black px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                Entrar como visitante
              </button>

              <button
                type="button"
                onClick={onLogin}
                className="bg-white text-black px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <span className="text-lg font-black text-blue-600">G</span>
                Entrar com Google
              </button>
            </div>

            <div className="text-zinc-500 text-sm mt-4 space-y-1">
              <p>
                Entrando como visitante, você pode testar tudo sem salvar na nuvem.
              </p>
              <p>
                Se gostar, clique em salvar com Google dentro do painel; o progresso feito como visitante será levado para sua conta.
              </p>
              <p className="text-yellow-300">
                Com Google, o salvamento na nuvem fica liberado durante o teste grátis de 7 dias. Depois disso, é preciso assinar para continuar sincronizando.
              </p>
            </div>
          </div>

          <div className="bg-zinc-950 border border-yellow-500/20 rounded-3xl p-8 shadow-[0_0_60px_rgba(234,179,8,0.18)]">
            <h2 className="text-2xl font-black text-yellow-300 mb-6">
              O que você acompanha
            </h2>

            <div className="space-y-4 text-zinc-300">
              {trackedFeatures.map(({ label, icon: Icon }) => (
                <p key={label} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-yellow-500/20 bg-yellow-400/10 text-yellow-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>{label}</span>
                </p>
              ))}
              <p className="flex items-center gap-3 text-emerald-300">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-400/10">
                  <CheckCircleIcon className="h-4 w-4" />
                </span>
                <span>Salvamento em nuvem no teste grátis</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
