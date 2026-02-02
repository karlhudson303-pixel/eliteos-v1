import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import {
  Habit,
  Trade,
  Goal,
  BudgetItem,
  DailyReview,
  MindsetLog,
  AppSettings,
} from "./types";

type EliteOSState = {
  habits: Habit[];
  trades: Trade[];
  goals: Goal[];
  budgetItems: BudgetItem[];
  dailyReviews: DailyReview[];
  mindsetLogs: MindsetLog[];
  settings: AppSettings | null;

  loadAll: () => Promise<void>;

  setHabits: (habits: Habit[]) => Promise<void>;
  setTrades: (trades: Trade[]) => Promise<void>;
  setGoals: (goals: Goal[]) => Promise<void>;
  setBudgetItems: (items: BudgetItem[]) => Promise<void>;
  setDailyReviews: (reviews: DailyReview[]) => Promise<void>;
  setMindsetLogs: (logs: MindsetLog[]) => Promise<void>;
  setSettings: (settings: AppSettings) => Promise<void>;
};

const FILES = {
  habits: "habits.json",
  trades: "trades.json",
  goals: "goals.json",
  budgetItems: "budget.json",
  dailyReviews: "dailyReviews.json",
  mindsetLogs: "mindsetLogs.json",
  settings: "settings.json",
} as const;

// ======================================================
// REAL WORKING DISK IO (USING YOUR RUST COMMANDS)
// ======================================================

async function loadFromDisk<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await invoke<string>("load_data", { path: file });
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function saveToDisk<T>(file: string, data: T): Promise<void> {
  try {
    await invoke("save_data", {
      path: file,
      data: JSON.stringify(data, null, 2),
    });
  } catch {
    // silent fail
  }
}

// ======================================================
// DEFAULT SETTINGS
// ======================================================

const DEFAULT_SETTINGS: AppSettings = {
  identityStatement: "I am becoming an elite trader with unwavering discipline.",
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

// ======================================================
// ZUSTAND STORE
// ======================================================

export const useEliteOS = create<EliteOSState>((set, get) => ({
  habits: [],
  trades: [],
  goals: [],
  budgetItems: [],
  dailyReviews: [],
  mindsetLogs: [],
  settings: null,

  loadAll: async () => {
    const [
      habits,
      trades,
      goals,
      budgetItems,
      dailyReviews,
      mindsetLogs,
      settings,
    ] = await Promise.all([
      loadFromDisk<Habit[]>(FILES.habits, []),
      loadFromDisk<Trade[]>(FILES.trades, []),
      loadFromDisk<Goal[]>(FILES.goals, []),
      loadFromDisk<BudgetItem[]>(FILES.budgetItems, []),
      loadFromDisk<DailyReview[]>(FILES.dailyReviews, []),
      loadFromDisk<MindsetLog[]>(FILES.mindsetLogs, []),
      loadFromDisk<AppSettings | null>(FILES.settings, null),
    ]);

    let finalSettings = settings;
    if (!finalSettings) {
      finalSettings = DEFAULT_SETTINGS;
      await saveToDisk(FILES.settings, DEFAULT_SETTINGS);
    }

    set({
      habits,
      trades,
      goals,
      budgetItems,
      dailyReviews,
      mindsetLogs,
      settings: finalSettings,
    });
  },

  setHabits: async (habits) => {
    set({ habits });
    await saveToDisk(FILES.habits, habits);
  },

  setTrades: async (trades) => {
    set({ trades });
    await saveToDisk(FILES.trades, trades);
  },

  setGoals: async (goals) => {
    set({ goals });
    await saveToDisk(FILES.goals, goals);
  },

  setBudgetItems: async (items) => {
    set({ budgetItems: items });
    await saveToDisk(FILES.budgetItems, items);
  },

  setDailyReviews: async (reviews) => {
    set({ dailyReviews: reviews });
    await saveToDisk(FILES.dailyReviews, reviews);
  },

  setMindsetLogs: async (logs) => {
    set({ mindsetLogs: logs });
    await saveToDisk(FILES.mindsetLogs, logs);
  },

  setSettings: async (settings) => {
    set({ settings });
    await saveToDisk(FILES.settings, settings);
  },
}));