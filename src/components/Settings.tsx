
import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";

import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  RefreshCcw,
  AlertTriangle,
  CheckCircle,
  HardDrive,
  Database,
  Shield,
  User,
  Zap,
  FileJson,
  FolderOpen,
  RotateCcw,
  Image,
  FileSpreadsheet,
  ClipboardCheck,
  Plus,
  X,
} from "lucide-react";

import {
  Habit,
  Trade,
  Goal,
  BudgetItem,
  DailyReview,
  MindsetLog,
  AppSettings,
  TradingRule,
} from "../types";

interface SettingsProps {
  settings: AppSettings;
  habits: Habit[];
  trades: Trade[];
  goals: Goal[];
  budgetItems: BudgetItem[];
  dailyReviews: DailyReview[];
  mindsetLogs: MindsetLog[];
  onUpdateSettings: (settings: AppSettings) => void;
  onResetHabits: () => void;
  onResetTrades: () => void;
  onResetGoals: () => void;
  onResetBudget: () => void;
  onResetReviews: () => void;
  onResetMindset: () => void;
  onResetAllData: () => void;
  onResetStreaksOnly: () => void;
  onImportData: (data: any) => void;
}

const Settings: React.FC<SettingsProps> = ({
  settings,
  habits,
  trades,
  goals,
  budgetItems,
  dailyReviews,
  mindsetLogs,
  onUpdateSettings,
  onResetHabits,
  onResetTrades,
  onResetGoals,
  onResetBudget,
  onResetReviews,
  onResetMindset,
  onResetAllData,
  onResetStreaksOnly,
  onImportData,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState<string | null>(null);

  const [identityStatement, setIdentityStatement] = useState(
    settings.identityStatement
  );
  const [displayName, setDisplayName] = useState(settings.displayName);
  const [maxConsecutiveLosses, setMaxConsecutiveLosses] = useState(
    settings.maxConsecutiveLosses || 3
  );
  const [maxDailyLoss, setMaxDailyLoss] = useState(
    settings.maxDailyLoss || 500
  );
  const [tradingRules, setTradingRules] = useState<TradingRule[]>(
    settings.tradingRules || []
  );
  const [newRuleText, setNewRuleText] = useState("");

  const [importStatus, setImportStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [exportStatus, setExportStatus] = useState<"idle" | "success">("idle");

  // Screenshot stats
  const [screenshotStats, setScreenshotStats] = useState<{
    count: number;
    sizeMB: number;
  } | null>(null);

  // Screenshot Manager Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [screenshotList, setScreenshotList] = useState<string[]>([]);
  const [thumbnailCache, setThumbnailCache] = useState<Record<string, string>>(
    {}
  );
  const [loadingScreenshots, setLoadingScreenshots] = useState(false);

  // Load screenshot stats
  useEffect(() => {
    refreshScreenshotStats();
  }, []);

  const refreshScreenshotStats = async () => {
    try {
      const [count, totalBytes] = await invoke<[number, number]>(
        "screenshot_stats"
      );
      setScreenshotStats({
        count,
        sizeMB: +(totalBytes / (1024 * 1024)).toFixed(2),
      });
    } catch (err) {
      console.error("Failed to load screenshot stats:", err);
    }
  };

  // Open screenshot folder
  const handleOpenScreenshotFolder = async () => {
    try {
      const baseDir = await invoke<string>("ensure_data_folder");
      const folder = `${baseDir}/screenshots`;
      await open(folder);
    } catch (err) {
      console.error("Failed to open screenshot folder:", err);
    }
  };

  // Open Screenshot Manager Drawer
  const openScreenshotManager = async () => {
    setDrawerOpen(true);
    await loadScreenshotList();
  };

  const loadScreenshotList = async () => {
    setLoadingScreenshots(true);
    try {
      const list = await invoke<string[]>("list_screenshots");
      setScreenshotList(list);
    } catch (err) {
      console.error("Failed to list screenshots:", err);
    }
    setLoadingScreenshots(false);
  };

  const loadThumbnail = async (filename: string) => {
    if (thumbnailCache[filename]) return;

    try {
      const dataUrl = await invoke<string>("load_screenshot", { filename });
      setThumbnailCache((prev) => ({ ...prev, [filename]: dataUrl }));
    } catch (err) {
      console.error("Failed to load screenshot:", err);
    }
  };

  const deleteScreenshot = async (filename: string) => {
    try {
      await invoke("delete_screenshot", { filename });
      await loadScreenshotList();
      await refreshScreenshotStats();
    } catch (err) {
      console.error("Failed to delete screenshot:", err);
    }
  };
  // Calculate storage stats (non-screenshot)
  const calculateStorageSize = () => {
    const data = {
      habits,
      trades,
      goals,
      budgetItems,
      dailyReviews,
      mindsetLogs,
      settings,
    };
    const bytes = new Blob([JSON.stringify(data)]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Export JSON
  const handleExportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      version: "1.0",
      habits,
      trades,
      goals,
      budgetItems,
      dailyReviews,
      mindsetLogs,
      settings,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `elite-os-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportStatus("success");
    setTimeout(() => setExportStatus("idle"), 3000);
  };

  // Export trades CSV
  const handleExportTradesCSV = () => {
    const headers = [
      "Date",
      "Symbol",
      "Type",
      "Entry Price",
      "Exit Price",
      "Position Size",
      "P&L",
      "Strategy",
      "Timeframe",
      "Pre-Trade Emotion",
      "Post-Trade Emotion",
      "Discipline Score",
      "Followed Plan",
      "Lessons Learned",
    ];

    const rows = trades.map((t) => [
      new Date(t.created_at).toLocaleDateString(),
      t.symbol,
      t.trade_type,
      t.entry_price || "",
      t.exit_price || "",
      t.position_size || "",
      t.profit_loss || 0,
      t.strategy || "",
      t.timeframe || "",
      t.pre_trade_emotion || "",
      t.post_trade_emotion || "",
      t.discipline_score || "",
      t.followed_plan ? "Yes" : "No",
      `"${(t.lessons_learned || "").replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `elite-os-trades-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export reviews CSV
  const handleExportReviewsCSV = () => {
    const headers = [
      "Date",
      "Morning Mindset",
      "Energy Level",
      "Focus Level",
      "Mood Score",
      "Overall Score",
      "Wins",
      "Improvements",
      "Gratitude",
      "Notes",
    ];

    const rows = dailyReviews.map((r) => [
      r.review_date,
      `"${(r.morning_mindset || "").replace(/"/g, '""')}"`,
      r.energy_level || "",
      r.focus_level || "",
      r.mood_score || "",
      r.overall_score || "",
      `"${(r.wins || []).join("; ").replace(/"/g, '""')}"`,
      `"${(r.improvements || []).join("; ").replace(/"/g, '""')}"`,
      `"${(r.gratitude || []).join("; ").replace(/"/g, '""')}"`,
      `"${(r.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `elite-os-reviews-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        onImportData(data);
        setImportStatus("success");
        setTimeout(() => setImportStatus("idle"), 3000);
      } catch (error) {
        setImportStatus("error");
        setTimeout(() => setImportStatus("idle"), 3000);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  // Save settings
  const handleSaveSettings = () => {
    onUpdateSettings({
      ...settings,
      identityStatement,
      displayName,
      maxConsecutiveLosses,
      maxDailyLoss,
      tradingRules,
    });
  };

  // Trading rules
  const handleAddRule = () => {
    if (newRuleText.trim()) {
      const newRule: TradingRule = {
        id: Date.now().toString(),
        text: newRuleText.trim(),
        isActive: true,
      };
      setTradingRules([...tradingRules, newRule]);
      setNewRuleText("");
    }
  };

  const handleToggleRule = (ruleId: string) => {
    setTradingRules(
      tradingRules.map((r) =>
        r.id === ruleId ? { ...r, isActive: !r.isActive } : r
      )
    );
  };

  const handleDeleteRule = (ruleId: string) => {
    setTradingRules(tradingRules.filter((r) => r.id !== ruleId));
  };

  // Confirm reset actions
  const confirmAction = (action: string) => {
    switch (action) {
      case "habits":
        onResetHabits();
        break;
      case "trades":
        onResetTrades();
        break;
      case "goals":
        onResetGoals();
        break;
      case "budget":
        onResetBudget();
        break;
      case "reviews":
        onResetReviews();
        break;
      case "mindset":
        onResetMindset();
        break;
      case "streaks":
        onResetStreaksOnly();
        break;
      case "all":
        onResetAllData();
        break;
    }
    setShowConfirmModal(null);
  };

  const dataStats = [
    { label: "Habits", count: habits.length, icon: <Zap className="w-4 h-4" /> },
    {
      label: "Trades",
      count: trades.length,
      icon: <Database className="w-4 h-4" />,
    },
    {
      label: "Goals",
      count: goals.length,
      icon: <Shield className="w-4 h-4" />,
    },
    {
      label: "Budget Items",
      count: budgetItems.length,
      icon: <Database className="w-4 h-4" />,
    },
    {
      label: "Daily Reviews",
      count: dailyReviews.length,
      icon: <FileJson className="w-4 h-4" />,
    },
    {
      label: "Mindset Logs",
      count: mindsetLogs.length,
      icon: <Database className="w-4 h-4" />,
    },
  ];
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-amber-500" />
            Settings & Data Management
          </h1>
          <p className="text-slate-400 mt-1">
            Manage your data, backups, trading rules, and reset options
          </p>
        </div>
      </div>

      {/* Storage Info Card */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <HardDrive className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Local Storage</h2>
            <p className="text-sm text-slate-400">
              All core data is stored locally on your device
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold text-emerald-500">
              {calculateStorageSize()}
            </p>
            <p className="text-xs text-slate-500">
              Total data size (excluding screenshots)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {dataStats.map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/30"
            >
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                {stat.icon}
                <span className="text-xs">{stat.label}</span>
              </div>
              <p className="text-xl font-bold text-white">{stat.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Screenshot Storage Section */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
            <Image className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Screenshot Storage</h2>
            <p className="text-sm text-slate-400">
              Screenshots are stored securely on your device via EliteOS
            </p>
          </div>

          {screenshotStats && (
            <div className="ml-auto text-right">
              <p className="text-2xl font-bold text-pink-400">
                {screenshotStats.sizeMB} MB
              </p>
              <p className="text-xs text-slate-500">
                {screenshotStats.count} screenshots
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleOpenScreenshotFolder}
            className="px-4 py-2 bg-pink-500/20 text-pink-400 font-medium rounded-lg border border-pink-500/30 hover:bg-pink-500/30 transition-all duration-200 flex items-center gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            Open Screenshot Folder
          </button>

          <button
            onClick={openScreenshotManager}
            className="px-4 py-2 bg-pink-500/20 text-pink-400 font-medium rounded-lg border border-pink-500/30 hover:bg-pink-500/30 transition-all duration-200 flex items-center gap-2"
          >
            <Image className="w-4 h-4" />
            Manage Screenshots
          </button>
        </div>
      </div>
      {/* Screenshot Manager Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex justify-end">
          <div className="w-[550px] h-full bg-slate-900 border-l border-slate-700 p-6 overflow-y-auto relative">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Image className="w-5 h-5 text-pink-400" />
              Screenshot Manager
            </h2>

            {loadingScreenshots ? (
              <p className="text-slate-400">Loading screenshots…</p>
            ) : screenshotList.length === 0 ? (
              <p className="text-slate-500">No screenshots found.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {screenshotList.map((file) => {
                  const thumb = thumbnailCache[file];
                  if (!thumb) loadThumbnail(file);

                  return (
                    <div
                      key={file}
                      className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex flex-col gap-3"
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={file}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-32 bg-slate-700/40 rounded-lg animate-pulse" />
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 truncate w-32">
                          {file}
                        </span>
                        <button
                          onClick={() => deleteScreenshot(file)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Identity & Trading Rules */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-slate-700/50 p-6 space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-amber-400" />
          Identity & Trading Rules
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400">Display Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400">Identity Statement</label>
            <textarea
              value={identityStatement}
              onChange={(e) => setIdentityStatement(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white h-24"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">
                Max Consecutive Losses
              </label>
              <input
                type="number"
                value={maxConsecutiveLosses}
                onChange={(e) =>
                  setMaxConsecutiveLosses(Number(e.target.value))
                }
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">Max Daily Loss</label>
              <input
                type="number"
                value={maxDailyLoss}
                onChange={(e) => setMaxDailyLoss(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>

          {/* Trading Rules */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Trading Rules</h3>

            <div className="flex gap-2">
              <input
                value={newRuleText}
                onChange={(e) => setNewRuleText(e.target.value)}
                placeholder="Add new rule…"
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
              <button
                onClick={handleAddRule}
                className="px-3 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/30"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {tradingRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rule.isActive}
                      onChange={() => handleToggleRule(rule.id)}
                    />
                    <span className="text-white">{rule.text}</span>
                  </div>

                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30"
          >
            Save Settings
          </button>
        </div>
      </div>

      {/* Reset & Danger Zone */}
      <div className="bg-gradient-to-br from-red-900/40 to-red-900/20 rounded-2xl border border-red-800/40 p-6 space-y-4">
        <h2 className="text-xl font-bold text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowConfirmModal("habits")}
            className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg"
          >
            Reset Habits
          </button>

          <button
            onClick={() => setShowConfirmModal("trades")}
            className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg"
          >
            Reset Trades
          </button>

          <button
            onClick={() => setShowConfirmModal("goals")}
            className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg"
          >
            Reset Goals
          </button>

          <button
            onClick={() => setShowConfirmModal("budget")}
            className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg"
          >
            Reset Budget
          </button>

          <button
            onClick={() => setShowConfirmModal("reviews")}
            className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg"
          >
            Reset Reviews
          </button>

          <button
            onClick={() => setShowConfirmModal("mindset")}
            className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg"
          >
            Reset Mindset Logs
          </button>

          <button
            onClick={() => setShowConfirmModal("streaks")}
            className="px-4 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg"
          >
            Reset Streaks Only
          </button>

          <button
            onClick={() => setShowConfirmModal("all")}
            className="px-4 py-2 bg-red-600/30 text-red-200 border border-red-600/40 rounded-lg font-bold"
          >
            Reset ALL Data
          </button>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-96 space-y-4">
            <h3 className="text-xl font-bold text-white">Are you sure?</h3>
            <p className="text-slate-400">
              This action cannot be undone. Proceed?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={() => confirmAction(showConfirmModal)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;