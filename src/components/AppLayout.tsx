import React, { useEffect, useState } from "react";
import {
  ViewType,
  Habit,
  Trade,
  Goal,
  BudgetItem,
  DailyReview as DailyReviewType,
  MindsetLog,
  AppSettings,
} from "../types";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import HabitTracker from "./HabitTracker";
import TradeJournal from "./TradeJournalWrapper";
import Analytics from "./Analytics";
import GoalsFinance from "./GoalsFinance";
import Psychology from "./Psychology";
import DailyReview from "./DailyReview";
import Reports from "./Reports";
import Settings from "./Settings";
import { useEliteOS } from "../eliteosStore";

// Default settings (same as before)
const defaultSettings: AppSettings = {
  identityStatement:
    "I am becoming an elite trader with unwavering discipline.",
  displayName: "Elite Trader",
  theme: "dark",
  notifications: true,
  maxConsecutiveLosses: 3,
  maxDailyLoss: 500,
  tradingRules: [
    {
      id: "1",
      text: "I have identified a clear setup with defined entry, stop loss, and target",
      isActive: true,
    },
    {
      id: "2",
      text: "This trade aligns with my trading plan and strategy",
      isActive: true,
    },
    {
      id: "3",
      text: "I am not revenge trading or trying to recover losses",
      isActive: true,
    },
    {
      id: "4",
      text: "My position size is within my risk management rules",
      isActive: true,
    },
    {
      id: "5",
      text: "I am emotionally stable and not trading out of boredom or FOMO",
      isActive: true,
    },
    {
      id: "6",
      text: "I have checked for upcoming news events that could affect this trade",
      isActive: true,
    },
    {
      id: "7",
      text: "I am willing to accept the loss if this trade goes against me",
      isActive: true,
    },
  ],
};

const AppLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");

  const habits = useEliteOS((s) => s.habits);
  const trades = useEliteOS((s) => s.trades);
  const goals = useEliteOS((s) => s.goals);
  const budgetItems = useEliteOS((s) => s.budgetItems);
  const dailyReviews = useEliteOS((s) => s.dailyReviews);
  const mindsetLogs = useEliteOS((s) => s.mindsetLogs);
  const settings = useEliteOS((s) => s.settings);

  const loadAll = useEliteOS((s) => s.loadAll);
  const setHabits = useEliteOS((s) => s.setHabits);
  const setTrades = useEliteOS((s) => s.setTrades);
  const setGoals = useEliteOS((s) => s.setGoals);
  const setBudgetItems = useEliteOS((s) => s.setBudgetItems);
  const setDailyReviews = useEliteOS((s) => s.setDailyReviews);
  const setMindsetLogs = useEliteOS((s) => s.setMindsetLogs);
  const setSettings = useEliteOS((s) => s.setSettings);

  // Load from disk on mount
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Fallback to defaults if settings not yet loaded
  const effectiveSettings: AppSettings = settings ?? defaultSettings;

  // Calculate identity score (unchanged logic)
  const habitsCompletedToday = habits.filter(
    (h) => h.completedToday && h.is_active
  ).length;
  const totalActiveHabits = habits.filter((h) => h.is_active).length;
  const habitCompletionRate =
    totalActiveHabits > 0
      ? (habitsCompletedToday / totalActiveHabits) * 100
      : 0;

  const winningTrades = trades.filter((t) => (t.profit_loss || 0) > 0).length;
  const winRate =
    trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
  const avgDiscipline =
    trades.length > 0
      ? trades.reduce(
          (sum, t) => sum + (t.discipline_score || 5),
          0
        ) / trades.length
      : 0;

  const activeGoals = goals.filter((g) => g.status === "active");
  const goalsProgress =
    activeGoals.length > 0
      ? activeGoals.reduce(
          (sum, g) => sum + (g.current_value / g.target_value) * 100,
          0
        ) / activeGoals.length
      : 0;

  const identityScore = Math.round(
    habitCompletionRate * 0.3 +
      winRate * 0.25 +
      ((avgDiscipline / 10) * 100) * 0.25 +
      goalsProgress * 0.2
  );

  const currentStreak =
    habits.length > 0
      ? Math.max(...habits.map((h) => h.currentStreak || 0), 0)
      : 0;

  // Today's review
  const today = new Date().toISOString().split("T")[0];
  const todayReview =
    dailyReviews.find((r) => r.review_date === today) || null;

  // Handlers (same behaviour, now using store setters)

  const handleToggleHabit = async (habitId: string) => {
    const updated = habits.map((habit) => {
      if (habit.id === habitId) {
        const wasCompleted = habit.completedToday;
        const newStreak = wasCompleted
          ? Math.max((habit.currentStreak || 1) - 1, 0)
          : (habit.currentStreak || 0) + 1;
        const newLongestStreak = Math.max(
          newStreak,
          habit.longestStreak || 0
        );

        return {
          ...habit,
          completedToday: !wasCompleted,
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
        };
      }
      return habit;
    });
    await setHabits(updated);
  };

  const handleAddHabit = async (
    habit: Omit<
      Habit,
      | "id"
      | "created_at"
      | "currentStreak"
      | "longestStreak"
      | "completedToday"
    >
  ) => {
    const newHabit: Habit = {
      ...habit,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      currentStreak: 0,
      longestStreak: 0,
      completedToday: false,
    };
    await setHabits([...habits, newHabit]);
  };

  const handleDeleteHabit = async (habitId: string) => {
    await setHabits(habits.filter((h) => h.id !== habitId));
  };

  const handleAddTrade = async (
    trade: Omit<Trade, "id" | "created_at">
  ) => {
    const newTrade: Trade = {
      ...trade,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    await setTrades([newTrade, ...trades]);
  };

  const handleDeleteTrade = async (tradeId: string) => {
    await setTrades(trades.filter((t) => t.id !== tradeId));
  };

  const handleAddGoal = async (
    goal: Omit<Goal, "id" | "created_at" | "updated_at">
  ) => {
    const newGoal: Goal = {
      ...goal,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await setGoals([...goals, newGoal]);
  };

  const handleUpdateGoal = async (
    goalId: string,
    updates: Partial<Goal>
  ) => {
    const updated = goals.map((g) =>
      g.id === goalId
        ? { ...g, ...updates, updated_at: new Date().toISOString() }
        : g
    );
    await setGoals(updated);
  };

  const handleDeleteGoal = async (goalId: string) => {
    await setGoals(goals.filter((g) => g.id !== goalId));
  };

  const handleAddBudgetItem = async (
    item: Omit<BudgetItem, "id" | "created_at">
  ) => {
    const newItem: BudgetItem = {
      ...item,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    await setBudgetItems([...budgetItems, newItem]);
  };

  const handleToggleBudgetPaid = async (itemId: string) => {
    const updated = budgetItems.map((item) =>
      item.id === itemId ? { ...item, is_paid: !item.is_paid } : item
    );
    await setBudgetItems(updated);
  };

  const handleDeleteBudgetItem = async (itemId: string) => {
    await setBudgetItems(budgetItems.filter((b) => b.id !== itemId));
  };

  const handleSaveReview = async (
    review: Omit<DailyReviewType, "id" | "created_at">
  ) => {
    const existingIndex = dailyReviews.findIndex(
      (r) => r.review_date === review.review_date
    );
    if (existingIndex >= 0) {
      const updated = [...dailyReviews];
      updated[existingIndex] = {
        ...review,
        id: dailyReviews[existingIndex].id,
        created_at: dailyReviews[existingIndex].created_at,
      };
      await setDailyReviews(updated);
    } else {
      const newReview: DailyReviewType = {
        ...review,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
      };
      await setDailyReviews([newReview, ...dailyReviews]);
    }
  };

  const handleAddMindsetLog = async (
    log: Omit<MindsetLog, "id" | "logged_at">
  ) => {
    const newLog: MindsetLog = {
      ...log,
      id: Date.now().toString(),
      logged_at: new Date().toISOString(),
    };
    await setMindsetLogs([newLog, ...mindsetLogs]);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "trade":
      case "trades":
        setCurrentView("trades");
        break;
      case "review":
        setCurrentView("review");
        break;
      case "habits":
        setCurrentView("habits");
        break;
      case "goals":
        setCurrentView("goals");
        break;
      default:
        break;
    }
  };

  // Settings handlers
  const handleUpdateSettings = async (newSettings: AppSettings) => {
    await setSettings(newSettings);
  };

  const handleResetHabits = async () => {
    await setHabits([]);
  };

  const handleResetTrades = async () => {
    await setTrades([]);
  };

  const handleResetGoals = async () => {
    await setGoals([]);
  };

  const handleResetBudget = async () => {
    await setBudgetItems([]);
  };

  const handleResetReviews = async () => {
    await setDailyReviews([]);
  };

  const handleResetMindset = async () => {
    await setMindsetLogs([]);
  };

  const handleResetAllData = async () => {
    await setHabits([]);
    await setTrades([]);
    await setGoals([]);
    await setBudgetItems([]);
    await setDailyReviews([]);
    await setMindsetLogs([]);
    await setSettings(defaultSettings);
  };

  const handleResetStreaksOnly = async () => {
    const updated = habits.map((habit) => ({
      ...habit,
      currentStreak: 0,
      longestStreak: 0,
      completedToday: false,
    }));
    await setHabits(updated);
  };

  const handleImportData = async (data: any) => {
    if (data.habits) await setHabits(data.habits as Habit[]);
    if (data.trades) await setTrades(data.trades as Trade[]);
    if (data.goals) await setGoals(data.goals as Goal[]);
    if (data.budgetItems)
      await setBudgetItems(data.budgetItems as BudgetItem[]);
    if (data.dailyReviews)
      await setDailyReviews(data.dailyReviews as DailyReviewType[]);
    if (data.mindsetLogs)
      await setMindsetLogs(data.mindsetLogs as MindsetLog[]);
    if (data.settings) await setSettings(data.settings as AppSettings);
  };

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <Dashboard
            habits={habits}
            trades={trades}
            goals={goals}
            todayReview={todayReview}
            onQuickAction={handleQuickAction}
          />
        );
      case "habits":
        return (
          <HabitTracker
            habits={habits}
            onToggleHabit={handleToggleHabit}
            onAddHabit={handleAddHabit}
            onDeleteHabit={handleDeleteHabit}
          />
        );
      case "trades":
        return (
          <TradeJournal
            trades={trades}
            onAddTrade={handleAddTrade}
            onDeleteTrade={handleDeleteTrade}
            tradingRules={effectiveSettings.tradingRules}
            maxConsecutiveLosses={effectiveSettings.maxConsecutiveLosses}
          />
        );
      case "analytics":
        return (
          <Analytics
            trades={trades}
            habits={habits}
            goals={goals}
            dailyReviews={dailyReviews}
          />
        );
      case "reports":
        return (
          <Reports
            trades={trades}
            habits={habits}
            goals={goals}
            dailyReviews={dailyReviews}
            budgetItems={budgetItems}
          />
        );
      case "goals":
        return (
          <GoalsFinance
            goals={goals}
            budgetItems={budgetItems}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
            onAddBudgetItem={handleAddBudgetItem}
            onToggleBudgetPaid={handleToggleBudgetPaid}
            onDeleteBudgetItem={handleDeleteBudgetItem}
          />
        );
      case "psychology":
        return (
          <Psychology
            mindsetLogs={mindsetLogs}
            trades={trades}
            onAddMindsetLog={handleAddMindsetLog}
          />
        );
      case "review":
        return (
          <DailyReview
            todayReview={todayReview}
            habits={habits}
            trades={trades}
            onSaveReview={handleSaveReview}
          />
        );
      case "settings":
        return (
          <Settings
            settings={effectiveSettings}
            habits={habits}
            trades={trades}
            goals={goals}
            budgetItems={budgetItems}
            dailyReviews={dailyReviews}
            mindsetLogs={mindsetLogs}
            onUpdateSettings={handleUpdateSettings}
            onResetHabits={handleResetHabits}
            onResetTrades={handleResetTrades}
            onResetGoals={handleResetGoals}
            onResetBudget={handleResetBudget}
            onResetReviews={handleResetReviews}
            onResetMindset={handleResetMindset}
            onResetAllData={handleResetAllData}
            onResetStreaksOnly={handleResetStreaksOnly}
            onImportData={handleImportData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        streakCount={currentStreak}
        identityScore={identityScore}
        identityStatement={effectiveSettings.identityStatement}
      />

      <main className="ml-64 min-h-screen">
        <div className="p-8">{renderView()}</div>
      </main>

      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-64 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default AppLayout;