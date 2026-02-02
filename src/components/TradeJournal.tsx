import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Image,
  Search,
  X,
  Eye,
  Trash2,
  HardDrive,
  ClipboardCheck,
  AlertTriangle,
} from "lucide-react";
import { Trade, TradingRule } from "../types";
import Button from "./ui/Button";
import Modal from "./ui/Modal";

import {
  saveScreenshot,
  getScreenshot,
  deleteScreenshot,
  getStorageStats,
} from "../lib/screenshotStorage";

import { useEliteOS } from "../eliteosStore";
import { v4 as uuid } from "uuid";

const emotions = [
  "Confident",
  "Calm",
  "Anxious",
  "FOMO",
  "Greedy",
  "Fearful",
  "Neutral",
  "Excited",
  "Frustrated",
  "Disciplined",
];

const strategies = [
  "Breakout",
  "Pullback",
  "Reversal",
  "Trend Following",
  "Range Trading",
  "Scalping",
  "Swing",
  "Position",
  "News Trading",
];

const timeframes = ["1m", "5m", "15m", "30m", "1H", "4H", "Daily", "Weekly"];

const defaultTradingRules: TradingRule[] = [
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
];

const TradeJournal: React.FC = () => {
  const { trades, setTrades } = useEliteOS();

  const tradingRules = defaultTradingRules;
  const maxConsecutiveLosses = 3;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "long" | "short">("all");
  const [filterResult, setFilterResult] = useState<"all" | "win" | "loss">(
    "all"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewingScreenshot, setViewingScreenshot] = useState<string | null>(
    null
  );
  const [storageStats, setStorageStats] = useState<any>(null);
  const [showChecklist, setShowChecklist] = useState(true);
  const [checklistItems, setChecklistItems] = useState<
    Record<string, boolean>
  >({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | null>(null);

  const [newTrade, setNewTrade] = useState<Partial<Trade>>({
    user_id: "user-1",
    symbol: "",
    trade_type: "long",
    entry_price: undefined,
    exit_price: undefined,
    position_size: undefined,
    profit_loss: undefined,
    entry_date: new Date().toISOString().slice(0, 16),
    exit_date: new Date().toISOString().slice(0, 16),
    timeframe: "1H",
    strategy: "",
    setup_type: "",
    screenshot_url: "",
    pre_trade_emotion: "Neutral",
    post_trade_emotion: "Neutral",
    discipline_score: 7,
    followed_plan: true,
    lessons_learned: "",
    tags: [],
    notes: "",
    checklist_completed: false,
    checklist_items: [],
  });

  const consecutiveLosses = React.useMemo(() => {
    let count = 0;
    const sortedTrades = [...trades].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    for (const trade of sortedTrades) {
      if ((trade.profit_loss || 0) < 0) count++;
      else break;
    }
    return count;
  }, [trades]);

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    tradingRules
      .filter((r) => r.isActive)
      .forEach((rule) => {
        initial[rule.id] = false;
      });
    setChecklistItems(initial);
  }, [tradingRules]);

  const allChecklistComplete = React.useMemo(() => {
    const activeRules = tradingRules.filter((r) => r.isActive);
    return activeRules.every((rule) => checklistItems[rule.id]);
  }, [checklistItems, tradingRules]);

  useEffect(() => {
    const loadStorageStats = async () => {
      try {
        const stats = await getStorageStats();
        setStorageStats(stats);
      } catch (error) {
        console.error("Error loading storage stats:", error);
      }
    };
    loadStorageStats();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Image too large! Please use an image under 10MB.");
      return;
    }

    setIsProcessing(true);
    pendingFileRef.current = file;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      setIsProcessing(false);
    };
    reader.onerror = () => {
      alert("Failed to read file. Please try again.");
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const loadScreenshotForViewing = async (trade: Trade) => {
    if (!trade.screenshot_url) {
      setViewingScreenshot(null);
      return;
    }

    try {
      const url = await getScreenshot(trade.screenshot_url);
      setViewingScreenshot(url);
    } catch (error) {
      console.error("Error loading screenshot:", error);
      setViewingScreenshot(null);
    }
  };

  useEffect(() => {
    if (viewingTrade) {
      loadScreenshotForViewing(viewingTrade);
    } else {
      setViewingScreenshot(null);
    }
  }, [viewingTrade]);

  const calculatePnL = () => {
    if (newTrade.entry_price && newTrade.exit_price && newTrade.position_size) {
      const pnl =
        newTrade.trade_type === "long"
          ? (newTrade.exit_price - newTrade.entry_price) *
            newTrade.position_size
          : (newTrade.entry_price - newTrade.exit_price) *
            newTrade.position_size;
      setNewTrade({ ...newTrade, profit_loss: parseFloat(pnl.toFixed(2)) });
    }
  };

  const handleAddTrade = async () => {
    if (!newTrade.symbol) return;

    let screenshotId = "";

    if (pendingFileRef.current) {
      try {
        setIsProcessing(true);
        screenshotId = await saveScreenshot(
          Date.now().toString(),
          pendingFileRef.current,
          newTrade.symbol
        );
      } catch (error) {
        console.error("Error saving screenshot:", error);
        alert("Failed to save screenshot, but trade will be logged.");
      } finally {
        setIsProcessing(false);
      }
    }

    const completedItems = tradingRules
      .filter((r) => r.isActive && checklistItems[r.id])
      .map((r) => r.text);

    const tradeToAdd: Trade = {
      id: uuid(),
      created_at: new Date().toISOString(),
      user_id: newTrade.user_id || "user-1",
      symbol: newTrade.symbol || "",
      trade_type: newTrade.trade_type || "long",
      entry_price: newTrade.entry_price || 0,
      exit_price: newTrade.exit_price || 0,
      position_size: newTrade.position_size || 0,
      profit_loss: newTrade.profit_loss || 0,
      entry_date: newTrade.entry_date || new Date().toISOString(),
      exit_date: newTrade.exit_date || new Date().toISOString(),
      timeframe: newTrade.timeframe || "1H",
      strategy: newTrade.strategy || "",
      setup_type: newTrade.setup_type || "",
      screenshot_url: screenshotId,
      pre_trade_emotion: newTrade.pre_trade_emotion || "Neutral",
      post_trade_emotion: newTrade.post_trade_emotion || "Neutral",
      discipline_score: newTrade.discipline_score || 7,
      followed_plan: newTrade.followed_plan ?? true,
      lessons_learned: newTrade.lessons_learned || "",
      tags: newTrade.tags || [],
      notes: newTrade.notes || "",
      checklist_completed: allChecklistComplete,
      checklist_items: completedItems,
    };

    const currentTrades = useEliteOS.getState().trades;
    await useEliteOS.getState().setTrades([...currentTrades, tradeToAdd]);

    setNewTrade({
      user_id: "user-1",
      symbol: "",
      trade_type: "long",
      entry_price: undefined,
      exit_price: undefined,
      position_size: undefined,
      profit_loss: undefined,
      entry_date: new Date().toISOString().slice(0, 16),
      exit_date: new Date().toISOString().slice(0, 16),
      timeframe: "1H",
      strategy: "",
      setup_type: "",
      screenshot_url: "",
      pre_trade_emotion: "Neutral",
      post_trade_emotion: "Neutral",
      discipline_score: 7,
      followed_plan: true,
      lessons_learned: "",
      tags: [],
      notes: "",
      checklist_completed: false,
      checklist_items: [],
    });
    setPreviewUrl(null);
    pendingFileRef.current = null;
    setIsAddModalOpen(false);

    const initial: Record<string, boolean> = {};
    tradingRules
      .filter((r) => r.isActive)
      .forEach((rule) => {
        initial[rule.id] = false;
      });
    setChecklistItems(initial);

    try {
      const stats = await getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error("Error reloading storage stats:", error);
    }
  };

  const handleDeleteTradeWithScreenshot = async (tradeId: string) => {
    const trade = trades.find((t) => t.id === tradeId);
    if (trade?.screenshot_url) {
      try {
        await deleteScreenshot(trade.screenshot_url);
      } catch (error) {
        console.error("Error deleting screenshot:", error);
      }
    }

    const remaining = trades.filter((t) => t.id !== tradeId);
    await useEliteOS.getState().setTrades(remaining);

    try {
      const stats = await getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error("Error reloading storage stats:", error);
    }
  };

  const filteredTrades = trades.filter((trade) => {
    const matchesSearch =
      trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.strategy?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || trade.trade_type === filterType;
    const matchesResult =
      filterResult === "all" ||
      (filterResult === "win" && (trade.profit_loss || 0) > 0) ||
      (filterResult === "loss" && (trade.profit_loss || 0) <= 0);
    return matchesSearch && matchesType && matchesResult;
  });

  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => (t.profit_loss || 0) > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const totalPnL = trades.reduce(
    (sum, t) => sum + (t.profit_loss || 0),
    0
  );
  const avgDiscipline =
    totalTrades > 0
      ? trades.reduce(
          (sum, t) => sum + (t.discipline_score || 5),
          0
        ) / totalTrades
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Trade Journal
          </h1>
          <p className="text-slate-400 mt-1">
            Track, analyze, and improve your trading
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg text-slate-400 border border-slate-700/50">
            <HardDrive className="w-4 h-4" />
            <span className="text-sm">
              {storageStats ? `${storageStats.totalSizeMB} MB` : "Storage"}
            </span>
          </button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Log Trade
          </Button>
        </div>
      </div>

      {/* Consecutive Loss Warning */}
      {consecutiveLosses >= maxConsecutiveLosses && (
        <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-red-400">Stop Trading Alert</h3>
            <p className="text-sm text-slate-300">
              You have {consecutiveLosses} consecutive losses. Take a break,
              review your trades, and reset mentally before continuing.
            </p>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
            Total Trades
          </p>
          <p className="text-2xl font-bold text-white">{totalTrades}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
            Win Rate
          </p>
          <p
            className={`text-2xl font-bold ${
              winRate >= 50 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {winRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
            Total P&L
          </p>
          <p
            className={`text-2xl font-bold ${
              totalPnL >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
            Avg Discipline
          </p>
          <p
            className={`text-2xl font-bold ${
              avgDiscipline >= 7 ? "text-amber-400" : "text-slate-300"
            }`}
          >
            {avgDiscipline.toFixed(1)}/10
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search trades..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              filterType === "all"
                ? "bg-amber-500 text-black"
                : "bg-slate-800/50 text-slate-400 hover:text-white"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType("long")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
              filterType === "long"
                ? "bg-emerald-500 text-white"
                : "bg-slate-800/50 text-slate-400 hover:text-white"
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Long
          </button>
          <button
            onClick={() => setFilterType("short")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
              filterType === "short"
                ? "bg-red-500 text-white"
                : "bg-slate-800/50 text-slate-400 hover:text-white"
            }`}
          >
            <TrendingDown className="w-4 h-4" /> Short
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterResult("all")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              filterResult === "all"
                ? "bg-amber-500 text-black"
                : "bg-slate-800/50 text-slate-400 hover:text-white"
            }`}
          >
            All Results
          </button>
          <button
            onClick={() => setFilterResult("win")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              filterResult === "win"
                ? "bg-emerald-500 text-white"
                : "bg-slate-800/50 text-slate-400 hover:text-white"
            }`}
          >
            Winners
          </button>
          <button
            onClick={() => setFilterResult("loss")}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              filterResult === "loss"
                ? "bg-red-500 text-white"
                : "bg-slate-800/50 text-slate-400 hover:text-white"
            }`}
          >
            Losers
          </button>
        </div>
      </div>

      {/* Trades List */}
      <div className="space-y-3">
        {filteredTrades.length > 0 ? (
          filteredTrades.map((trade) => (
            <div
              key={trade.id}
              className={`bg-slate-800/50 rounded-xl p-4 border transition-all hover:border-slate-600/50 cursor-pointer ${
                (trade.profit_loss || 0) >= 0
                  ? "border-emerald-500/20"
                  : "border-red-500/20"
              }`}
              onClick={() => setViewingTrade(trade)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      trade.trade_type === "long"
                        ? "bg-emerald-500/20"
                        : "bg-red-500/20"
                    }`}
                  >
                    {trade.trade_type === "long" ? (
                      <TrendingUp className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">
                        {trade.symbol}
                      </h3>
                      {trade.screenshot_url && (
                        <Image className="w-4 h-4 text-slate-500" />
                      )}
                      {trade.checklist_completed && (
                        <ClipboardCheck className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span>{trade.strategy || "No strategy"}</span>
                      <span>•</span>
                      <span>{trade.timeframe}</span>
                      <span>•</span>
                      <span>
                        {new Date(
                          trade.entry_date || trade.created_at
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p
                      className={`text-xl font-bold ${
                        (trade.profit_loss || 0) >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {(trade.profit_loss || 0) >= 0 ? "+" : ""}$
                      {(trade.profit_loss || 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-slate-500">
                      Discipline: {trade.discipline_score}/10
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingTrade(trade);
                      }}
                      className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTradeWithScreenshot(trade.id);
                      }}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No trades found</p>
            <p className="text-sm mt-1">
              Start logging your trades to track your progress
            </p>
          </div>
        )}
      </div>

      {/* Add Trade Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setPreviewUrl(null);
          pendingFileRef.current = null;
        }}
        title="Log New Trade"
        size="xl"
      >
        <div className="space-y-6">
          {/* Pre-Trade Checklist */}
          {showChecklist && (
            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/30">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4" />
                  Pre-Trade Checklist
                </h4>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded ${
                    allChecklistComplete
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-700/50 text-slate-400"
                  }`}
                >
                  {
                    Object.values(checklistItems).filter(Boolean)
                      .length
                  }
                  /{tradingRules.filter((r) => r.isActive).length} Complete
                </span>
              </div>
              <div className="space-y-2">
                {tradingRules
                  .filter((r) => r.isActive)
                  .map((rule) => (
                    <label
                      key={rule.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                        checklistItems[rule.id]
                          ? "bg-emerald-500/10"
                          : "hover:bg-slate-700/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checklistItems[rule.id] || false}
                        onChange={(e) =>
                          setChecklistItems({
                            ...checklistItems,
                            [rule.id]: e.target.checked,
                          })
                        }
                        className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500"
                      />
                      <span
                        className={`text-sm ${
                          checklistItems[rule.id]
                            ? "text-emerald-400"
                            : "text-slate-300"
                        }`}
                      >
                        {rule.text}
                      </span>
                    </label>
                  ))}
              </div>
              {!allChecklistComplete && (
                <p className="text-xs text-amber-400 mt-3 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Complete all items before logging your trade for better
                  discipline tracking
                </p>
              )}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Symbol
              </label>
              <input
                type="text"
                value={newTrade.symbol}
                onChange={(e) =>
                  setNewTrade({
                    ...newTrade,
                    symbol: e.target.value.toUpperCase(),
                  })
                }
                placeholder="BTC/USD"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Direction
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setNewTrade({ ...newTrade, trade_type: "long" })
                  }
                  className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    newTrade.trade_type === "long"
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-800/50 text-slate-400 hover:text-white"
                  }`}
                >
                  <TrendingUp className="w-5 h-5" /> Long
                </button>
                <button
                  onClick={() =>
                    setNewTrade({ ...newTrade, trade_type: "short" })
                  }
                  className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    newTrade.trade_type === "short"
                      ? "bg-red-500 text-white"
                      : "bg-slate-800/50 text-slate-400 hover:text-white"
                  }`}
                >
                  <TrendingDown className="w-5 h-5" /> Short
                </button>
              </div>
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Entry Price
              </label>
              <input
                type="number"
                value={newTrade.entry_price || ""}
                onChange={(e) =>
                  setNewTrade({
                    ...newTrade,
                    entry_price: parseFloat(e.target.value),
                  })
                }
                onBlur={calculatePnL}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Exit Price
              </label>
              <input
                type="number"
                value={newTrade.exit_price || ""}
                onChange={(e) =>
                  setNewTrade({
                    ...newTrade,
                    exit_price: parseFloat(e.target.value),
                  })
                }
                onBlur={calculatePnL}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Position Size
              </label>
              <input
                type="number"
                value={newTrade.position_size || ""}
                onChange={(e) =>
                  setNewTrade({
                    ...newTrade,
                    position_size: parseFloat(e.target.value),
                  })
                }
                onBlur={calculatePnL}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* P&L and Strategy */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                P&L ($)
              </label>
              <input
                type="number"
                value={newTrade.profit_loss || ""}
                onChange={(e) =>
                  setNewTrade({
                    ...newTrade,
                    profit_loss: parseFloat(e.target.value),
                  })
                }
                placeholder="0.00"
                className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl placeholder-slate-500 focus:outline-none ${
                  (newTrade.profit_loss || 0) >= 0
                    ? "border-emerald-500/50 text-emerald-400"
                    : "border-red-500/50 text-red-400"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Strategy
              </label>
              <select
                value={newTrade.strategy}
                onChange={(e) =>
                  setNewTrade({ ...newTrade, strategy: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="">Select strategy</option>
                {strategies.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Timeframe
              </label>
              <select
                value={newTrade.timeframe}
                onChange={(e) =>
                  setNewTrade({ ...newTrade, timeframe: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
              >
                {timeframes.map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Psychology Section */}
          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
            <h4 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              Psychology & Discipline
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Pre-Trade Emotion
                </label>
                <select
                  value={newTrade.pre_trade_emotion}
                  onChange={(e) =>
                    setNewTrade({
                      ...newTrade,
                      pre_trade_emotion: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                >
                  {emotions.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Post-Trade Emotion
                </label>
                <select
                  value={newTrade.post_trade_emotion}
                  onChange={(e) =>
                    setNewTrade({
                      ...newTrade,
                      post_trade_emotion: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                >
                  {emotions.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Discipline Score: {newTrade.discipline_score}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={newTrade.discipline_score}
                onChange={(e) =>
                  setNewTrade({
                    ...newTrade,
                    discipline_score: parseInt(e.target.value),
                  })
                }
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Poor</span>
                <span>Perfect</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <input
                type="checkbox"
                id="followed_plan"
                checked={newTrade.followed_plan}
                onChange={(e) =>
                  setNewTrade({
                    ...newTrade,
                    followed_plan: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500"
              />
              <label htmlFor="followed_plan" className="text-sm text-slate-300">
                I followed my trading plan
              </label>
            </div>
          </div>

          {/* Screenshot Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Screenshot
              <span className="text-xs text-slate-500 ml-2">
                (Saves to disk)
              </span>
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Trade screenshot"
                  className="w-full h-48 object-cover rounded-xl border border-slate-700/50"
                />
                <button
                  onClick={() => {
                    setPreviewUrl(null);
                    pendingFileRef.current = null;
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 rounded-lg text-white hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full py-8 border-2 border-dashed border-slate-700/50 rounded-xl text-slate-400 hover:text-amber-500 hover:border-amber-500/50 transition-all flex flex-col items-center gap-2"
              >
                {isProcessing ? (
                  <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
                ) : (
                  <>
                    <HardDrive className="w-8 h-8" />
                    <span>Upload screenshot</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Lessons Learned */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Lessons Learned
            </label>
            <textarea
              value={newTrade.lessons_learned}
              onChange={(e) =>
                setNewTrade({
                  ...newTrade,
                  lessons_learned: e.target.value,
                })
              }
              placeholder="What did you learn from this trade?"
              rows={3}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setPreviewUrl(null);
                pendingFileRef.current = null;
              }}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTrade}
              disabled={!newTrade.symbol || isProcessing}
              fullWidth
            >
              {isProcessing ? "Saving..." : "Log Trade"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Trade Modal */}
      <Modal
        isOpen={!!viewingTrade}
        onClose={() => {
          setViewingTrade(null);
          setViewingScreenshot(null);
        }}
        title={viewingTrade ? `${viewingTrade.symbol} Trade Details` : ""}
        size="xl"
      >
        {viewingTrade && (
          <div className="space-y-6">
            {/* Trade Header */}
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    viewingTrade.trade_type === "long"
                      ? "bg-emerald-500/20"
                      : "bg-red-500/20"
                  }`}
                >
                  {viewingTrade.trade_type === "long" ? (
                    <TrendingUp className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-red-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {viewingTrade.symbol}
                  </h3>
                  <p className="text-slate-400">
                    {viewingTrade.strategy} • {viewingTrade.timeframe}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-3xl font-bold ${
                    (viewingTrade.profit_loss || 0) >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {(viewingTrade.profit_loss || 0) >= 0 ? "+" : ""}$
                  {(viewingTrade.profit_loss || 0).toFixed(2)}
                </p>
                <p className="text-slate-500">P&L</p>
              </div>
            </div>

            {/* Checklist Status */}
            {viewingTrade.checklist_completed !== undefined && (
              <div
                className={`p-3 rounded-lg flex items-center gap-2 ${
                  viewingTrade.checklist_completed
                    ? "bg-emerald-500/10 border border-emerald-500/30"
                    : "bg-amber-500/10 border border-amber-500/30"
                }`}
              >
                <ClipboardCheck
                  className={`w-5 h-5 ${
                    viewingTrade.checklist_completed
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}
                />
                <span
                  className={`text-sm ${
                    viewingTrade.checklist_completed
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}
                >
                  {viewingTrade.checklist_completed
                    ? "Pre-trade checklist completed"
                    : "Pre-trade checklist incomplete"}
                </span>
              </div>
            )}

            {/* Screenshot */}
            {viewingScreenshot && (
              <div>
                <img
                  src={viewingScreenshot}
                  alt="Trade screenshot"
                  className="w-full rounded-xl border border-slate-700/50"
                />
              </div>
            )}
            {viewingTrade.screenshot_url && !viewingScreenshot && (
              <div className="flex items-center justify-center py-8 text-slate-500">
                <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mr-2" />
                Loading screenshot...
              </div>
            )}

            {/* Trade Details Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-800/30 rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Entry</p>
                <p className="text-lg font-bold text-white">
                  ${viewingTrade.entry_price?.toFixed(2) || "-"}
                </p>
              </div>
              <div className="p-3 bg-slate-800/30 rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Exit</p>
                <p className="text-lg font-bold text-white">
                  ${viewingTrade.exit_price?.toFixed(2) || "-"}
                </p>
              </div>
              <div className="p-3 bg-slate-800/30 rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Size</p>
                <p className="text-lg font-bold text-white">
                  {viewingTrade.position_size || "-"}
                </p>
              </div>
              <div className="p-3 bg-slate-800/30 rounded-lg">
                <p className="text-xs text-slate-500 uppercase">Discipline</p>
                <p
                  className={`text-lg font-bold ${
                    (viewingTrade.discipline_score || 0) >= 7
                      ? "text-amber-400"
                      : "text-slate-300"
                  }`}
                >
                  {viewingTrade.discipline_score}/10
                </p>
              </div>
            </div>

            {/* Psychology */}
            <div className="p-4 bg-slate-800/30 rounded-xl">
              <h4 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-3">
                Psychology
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Pre-Trade Emotion</p>
                  <p className="text-white font-medium">
                    {viewingTrade.pre_trade_emotion || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Post-Trade Emotion</p>
                  <p className="text-white font-medium">
                    {viewingTrade.post_trade_emotion || "-"}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-slate-500">Followed Plan</p>
                <p
                  className={`font-medium ${
                    viewingTrade.followed_plan
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {viewingTrade.followed_plan ? "Yes" : "No"}
                </p>
              </div>
            </div>

            {/* Lessons */}
            {viewingTrade.lessons_learned && (
              <div className="p-4 bg-slate-800/30 rounded-xl">
                <h4 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-2">
                  Lessons Learned
                </h4>
                <p className="text-slate-300">
                  {viewingTrade.lessons_learned}
                </p>
              </div>
            )}

            <Button
              variant="secondary"
              onClick={() => {
                setViewingTrade(null);
                setViewingScreenshot(null);
              }}
              fullWidth
            >
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TradeJournal;