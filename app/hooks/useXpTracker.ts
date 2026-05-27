import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "~/supabase";
import { useBilling } from "~/hooks/useBilling";

export const DEFAULT_TOTAL_XP = 0;
export const DEFAULT_CURRENT_XP = 0;
export const DEFAULT_DAILY_GOAL = 0;
export const DEFAULT_CURRENT_LEVEL = 0;
export const DEFAULT_TARGET_LEVEL = 1;
export const DEFAULT_USER_TOTAL_XP = 0;
export const GUEST_CURRENT_LEVEL = 0;
export const GUEST_TARGET_LEVEL = 1;

const MILESTONES = [25, 50, 75, 100];
const GUEST_PROGRESS_DRAFT_KEY = "xpTrackerGuestProgressDraft";
const XP_PROGRESS_SELECT_BASE =
  "total_xp, current_xp, daily_goal, history, reached_milestones, last_saved_xp, dark_mode";
const XP_PROGRESS_SELECT_LEVELS = `${XP_PROGRESS_SELECT_BASE}, current_level, target_level`;
const XP_PROGRESS_SELECT_FULL = `${XP_PROGRESS_SELECT_LEVELS}, user_total_xp`;

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
  current_level?: number;
  target_level?: number;
  user_total_xp?: number;
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
  userTotalXP?: number;
}

interface ProgressSnapshot {
  totalXP: number;
  currentXP: number;
  dailyGoal: number;
  history: HistoryEntry[];
  reachedMilestones: number[];
  lastSavedXP: number;
  darkMode: boolean;
  currentLevel: number;
  targetLevel: number;
  userTotalXP: number;
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
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function isMissingProgressColumn(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
} | null) {
  if (!error) return false;

  const errorText = [
    error.code,
    error.message,
    error.details,
    error.hint,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    errorText.includes("user_total_xp") ||
    errorText.includes("current_level") ||
    errorText.includes("target_level")
  );
}

function isUserTotalXPColumnError(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
} | null) {
  if (!error) return false;

  return [
    error.code,
    error.message,
    error.details,
    error.hint,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes("user_total_xp");
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
  const [userTotalXP, setUserTotalXP] = useState(DEFAULT_USER_TOTAL_XP);
  const billing = useBilling({ user, guestMode, progressLoaded });

  const milestoneTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const levelColumnsAvailable = useRef(true);
  const userTotalXPColumnAvailable = useRef(true);

  function getProgressSelectColumns() {
    if (levelColumnsAvailable.current && userTotalXPColumnAvailable.current) {
      return XP_PROGRESS_SELECT_FULL;
    }

    if (levelColumnsAvailable.current) {
      return XP_PROGRESS_SELECT_LEVELS;
    }

    return XP_PROGRESS_SELECT_BASE;
  }

  function downgradeProgressColumns(error: {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  } | null) {
    const errorText = [
      error?.code,
      error?.message,
      error?.details,
      error?.hint,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (errorText.includes("user_total_xp")) {
      userTotalXPColumnAvailable.current = false;
      return;
    }

    if (
      errorText.includes("current_level") ||
      errorText.includes("target_level")
    ) {
      levelColumnsAvailable.current = false;
      userTotalXPColumnAvailable.current = false;
      return;
    }

    if (userTotalXPColumnAvailable.current) {
      userTotalXPColumnAvailable.current = false;
      return;
    }

    levelColumnsAvailable.current = false;
  }

  function buildProgressPayload<T extends Record<string, unknown>>(
    basePayload: T,
    userTotalXPValue: number,
    levels = {
      currentLevel,
      targetLevel,
    }
  ) {
    return {
      ...basePayload,
      ...(levelColumnsAvailable.current
        ? {
            current_level: levels.currentLevel,
            target_level: levels.targetLevel,
          }
        : {}),
      ...(userTotalXPColumnAvailable.current
        ? {
            user_total_xp: userTotalXPValue,
          }
        : {}),
    };
  }

  async function persistProgressSnapshot(
    snapshot: ProgressSnapshot,
    options: { requireUserTotalXP?: boolean } = {}
  ) {
    if (guestMode || !billing.canUseCloudSync) return true;
    if (!user || !progressLoaded || loadError) return false;

    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = null;
    }

    setSaveStatus("saving");

    const baseUpdate = {
      total_xp: snapshot.totalXP,
      current_xp: snapshot.currentXP,
      daily_goal: snapshot.dailyGoal,
      history: snapshot.history,
      reached_milestones: snapshot.reachedMilestones,
      last_saved_xp: snapshot.lastSavedXP,
      dark_mode: snapshot.darkMode,
      updated_at: new Date().toISOString(),
    };

    const levels = {
      currentLevel: snapshot.currentLevel,
      targetLevel: snapshot.targetLevel,
    };

    let saveResult = await supabase
      .from("xp_progress")
      .update(buildProgressPayload(baseUpdate, snapshot.userTotalXP, levels))
      .eq("user_id", user.id);

    while (isMissingProgressColumn(saveResult.error)) {
      if (
        options.requireUserTotalXP &&
        isUserTotalXPColumnError(saveResult.error)
      ) {
        console.error(
          "Erro ao salvar XP do usuário: a coluna user_total_xp não foi encontrada.",
          saveResult.error
        );
        setSaveStatus("error");
        return false;
      }

      downgradeProgressColumns(saveResult.error);

      saveResult = await supabase
        .from("xp_progress")
        .update(buildProgressPayload(baseUpdate, snapshot.userTotalXP, levels))
        .eq("user_id", user.id);

      if (!saveResult.error) break;
      if (!isMissingProgressColumn(saveResult.error)) break;
      if (!levelColumnsAvailable.current && !userTotalXPColumnAvailable.current) {
        break;
      }
    }

    if (saveResult.error) {
      console.error("Erro ao salvar progresso:", saveResult.error);
      setSaveStatus("error");
      return false;
    }

    setSaveStatus("saved");
    return true;
  }

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
      userTotalXP,
    };

    window.localStorage.setItem(
      GUEST_PROGRESS_DRAFT_KEY,
      JSON.stringify(draft)
    );
  }

  async function loginWithGoogle() {
    if (guestMode) {
      saveGuestProgressDraft();
    } else {
      clearGuestProgressDraft();
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
    setCurrentLevel(GUEST_CURRENT_LEVEL);
    setTargetLevel(GUEST_TARGET_LEVEL);
    setUserTotalXP(DEFAULT_USER_TOTAL_XP);
    clearGuestProgressDraft();
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
    setCurrentLevel(sanitizeLevel(data.current_level ?? DEFAULT_CURRENT_LEVEL));
    setTargetLevel(sanitizeLevel(data.target_level ?? DEFAULT_TARGET_LEVEL));
    setUserTotalXP(Math.max(0, data.user_total_xp ?? DEFAULT_USER_TOTAL_XP));
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
    setUserTotalXP(Math.max(0, draft.userTotalXP ?? DEFAULT_USER_TOTAL_XP));
  }

  async function loadProgress(userId: string) {
    setProgressLoaded(false);
    setSaveStatus("idle");
    setLoadError(null);

    let progressResult = await supabase
      .from("xp_progress")
      .select(getProgressSelectColumns())
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    while (isMissingProgressColumn(progressResult.error)) {
      downgradeProgressColumns(progressResult.error);

      progressResult = await supabase
        .from("xp_progress")
        .select(getProgressSelectColumns())
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!progressResult.error) break;
      if (!isMissingProgressColumn(progressResult.error)) break;
      if (!levelColumnsAvailable.current && !userTotalXPColumnAvailable.current) {
        break;
      }
    }

    const { data, error } = progressResult;

    if (error) {
      console.error("Erro ao carregar progresso:", error);
      setLoadError("Não foi possível carregar seu progresso.");
      setProgressLoaded(true);
      setSaveStatus("error");
      return;
    }

    if (!data) {
      const baseInsert = {
        user_id: userId,
        total_xp: DEFAULT_TOTAL_XP,
        current_xp: DEFAULT_CURRENT_XP,
        daily_goal: DEFAULT_DAILY_GOAL,
        history: [],
        reached_milestones: [],
        last_saved_xp: DEFAULT_CURRENT_XP,
        dark_mode: true,
      };

      let createResult = await supabase
        .from("xp_progress")
        .insert({
          ...baseInsert,
          ...(levelColumnsAvailable.current
            ? {
                current_level: DEFAULT_CURRENT_LEVEL,
                target_level: DEFAULT_TARGET_LEVEL,
              }
            : {}),
          ...(userTotalXPColumnAvailable.current
            ? {
                user_total_xp: DEFAULT_USER_TOTAL_XP,
              }
            : {}),
        })
        .select(getProgressSelectColumns())
        .single();

      while (isMissingProgressColumn(createResult.error)) {
        downgradeProgressColumns(createResult.error);

        createResult = await supabase
          .from("xp_progress")
          .insert({
            ...baseInsert,
            ...(levelColumnsAvailable.current
              ? {
                  current_level: DEFAULT_CURRENT_LEVEL,
                  target_level: DEFAULT_TARGET_LEVEL,
                }
              : {}),
            ...(userTotalXPColumnAvailable.current
              ? {
                  user_total_xp: DEFAULT_USER_TOTAL_XP,
                }
              : {}),
          })
          .select(getProgressSelectColumns())
          .single();

        if (!createResult.error) break;
        if (!isMissingProgressColumn(createResult.error)) break;
        if (!levelColumnsAvailable.current && !userTotalXPColumnAvailable.current) {
          break;
        }
      }

      const { data: created, error: createError } = createResult;

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
    if (guestMode || !billing.canUseCloudSync) return;
    if (!user || !progressLoaded || loadError) return;

    setSaveStatus("saving");

    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = setTimeout(async () => {
      const baseUpdate = {
        total_xp: totalXP,
        current_xp: currentXP,
        daily_goal: dailyGoal,
        history,
        reached_milestones: reachedMilestones,
        last_saved_xp: lastSavedXP,
        dark_mode: darkMode,
        updated_at: new Date().toISOString(),
      };

      let saveResult = await supabase
        .from("xp_progress")
        .update(buildProgressPayload(baseUpdate, userTotalXP))
        .eq("user_id", user.id);

      while (isMissingProgressColumn(saveResult.error)) {
        downgradeProgressColumns(saveResult.error);

        saveResult = await supabase
          .from("xp_progress")
          .update(buildProgressPayload(baseUpdate, userTotalXP))
          .eq("user_id", user.id);

        if (!saveResult.error) break;
        if (!isMissingProgressColumn(saveResult.error)) break;
        if (!levelColumnsAvailable.current && !userTotalXPColumnAvailable.current) {
          break;
        }
      }

      if (saveResult.error) {
        console.error("Erro ao salvar progresso:", saveResult.error);
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
    billing.canUseCloudSync,
    progressLoaded,
    loadError,
    totalXP,
    currentXP,
    dailyGoal,
    history,
    reachedMilestones,
    lastSavedXP,
    darkMode,
    currentLevel,
    targetLevel,
    userTotalXP,
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
    setUserTotalXP((prev) => prev + xpGained);
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
    setUserTotalXP((prev) => prev + appliedXP);
    setHistory((prev) => [entry, ...prev]);
    setLastSavedXP(newCurrentXP);
  }

  function undoLastProgress() {
    const [lastEntry, ...remainingHistory] = history;

    if (!lastEntry) return;

    const restoredCurrentXP = Math.min(
      totalXP,
      Math.max(0, lastEntry.xpRemaining + lastEntry.xpGained)
    );
    const restoredPercentage =
      totalXP > 0 ? clamp(((totalXP - restoredCurrentXP) / totalXP) * 100, 0, 100) : 0;

    setHistory(remainingHistory);
    setCurrentXP(restoredCurrentXP);
    setLastSavedXP(restoredCurrentXP);
    setUserTotalXP((prev) => Math.max(0, prev - lastEntry.xpGained));
    setReachedMilestones(
      MILESTONES.filter((milestone) => restoredPercentage >= milestone)
    );
    setActiveMilestone(null);
    setBarPulsing(false);
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
    userTotalXP,
  }: {
    totalXP: number;
    currentXP: number;
    dailyGoal: number;
    currentLevel: number;
    targetLevel: number;
    userTotalXP: number;
  }) {
    setTotalXP(totalXP);
    setCurrentXP(currentXP);
    setDailyGoal(dailyGoal);
    setCurrentLevel(sanitizeLevel(currentLevel));
    setTargetLevel(sanitizeLevel(targetLevel));
    setUserTotalXP(Math.max(0, userTotalXP));
    setLastSavedXP(currentXP);
    setHistory([]);
    setReachedMilestones([]);
    setActiveMilestone(null);
    setBarPulsing(false);
  }

  async function updateProgressSettings({
    totalXP: nextTotalXP,
    currentXP: nextCurrentXP,
    dailyGoal: nextDailyGoal,
    currentLevel: nextCurrentLevel,
    targetLevel: nextTargetLevel,
    userTotalXP: nextUserTotalXP,
  }: {
    totalXP: number;
    currentXP: number;
    dailyGoal: number;
    currentLevel: number;
    targetLevel: number;
    userTotalXP: number;
  }) {
    const sanitizedCurrentXP = Math.max(0, nextCurrentXP);
    const sanitizedCurrentLevel = sanitizeLevel(nextCurrentLevel);
    const sanitizedTargetLevel = sanitizeLevel(nextTargetLevel);
    const sanitizedUserTotalXP = Math.max(0, nextUserTotalXP);
    const xpGained = currentXP - sanitizedCurrentXP;
    const nextHistory =
      xpGained > 0
        ? [
            {
              date: new Date().toISOString(),
              xpGained,
              xpRemaining: sanitizedCurrentXP,
              totalXP: nextTotalXP,
              source: "Ajuste manual em configurações",
            },
            ...history,
          ]
        : history;

    setTotalXP(nextTotalXP);
    setCurrentXP(sanitizedCurrentXP);
    setDailyGoal(nextDailyGoal);
    setCurrentLevel(sanitizedCurrentLevel);
    setTargetLevel(sanitizedTargetLevel);
    setUserTotalXP(sanitizedUserTotalXP);
    setLastSavedXP(sanitizedCurrentXP);

    if (xpGained > 0) {
      setHistory(nextHistory);
    }

    return persistProgressSnapshot(
      {
        totalXP: nextTotalXP,
        currentXP: sanitizedCurrentXP,
        dailyGoal: nextDailyGoal,
        history: nextHistory,
        reachedMilestones,
        lastSavedXP: sanitizedCurrentXP,
        darkMode,
        currentLevel: sanitizedCurrentLevel,
        targetLevel: sanitizedTargetLevel,
        userTotalXP: sanitizedUserTotalXP,
      },
      { requireUserTotalXP: true }
    );


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
    setCurrentLevel(guestMode ? GUEST_CURRENT_LEVEL : DEFAULT_CURRENT_LEVEL);
    setTargetLevel(guestMode ? GUEST_TARGET_LEVEL : DEFAULT_TARGET_LEVEL);
    setUserTotalXP(DEFAULT_USER_TOTAL_XP);

    if (guestMode || !user) return;

    setSaveStatus("saving");

    const baseReset = {
      total_xp: DEFAULT_TOTAL_XP,
      current_xp: DEFAULT_CURRENT_XP,
      daily_goal: DEFAULT_DAILY_GOAL,
      history: [],
      reached_milestones: [],
      last_saved_xp: DEFAULT_CURRENT_XP,
      dark_mode: true,
      updated_at: new Date().toISOString(),
    };

    let resetResult = await supabase
      .from("xp_progress")
      .update({
        ...baseReset,
        ...(levelColumnsAvailable.current
          ? {
              current_level: DEFAULT_CURRENT_LEVEL,
              target_level: DEFAULT_TARGET_LEVEL,
            }
          : {}),
        ...(userTotalXPColumnAvailable.current
          ? {
              user_total_xp: DEFAULT_USER_TOTAL_XP,
            }
          : {}),
      })
      .eq("user_id", user.id);

    while (isMissingProgressColumn(resetResult.error)) {
      downgradeProgressColumns(resetResult.error);

      resetResult = await supabase
        .from("xp_progress")
        .update({
          ...baseReset,
          ...(levelColumnsAvailable.current
            ? {
                current_level: DEFAULT_CURRENT_LEVEL,
                target_level: DEFAULT_TARGET_LEVEL,
              }
            : {}),
          ...(userTotalXPColumnAvailable.current
            ? {
                user_total_xp: DEFAULT_USER_TOTAL_XP,
              }
            : {}),
        })
        .eq("user_id", user.id);

      if (!resetResult.error) break;
      if (!isMissingProgressColumn(resetResult.error)) break;
      if (!levelColumnsAvailable.current && !userTotalXPColumnAvailable.current) {
        break;
      }
    }

    if (resetResult.error) {
      console.error("Erro ao resetar progresso:", resetResult.error);
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
  const canUndoLastProgress = history.length > 0;
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
    billing,
    userName,
    currentLevel,
    targetLevel,
    userTotalXP,
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
    undoLastProgress,
    canUndoLastProgress,
    configureInitialProgress,
    updateProgressSettings,
    deleteHistoryEntry,
    updateHistoryEntry,
    resetProgress,
  };
}
