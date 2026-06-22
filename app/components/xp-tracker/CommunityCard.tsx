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
  openChatUserId?: string | null;
  openChatSignal?: number;
  onChatOpened?: () => void;
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

interface CommunityMessageRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  sender_name: string;
  recipient_name: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

interface CommunityUnreadMessageRow {
  sender_id: string;
}

interface CommunityTypingStatusRow {
  user_id: string;
  recipient_id: string;
  display_name: string;
  is_typing: boolean;
  updated_at: string;
}

interface CommunityBlockRow {
  id: string;
  blocker_id: string;
  blocked_id: string;
  blocker_name: string;
  blocked_name: string;
  created_at: string;
}

type CommunityRunActivity = "qualquer" | "cripta_1" | "cripta_2" | "cripta_3" | "masmorra";

interface CommunityRunStatusRow {
  user_id: string;
  display_name: string;
  looking_for_run: boolean;
  activity_type: CommunityRunActivity;
  note: string;
  updated_at: string;
}

interface CommunityRunInviteRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  sender_name: string;
  recipient_name: string;
  activity_type: CommunityRunActivity;
  note: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  created_at: string;
  updated_at: string;
  responded_at: string | null;
}

type LoadStatus = "idle" | "loading" | "ready" | "error";
type CommunityView = "all" | "friends" | "seeking" | "recent";

const RUN_ACTIVITY_OPTIONS: Array<{ value: CommunityRunActivity; label: string }> = [
  { value: "qualquer", label: "Qualquer run" },
  { value: "cripta_1", label: "Cripta 1" },
  { value: "cripta_2", label: "Cripta 2" },
  { value: "cripta_3", label: "Cripta 3" },
  { value: "masmorra", label: "Masmorra" },
];

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function formatChatTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatChatDay(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getRunActivityLabel(activity: CommunityRunActivity) {
  return RUN_ACTIVITY_OPTIONS.find((option) => option.value === activity)?.label ?? "Run";
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
    text.includes("community_friend_requests") ||
    text.includes("community_messages") ||
    text.includes("community_blocks") ||
    text.includes("community_message_reports") ||
    text.includes("community_run_status") ||
    text.includes("community_run_invites") ||
    text.includes("community_typing_status") ||
    text.includes("community_social_logs")
  );
}

export function CommunityCard({
  user,
  userName,
  currentLevel,
  targetLevel,
  percentageDisplay,
  badges,
  openChatUserId,
  openChatSignal = 0,
  onChatOpened,
  onFriendshipChanged,
  theme,
}: CommunityCardProps) {
  const [profiles, setProfiles] = useState<CommunityProfileRow[]>([]);
  const [friendRequests, setFriendRequests] = useState<CommunityFriendRequestRow[]>([]);
  const [blocks, setBlocks] = useState<CommunityBlockRow[]>([]);
  const [runStatuses, setRunStatuses] = useState<CommunityRunStatusRow[]>([]);
  const [runInvites, setRunInvites] = useState<CommunityRunInviteRow[]>([]);
  const [unreadMessageCounts, setUnreadMessageCounts] = useState<Record<string, number>>({});
  const [typingStatus, setTypingStatus] = useState<CommunityTypingStatusRow | null>(null);
  const [shareProfile, setShareProfile] = useState(false);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [communityView, setCommunityView] = useState<CommunityView>("all");
  const [feedback, setFeedback] = useState("");
  const [runStatusActivity, setRunStatusActivity] = useState<CommunityRunActivity>("qualquer");
  const [runStatusNote, setRunStatusNote] = useState("");
  const [runInviteProfile, setRunInviteProfile] = useState<CommunityProfileRow | null>(null);
  const [runInviteActivity, setRunInviteActivity] = useState<CommunityRunActivity>("qualquer");
  const [runInviteNote, setRunInviteNote] = useState("");
  const [activeChatProfile, setActiveChatProfile] = useState<CommunityProfileRow | null>(null);
  const [chatMessages, setChatMessages] = useState<CommunityMessageRow[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatFeedback, setChatFeedback] = useState("");
  const syncTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

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
  const ownRunStatus = runStatuses.find((item) => item.user_id === user?.id);
  const incomingRunInvites = runInvites.filter(
    (invite) => invite.recipient_id === user?.id && invite.status === "pending"
  );
  const socialHistory = runInvites
    .filter((invite) => invite.status === "accepted" || invite.status === "declined")
    .slice(0, 6);
  const displayedProfiles = visibleProfiles.filter((profile) => {
    if (communityView === "all") return true;
    if (communityView === "seeking") {
      return profile.user_id !== user?.id && Boolean(getRunStatusForProfile(profile.user_id));
    }
    if (communityView === "recent") {
      const timestamp = new Date(profile.updated_at).getTime();
      return Number.isFinite(timestamp) && Date.now() - timestamp <= 1000 * 60 * 60 * 24 * 7;
    }

    return acceptedFriendIds.has(profile.user_id);
  });

  async function logSocialAction(
    actionType: string,
    targetId: string | null,
    targetName: string,
    metadata: Record<string, string | number | boolean | null> = {}
  ) {
    if (!user) return;

    const { error } = await supabase
      .from("community_social_logs")
      .insert({
        actor_id: user.id,
        target_id: targetId,
        actor_name: sanitizeCommunityName(userName),
        target_name: sanitizeCommunityName(targetName),
        action_type: actionType,
        metadata,
      });

    if (error && !isMissingCommunityTable(error)) {
      console.warn("Erro ao registrar log social:", error);
    }
  }

  function getRequestForProfile(profileId: string) {
    if (!user) return null;

    return friendRequests.find(
      (request) =>
        (request.requester_id === user.id && request.addressee_id === profileId) ||
        (request.requester_id === profileId && request.addressee_id === user.id)
    );
  }

  function getBlockForProfile(profileId: string) {
    if (!user) return null;

    return blocks.find(
      (block) =>
        (block.blocker_id === user.id && block.blocked_id === profileId) ||
        (block.blocker_id === profileId && block.blocked_id === user.id)
    );
  }

  function getRunStatusForProfile(profileId: string) {
    return runStatuses.find(
      (runStatus) => runStatus.user_id === profileId && runStatus.looking_for_run
    );
  }

  function getPendingRunInviteForProfile(profileId: string) {
    if (!user) return null;

    return runInvites.find(
      (invite) =>
        invite.status === "pending" &&
        (
          (invite.sender_id === user.id && invite.recipient_id === profileId) ||
          (invite.sender_id === profileId && invite.recipient_id === user.id)
        )
    );
  }

  async function loadRunStatuses() {
    if (!user) {
      setRunStatuses([]);
      return;
    }

    const { data, error } = await supabase
      .from("community_run_status")
      .select("user_id, display_name, looking_for_run, activity_type, note, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      if (!isMissingCommunityTable(error)) {
        console.warn("Erro ao carregar status de runs:", error);
      }

      setRunStatuses([]);
      return;
    }

    const rows = ((data as CommunityRunStatusRow[]) ?? []);
    setRunStatuses(rows);

    const ownStatus = rows.find((item) => item.user_id === user.id);
    if (ownStatus) {
      setRunStatusActivity(ownStatus.activity_type);
      setRunStatusNote(ownStatus.note ?? "");
    }
  }

  async function loadRunInvites() {
    if (!user) {
      setRunInvites([]);
      return;
    }

    const { data, error } = await supabase
      .from("community_run_invites")
      .select(
        "id, sender_id, recipient_id, sender_name, recipient_name, activity_type, note, status, created_at, updated_at, responded_at"
      )
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order("updated_at", { ascending: false })
      .limit(30);

    if (error) {
      if (!isMissingCommunityTable(error)) {
        console.warn("Erro ao carregar convites de run:", error);
      }

      setRunInvites([]);
      return;
    }

    setRunInvites((data as CommunityRunInviteRow[]) ?? []);
  }

  async function loadUnreadMessageCounts() {
    if (!user) {
      setUnreadMessageCounts({});
      return;
    }

    const { data, error } = await supabase
      .from("community_messages")
      .select("sender_id")
      .eq("recipient_id", user.id)
      .is("read_at", null);

    if (error) {
      if (!isMissingCommunityTable(error)) {
        console.warn("Erro ao carregar mensagens nao lidas:", error);
      }

      setUnreadMessageCounts({});
      return;
    }

    const counts = ((data as CommunityUnreadMessageRow[]) ?? []).reduce<Record<string, number>>(
      (acc, row) => {
        acc[row.sender_id] = (acc[row.sender_id] ?? 0) + 1;
        return acc;
      },
      {}
    );

    setUnreadMessageCounts(counts);
  }

  async function loadTypingStatus(profile: CommunityProfileRow) {
    if (!user) return;

    const { data, error } = await supabase
      .from("community_typing_status")
      .select("user_id, recipient_id, display_name, is_typing, updated_at")
      .eq("user_id", profile.user_id)
      .eq("recipient_id", user.id)
      .maybeSingle();

    if (error) {
      if (!isMissingCommunityTable(error)) {
        console.warn("Erro ao carregar digitando:", error);
      }

      setTypingStatus(null);
      return;
    }

    const row = data as CommunityTypingStatusRow | null;
    const isFresh = row
      ? Date.now() - new Date(row.updated_at).getTime() <= 5000
      : false;

    setTypingStatus(row?.is_typing && isFresh ? row : null);
  }

  async function updateTypingStatus(profile: CommunityProfileRow, isTyping: boolean) {
    if (!user) return;

    const { error } = await supabase
      .from("community_typing_status")
      .upsert(
        {
          user_id: user.id,
          recipient_id: profile.user_id,
          display_name: sanitizeCommunityName(userName),
          is_typing: isTyping,
        },
        { onConflict: "user_id,recipient_id" }
      );

    if (error && !isMissingCommunityTable(error)) {
      console.warn("Erro ao atualizar digitando:", error);
    }
  }

  async function loadBlocks() {
    if (!user) {
      setBlocks([]);
      return;
    }

    const { data, error } = await supabase
      .from("community_blocks")
      .select("id, blocker_id, blocked_id, blocker_name, blocked_name, created_at")
      .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      if (!isMissingCommunityTable(error)) {
        console.warn("Erro ao carregar bloqueios da comunidade:", error);
      }

      setBlocks([]);
      return;
    }

    setBlocks((data as CommunityBlockRow[]) ?? []);
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
      setBlocks([]);
      setRunStatuses([]);
      setRunInvites([]);
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
      setRunStatuses([]);
      setRunInvites([]);
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
    await loadBlocks();
    await loadRunStatuses();
    await loadRunInvites();
    await loadUnreadMessageCounts();
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
    setRunStatuses([]);
    setRunInvites([]);
    setStatus("ready");
  }

  async function saveRunStatus(nextLookingForRun: boolean) {
    if (!user) return;

    setFeedback("");

    const { error } = await supabase
      .from("community_run_status")
      .upsert(
        {
          user_id: user.id,
          display_name: sanitizeCommunityName(userName),
          looking_for_run: nextLookingForRun,
          activity_type: runStatusActivity,
          note: runStatusNote.trim().slice(0, 120),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      if (isMissingCommunityTable(error)) {
        setFeedback("Procura de run precisa do SQL 016 no Supabase.");
      } else {
        setFeedback("Nao foi possivel atualizar seu status de run agora.");
      }

      console.warn("Erro ao salvar status de run:", error);
      return;
    }

    setFeedback(
      nextLookingForRun
        ? `Voce esta procurando grupo para ${getRunActivityLabel(runStatusActivity)}.`
        : "Voce saiu da procura de grupo."
    );
    await logSocialAction(
      nextLookingForRun ? "run_status_enabled" : "run_status_disabled",
      null,
      "Comunidade",
      { activity_type: runStatusActivity }
    );
    await loadRunStatuses();
    onFriendshipChanged?.();
  }

  function openRunInvite(profile: CommunityProfileRow) {
    setRunInviteProfile(profile);
    setRunInviteActivity(getRunStatusForProfile(profile.user_id)?.activity_type ?? "qualquer");
    setRunInviteNote("");
  }

  function closeRunInvite() {
    setRunInviteProfile(null);
    setRunInviteActivity("qualquer");
    setRunInviteNote("");
  }

  async function sendRunInvite() {
    if (!user || !runInviteProfile) return;

    setFeedback("");

    const { error } = await supabase
      .from("community_run_invites")
      .insert({
        sender_id: user.id,
        recipient_id: runInviteProfile.user_id,
        sender_name: sanitizeCommunityName(userName),
        recipient_name: sanitizeCommunityName(runInviteProfile.display_name),
        activity_type: runInviteActivity,
        note: runInviteNote.trim().slice(0, 160),
        status: "pending",
      });

    if (error) {
      if (isMissingCommunityTable(error)) {
        setFeedback("Convites de run precisam do SQL 016 no Supabase.");
      } else {
        setFeedback("Nao foi possivel enviar o convite agora.");
      }

      console.warn("Erro ao enviar convite de run:", error);
      return;
    }

    setFeedback(`Convite enviado para ${runInviteProfile.display_name}.`);
    await logSocialAction("run_invite_sent", runInviteProfile.user_id, runInviteProfile.display_name, {
      activity_type: runInviteActivity,
    });
    closeRunInvite();
    await loadRunInvites();
    onFriendshipChanged?.();
  }

  async function respondToRunInvite(
    invite: CommunityRunInviteRow,
    nextStatus: "accepted" | "declined"
  ) {
    if (!user || invite.recipient_id !== user.id) return;

    const { error } = await supabase
      .from("community_run_invites")
      .update({
        status: nextStatus,
        responded_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    if (error) {
      console.warn("Erro ao responder convite de run:", error);
      setFeedback("Nao foi possivel responder esse convite agora.");
      return;
    }

    setFeedback(
      nextStatus === "accepted"
        ? `Voce aceitou a run de ${invite.sender_name}.`
        : `Voce recusou a run de ${invite.sender_name}.`
    );
    await logSocialAction(
      nextStatus === "accepted" ? "run_invite_accepted" : "run_invite_declined",
      invite.sender_id,
      invite.sender_name,
      { activity_type: invite.activity_type }
    );
    await loadRunInvites();
    onFriendshipChanged?.();
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
    await logSocialAction("friend_request_sent", profile.user_id, profile.display_name);
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
    await logSocialAction("friend_removed", null, profileName);
    await loadFriendRequests();
    onFriendshipChanged?.();
  }

  async function blockProfile(profile: CommunityProfileRow) {
    if (!user || profile.user_id === user.id) return;

    const confirmed = window.confirm(`Bloquear ${profile.display_name}? Essa pessoa não poderá trocar mensagens com você.`);

    if (!confirmed) return;

    const { error } = await supabase
      .from("community_blocks")
      .upsert({
        blocker_id: user.id,
        blocked_id: profile.user_id,
        blocker_name: sanitizeCommunityName(userName),
        blocked_name: sanitizeCommunityName(profile.display_name),
      }, { onConflict: "blocker_id,blocked_id" });

    if (error) {
      if (isMissingCommunityTable(error)) {
        setFeedback("Bloqueios precisam do SQL 015 no Supabase.");
      } else {
        setFeedback("Não foi possível bloquear agora.");
      }

      console.warn("Erro ao bloquear jogador:", error);
      return;
    }

    setFeedback(`${profile.display_name} foi bloqueado.`);
    await logSocialAction("user_blocked", profile.user_id, profile.display_name);
    if (activeChatProfile?.user_id === profile.user_id) {
      closeChat();
    }
    await loadBlocks();
    onFriendshipChanged?.();
  }

  async function unblockProfile(block: CommunityBlockRow, profileName: string) {
    if (!user || block.blocker_id !== user.id) return;

    const { error } = await supabase
      .from("community_blocks")
      .delete()
      .eq("id", block.id);

    if (error) {
      console.warn("Erro ao desbloquear jogador:", error);
      setFeedback("Não foi possível desbloquear agora.");
      return;
    }

    setFeedback(`${profileName} foi desbloqueado.`);
    await logSocialAction("user_unblocked", block.blocked_id, profileName);
    await loadBlocks();
    onFriendshipChanged?.();
  }

  async function loadChatMessages(
    profile: CommunityProfileRow,
    options: { silent?: boolean } = {}
  ) {
    if (!user) return;

    if (!options.silent) {
      setChatLoading(true);
    }
    setChatFeedback("");

    const { data, error } = await supabase
      .from("community_messages")
      .select("id, sender_id, recipient_id, sender_name, recipient_name, body, read_at, created_at")
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${profile.user_id}),and(sender_id.eq.${profile.user_id},recipient_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true })
      .limit(80);

    if (error) {
      if (isMissingCommunityTable(error)) {
        setChatFeedback("O chat precisa do SQL 014 no Supabase.");
      } else {
        setChatFeedback("Não foi possível carregar a conversa agora.");
      }

      console.warn("Erro ao carregar conversa:", error);
      if (!options.silent) {
        setChatMessages([]);
        setChatLoading(false);
      }
      return;
    }

    setChatMessages((data as CommunityMessageRow[]) ?? []);
    if (!options.silent) {
      setChatLoading(false);
    }

    await supabase
      .from("community_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("sender_id", profile.user_id)
      .eq("recipient_id", user.id)
      .is("read_at", null);

    await loadUnreadMessageCounts();
    await loadTypingStatus(profile);
    onFriendshipChanged?.();
  }

  async function reportMessage(message: CommunityMessageRow) {
    if (!user || message.sender_id === user.id) return;

    const confirmed = window.confirm("Denunciar esta mensagem para revisão do admin?");

    if (!confirmed) return;

    const { error } = await supabase
      .from("community_message_reports")
      .insert({
        message_id: message.id,
        reporter_id: user.id,
        reported_user_id: message.sender_id,
        reporter_name: sanitizeCommunityName(userName),
        reported_name: sanitizeCommunityName(message.sender_name),
        message_body: message.body,
        reason: "Mensagem denunciada pelo usuário.",
      });

    if (error) {
      if (isMissingCommunityTable(error)) {
        setChatFeedback("Denúncias precisam do SQL 015 no Supabase.");
      } else if (error.code === "23505") {
        setChatFeedback("Você já denunciou esta mensagem.");
      } else {
        setChatFeedback("Não foi possível denunciar agora.");
      }

      console.warn("Erro ao denunciar mensagem:", error);
      return;
    }

    setChatFeedback("Mensagem denunciada para revisão.");
    await logSocialAction("message_reported", message.sender_id, message.sender_name);
  }

  function openChat(profile: CommunityProfileRow) {
    setActiveChatProfile(profile);
    setChatDraft("");
    loadChatMessages(profile);
    loadTypingStatus(profile);
    onChatOpened?.();
  }

  function closeChat() {
    if (activeChatProfile) {
      updateTypingStatus(activeChatProfile, false);
    }
    setActiveChatProfile(null);
    setChatMessages([]);
    setChatDraft("");
    setChatFeedback("");
    setTypingStatus(null);
  }

  async function sendChatMessage() {
    if (!user || !activeChatProfile) return;

    const body = chatDraft.trim();

    if (!body) return;

    if (body.length > 500) {
      setChatFeedback("Mensagem muito longa. Use até 500 caracteres.");
      return;
    }

    setChatFeedback("");

    const { error } = await supabase
      .from("community_messages")
      .insert({
        sender_id: user.id,
        recipient_id: activeChatProfile.user_id,
        sender_name: sanitizeCommunityName(userName),
        recipient_name: sanitizeCommunityName(activeChatProfile.display_name),
        body,
      });

    if (error) {
      if (isMissingCommunityTable(error)) {
        setChatFeedback("O chat precisa do SQL 014 no Supabase.");
      } else {
        setChatFeedback("Não foi possível enviar a mensagem agora.");
      }

      console.warn("Erro ao enviar mensagem:", error);
      return;
    }

    setChatDraft("");
    await updateTypingStatus(activeChatProfile, false);
    await logSocialAction("message_sent", activeChatProfile.user_id, activeChatProfile.display_name);
    await loadChatMessages(activeChatProfile);
    onFriendshipChanged?.();
  }

  useEffect(() => {
    loadCommunity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!openChatUserId || openChatSignal === 0) return;

    const profile = profiles.find((item) => item.user_id === openChatUserId);
    const request = getRequestForProfile(openChatUserId);

    if (!profile || request?.status !== "accepted") return;

    setCommunityView("friends");
    openChat(profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openChatSignal, openChatUserId, profiles, friendRequests]);

  useEffect(() => {
    if (!activeChatProfile || !user) return;

    const interval = window.setInterval(() => {
      loadChatMessages(activeChatProfile, { silent: true });
    }, 2500);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatProfile?.user_id, user?.id]);

  useEffect(() => {
    if (!activeChatProfile || !user) return;

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    const isTyping = chatDraft.trim().length > 0;
    updateTypingStatus(activeChatProfile, isTyping);

    if (isTyping) {
      typingTimeout.current = setTimeout(() => {
        updateTypingStatus(activeChatProfile, false);
      }, 3500);
    }

    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatProfile?.user_id, chatDraft, user?.id]);

  useEffect(() => {
    if (!activeChatProfile) return;

    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeChatProfile, chatMessages.length]);

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

          <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/5 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-black text-cyan-200">
                  Procurando grupo
                </p>
                <p className={`${theme.muted} mt-1 text-xs leading-relaxed`}>
                  Avise seus amigos que voce esta disponivel para uma run. Sem quantidade de jogadores.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  value={runStatusActivity}
                  onChange={(event) => setRunStatusActivity(event.target.value as CommunityRunActivity)}
                  className="rounded-xl border border-cyan-500/20 bg-black px-3 py-2 text-xs font-black text-cyan-100 outline-none"
                >
                  {RUN_ACTIVITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={runStatusNote}
                  onChange={(event) => setRunStatusNote(event.target.value.slice(0, 120))}
                  placeholder="Ex.: bora depois das 20h"
                  className="rounded-xl border border-cyan-500/20 bg-black px-3 py-2 text-xs font-bold text-white outline-none placeholder:text-zinc-600"
                />

                <button
                  type="button"
                  onClick={() => saveRunStatus(!ownRunStatus?.looking_for_run)}
                  className={`rounded-xl px-4 py-2 text-xs font-black transition-all hover:scale-[1.02] ${
                    ownRunStatus?.looking_for_run
                      ? "border border-red-500/25 bg-red-500/10 text-red-200"
                      : "bg-gradient-to-r from-cyan-300 to-emerald-500 text-zinc-950"
                  }`}
                >
                  {ownRunStatus?.looking_for_run ? "Parar procura" : "Ficar procurando"}
                </button>
              </div>
            </div>

            {ownRunStatus?.looking_for_run && (
              <p className="mt-3 inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-200">
                Status ativo: {getRunActivityLabel(ownRunStatus.activity_type)}
              </p>
            )}
          </div>

          {incomingRunInvites.length > 0 && (
            <div className="rounded-2xl border border-yellow-500/15 bg-yellow-500/5 p-4">
              <p className="text-sm font-black text-yellow-200">
                Convites de run
              </p>
              <div className="mt-3 space-y-2">
                {incomingRunInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-col gap-3 rounded-2xl border border-yellow-500/15 bg-black/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-black text-white">
                        {invite.sender_name} chamou voce para {getRunActivityLabel(invite.activity_type)}
                      </p>
                      {invite.note && (
                        <p className={`${theme.muted} mt-1 text-xs`}>
                          {invite.note}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => respondToRunInvite(invite, "accepted")}
                        className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-white transition-all hover:scale-[1.02]"
                      >
                        Aceitar
                      </button>
                      <button
                        type="button"
                        onClick={() => respondToRunInvite(invite, "declined")}
                        className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-black text-red-200 transition-all hover:bg-red-500/15"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {([
                ["all", `Todos (${Math.max(visibleProfiles.length - 1, 0)})`],
                ["friends", `Amigos (${acceptedFriendIds.size})`],
                ["seeking", `Procurando (${runStatuses.filter((item) => item.looking_for_run && item.user_id !== user.id).length})`],
                ["recent", "Recentes"],
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
              Amigos ficam prontos para chat, convites de run e status social.
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
                const block = getBlockForProfile(profile.user_id);
                const pendingRunInvite = getPendingRunInviteForProfile(profile.user_id);
                const isSelf = profile.user_id === user.id;
                const isIncomingPending =
                  request?.status === "pending" && request.addressee_id === user.id;
                const isOutgoingPending =
                  request?.status === "pending" && request.requester_id === user.id;
                const isFriend = request?.status === "accepted";
                const wasDeclined = request?.status === "declined";
                const isBlockedByMe = block?.blocker_id === user.id;
                const hasBlockedMe = block?.blocked_id === user.id;
                const runStatus = getRunStatusForProfile(profile.user_id);

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

                      {runStatus && !isSelf && (
                        <div className="mt-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2">
                          <p className="text-xs font-black text-cyan-200">
                            Procurando: {getRunActivityLabel(runStatus.activity_type)}
                          </p>
                          {runStatus.note && (
                            <p className={`${theme.muted} mt-1 text-xs`}>
                              {runStatus.note}
                            </p>
                          )}
                        </div>
                      )}

                      {!isSelf && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {isFriend && (
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase text-emerald-200">
                              Amigo conectado
                            </span>
                          )}
                          {(unreadMessageCounts[profile.user_id] ?? 0) > 0 && (
                            <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 text-[10px] font-black uppercase text-yellow-200">
                              {unreadMessageCounts[profile.user_id]} nao lida
                            </span>
                          )}
                          {pendingRunInvite && (
                            <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-[10px] font-black uppercase text-cyan-200">
                              {pendingRunInvite.sender_id === user.id ? "Convite enviado" : "Convite recebido"}
                            </span>
                          )}
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
                            {!block && (
                              <button
                                type="button"
                                onClick={() => openChat(profile)}
                                className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-200 transition-all hover:bg-cyan-500/15"
                              >
                                Conversar
                              </button>
                            )}
                            {!block && !pendingRunInvite && (
                              <button
                                type="button"
                                onClick={() => openRunInvite(profile)}
                                className="rounded-full border border-yellow-500/25 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-200 transition-all hover:bg-yellow-500/15"
                              >
                                Convidar run
                              </button>
                            )}
                            {!block && pendingRunInvite && (
                              <span className="inline-flex rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-200">
                                {pendingRunInvite.sender_id === user.id ? "Run convidada" : "Run pendente"}
                              </span>
                            )}
                            {isBlockedByMe && block ? (
                              <button
                                type="button"
                                onClick={() => unblockProfile(block, profile.display_name)}
                                className="rounded-full border border-yellow-500/25 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-200 transition-all hover:bg-yellow-500/15"
                              >
                                Desbloquear
                              </button>
                            ) : hasBlockedMe ? (
                              <span className="inline-flex rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-black text-red-200">
                                Bloqueado
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => blockProfile(profile)}
                                className="rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1 text-xs font-black text-red-200 transition-all hover:bg-red-500/15"
                              >
                                Bloquear
                              </button>
                            )}
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

          <div className="rounded-2xl border border-emerald-500/15 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-emerald-200">
                  Historico social
                </p>
                <p className={`${theme.muted} mt-1 text-xs`}>
                  Runs combinadas e respostas recentes entre amigos.
                </p>
              </div>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-200">
                {socialHistory.length}
              </span>
            </div>

            {socialHistory.length === 0 ? (
              <p className={`${theme.muted} mt-3 text-xs`}>
                Nenhuma run social registrada ainda.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {socialHistory.map((invite) => {
                  const isSender = invite.sender_id === user.id;
                  const otherName = isSender ? invite.recipient_name : invite.sender_name;
                  const statusLabel = invite.status === "accepted" ? "Aceito" : "Recusado";

                  return (
                    <div
                      key={invite.id}
                      className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 px-3 py-2"
                    >
                      <p className="text-xs font-black text-white">
                        {isSender ? "Voce convidou" : "Voce recebeu convite de"} {otherName}
                      </p>
                      <p className={`${theme.muted} mt-1 text-xs`}>
                        {getRunActivityLabel(invite.activity_type)} - {statusLabel}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {feedback && (
        <p className="mt-4 rounded-2xl border border-yellow-500/15 bg-yellow-500/10 px-4 py-3 text-sm font-bold text-yellow-100">
          {feedback}
        </p>
      )}

      {runInviteProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Convidar ${runInviteProfile.display_name} para run`}
        >
          <div className="w-full max-w-md rounded-3xl border border-yellow-500/25 bg-zinc-950 p-5 shadow-2xl shadow-yellow-950/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-yellow-300">
                  Convite de run
                </p>
                <h3 className="mt-1 text-xl font-black text-white">
                  {runInviteProfile.display_name}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeRunInvite}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-red-500/25 bg-red-500/10 text-lg font-black text-red-200 transition-all hover:bg-red-500/15"
                aria-label="Fechar convite"
              >
                x
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs font-black uppercase text-zinc-500">
                  Tipo de run
                </span>
                <select
                  value={runInviteActivity}
                  onChange={(event) => setRunInviteActivity(event.target.value as CommunityRunActivity)}
                  className="mt-1 w-full rounded-2xl border border-yellow-500/20 bg-black px-4 py-3 text-sm font-black text-yellow-100 outline-none"
                >
                  {RUN_ACTIVITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase text-zinc-500">
                  Observacao
                </span>
                <textarea
                  value={runInviteNote}
                  onChange={(event) => setRunInviteNote(event.target.value.slice(0, 160))}
                  placeholder="Ex.: vou fazer agora, bora?"
                  rows={3}
                  className="mt-1 w-full resize-none rounded-2xl border border-yellow-500/20 bg-black px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-zinc-600"
                />
              </label>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={closeRunInvite}
                className="flex-1 rounded-2xl border border-zinc-700 bg-black px-4 py-3 text-sm font-black text-zinc-300 transition-all hover:bg-zinc-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={sendRunInvite}
                className="flex-1 rounded-2xl bg-gradient-to-r from-yellow-300 to-amber-600 px-4 py-3 text-sm font-black text-black transition-all hover:scale-[1.02]"
              >
                Enviar convite
              </button>
            </div>
          </div>
        </div>
      )}

      {activeChatProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Conversa com ${activeChatProfile.display_name}`}
        >
          <div className="flex h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-cyan-500/25 bg-zinc-950 shadow-2xl shadow-cyan-950/30 sm:max-h-[82vh] sm:rounded-3xl">
            <div className="grid grid-cols-[1fr_auto] gap-2 border-b border-cyan-500/10 p-3 sm:flex sm:items-start sm:justify-between sm:gap-3 sm:p-4">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-cyan-300">
                  Chat entre amigos
                </p>
                <h3 className="mt-1 truncate text-lg font-black text-white sm:text-xl">
                  {activeChatProfile.display_name}
                </h3>
                {getBlockForProfile(activeChatProfile.user_id) && (
                  <p className="mt-1 text-xs font-bold text-red-300">
                    Conversa bloqueada. Desbloqueie para voltar a enviar mensagens.
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-start justify-end gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => loadChatMessages(activeChatProfile)}
                  className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-2 text-[10px] font-black text-cyan-200 transition-all hover:bg-cyan-500/15 sm:px-3 sm:text-xs"
                >
                  Atualizar
                </button>

                <button
                  type="button"
                  onClick={() => blockProfile(activeChatProfile)}
                  className="rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-2 text-[10px] font-black text-red-200 transition-all hover:bg-red-500/15 sm:px-3 sm:text-xs"
                >
                  Bloquear
                </button>

                <button
                  type="button"
                  onClick={closeChat}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-red-500/25 bg-red-500/10 text-base font-black text-red-200 transition-all hover:bg-red-500/15 sm:h-10 sm:w-10 sm:text-lg"
                  aria-label="Fechar conversa"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 sm:space-y-3 sm:p-4">
              {chatLoading ? (
                <p className="rounded-2xl border border-cyan-500/15 bg-cyan-500/10 p-3 text-xs font-bold text-cyan-100 sm:p-4 sm:text-sm">
                  Carregando conversa...
                </p>
              ) : chatMessages.length === 0 ? (
                <p className="rounded-2xl border border-cyan-500/15 bg-cyan-500/10 p-3 text-xs font-bold text-cyan-100 sm:p-4 sm:text-sm">
                  Nenhuma mensagem ainda. Comece a conversa com calma.
                </p>
              ) : (
                chatMessages.map((message, index) => {
                  const isMine = message.sender_id === user?.id;
                  const dayLabel = formatChatDay(message.created_at);
                  const previousDayLabel =
                    index > 0 ? formatChatDay(chatMessages[index - 1].created_at) : "";
                  const showDay = dayLabel !== previousDayLabel;

                  return (
                    <div key={message.id}>
                      {showDay && (
                        <div className="my-3 flex justify-center">
                          <span className="rounded-full border border-zinc-700 bg-black/40 px-3 py-1 text-[10px] font-black uppercase text-zinc-500">
                            {dayLabel}
                          </span>
                        </div>
                      )}

                      <div
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[88%] rounded-2xl border px-3 py-2.5 sm:max-w-[82%] sm:px-4 sm:py-3 ${
                            isMine
                              ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-50"
                              : "border-cyan-500/20 bg-cyan-500/10 text-cyan-50"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                            {message.body}
                          </p>
                          <p className="mt-2 text-[10px] font-bold uppercase text-zinc-500">
                            {formatChatTime(message.created_at)}
                            {isMine && (
                              <span className={message.read_at ? "text-emerald-300" : "text-zinc-500"}>
                                {" "}• {message.read_at ? "Lida" : "Enviada"}
                              </span>
                            )}
                          </p>
                          {!isMine && (
                            <button
                              type="button"
                              onClick={() => reportMessage(message)}
                              className="mt-2 text-[10px] font-black uppercase text-red-300/80 transition-all hover:text-red-200"
                            >
                              Denunciar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t border-cyan-500/10 p-3 sm:p-4">
              {typingStatus && (
                <p className="mb-2 text-xs font-black text-cyan-300">
                  {typingStatus.display_name} esta digitando...
                </p>
              )}

              {chatFeedback && (
                <p className="mb-2 rounded-2xl border border-yellow-500/15 bg-yellow-500/10 px-3 py-2 text-xs font-bold text-yellow-100 sm:mb-3 sm:px-4 sm:py-3 sm:text-sm">
                  {chatFeedback}
                </p>
              )}

              <div className="flex flex-row gap-2">
                <textarea
                  value={chatDraft}
                  onChange={(event) => setChatDraft(event.target.value.slice(0, 500))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendChatMessage();
                    }
                  }}
                  placeholder="Escreva uma mensagem..."
                  rows={1}
                  className="min-h-[44px] flex-1 resize-none rounded-2xl border border-cyan-500/20 bg-black px-3 py-2.5 text-sm font-bold text-white outline-none transition-all placeholder:text-zinc-600 focus:border-cyan-300 sm:min-h-[56px] sm:px-4 sm:py-3"
                />
                <button
                  type="button"
                  onClick={sendChatMessage}
                  disabled={!chatDraft.trim() || Boolean(getBlockForProfile(activeChatProfile.user_id))}
                  className="rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-500 px-4 py-2.5 text-xs font-black text-zinc-950 transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:px-5 sm:py-3 sm:text-sm"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
