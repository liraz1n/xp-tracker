import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "~/supabase";

export const DEFAULT_TOTAL_XP = 0;
export const DEFAULT_CURRENT_XP = 0;
export const DEFAULT_DAILY_GOAL = 0;
export const DEFAULT_CURRENT_LEVEL = 36;
export const DEFAULT_TARGET_LEVEL = 37;

const MILESTONES = [25, 50, 75, 100];
const GUEST_PROGRESS_DRAFT_KEY = "xpTrackerGuestProgressDraft";
const LEVEL_PROGRESS_STORAGE_KEY = "xpTrackerLevelProgress";

export interface HistoryEntry {
  date: string;
  xpGained: number;
  xpRemaining: number;
  totalXP?: number;
  source?: string;
}

interface XpProgressRow {
  total_xp: number;
  current_xp: number;
  daily_goal: number;
  history: HistoryEntry[];
  reached_milestones: number[];
  last_saved_xp: number;
  dark_mode: boolean;
}

interface GuestProgressDraft {
  totalXP: number;
  currentXP: number;
  dailyGoal: number;
  history: HistoryEntry[];
  lastSavedXP: number;
  reachedMilestones: number[];
  darkMode: boolean;
  currentLevel?: number;
  targetLevel?: number;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function readGuestProgressDraft() {
  if (typeof window === "undefined") return null;

  const rawDraft = window.localStorage.getItem(GUEST_PROGRESS_DRAFT_KEY);
  if (!rawDraft) return null;

  try {
    return JSON.parse(rawDraft) as GuestProgressDraft;
  } catch {
    window.localStorage.removeItem(GUEST_PROGRESS_DRAFT_KEY);
    return null;
  }
}

function clearGuestProgressDraft() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(GUEST_PROGRESS_DRAFT_KEY);
}

function sanitizeLevel(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function getLevelProgressStorageKey(id: string) {
  return `${LEVEL_PROGRESS_STORAGE_KEY}:${id}`;
}

function readLevelProgress(id: string) {
  if (typeof window === "undefined") return null;

  const rawLevelProgress = window.localStorage.getItem(
    getLevelProgressStorageKey(id)
  );
  if (!rawLevelProgress) return null;

  try {
    const parsed = JSON.parse(rawLevelProgress) as {
      currentLevel?: number;
      targetLevel?: number;
    };

    return {
      currentLevel: sanitizeLevel(parsed.currentLevel ?? DEFAULT_CURRENT_LEVEL),
      targetLevel: sanitizeLevel(parsed.targetLevel ?? DEFAULT_TARGET_LEVEL),
    };
  } catch {
    window.localStorage.removeItem(getLevelProgressStorageKey(id));
    return null;
  }
}

function saveLevelProgress(
  id: string,
  values: {
    currentLevel: number;
    targetLevel: number;
  }
) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    getLevelProgressStorageKey(id),
    JSON.stringify(values)
  );
}

export function useXpTracker() {
  const [totalXP, setTotalXP] = useState<number>(DEFAULT_TOTAL_XP);
  const [currentXP, setCurrentXP] = useState<number>(DEFAULT_CURRENT_XP);
  const [dailyGoal, setDailyGoal] = useState<number>(DEFAULT_DAILY_GOAL);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lastSavedXP, setLastSavedXP] = useState<number>(DEFAULT_CURRENT_XP);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reachedMilestones, setReachedMilestones] = useState<number[]>([]);
  const [activeMilestone, setActiveMilestone] = useState<number | null>(null);
  const [barPulsing, setBarPulsing] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [currentLevel, setCurrentLevel] = useState(DEFAULT_CURRENT_LEVEL);
  const [targetLevel, setTargetLevel] = useState(DEFAULT_TARGET_LEVEL);

  const milestoneTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function saveGuestProgressDraft() {
    if (typeof window === "undefined") return;

    const draft: GuestProgressDraft = {
      totalXP,
      currentXP,
      dailyGoal,
      history,
      lastSavedXP,
      reachedMilestones,
      darkMode,
      currentLevel,
      targetLevel,
    };

    window.localStorage.setItem(
      GUEST_PROGRESS_DRAFT_KEY,
      JSON.stringify(draft)
    );
  }

  async function loginWithGoogle() {
    if (guestMode) {
      saveGuestProgressDraft();
    }

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  }

  function loginAsGuest() {
    setGuestMode(true);
    setUser(null);
    setLoadError(null);
    setProgressLoaded(true);
    setSaveStatus("idle");
    setTotalXP(DEFAULT_TOTAL_XP);
    setCurrentXP(DEFAULT_CURRENT_XP);
    setDailyGoal(DEFAULT_DAILY_GOAL);
    setHistory([]);
    setLastSavedXP(DEFAULT_CURRENT_XP);
    setReachedMilestones([]);
    setActiveMilestone(null);
    setBarPulsing(false);
    setDarkMode(true);

    const savedGuestLevel = readLevelProgress("guest");
    setCurrentLevel(savedGuestLevel?.currentLevel ?? DEFAULT_CURRENT_LEVEL);
    setTargetLevel(savedGuestLevel?.targetLevel ?? DEFAULT_TARGET_LEVEL);
  }

  async function logout() {
    if (guestMode) {
      setGuestMode(false);
      setProgressLoaded(false);
      setSaveStatus("idle");
      setLoadError(null);
      return;
    }

    await supabase.auth.signOut();
  }

  function applyProgress(data: XpProgressRow) {
    setTotalXP(data.total_xp);
    setCurrentXP(data.current_xp);
    setDailyGoal(data.daily_goal);
    setHistory(data.history ?? []);
    setReachedMilestones(data.reached_milestones ?? []);
    setLastSavedXP(data.last_saved_xp);
    setDarkMode(data.dark_mode);
  }

  function applyGuestProgressDraft(draft: GuestProgressDraft) {
    setTotalXP(draft.totalXP);
    setCurrentXP(draft.currentXP);
    setDailyGoal(draft.dailyGoal);
    setHistory(draft.history ?? []);
    setReachedMilestones(draft.reachedMilestones ?? []);
    setLastSavedXP(draft.lastSavedXP);
    setDarkMode(draft.darkMode);
    setCurrentLevel(sanitizeLevel(draft.currentLevel ?? DEFAULT_CURRENT_LEVEL));
    setTargetLevel(sanitizeLevel(draft.targetLevel ?? DEFAULT_TARGET_LEVEL));
  }

  async function loadProgress(userId: string) {
    setProgressLoaded(false);
    setSaveStatus("idle");
    setLoadError(null);

    const { data, error } = await supabase
      .from("xp_progress")
      .select(
        "total_xp, current_xp, daily_goal, history, reached_milestones, last_saved_xp, dark_mode"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar progresso:", error);
      setLoadError("Não foi possível carregar seu progresso.");
      setProgressLoaded(true);
      setSaveStatus("error");
      return;
    }

    if (!data) {
      const { data: created, error: createError } = await supabase
        .from("xp_progress")
        .insert({
          user_id: userId,
          total_xp: DEFAULT_TOTAL_XP,
          current_xp: DEFAULT_CURRENT_XP,
          daily_goal: DEFAULT_DAILY_GOAL,
          history: [],
          reached_milestones: [],
          last_saved_xp: DEFAULT_CURRENT_XP,
          dark_mode: true,
        })
        .select(
          "total_xp, current_xp, daily_goal, history, reached_milestones, last_saved_xp, dark_mode"
        )
        .single();

      if (createError) {
        console.error("Erro ao criar progresso:", createError);
        setLoadError("Não foi possível criar seu progresso.");
        setProgressLoaded(true);
        setSaveStatus("error");
        return;
      }

      const guestDraft = readGuestProgressDraft();

      if (guestDraft) {
        applyGuestProgressDraft(guestDraft);
        clearGuestProgressDraft();
      } else {
        applyProgress(created as XpProgressRow);
      }

      const savedLevel = readLevelProgress(userId);
      if (savedLevel) {
        setCurrentLevel(savedLevel.currentLevel);
        setTargetLevel(savedLevel.targetLevel);
      }

      setProgressLoaded(true);
      setSaveStatus("saved");
      return;
    }

    const guestDraft = readGuestProgressDraft();

    if (guestDraft) {
      applyGuestProgressDraft(guestDraft);
      clearGuestProgressDraft();
    } else {
      applyProgress(data as XpProgressRow);
    }

    const savedLevel = readLevelProgress(userId);
    if (savedLevel) {
      setCurrentLevel(savedLevel.currentLevel);
      setTargetLevel(savedLevel.targetLevel);
    }

    setProgressLoaded(true);
    setSaveStatus("saved");
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setGuestMode(false);
      }

      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (guestMode) return;

    if (!user) {
      setProgressLoaded(false);
      setLoadError(null);
      return;
    }

    loadProgress(user.id);
  }, [user, guestMode]);

  useEffect(() => {
    if (guestMode) return;
    if (!user || !progressLoaded || loadError) return;

    setSaveStatus("saving");

    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = setTimeout(async () => {
      const { error } = await supabase
        .from("xp_progress")
        .update({
          total_xp: totalXP,
          current_xp: currentXP,
          daily_goal: dailyGoal,
          history,
          reached_milestones: reachedMilestones,
          last_saved_xp: lastSavedXP,
          dark_mode: darkMode,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) {
        console.error("Erro ao salvar progresso:", error);
        setSaveStatus("error");
        return;
      }

      setSaveStatus("saved");
    }, 700);

    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, [
    user,
    guestMode,
    progressLoaded,
    loadError,
    totalXP,
    currentXP,
    dailyGoal,
    history,
    reachedMilestones,
    lastSavedXP,
    darkMode,
  ]);

  useEffect(() => {
    return () => {
      if (milestoneTimeout.current) {
        clearTimeout(milestoneTimeout.current);
      }

      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!progressLoaded) return;

    if (guestMode) {
      saveLevelProgress("guest", {
        currentLevel,
        targetLevel,
      });
      return;
    }

    if (!user) return;

    saveLevelProgress(user.id, {
      currentLevel,
      targetLevel,
    });
  }, [currentLevel, targetLevel, guestMode, progressLoaded, user]);

  const completedXP = Math.max(0, totalXP - currentXP);
  const percentageValue =
    totalXP > 0 ? clamp((completedXP / totalXP) * 100, 0, 100) : 0;
  const percentageDisplay = percentageValue.toFixed(2);

  useEffect(() => {
    if (!progressLoaded || loadError) return;

    const eligibleMilestones = MILESTONES.filter(
      (milestone) => percentageValue >= milestone
    );
    const newMilestones = eligibleMilestones.filter(
      (milestone) => !reachedMilestones.includes(milestone)
    );
    const milestonesChanged =
      eligibleMilestones.length !== reachedMilestones.length ||
      eligibleMilestones.some(
        (milestone, index) => milestone !== reachedMilestones[index]
      );

    if (milestonesChanged) {
      setReachedMilestones(eligibleMilestones);
    }

    if (newMilestones.length > 0) {
      triggerMilestone(newMilestones[newMilestones.length - 1]);
    }
  }, [percentageValue, progressLoaded, loadError, reachedMilestones]);

  function triggerMilestone(milestone: number) {
    setActiveMilestone(milestone);
    setBarPulsing(true);

    if (milestoneTimeout.current) {
      clearTimeout(milestoneTimeout.current);
    }

    milestoneTimeout.current = setTimeout(() => {
      setActiveMilestone(null);
      setBarPulsing(false);
    }, 4000);
  }

  function saveProgress() {
    const xpGained = lastSavedXP - currentXP;

    if (xpGained <= 0) return;

    const entry: HistoryEntry = {
      date: new Date().toISOString(),
      xpGained,
      xpRemaining: currentXP,
      totalXP,
    };

    setHistory((prev) => [entry, ...prev]);
    setLastSavedXP(currentXP);
  }

  function applyFarmProgress({
    xpGained,
    source,
  }: {
    xpGained: number;
    source: string;
  }) {
    if (currentXP <= 0 || xpGained <= 0) return;

    const newCurrentXP = Math.max(0, currentXP - xpGained);
    const appliedXP = currentXP - newCurrentXP;

    if (appliedXP <= 0) return;

    const entry: HistoryEntry = {
      date: new Date().toISOString(),
      xpGained: appliedXP,
      xpRemaining: newCurrentXP,
      totalXP,
      source,
    };

    setCurrentXP(newCurrentXP);
    setHistory((prev) => [entry, ...prev]);
    setLastSavedXP(newCurrentXP);
  }

  function deleteHistoryEntry(indexToDelete: number) {
    setHistory((prev) => prev.filter((_, index) => index !== indexToDelete));
  }

  function updateHistoryEntry(indexToUpdate: number, updatedEntry: HistoryEntry) {
    setHistory((prev) =>
      prev.map((entry, index) =>
        index === indexToUpdate ? updatedEntry : entry
      )
    );
  }

  function configureInitialProgress({
    totalXP,
    currentXP,
    dailyGoal,
    currentLevel,
    targetLevel,
  }: {
    totalXP: number;
    currentXP: number;
    dailyGoal: number;
    currentLevel: number;
    targetLevel: number;
  }) {
    setTotalXP(totalXP);
    setCurrentXP(currentXP);
    setDailyGoal(dailyGoal);
    setCurrentLevel(sanitizeLevel(currentLevel));
    setTargetLevel(sanitizeLevel(targetLevel));
    setLastSavedXP(currentXP);
    setHistory([]);
    setReachedMilestones([]);
    setActiveMilestone(null);
    setBarPulsing(false);
  }

  async function resetProgress() {
    setTotalXP(DEFAULT_TOTAL_XP);
    setCurrentXP(DEFAULT_CURRENT_XP);
    setDailyGoal(DEFAULT_DAILY_GOAL);
    setHistory([]);
    setLastSavedXP(DEFAULT_CURRENT_XP);
    setReachedMilestones([]);
    setActiveMilestone(null);
    setBarPulsing(false);
    setDarkMode(true);
    setCurrentLevel(DEFAULT_CURRENT_LEVEL);
    setTargetLevel(DEFAULT_TARGET_LEVEL);

    if (guestMode || !user) return;

    setSaveStatus("saving");

    const { error } = await supabase
      .from("xp_progress")
      .update({
        total_xp: DEFAULT_TOTAL_XP,
        current_xp: DEFAULT_CURRENT_XP,
        daily_goal: DEFAULT_DAILY_GOAL,
        history: [],
        reached_milestones: [],
        last_saved_xp: DEFAULT_CURRENT_XP,
        dark_mode: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao resetar progresso:", error);
      setSaveStatus("error");
      return;
    }

    setSaveStatus("saved");
  }

  const averageDailyXP = useMemo(() => {
    if (history.length < 2) return null;

    const totalGained = history.reduce((sum, entry) => sum + entry.xpGained, 0);
    const firstDate = new Date(history[history.length - 1].date);
    const lastDate = new Date(history[0].date);

    const days = Math.max(
      (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
      1
    );

    return totalGained / days;
  }, [history]);

  const daysGoal = dailyGoal > 0 ? Math.ceil(currentXP / dailyGoal) : null;
  const daysAvg =
    averageDailyXP && averageDailyXP > 0
      ? Math.ceil(currentXP / averageDailyXP)
      : null;
  const xpGainedSinceLastSave = lastSavedXP - currentXP;
  const userName =
    guestMode
      ? "Visitante"
      : user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email;

  return {
    totalXP,
    setTotalXP,
    currentXP,
    setCurrentXP,
    dailyGoal,
    setDailyGoal,
    history,
    lastSavedXP,
    progressLoaded,
    loadError,
    activeMilestone,
    barPulsing,
    darkMode,
    setDarkMode,
    user,
    guestMode,
    userName,
    currentLevel,
    targetLevel,
    setCurrentLevel,
    setTargetLevel,
    saveStatus,
    completedXP,
    percentageValue,
    percentageDisplay,
    averageDailyXP,
    daysGoal,
    daysAvg,
    xpGainedSinceLastSave,
    loginWithGoogle,
    loginAsGuest,
    logout,
    loadProgress,
    saveProgress,
    applyFarmProgress,
    configureInitialProgress,
    deleteHistoryEntry,
    updateHistoryEntry,
    resetProgress,
  };
}
