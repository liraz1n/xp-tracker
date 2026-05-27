"use client";

import { useState, type ReactNode } from "react";
import { LoginScreen } from "~/components/xp-tracker/LoginScreen";
import { DashboardHeader } from "~/components/xp-tracker/DashboardHeader";
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
import { UsageAchievementsCard } from "~/components/xp-tracker/UsageAchievementsCard";
import { SiteFooter } from "~/components/xp-tracker/SiteFooter";
import { useXpTracker, type HistoryEntry } from "~/hooks/useXpTracker";

type SidebarTab = "historico" | "grafico";

interface MobileDashboardSectionProps {
  title: string;
  description: string;
  defaultOpen?: boolean;
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
  theme,
  children,
}: MobileDashboardSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="md:contents">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`${theme.card} md:hidden w-full border rounded-2xl px-4 py-3 text-left transition-all ${
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

      <div className={`${open ? "block" : "hidden"} md:block`}>
        {children}
      </div>
    </section>
  );
}

export default function Home() {
  const tracker = useXpTracker();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("historico");
  const [historyEntryToDelete, setHistoryEntryToDelete] = useState<number | null>(null);
  const [historyEntryToEdit, setHistoryEntryToEdit] = useState<number | null>(null);

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
    tracker.saveProgress();
    setSidebarOpen(true);
    setSidebarTab("historico");
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
    <div className={`min-h-screen ${theme.bg} ${theme.text} transition-colors duration-300`}>
      <div className={`transition-all duration-300 ${sidebarOpen ? "md:mr-80" : "mr-0"}`}>
        <main className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
          <DashboardHeader
            userName={tracker.userName}
            darkMode={tracker.darkMode}
            saveStatus={tracker.saveStatus}
            historyCount={tracker.history.length}
            guestMode={tracker.guestMode}
            theme={theme}
            onToggleDarkMode={() => tracker.setDarkMode((prev) => !prev)}
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            onOpenSettings={() => setShowSettings(true)}
            onLoginWithGoogle={tracker.loginWithGoogle}
            onLogout={tracker.logout}
          />

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

          {!shouldShowOnboarding && (
            <FarmRunsCard
              currentXP={tracker.currentXP}
              currentLevel={tracker.currentLevel}
              totalXP={tracker.totalXP}
              theme={theme}
              onApplyFarmProgress={tracker.applyFarmProgress}
            />
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

          {!shouldShowOnboarding && (
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

          {!shouldShowOnboarding && (
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
              disabled={tracker.xpGainedSinceLastSave <= 0}
              className="bg-gradient-to-r from-emerald-500 to-emerald-700 hover:scale-105 transition-all duration-300 px-5 py-3 rounded-2xl font-bold shadow-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Salvar Progresso{" "}
              {tracker.xpGainedSinceLastSave > 0 &&
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
        formatEntryDate={formatEntryDate}
        theme={theme}
      />

      <SettingsPanel
        open={showSettings}
        totalXP={tracker.totalXP}
        currentXP={tracker.currentXP}
        dailyGoal={tracker.dailyGoal}
        currentLevel={tracker.currentLevel}
        targetLevel={tracker.targetLevel}
        theme={theme}
        onClose={() => setShowSettings(false)}
        onReset={() => setShowResetModal(true)}
        onSave={tracker.updateProgressSettings}
      />

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
              <p className="text-emerald-400 font-black text-lg">
                +{pendingDeleteEntry.xpGained.toLocaleString("pt-BR")} XP
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
