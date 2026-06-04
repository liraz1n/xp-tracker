import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "~/supabase";

interface SuggestionBoxProps {
  user: User | null;
  userName: string;
  theme: {
    card: string;
    input: string;
    muted: string;
    text: string;
  };
}

type SubmitStatus = "idle" | "sending" | "success" | "error";

export function SuggestionBox({ user, userName, theme }: SuggestionBoxProps) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [feedback, setFeedback] = useState("");
  const remainingChars = 1000 - message.length;
  const canSubmit =
    Boolean(user) &&
    message.trim().length >= 3 &&
    message.length <= 1000 &&
    status !== "sending";

  async function submitSuggestion() {
    const trimmedMessage = message.trim();

    if (!user) {
      setStatus("error");
      setFeedback("Entre com Google para enviar sua sugestão.");
      return;
    }

    if (trimmedMessage.length < 3) {
      setStatus("error");
      setFeedback("Escreva uma sugestão um pouco mais detalhada.");
      return;
    }

    setStatus("sending");
    setFeedback("");

    const { error } = await supabase.from("suggestions").insert({
      user_id: user.id,
      user_email: user.email ?? null,
      user_name: userName,
      message: trimmedMessage,
    });

    if (error) {
      setStatus("error");
      setFeedback("Não foi possível enviar agora. Tente novamente em instantes.");
      console.warn("Erro ao enviar sugestão:", error);
      return;
    }

    setStatus("success");
    setFeedback("Sugestão enviada. Valeu por ajudar a melhorar o XP Tracker.");
    setMessage("");
  }

  return (
    <section className={`${theme.card} mt-6 rounded-3xl border p-5 md:p-6`}>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.4fr] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase text-yellow-400">
            Caixa de sugestão
          </p>
          <h2 className="mt-1 text-2xl font-black text-yellow-300">
            Ajude a evoluir o XP Tracker
          </h2>
          <p className={`${theme.muted} mt-2 text-sm leading-relaxed`}>
            Envie ideias de melhoria, problemas que encontrou ou recursos que
            fariam sentido para seu farm.
          </p>
          {!user && (
            <p className="mt-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-xs font-bold text-yellow-100">
              Entre com Google para enviar uma sugestão identificada.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <textarea
            value={message}
            onChange={(event) => {
              setMessage(event.target.value.slice(0, 1000));
              if (status !== "sending") {
                setStatus("idle");
                setFeedback("");
              }
            }}
            disabled={!user || status === "sending"}
            placeholder="Escreva sua sugestão aqui..."
            className={`${theme.input} min-h-32 w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none transition-all focus:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-50`}
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={`${remainingChars < 80 ? "text-yellow-300" : theme.muted} text-xs`}>
              {remainingChars.toLocaleString("pt-BR")} caracteres restantes
            </p>

            <button
              type="button"
              onClick={submitSuggestion}
              disabled={!canSubmit}
              className="rounded-2xl bg-gradient-to-r from-yellow-300 to-amber-600 px-5 py-3 text-sm font-black text-black transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >
              {status === "sending" ? "Enviando..." : "Enviar sugestão"}
            </button>
          </div>

          {feedback && (
            <p
              className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                status === "success"
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                  : "border-red-500/25 bg-red-500/10 text-red-300"
              }`}
            >
              {feedback}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
