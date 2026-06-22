import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "~/supabase";
import type { ProfileBadge } from "~/components/xp-tracker/ProfileBadgesCard";

interface CommunityCardProps {
  user: User | null;
  userName: string;
  currentLevel: number;
  targetLevel: number;
  percentageDisplay: string;
  badges: ProfileBadge[];
  onFriendshipChanged?: () => void;
  theme: {
    card: string;
    muted: string;
    text: string;
  };
}

interface CommunityProfileRow {
  user_id: string;
  display_name: string;
  current_level: number;
  target_level: number;
  progress_percent: number;
  badges: string[] | null;
  share_profile: boolean;
  accepted_at: string | null;
  updated_at: string;
}

interface CommunityFriendRequestRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  requester_name: string;
  addressee_name: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  created_at: string;
  updated_at: string;
  responded_at: string | null;
}

type LoadStatus = "idle" | "loading" | "ready" | "error";
type CommunityView = "all" | "friends";

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function sanitizeCommunityName(name: string) {
  const fallback = "Jogador XP";
  const sanitized = name.trim().replace(/\s+/g, " ").slice(0, 40);

  return sanitized.length >= 2 ? sanitized : fallback;
}

function isMissingCommunityTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;

  const text = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    text.includes("community_profiles") ||
    text.includes("community_friend_requests")
  );
}

export function CommunityCard({
  user,
  userName,
  currentLevel,
  targetLevel,
  percentageDisplay,
  badges,
  onFriendshipChanged,
  theme,
}: CommunityCardProps) {
  const [profiles, setProfiles] = useState<CommunityProfileRow[]>([]);
  const [friendRequests, setFriendRequests] = useState<CommunityFriendRequestRow[]>([]);
  const [shareProfile, setShareProfile] = useState(false);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [communityView, setCommunityView] = useState<CommunityView>("all");
  const [feedback, setFeedback] = useState("");
  const syncTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const badgeLabels = useMemo(
    () => badges.map((badge) => badge.label),
    [badges]
  );
  const currentUserProfile = profiles.find(
    (profile) => profile.user_id === user?.id
  );
  const visibleProfiles = profiles
    .filter((profile) => profile.share_profile)
    .sort((a, b) => {
      if (b.current_level !== a.current_level) {
        return b.current_level - a.current_level;
      }

      return b.progress_percent - a.progress_percent;
    });
  const acceptedFriendIds = useMemo(() => {
    if (!user) return new Set<string>();

    return new Set(
      friendRequests
        .filter((request) => request.status === "accepted")
        .map((request) =>
          request.requester_id === user.id ? request.addressee_id : request.requester_id
        )
    );
  }, [friendRequests, user]);
  const displayedProfiles = visibleProfiles.filter((profile) => {
    if (communityView === "all") return true;

    return acceptedFriendIds.has(profile.user_id);
  });

  function getRequestForProfile(profileId: string) {
    if (!user) return null;

    return friendRequests.find(
      (request) =>
        (request.requester_id === user.id && request.addressee_id === profileId) ||
        (request.requester_id === profileId && request.addressee_id === user.id)
    );
  }

  async function loadFriendRequests() {
    if (!user) {
      setFriendRequests([]);
      return;
    }

    const { data, error } = await supabase
      .from("community_friend_requests")
      .select(
        "id, requester_id, addressee_id, requester_name, addressee_name, status, created_at, updated_at, responded_at"
      )
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (error) {
      if (isMissingCommunityTable(error)) {
        setFeedback("Pedidos de amizade precisam do SQL 012 no Supabase.");
      } else {
        console.warn("Erro ao carregar pedidos de amizade:", error);
      }

      setFriendRequests([]);
      return;
    }

    setFriendRequests((data as CommunityFriendRequestRow[]) ?? []);
  }

  async function loadCommunity() {
    if (!user) {
      setProfiles([]);
      setShareProfile(false);
      setStatus("idle");
      return;
    }

    setStatus("loading");
    setFeedback("");

    const { data: ownProfile, error: ownError } = await supabase
      .from("community_profiles")
      .select(
        "user_id, display_name, current_level, target_level, progress_percent, badges, share_profile, accepted_at, updated_at"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (ownError) {
      if (isMissingCommunityTable(ownError)) {
        setStatus("error");
        setFeedback("A Comunidade ainda precisa do SQL 011 no Supabase.");
        return;
      }

      console.warn("Erro ao carregar perfil da comunidade:", ownError);
      setStatus("error");
      setFeedback("Não foi possível carregar a Comunidade agora.");
      return;
    }

    const ownShareEnabled = Boolean(ownProfile?.share_profile);

    setShareProfile(ownShareEnabled);

    if (!ownShareEnabled) {
      setProfiles(ownProfile ? [ownProfile as CommunityProfileRow] : []);
      setFriendRequests([]);
      setStatus("ready");
      return;
    }

    const { data, error } = await supabase
      .from("community_profiles")
      .select(
        "user_id, display_name, current_level, target_level, progress_percent, badges, share_profile, accepted_at, updated_at"
      )
      .eq("share_profile", true)
      .order("current_level", { ascending: false })
      .order("progress_percent", { ascending: false })
      .limit(50);

    if (error) {
      console.warn("Erro ao carregar jogadores da comunidade:", error);
      setStatus("error");
      setFeedback("Não foi possível carregar os jogadores agora.");
      return;
    }

    setProfiles((data as CommunityProfileRow[]) ?? []);
    await loadFriendRequests();
    setStatus("ready");
  }

  async function upsertCommunityProfile(nextShareProfile = true) {
    if (!user) return false;

    const payload = {
      user_id: user.id,
      display_name: sanitizeCommunityName(userName),
      current_level: currentLevel,
      target_level: targetLevel,
      progress_percent: Number(percentageDisplay) || 0,
      badges: badgeLabels,
      share_profile: nextShareProfile,
      accepted_at: nextShareProfile
        ? currentUserProfile?.accepted_at ?? new Date().toISOString()
        : currentUserProfile?.accepted_at ?? null,
    };

    const { error } = await supabase
      .from("community_profiles")
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      if (isMissingCommunityTable(error)) {
        setFeedback("A Comunidade ainda precisa do SQL 011 no Supabase.");
      } else {
        setFeedback("Não foi possível salvar sua escolha agora.");
      }

      console.warn("Erro ao salvar perfil da comunidade:", error);
      setStatus("error");
      return false;
    }

    return true;
  }

  async function joinCommunity() {
    if (!user) {
      setFeedback("Entre com Google para participar da Comunidade.");
      return;
    }

    setStatus("loading");
    setFeedback("");

    const saved = await upsertCommunityProfile(true);

    if (!saved) return;

    setShareProfile(true);
    setFeedback("Comunidade ativada. Seu nível agora fica visível para outros participantes.");
    await loadCommunity();
  }

  async function leaveCommunity() {
    if (!user) return;

    setStatus("loading");
    setFeedback("");

    const saved = await upsertCommunityProfile(false);

    if (!saved) return;

    setShareProfile(false);
    setProfiles((current) =>
      current.map((profile) =>
        profile.user_id === user.id
          ? { ...profile, share_profile: false }
          : profile
      )
    );
    setFeedback("Seu nível ficou privado. Para ver outros jogadores, ative novamente.");
    setFriendRequests([]);
    setStatus("ready");
  }

  async function sendFriendRequest(profile: CommunityProfileRow) {
    if (!user || profile.user_id === user.id) return;

    setFeedback("");

    const existingRequest = getRequestForProfile(profile.user_id);
    const payload = {
      requester_id: user.id,
      addressee_id: profile.user_id,
      requester_name: sanitizeCommunityName(userName),
      addressee_name: sanitizeCommunityName(profile.display_name),
      status: "pending" as const,
      responded_at: null,
    };

    if (existingRequest) {
      const { error } = await supabase
        .from("community_friend_requests")
        .update(payload)
        .eq("id", existingRequest.id);

      if (error) {
        console.warn("Erro ao reenviar pedido de amizade:", error);
        setFeedback("Não foi possível enviar o pedido agora.");
        return;
      }
    } else {
      const { error } = await supabase
        .from("community_friend_requests")
        .insert(payload);

      if (error) {
        if (isMissingCommunityTable(error)) {
          setFeedback("Pedidos de amizade precisam do SQL 012 no Supabase.");
        } else {
          setFeedback("Não foi possível enviar o pedido agora.");
        }

        console.warn("Erro ao enviar pedido de amizade:", error);
        return;
      }
    }

    setFeedback(`Pedido enviado para ${profile.display_name}.`);
    await loadFriendRequests();
    onFriendshipChanged?.();
  }

  async function respondToFriendRequest(
    request: CommunityFriendRequestRow,
    nextStatus: "accepted" | "declined"
  ) {
    if (!user || request.addressee_id !== user.id) return;

    const { error } = await supabase
      .from("community_friend_requests")
      .update({
        status: nextStatus,
        responded_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    if (error) {
      console.warn("Erro ao responder pedido de amizade:", error);
      setFeedback("Não foi possível responder o pedido agora.");
      return;
    }

    setFeedback(
      nextStatus === "accepted"
        ? `${request.requester_name} agora é seu amigo.`
        : `Pedido de ${request.requester_name} recusado.`
    );
    await loadFriendRequests();
    onFriendshipChanged?.();
  }

  async function removeFriend(request: CommunityFriendRequestRow, profileName: string) {
    if (!user || request.status !== "accepted") return;

    const confirmed = window.confirm(`Remover ${profileName} da sua lista de amigos?`);

    if (!confirmed) return;

    const { error } = await supabase
      .from("community_friend_requests")
      .delete()
      .eq("id", request.id);

    if (error) {
      console.warn("Erro ao remover amigo:", error);
      setFeedback("Não foi possível remover esse amigo agora.");
      return;
    }

    setFeedback(`${profileName} foi removido da sua lista de amigos.`);
    await loadFriendRequests();
    onFriendshipChanged?.();
  }

  useEffect(() => {
    loadCommunity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user || !shareProfile || status === "loading") return;

    if (syncTimeout.current) {
      clearTimeout(syncTimeout.current);
    }

    syncTimeout.current = setTimeout(() => {
      upsertCommunityProfile(true).then((saved) => {
        if (saved) {
          loadCommunity();
        }
      });
    }, 900);

    return () => {
      if (syncTimeout.current) {
        clearTimeout(syncTimeout.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    badgeLabels.join("|"),
    currentLevel,
    percentageDisplay,
    shareProfile,
    targetLevel,
    user?.id,
    userName,
  ]);

  return (
    <section className={`${theme.card} rounded-3xl border p-5 md:p-6`}>
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-emerald-300">
            Comunidade
          </p>
          <h2 className="mt-1 text-2xl font-black text-yellow-300">
            Jogadores do XP Tracker
          </h2>
          <p className={`${theme.muted} mt-2 max-w-2xl text-sm leading-relaxed`}>
            Veja o nível de outros jogadores que também aceitaram compartilhar o
            próprio nível. Se você deixar seu nível privado, a lista também fica
            bloqueada para você.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm">
          <p className="font-black text-emerald-200">
            {shareProfile ? "Participando" : "Nível privado"}
          </p>
          <p className="mt-1 text-xs text-emerald-100/70">
            {shareProfile
              ? "Visibilidade recíproca ativa."
              : "Aceite para ver e aparecer."}
          </p>
        </div>
      </div>

      {!user ? (
        <div className="rounded-2xl border border-yellow-500/15 bg-yellow-500/10 p-4 text-sm font-bold text-yellow-100">
          Entre com Google para participar da Comunidade.
        </div>
      ) : !shareProfile ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="rounded-2xl border border-yellow-500/15 bg-black/20 p-4">
            <p className="text-sm font-black text-yellow-200">
              Termo rapido de visibilidade
            </p>
            <p className={`${theme.muted} mt-2 text-sm leading-relaxed`}>
              Ao ativar a Comunidade, seu nome ou nick, nível atual, progresso
              para o próximo nível e selos ficam visíveis para outros jogadores
              que também ativaram a Comunidade. Você pode desativar quando quiser.
            </p>
          </div>

          <button
            type="button"
            onClick={joinCommunity}
            disabled={status === "loading"}
            className="rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-700 px-5 py-4 text-sm font-black text-white shadow-lg transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {status === "loading" ? "Ativando..." : "Aceitar e participar"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-emerald-500/15 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-emerald-200">
                Seu perfil está visível
              </p>
              <p className={`${theme.muted} mt-1 text-xs`}>
                {sanitizeCommunityName(userName)} - nível {currentLevel} para {targetLevel}
              </p>
            </div>

            <button
              type="button"
              onClick={leaveCommunity}
              disabled={status === "loading"}
              className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-black text-red-200 transition-all hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ocultar meu nível
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {([
                ["all", `Todos (${Math.max(visibleProfiles.length - 1, 0)})`],
                ["friends", `Amigos (${acceptedFriendIds.size})`],
              ] as const).map(([view, label]) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setCommunityView(view)}
                  className={`rounded-full border px-4 py-2 text-xs font-black transition-all ${
                    communityView === view
                      ? "border-yellow-400 bg-yellow-400/15 text-yellow-200"
                      : "border-emerald-500/15 bg-black/20 text-zinc-400 hover:text-emerald-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <p className={`${theme.muted} text-xs`}>
              Amigos já ficam preparados para o chat da Comunidade.
            </p>
          </div>

          {displayedProfiles.length === 0 ? (
            <div className="rounded-2xl border border-yellow-500/15 bg-yellow-500/10 p-4 text-sm font-bold text-yellow-100">
              {communityView === "friends"
                ? "Você ainda não tem amigos adicionados. Envie um pedido pela aba Todos."
                : "Ainda não há outros jogadores visíveis. Quando alguém aceitar, aparece aqui."}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {displayedProfiles.map((profile) => {
                const request = getRequestForProfile(profile.user_id);
                const isSelf = profile.user_id === user.id;
                const isIncomingPending =
                  request?.status === "pending" && request.addressee_id === user.id;
                const isOutgoingPending =
                  request?.status === "pending" && request.requester_id === user.id;
                const isFriend = request?.status === "accepted";
                const wasDeclined = request?.status === "declined";

                return (
                  <article
                    key={profile.user_id}
                    className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4"
                  >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className={`${theme.text} truncate text-base font-black`}>
                            {profile.display_name}
                          </h3>
                          <p className={`${theme.muted} mt-1 text-xs`}>
                          Nível {profile.current_level} para {profile.target_level}
                          </p>
                        </div>

                        <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-300">
                          {formatPercent(Number(profile.progress_percent) || 0)}
                        </span>
                      </div>

                      {profile.badges && profile.badges.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {profile.badges.map((badge) => (
                            <span
                              key={badge}
                              className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase text-emerald-200"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-4">
                        {isSelf ? (
                          <span className="inline-flex rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-300">
                            Você
                          </span>
                        ) : isFriend ? (
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-200">
                              Amigo
                            </span>
                            {request && (
                              <button
                                type="button"
                                onClick={() => removeFriend(request, profile.display_name)}
                                className="rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-black text-red-200 transition-all hover:bg-red-500/15"
                              >
                                Remover
                              </button>
                            )}
                          </div>
                        ) : isIncomingPending && request ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => respondToFriendRequest(request, "accepted")}
                              className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-white transition-all hover:scale-[1.02]"
                            >
                              Aceitar
                            </button>
                            <button
                              type="button"
                              onClick={() => respondToFriendRequest(request, "declined")}
                              className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-black text-red-200 transition-all hover:bg-red-500/15"
                            >
                              Recusar
                            </button>
                          </div>
                        ) : isOutgoingPending ? (
                          <span className="inline-flex rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-200">
                            Pedido enviado
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => sendFriendRequest(profile)}
                            className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-200 transition-all hover:bg-emerald-500/15"
                          >
                            {wasDeclined ? "Enviar novamente" : "Adicionar amigo"}
                          </button>
                        )}
                      </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {feedback && (
        <p className="mt-4 rounded-2xl border border-yellow-500/15 bg-yellow-500/10 px-4 py-3 text-sm font-bold text-yellow-100">
          {feedback}
        </p>
      )}
    </section>
  );
}
