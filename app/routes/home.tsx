"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "~/supabase";
import { LoginScreen } from "~/components/xp-tracker/LoginScreen";
import { DashboardHeader } from "~/components/xp-tracker/DashboardHeader";
import { DeathAction } from "~/components/xp-tracker/DeathAction";
import { DoubleXpAction } from "~/components/xp-tracker/DoubleXpAction";
import { StatsCards } from "~/components/xp-tracker/StatsCards";
import { ProgressCard } from "~/components/xp-tracker/ProgressCard";
import { EstimateCards } from "~/components/xp-tracker/EstimateCards";
import { HistorySidebar } from "~/components/xp-tracker/HistorySidebar";
import { ResetModal } from "~/components/xp-tracker/ResetModal";
import { SettingsPanel } from "~/components/xp-tracker/SettingsPanel";
import { EditHistoryEntryModal } from "~/components/xp-tracker/EditHistoryEntryModal";
import { OnboardingCard } from "~/components/xp-tracker/OnboardingCard";
import { FarmRunsCard } from "~/components/xp-tracker/FarmRunsCard";
import { SmartHistoryCard } from "~/components/xp-tracker/SmartHistoryCard";
import {
  getUsageAchievements,
  UsageAchievementsCard,
} from "~/components/xp-tracker/UsageAchievementsCard";
import { GoalsRankingCard } from "~/components/xp-tracker/GoalsRankingCard";
import {
  buildNotifications,
  type AppNotification,
} from "~/components/xp-tracker/NotificationCenter";
import { SuggestionBox } from "~/components/xp-tracker/SuggestionBox";
import { AdminPanelCard, type AdminUserOverview } from "~/components/xp-tracker/AdminPanelCard";
import { FarmPlannerCard } from "~/components/xp-tracker/FarmPlannerCard";
import { PaymentReturnCard } from "~/components/xp-tracker/PaymentReturnCard";
import {
  getProfileBadges,
} from "~/components/xp-tracker/ProfileBadgesCard";
import { ReferralInviteAction } from "~/components/xp-tracker/ReferralInviteAction";
import { SiteFooter } from "~/components/xp-tracker/SiteFooter";
import { SubscriptionCard } from "~/components/xp-tracker/SubscriptionCard";
import { SubscriptionPanel } from "~/components/xp-tracker/SubscriptionPanel";
import { TeletofusLink } from "~/components/xp-tracker/TeletofusLink";
import { CommunityCard } from "~/components/xp-tracker/CommunityCard";
import { useXpTracker, type HistoryEntry } from "~/hooks/useXpTracker";
import { getLocalDateKey } from "~/utils/dateKeys";

type SidebarTab = "historico" | "grafico" | "resultado";
const UI_STATE_STORAGE_KEY = "xpTrackerUiState";

interface StoredUiState {
  showSettings?: boolean;
  showSubscriptionPanel?: boolean;
  sidebarOpen?: boolean;
  sidebarTab?: SidebarTab;
  scrollY?: number;
}

interface CommunityFriendRequestNotificationRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  requester_name: string;
  addressee_name: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  updated_at: string;
}

interface CommunityMessageNotificationRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  sender_name: string;
  body: string;
  created_at: string;
}

function readStoredUiState(): StoredUiState | null {
  if (typeof window === "undefined") return null;

  try {
    const rawState = window.localStorage.getItem(UI_STATE_STORAGE_KEY);
    if (!rawState) return null;

    const state = JSON.parse(rawState) as StoredUiState;
    return {
      showSettings: Boolean(state.showSettings),
      showSubscriptionPanel: Boolean(state.showSubscriptionPanel),
      sidebarOpen: Boolean(state.sidebarOpen),
      sidebarTab:
        state.sidebarTab === "grafico" || state.sidebarTab === "resultado"
          ? state.sidebarTab
          : "historico",
      scrollY: Number.isFinite(state.scrollY) ? Math.max(0, Number(state.scrollY)) : 0,
    };
  } catch {
    window.localStorage.removeItem(UI_STATE_STORAGE_KEY);
    return null;
  }
}

function writeStoredUiState(state: StoredUiState) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(UI_STATE_STORAGE_KEY, JSON.stringify(state));
}

interface MobileDashboardSectionProps {
  title: string;
  description: string;
  defaultOpen?: boolean;
  collapsibleOnDesktop?: boolean;
  openSignal?: number;
  theme: {
    card: string;
    muted: string;
    text: string;
  };
  children: ReactNode;
}

function MobileDashboardSection({
  title,
  description,
  defaultOpen = false,
  collapsibleOnDesktop = false,
  openSignal = 0,
  theme,
  children,
}: MobileDashboardSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const buttonVisibilityClass = collapsibleOnDesktop
    ? "w-full"
    : "md:hidden w-full";
  const contentVisibilityClass = collapsibleOnDesktop
    ? open
      ? "block"
      : "hidden"
    : `${open ? "block" : "hidden"} md:block`;

  useEffect(() => {
    if (openSignal > 0) {
      setOpen(true);
    }
  }, [openSignal]);

  return (
    <section className={collapsibleOnDesktop ? "mb-4 md:mb-5" : "md:contents"}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`${theme.card} ${buttonVisibilityClass} border rounded-2xl px-4 py-3 text-left transition-all ${
          open ? "mb-3" : "mb-4"
        }`}
      >
        <span className="flex items-center justify-between gap-3">
          <span className="min-w-0">
            <span className={`${theme.text} block text-sm font-black`}>
              {title}
            </span>
            <span className={`${theme.muted} mt-0.5 block text-xs leading-snug`}>
              {description}
            </span>
          </span>

          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-yellow-500/20 bg-yellow-500/10 text-lg font-black text-yellow-300">
            {open ? "-" : "+"}
          </span>
        </span>
      </button>

      <div className={contentVisibilityClass}>
        {children}
      </div>
    </section>
  );
}

export default function Home() {
  const tracker = useXpTracker();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubscriptionPanel, setShowSubscriptionPanel] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("historico");
  const [historyEntryToDelete, setHistoryEntryToDelete] = useState<number | null>(null);
  const [historyEntryToEdit, setHistoryEntryToEdit] = useState<number | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUserOverview[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [lastReadHistoryCount, setLastReadHistoryCount] = useState(0);
  const [historyReadInitialized, setHistoryReadInitialized] = useState(false);
  const [lastReadNotificationKey, setLastReadNotificationKey] = useState("");
  const [achievementNotifications, setAchievementNotifications] = useState<AppNotification[]>([]);
  const [communityNotifications, setCommunityNotifications] = useState<AppNotification[]>([]);
  const [communityChatTargetId, setCommunityChatTargetId] = useState<string | null>(null);
  const [communityOpenSignal, setCommunityOpenSignal] = useState(0);
  const [achievementToast, setAchievementToast] = useState<AppNotification | null>(null);
  const completedAchievementKeys = useRef<Set<string> | null>(null);
  const achievementToastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uiStateReady = useRef(false);

  const paymentReturnStatus = useMemo(() => {
    if (typeof window === "undefined") return null;

    const value = new URLSearchParams(window.location.search).get("payment");

    return value === "success" || value === "pending" || value === "failure"
      ? value
      : null;
  }, []);
  const paymentReturnId = useMemo(() => {
    if (typeof window === "undefined") return null;

    const params = new URLSearchParams(window.location.search);

    return params.get("payment_id") ?? params.get("collection_id");
  }, []);

  useEffect(() => {
    const storedState = readStoredUiState();

    if (storedState) {
      setShowSettings(Boolean(storedState.showSettings));
      setShowSubscriptionPanel(Boolean(storedState.showSubscriptionPanel));
      setSidebarOpen(Boolean(storedState.sidebarOpen));
      setSidebarTab(storedState.sidebarTab ?? "historico");

      if (storedState.scrollY && storedState.scrollY > 0) {
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: storedState.scrollY ?? 0, behavior: "auto" });
        });
      }
    }

    uiStateReady.current = true;
  }, []);

  useEffect(() => {
    if (!uiStateReady.current) return;

    const state = {
      showSettings,
      showSubscriptionPanel,
      sidebarOpen,
      sidebarTab,
      scrollY: typeof window === "undefined" ? 0 : window.scrollY,
    };

    writeStoredUiState(state);
  }, [showSettings, showSubscriptionPanel, sidebarOpen, sidebarTab]);

  useEffect(() => {
    function persistCurrentUiState() {
      writeStoredUiState({
        showSettings,
        showSubscriptionPanel,
        sidebarOpen,
        sidebarTab,
        scrollY: window.scrollY,
      });
    }

    window.addEventListener("pagehide", persistCurrentUiState);
    document.addEventListener("visibilitychange", persistCurrentUiState);

    return () => {
      window.removeEventListener("pagehide", persistCurrentUiState);
      document.removeEventListener("visibilitychange", persistCurrentUiState);
    };
  }, [showSettings, showSubscriptionPanel, sidebarOpen, sidebarTab]);

  function formatDate(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatEntryDate(iso: string) {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatSignedXP(value: number) {
    const absoluteValue = Math.abs(value).toLocaleString("pt-BR");

    if (value > 0) return `+${absoluteValue}`;
    if (value < 0) return `-${absoluteValue}`;

    return "0";
  }

  async function confirmReset() {
    await tracker.resetProgress();
    setSidebarOpen(false);
    setShowResetModal(false);
    setShowSettings(false);
  }

  function confirmDeleteHistoryEntry() {
    if (historyEntryToDelete === null) return;

    tracker.deleteHistoryEntry(historyEntryToDelete);
    setHistoryEntryToDelete(null);
  }

  function confirmEditHistoryEntry(entry: HistoryEntry) {
    if (historyEntryToEdit === null) return;

    tracker.updateHistoryEntry(historyEntryToEdit, entry);
    setHistoryEntryToEdit(null);
  }

  function saveProgress() {
    const nextHistoryCount =
      tracker.xpGainedSinceLastSave > 0
        ? tracker.history.length + 1
        : tracker.history.length;

    tracker.saveProgress();
    setSidebarOpen(true);
    setSidebarTab("historico");
    setLastReadHistoryCount(nextHistoryCount);
  }

  function toggleHistorySidebar() {
    setLastReadHistoryCount(tracker.history.length);
    setSidebarOpen((prev) => !prev);
  }

  function toggleNotifications(notificationKey: string) {
    setLastReadNotificationKey(notificationKey);
    setNotificationsOpen((prev) => !prev);
  }

  function closeNotifications() {
    setNotificationsOpen(false);
  }

  function openCommunityChatFromNotification(userId: string) {
    setCommunityChatTargetId(userId);
    setCommunityOpenSignal((value) => value + 1);
    setNotificationsOpen(false);

    window.setTimeout(() => {
      document
        .getElementById("community-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  async function loadCommunityNotifications() {
    if (!tracker.user || !tracker.progressLoaded) {
      setCommunityNotifications([]);
      return;
    }

    const { data, error } = await supabase
      .from("community_friend_requests")
      .select(
        "id, requester_id, addressee_id, requester_name, addressee_name, status, updated_at"
      )
      .or(`requester_id.eq.${tracker.user.id},addressee_id.eq.${tracker.user.id}`)
      .in("status", ["pending", "accepted", "declined"])
      .order("updated_at", { ascending: false })
      .limit(12);

    if (error) {
      const errorText = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();

      if (
        error.code !== "42P01" &&
        error.code !== "PGRST205" &&
        !errorText.includes("community_friend_requests")
      ) {
        console.warn("Erro ao carregar notificações da comunidade:", error);
      }

      setCommunityNotifications([]);
      return;
    }

    const rows = ((data as CommunityFriendRequestNotificationRow[]) ?? [])
      .filter((request) => request.status !== "cancelled");

    const friendshipNotifications = rows
      .map<AppNotification | null>((request) => {
        const isIncoming = request.addressee_id === tracker.user?.id;
        const isOutgoing = request.requester_id === tracker.user?.id;

        if (request.status === "pending" && isIncoming) {
          return {
            title: "Novo pedido de amizade",
            message: `${request.requester_name} quer se conectar com você na Comunidade.`,
            tone: "cyan",
          };
        }

        if (request.status === "accepted" && isOutgoing) {
          return {
            title: "Pedido de amizade aceito",
            message: `${request.addressee_name} aceitou seu pedido de amizade.`,
            tone: "emerald",
          };
        }

        if (request.status === "declined" && isOutgoing) {
          return {
            title: "Pedido de amizade recusado",
            message: `${request.addressee_name} recusou seu pedido de amizade.`,
            tone: "yellow",
          };
        }

        return null;
      })
      .filter((notification): notification is AppNotification => Boolean(notification));

    const { data: messageData, error: messageError } = await supabase
      .from("community_messages")
      .select("id, sender_id, recipient_id, sender_name, body, created_at")
      .eq("recipient_id", tracker.user.id)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(8);

    if (messageError) {
      const errorText = `${messageError.code ?? ""} ${messageError.message ?? ""}`.toLowerCase();

      if (
        messageError.code !== "42P01" &&
        messageError.code !== "PGRST205" &&
        !errorText.includes("community_messages")
      ) {
        console.warn("Erro ao carregar mensagens da comunidade:", messageError);
      }
    }

    const messageNotifications = ((messageData as CommunityMessageNotificationRow[]) ?? [])
      .map<AppNotification>((message) => ({
        title: "Nova mensagem",
        message: `${message.sender_name}: ${message.body.slice(0, 80)}${message.body.length > 80 ? "..." : ""}`,
        tone: "cyan",
        action: "community-chat",
        actionLabel: "Abrir conversa",
        communityUserId: message.sender_id,
      }));

    setCommunityNotifications([
      ...messageNotifications,
      ...friendshipNotifications,
    ].slice(0, 8));
  }

  const theme = {
    bg: tracker.darkMode ? "bg-black" : "bg-zinc-100",
    card: tracker.darkMode
      ? "bg-zinc-950 border-yellow-500/20"
      : "bg-white border-yellow-500/30",
    text: tracker.darkMode ? "text-white" : "text-zinc-900",
    muted: tracker.darkMode ? "text-zinc-500" : "text-zinc-500",
    input: tracker.darkMode
      ? "bg-black border-yellow-500/20 text-white"
      : "bg-zinc-100 border-yellow-500/30 text-zinc-900",
    sidebar: tracker.darkMode
      ? "bg-zinc-950 border-yellow-500/10"
      : "bg-white border-zinc-200",
    histEntry: tracker.darkMode ? "border-zinc-800" : "border-zinc-100",
    tabActive: tracker.darkMode
      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
      : "bg-yellow-50 text-yellow-600 border-yellow-300",
    tabInactive: tracker.darkMode
      ? "text-zinc-500 border-transparent hover:text-zinc-300"
      : "text-zinc-400 border-transparent hover:text-zinc-600",
    chartGrid: tracker.darkMode ? "#27272a" : "#e4e4e7",
    chartText: tracker.darkMode ? "#71717a" : "#888",
  };

  const pendingDeleteEntry =
    historyEntryToDelete !== null ? tracker.history[historyEntryToDelete] : null;
  const pendingEditEntry =
    historyEntryToEdit !== null ? tracker.history[historyEntryToEdit] : null;
  const shouldShowOnboarding =
    tracker.totalXP === 0 && tracker.currentXP === 0 && tracker.history.length === 0;
  const premiumLocked = tracker.billing.accessStatus === "locked";
  const todayKey = getLocalDateKey(new Date());
  const xpToday = tracker.history
    .filter((entry) => getLocalDateKey(new Date(entry.date)) === todayKey)
    .reduce((sum, entry) => sum + Math.max(0, entry.xpGained), 0);
  const completedUsageAchievements = useMemo(
    () => getUsageAchievements(tracker.history, tracker.dailyGoal).completedAchievements,
    [tracker.dailyGoal, tracker.history]
  );
  const notifications = useMemo(
    () =>
      buildNotifications({
        billing: tracker.billing,
        currentXP: tracker.currentXP,
        totalXP: tracker.totalXP,
        dailyGoal: tracker.dailyGoal,
        xpToday,
        saveStatus: tracker.saveStatus,
        achievementNotifications,
        communityNotifications,
      }),
    [
      achievementNotifications,
      communityNotifications,
      tracker.billing,
      tracker.currentXP,
      tracker.totalXP,
      tracker.dailyGoal,
      xpToday,
      tracker.saveStatus,
    ]
  );
  const notificationKey = useMemo(
    () =>
      notifications
        .map((notification) => `${notification.title}:${notification.message}`)
        .join("|"),
    [notifications]
  );
  const profileBadges = useMemo(
    () => getProfileBadges(tracker.billing),
    [tracker.billing]
  );
  const unreadHistoryCount = Math.max(
    0,
    tracker.history.length - lastReadHistoryCount
  );
  const unreadNotificationsCount =
    notificationKey && notificationKey !== lastReadNotificationKey
      ? notifications.length
      : 0;

  useEffect(() => {
    if (!tracker.progressLoaded || historyReadInitialized) return;

    setLastReadHistoryCount(tracker.history.length);
    setHistoryReadInitialized(true);
  }, [historyReadInitialized, tracker.history.length, tracker.progressLoaded]);

  useEffect(() => {
    if (!tracker.user || !tracker.progressLoaded) {
      setCommunityNotifications([]);
      return;
    }

    loadCommunityNotifications();

    const interval = window.setInterval(loadCommunityNotifications, 8000);

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        loadCommunityNotifications();
      }
    }

    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracker.progressLoaded, tracker.user?.id]);

  useEffect(() => {
    if (!tracker.progressLoaded) return;

    const nextKeys = new Set(
      completedUsageAchievements.map(
        (achievement) => `${achievement.groupKey}:${achievement.target}`
      )
    );

    if (!completedAchievementKeys.current) {
      completedAchievementKeys.current = nextKeys;
      return;
    }

    const previousKeys = completedAchievementKeys.current;
    const unlockedNow = completedUsageAchievements.filter(
      (achievement) => !previousKeys.has(`${achievement.groupKey}:${achievement.target}`)
    );

    completedAchievementKeys.current = nextKeys;

    if (unlockedNow.length === 0) return;

    const nextNotifications = unlockedNow.map<AppNotification>((achievement) => ({
      title: "Conquista desbloqueada",
      message: `${achievement.title} foi liberada. ${achievement.value}`,
      tone: "emerald",
    }));

    setAchievementNotifications((current) => [
      ...nextNotifications,
      ...current,
    ].slice(0, 8));
    setAchievementToast(nextNotifications[0]);

    if (achievementToastTimeout.current) {
      clearTimeout(achievementToastTimeout.current);
    }

    achievementToastTimeout.current = setTimeout(() => {
      setAchievementToast(null);
    }, 5000);
  }, [completedUsageAchievements, tracker.progressLoaded]);

  useEffect(() => {
    return () => {
      if (achievementToastTimeout.current) {
        clearTimeout(achievementToastTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAdminUsers() {
      if (!tracker.billing.isSuperAdmin || !tracker.user) {
        setAdminUsers([]);
        return;
      }

      const { data, error } = await supabase.rpc("get_admin_user_overview");

      if (cancelled) return;

      if (error) {
        console.warn("Visão admin ainda não está configurada:", error);
        setAdminUsers([]);
        return;
      }

      setAdminUsers((data as AdminUserOverview[]) ?? []);
    }

    loadAdminUsers();

    return () => {
      cancelled = true;
    };
  }, [tracker.billing.isSuperAdmin, tracker.user]);

  useEffect(() => {
    if (!paymentReturnStatus || paymentReturnStatus === "failure" || !paymentReturnId) {
      return;
    }

    let cancelled = false;

    async function reconcilePaymentReturn() {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token || cancelled) return;

      const response = await fetch("/api/billing/mercadopago/reconcile", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          paymentId: paymentReturnId,
        }),
      });

      if (cancelled || !response.ok) return;

      const result = (await response.json()) as { status?: string };

      if (result.status === "approved") {
        window.setTimeout(() => {
          window.location.replace("/");
        }, 800);
      }
    }

    reconcilePaymentReturn();

    return () => {
      cancelled = true;
    };
  }, [paymentReturnStatus, paymentReturnId]);

  if (!tracker.user && !tracker.guestMode) {
    return (
      <LoginScreen
        onLogin={tracker.loginWithGoogle}
        onGuestLogin={tracker.loginAsGuest}
      />
    );
  }

  if (!tracker.progressLoaded) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <p className="text-yellow-300 font-bold text-lg">
          Carregando seu progresso...
        </p>
      </main>
    );
  }

  if (tracker.loadError) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="bg-zinc-950 border border-red-500/30 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_0_60px_rgba(239,68,68,0.2)]">
          <div className="text-4xl mb-4">!</div>

          <h1 className="text-2xl font-black text-white mb-3">
            Erro ao carregar
          </h1>

          <p className="text-zinc-400 mb-6">{tracker.loadError}</p>

          <button
            type="button"
            onClick={() => tracker.user && tracker.loadProgress(tracker.user.id)}
            className="bg-gradient-to-r from-yellow-400 to-amber-600 text-black px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all"
          >
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  return (
    <div
      className={`min-h-screen ${theme.bg} ${theme.text} select-none transition-colors duration-300 [&_input]:select-text [&_textarea]:select-text`}
    >
      <div className={`relative z-10 transition-all duration-300 ${sidebarOpen ? "md:mr-80" : "mr-0"}`}>
        <main className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
          <DashboardHeader
            userName={tracker.userName}
            darkMode={tracker.darkMode}
            saveStatus={tracker.saveStatus}
            historyCount={unreadHistoryCount}
            guestMode={tracker.guestMode}
            notifications={notifications}
            badges={profileBadges}
            unreadNotificationsCount={unreadNotificationsCount}
            notificationsOpen={notificationsOpen}
            theme={theme}
            onToggleDarkMode={() => tracker.setDarkMode((prev) => !prev)}
            onToggleSidebar={toggleHistorySidebar}
            onToggleNotifications={() => toggleNotifications(notificationKey)}
            onCloseNotifications={closeNotifications}
            onOpenSubscription={() => setShowSubscriptionPanel(true)}
            onOpenCommunityChat={openCommunityChatFromNotification}
            onOpenSettings={() => setShowSettings(true)}
            onRenameUser={tracker.updateDisplayName}
            onLoginWithGoogle={tracker.loginWithGoogle}
            onLogout={tracker.logout}
          />

          <SubscriptionCard
            billing={tracker.billing}
            checkoutLoading={tracker.billing.checkoutLoading}
            theme={theme}
            onCheckout={tracker.billing.startCheckout}
          />

          <PaymentReturnCard status={paymentReturnStatus} theme={theme} />

          {shouldShowOnboarding && (
            <OnboardingCard
              guestMode={tracker.guestMode}
              theme={theme}
              onStart={tracker.configureInitialProgress}
            />
          )}

          <StatsCards
            totalXP={tracker.totalXP}
            currentXP={tracker.currentXP}
            userTotalXP={tracker.userTotalXP}
            percentageDisplay={tracker.percentageDisplay}
            currentLevel={tracker.currentLevel}
            targetLevel={tracker.targetLevel}
            theme={theme}
          />

          <ProgressCard
            completedXP={tracker.completedXP}
            percentageValue={tracker.percentageValue}
            percentageDisplay={tracker.percentageDisplay}
            activeMilestone={tracker.activeMilestone}
            barPulsing={tracker.barPulsing}
            theme={theme}
          />

          {!shouldShowOnboarding && !premiumLocked && (
            <MobileDashboardSection
              title="Comunidade"
              description="Veja jogadores que aceitaram compartilhar o proprio nivel."
              collapsibleOnDesktop
              openSignal={communityOpenSignal}
              theme={theme}
            >
              <div id="community-section">
                <CommunityCard
                  user={tracker.user}
                  userName={tracker.userName ?? "Jogador XP"}
                  currentLevel={tracker.currentLevel}
                  targetLevel={tracker.targetLevel}
                  percentageDisplay={tracker.percentageDisplay}
                  badges={profileBadges}
                  openChatUserId={communityChatTargetId}
                  openChatSignal={communityOpenSignal}
                  onChatOpened={() => setCommunityChatTargetId(null)}
                  onFriendshipChanged={loadCommunityNotifications}
                  theme={theme}
                />
              </div>
            </MobileDashboardSection>
          )}

          {!shouldShowOnboarding && !premiumLocked && (
            <FarmRunsCard
              currentXP={tracker.currentXP}
              currentLevel={tracker.currentLevel}
              totalXP={tracker.totalXP}
              doubleXpMode={tracker.doubleXpMode}
              wisdomElixirActive={tracker.wisdomElixirActive}
              theme={theme}
              onApplyFarmProgress={tracker.applyFarmProgress}
            />
          )}

          {!shouldShowOnboarding && (
            <MobileDashboardSection
              title="Metas e ranking"
              description="Acompanhe metas, ritmo e ranking do progresso."
              collapsibleOnDesktop
              theme={theme}
            >
              <GoalsRankingCard
                history={tracker.history}
                currentXP={tracker.currentXP}
                dailyGoal={tracker.dailyGoal}
                averageDailyXP={tracker.averageDailyXP}
                theme={theme}
              />
            </MobileDashboardSection>
          )}

          {!shouldShowOnboarding && !premiumLocked && (
            <MobileDashboardSection
              title="Planejador de farm"
              description="Veja sugestões de runs para bater sua meta."
              collapsibleOnDesktop
              theme={theme}
            >
              <FarmPlannerCard
                currentXP={tracker.currentXP}
                dailyGoal={tracker.dailyGoal}
                theme={theme}
              />
            </MobileDashboardSection>
          )}

          <MobileDashboardSection
            title="Estimativas"
            description="Previsão por meta diária e média histórica."
            theme={theme}
          >
            <EstimateCards
              daysGoal={tracker.daysGoal}
              daysAvg={tracker.daysAvg}
              dailyGoal={tracker.dailyGoal}
              averageDailyXP={tracker.averageDailyXP}
              formatDate={formatDate}
              theme={theme}
            />
          </MobileDashboardSection>

          {!shouldShowOnboarding && !premiumLocked && (
            <MobileDashboardSection
              title="Marcos do farm"
              description="Conquistas de uso e metas automáticas."
              theme={theme}
            >
              <UsageAchievementsCard
                history={tracker.history}
                dailyGoal={tracker.dailyGoal}
                theme={theme}
              />
            </MobileDashboardSection>
          )}

          {!shouldShowOnboarding && tracker.user && tracker.billing.isSuperAdmin && (
            <MobileDashboardSection
              title="Painel admin"
              description="Resumo operacional do usuário e do plano."
              theme={theme}
            >
              <AdminPanelCard
                userName={tracker.userName}
                userEmail={tracker.user.email}
                billing={tracker.billing}
                history={tracker.history}
                currentXP={tracker.currentXP}
                totalXP={tracker.totalXP}
                isSuperAdmin={tracker.billing.isSuperAdmin}
                adminUsers={adminUsers}
                theme={theme}
              />
            </MobileDashboardSection>
          )}

          {!shouldShowOnboarding && !premiumLocked && (
            <MobileDashboardSection
              title="Histórico inteligente"
              description="Ritmo recente, melhores registros e resumo do farm."
              theme={theme}
            >
              <SmartHistoryCard
                history={tracker.history}
                currentXP={tracker.currentXP}
                theme={theme}
              />
            </MobileDashboardSection>
          )}

          <div className="flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={saveProgress}
              disabled={premiumLocked || tracker.xpGainedSinceLastSave <= 0}
              className="bg-gradient-to-r from-emerald-500 to-emerald-700 hover:scale-105 transition-all duration-300 px-5 py-3 rounded-2xl font-bold shadow-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {premiumLocked ? "Premium para salvar" : "Salvar Progresso"}{" "}
              {!premiumLocked && tracker.xpGainedSinceLastSave > 0 &&
                `(+${tracker.xpGainedSinceLastSave.toLocaleString("pt-BR")} XP)`}
            </button>

            <button
              type="button"
              onClick={tracker.undoLastProgress}
              disabled={!tracker.canUndoLastProgress}
              className={`${theme.card} border hover:border-yellow-400 transition-all duration-300 px-5 py-3 rounded-2xl font-bold shadow-lg disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              Voltar último progresso
            </button>

            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className={`${theme.card} border hover:border-yellow-400 transition-all duration-300 px-5 py-3 rounded-2xl font-bold shadow-lg`}
            >
              Configurações
            </button>
          </div>

          <SuggestionBox
            user={tracker.user}
            userName={tracker.userName}
            theme={theme}
          />

          <SiteFooter darkMode={tracker.darkMode} />
        </main>
      </div>

      <HistorySidebar
        open={sidebarOpen}
        darkMode={tracker.darkMode}
        history={tracker.history}
        totalXP={tracker.totalXP}
        sidebarTab={sidebarTab}
        setSidebarTab={setSidebarTab}
        onClose={() => setSidebarOpen(false)}
        onDeleteHistoryEntry={setHistoryEntryToDelete}
        onEditHistoryEntry={setHistoryEntryToEdit}
        onDuplicateHistoryEntry={tracker.duplicateHistoryEntry}
        formatEntryDate={formatEntryDate}
        theme={theme}
      />

      <SettingsPanel
        open={showSettings}
        totalXP={tracker.totalXP}
        currentXP={tracker.currentXP}
        userTotalXP={tracker.userTotalXP}
        dailyGoal={tracker.dailyGoal}
        currentLevel={tracker.currentLevel}
        targetLevel={tracker.targetLevel}
        theme={theme}
        onClose={() => setShowSettings(false)}
        onReset={() => setShowResetModal(true)}
        onDeleteAccount={tracker.deleteAccount}
        onSave={tracker.updateProgressSettings}
      />

      <SubscriptionPanel
        open={showSubscriptionPanel}
        billing={tracker.billing}
        theme={theme}
        onClose={() => setShowSubscriptionPanel(false)}
      />

      {!shouldShowOnboarding && !premiumLocked && (
        <>
          <DoubleXpAction
            mode={tracker.doubleXpMode}
            wisdomElixirActive={tracker.wisdomElixirActive}
            wisdomElixirEndsAt={tracker.wisdomElixirEndsAt}
            onChange={tracker.setDoubleXpMode}
            onActivateWisdomElixir={tracker.activateWisdomElixir}
            onDeactivateWisdomElixir={tracker.deactivateWisdomElixir}
          />
          {tracker.user && (
            <ReferralInviteAction
              summary={tracker.billing.referralSummary}
              loading={tracker.billing.referralLoading}
              error={tracker.billing.referralError}
              guestMode={tracker.guestMode}
              theme={theme}
            />
          )}
          <TeletofusLink />
          <DeathAction
            userTotalXP={tracker.userTotalXP}
            disabled={tracker.userTotalXP <= 0}
            theme={theme}
            onConfirm={tracker.registerDeath}
          />
        </>
      )}

      {achievementToast && (
        <div className="fixed bottom-5 left-4 right-4 z-50 rounded-2xl border border-emerald-500/30 bg-zinc-950/95 p-4 text-white shadow-[0_0_40px_rgba(16,185,129,0.25)] backdrop-blur md:left-auto md:right-6 md:w-96">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-300">
            Nova conquista
          </p>
          <p className="mt-1 text-base font-black text-yellow-300">
            {achievementToast.message}
          </p>
        </div>
      )}

      <EditHistoryEntryModal
        entry={pendingEditEntry ?? null}
        fallbackTotalXP={tracker.totalXP}
        onCancel={() => setHistoryEntryToEdit(null)}
        onSave={confirmEditHistoryEntry}
      />

      {pendingDeleteEntry && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-red-500/30 rounded-3xl p-8 max-w-md w-full shadow-[0_0_60px_rgba(239,68,68,0.2)]">
            <div className="text-4xl mb-4">!</div>

            <h2 className="text-2xl font-black text-white mb-2">
              Excluir registro?
            </h2>

            <p className="text-zinc-400 mb-6">
              Este registro será removido do histórico, e a alteração será salva na nuvem.
            </p>

            <div className="bg-black/40 border border-red-500/20 rounded-2xl p-4 mb-8">
              <p
                className={`font-black text-lg ${
                  pendingDeleteEntry.xpGained < 0 ? "text-red-300" : "text-emerald-400"
                }`}
              >
                {formatSignedXP(pendingDeleteEntry.xpGained)} XP
              </p>
              <p className="text-zinc-400 text-sm mt-1">
                Restaram {pendingDeleteEntry.xpRemaining.toLocaleString("pt-BR")} XP
              </p>
              <p className="text-zinc-500 text-sm mt-1">
                {formatEntryDate(pendingDeleteEntry.date)}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setHistoryEntryToDelete(null)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 transition-all px-6 py-3 rounded-2xl font-bold text-white"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmDeleteHistoryEntry}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-700 hover:scale-105 transition-all px-6 py-3 rounded-2xl font-bold text-white"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <ResetModal
        open={showResetModal}
        onCancel={() => setShowResetModal(false)}
        onConfirm={confirmReset}
      />
    </div>
  );
}
