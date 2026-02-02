import React, { useState, useMemo } from 'react';
import {
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  Flame,
  Download,
  ChevronLeft,
  ChevronRight,
  Award,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { Trade, Habit, Goal, DailyReview, BudgetItem } from '../types';

interface ReportsProps {
  trades: Trade[];
  habits: Habit[];
  goals: Goal[];
  dailyReviews: DailyReview[];
  budgetItems: BudgetItem[];
}

type ReportPeriod = 'week' | 'month';

const Reports: React.FC<ReportsProps> = ({
  trades,
  habits,
  goals,
  dailyReviews,
  budgetItems,
}) => {
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('week');
  const [periodOffset, setPeriodOffset] = useState(0); // 0 = current, -1 = previous, etc.

  // Calculate date range
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date;

    if (reportPeriod === 'week') {
      const dayOfWeek = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek + (periodOffset * 7));
      start.setHours(0, 0, 0, 0);
      
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      start = new Date(now.getFullYear(), now.getMonth() + periodOffset, 1);
      end = new Date(now.getFullYear(), now.getMonth() + periodOffset + 1, 0, 23, 59, 59, 999);
    }

    return { start, end };
  }, [reportPeriod, periodOffset]);

  // Filter data by date range
  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      const date = new Date(t.created_at);
      return date >= dateRange.start && date <= dateRange.end;
    });
  }, [trades, dateRange]);

  const filteredReviews = useMemo(() => {
    return dailyReviews.filter(r => {
      const date = new Date(r.review_date);
      return date >= dateRange.start && date <= dateRange.end;
    });
  }, [dailyReviews, dateRange]);

  // Calculate trading stats
  const tradingStats = useMemo(() => {
    const wins = filteredTrades.filter(t => (t.profit_loss || 0) > 0);
    const losses = filteredTrades.filter(t => (t.profit_loss || 0) < 0);
    const totalPnL = filteredTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const avgDiscipline = filteredTrades.length > 0
      ? filteredTrades.reduce((sum, t) => sum + (t.discipline_score || 5), 0) / filteredTrades.length
      : 0;
    const followedPlan = filteredTrades.filter(t => t.followed_plan).length;

    // Best and worst trades
    const sortedByPnL = [...filteredTrades].sort((a, b) => (b.profit_loss || 0) - (a.profit_loss || 0));
    const bestTrade = sortedByPnL[0];
    const worstTrade = sortedByPnL[sortedByPnL.length - 1];

    // Strategy breakdown
    const strategyStats: Record<string, { wins: number; losses: number; pnl: number }> = {};
    filteredTrades.forEach(trade => {
      const strategy = trade.strategy || 'Unknown';
      if (!strategyStats[strategy]) {
        strategyStats[strategy] = { wins: 0, losses: 0, pnl: 0 };
      }
      if ((trade.profit_loss || 0) > 0) strategyStats[strategy].wins++;
      else if ((trade.profit_loss || 0) < 0) strategyStats[strategy].losses++;
      strategyStats[strategy].pnl += trade.profit_loss || 0;
    });

    // Emotion breakdown
    const emotionStats: Record<string, { count: number; wins: number; pnl: number }> = {};
    filteredTrades.forEach(trade => {
      const emotion = trade.pre_trade_emotion || 'Unknown';
      if (!emotionStats[emotion]) {
        emotionStats[emotion] = { count: 0, wins: 0, pnl: 0 };
      }
      emotionStats[emotion].count++;
      if ((trade.profit_loss || 0) > 0) emotionStats[emotion].wins++;
      emotionStats[emotion].pnl += trade.profit_loss || 0;
    });

    return {
      totalTrades: filteredTrades.length,
      wins: wins.length,
      losses: losses.length,
      winRate: filteredTrades.length > 0 ? (wins.length / filteredTrades.length) * 100 : 0,
      totalPnL,
      avgDiscipline,
      followedPlanRate: filteredTrades.length > 0 ? (followedPlan / filteredTrades.length) * 100 : 0,
      bestTrade,
      worstTrade,
      strategyStats,
      emotionStats,
    };
  }, [filteredTrades]);

  // Calculate habit stats
  const habitStats = useMemo(() => {
    const activeHabits = habits.filter(h => h.is_active);
    const avgStreak = activeHabits.length > 0
      ? activeHabits.reduce((sum, h) => sum + (h.currentStreak || 0), 0) / activeHabits.length
      : 0;
    const maxStreak = habits.length > 0
      ? Math.max(...habits.map(h => h.longestStreak || 0), 0)
      : 0;

    return {
      totalActive: activeHabits.length,
      avgStreak,
      maxStreak,
    };
  }, [habits]);

  // Calculate review stats
  const reviewStats = useMemo(() => {
    const avgMood = filteredReviews.length > 0
      ? filteredReviews.reduce((sum, r) => sum + (r.mood_score || 5), 0) / filteredReviews.length
      : 0;
    const avgEnergy = filteredReviews.length > 0
      ? filteredReviews.reduce((sum, r) => sum + (r.energy_level || 5), 0) / filteredReviews.length
      : 0;
    const avgOverall = filteredReviews.length > 0
      ? filteredReviews.reduce((sum, r) => sum + (r.overall_score || 5), 0) / filteredReviews.length
      : 0;

    // Collect all wins and improvements
    const allWins = filteredReviews.flatMap(r => r.wins || []);
    const allImprovements = filteredReviews.flatMap(r => r.improvements || []);

    return {
      reviewsCompleted: filteredReviews.length,
      avgMood,
      avgEnergy,
      avgOverall,
      topWins: allWins.slice(0, 5),
      topImprovements: allImprovements.slice(0, 5),
    };
  }, [filteredReviews]);

  // Generate insights
  const insights = useMemo(() => {
    const list: { type: 'success' | 'warning' | 'info'; text: string }[] = [];

    if (tradingStats.winRate >= 60) {
      list.push({ type: 'success', text: `Excellent win rate of ${tradingStats.winRate.toFixed(0)}%! Keep up the great work.` });
    } else if (tradingStats.winRate < 40 && tradingStats.totalTrades >= 5) {
      list.push({ type: 'warning', text: `Win rate of ${tradingStats.winRate.toFixed(0)}% needs improvement. Review your entry criteria.` });
    }

    if (tradingStats.avgDiscipline >= 8) {
      list.push({ type: 'success', text: `Strong discipline score of ${tradingStats.avgDiscipline.toFixed(1)}/10. Your trading plan is working.` });
    } else if (tradingStats.avgDiscipline < 6 && tradingStats.totalTrades >= 3) {
      list.push({ type: 'warning', text: `Discipline score of ${tradingStats.avgDiscipline.toFixed(1)}/10 is below target. Use the pre-trade checklist.` });
    }

    if (tradingStats.followedPlanRate < 70 && tradingStats.totalTrades >= 5) {
      list.push({ type: 'warning', text: `Only ${tradingStats.followedPlanRate.toFixed(0)}% of trades followed your plan. Stick to your rules.` });
    }

    if (habitStats.avgStreak >= 7) {
      list.push({ type: 'success', text: `Average habit streak of ${habitStats.avgStreak.toFixed(0)} days shows great consistency.` });
    }

    if (reviewStats.reviewsCompleted < (reportPeriod === 'week' ? 5 : 20)) {
      list.push({ type: 'info', text: `Complete more daily reviews to track your progress and mindset.` });
    }

    // Best emotion insight
    const bestEmotion = Object.entries(tradingStats.emotionStats)
      .filter(([_, stats]) => stats.count >= 3)
      .sort((a, b) => (b[1].wins / b[1].count) - (a[1].wins / a[1].count))[0];
    
    if (bestEmotion) {
      const winRate = (bestEmotion[1].wins / bestEmotion[1].count) * 100;
      list.push({ type: 'info', text: `You trade best when feeling "${bestEmotion[0]}" (${winRate.toFixed(0)}% win rate).` });
    }

    return list;
  }, [tradingStats, habitStats, reviewStats, reportPeriod]);

  // Export report
  const handleExportReport = () => {
    const report = {
      period: reportPeriod,
      dateRange: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      },
      trading: tradingStats,
      habits: habitStats,
      reviews: reviewStats,
      insights: insights.map(i => i.text),
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elite-os-${reportPeriod}ly-report-${dateRange.start.toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (reportPeriod === 'week') {
      return `${dateRange.start.toLocaleDateString('en-US', options)} - ${dateRange.end.toLocaleDateString('en-US', options)}`;
    }
    return dateRange.start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Performance Reports</h1>
          <p className="text-slate-400 mt-1">Auto-generated summaries of your progress</p>
        </div>
        <button
          onClick={handleExportReport}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-lg font-semibold hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <div className="flex items-center gap-2">
          {(['week', 'month'] as const).map((period) => (
            <button
              key={period}
              onClick={() => {
                setReportPeriod(period);
                setPeriodOffset(0);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                reportPeriod === period
                  ? 'bg-amber-500 text-black'
                  : 'text-slate-400 hover:text-white bg-slate-700/50'
              }`}
            >
              {period === 'week' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setPeriodOffset(prev => prev - 1)}
            className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-medium min-w-[180px] text-center">
            {formatDateRange()}
          </span>
          <button
            onClick={() => setPeriodOffset(prev => Math.min(prev + 1, 0))}
            disabled={periodOffset >= 0}
            className={`p-2 rounded-lg bg-slate-700/50 transition-colors ${
              periodOffset >= 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Total Trades</span>
          </div>
          <p className="text-3xl font-black text-white">{tradingStats.totalTrades}</p>
          <p className="text-xs text-slate-500 mt-1">{tradingStats.wins}W / {tradingStats.losses}L</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Win Rate</span>
          </div>
          <p className={`text-3xl font-black ${tradingStats.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
            {tradingStats.winRate.toFixed(1)}%
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            {tradingStats.totalPnL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-xs uppercase tracking-wider">P&L</span>
          </div>
          <p className={`text-3xl font-black ${tradingStats.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {tradingStats.totalPnL >= 0 ? '+' : ''}${tradingStats.totalPnL.toFixed(2)}
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Brain className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Discipline</span>
          </div>
          <p className={`text-3xl font-black ${tradingStats.avgDiscipline >= 7 ? 'text-amber-400' : 'text-slate-300'}`}>
            {tradingStats.avgDiscipline.toFixed(1)}/10
          </p>
        </div>
      </div>

      {/* Main Report Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trading Summary */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            Trading Summary
          </h3>

          {tradingStats.totalTrades > 0 ? (
            <div className="space-y-4">
              {/* Best & Worst Trade */}
              <div className="grid grid-cols-2 gap-4">
                {tradingStats.bestTrade && (
                  <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                    <p className="text-xs text-emerald-400 uppercase mb-1">Best Trade</p>
                    <p className="text-lg font-bold text-white">{tradingStats.bestTrade.symbol}</p>
                    <p className="text-emerald-400 font-medium">
                      +${(tradingStats.bestTrade.profit_loss || 0).toFixed(2)}
                    </p>
                  </div>
                )}
                {tradingStats.worstTrade && (tradingStats.worstTrade.profit_loss || 0) < 0 && (
                  <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                    <p className="text-xs text-red-400 uppercase mb-1">Worst Trade</p>
                    <p className="text-lg font-bold text-white">{tradingStats.worstTrade.symbol}</p>
                    <p className="text-red-400 font-medium">
                      ${(tradingStats.worstTrade.profit_loss || 0).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {/* Strategy Breakdown */}
              <div>
                <p className="text-sm text-slate-400 mb-2">Strategy Performance</p>
                <div className="space-y-2">
                  {Object.entries(tradingStats.strategyStats)
                    .sort((a, b) => b[1].pnl - a[1].pnl)
                    .slice(0, 5)
                    .map(([strategy, stats]) => {
                      const total = stats.wins + stats.losses;
                      const winRate = total > 0 ? (stats.wins / total) * 100 : 0;
                      return (
                        <div key={strategy} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                          <div>
                            <span className="text-sm text-white">{strategy}</span>
                            <span className="text-xs text-slate-500 ml-2">
                              {stats.wins}W/{stats.losses}L ({winRate.toFixed(0)}%)
                            </span>
                          </div>
                          <span className={`text-sm font-bold ${stats.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {stats.pnl >= 0 ? '+' : ''}${stats.pnl.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Plan Adherence */}
              <div className="p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Plan Adherence</span>
                  <span className={`text-sm font-bold ${tradingStats.followedPlanRate >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {tradingStats.followedPlanRate.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${tradingStats.followedPlanRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${tradingStats.followedPlanRate}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No trades in this period</p>
            </div>
          )}
        </div>

        {/* Mindset & Habits Summary */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-amber-500" />
            Mindset & Habits
          </h3>

          <div className="space-y-4">
            {/* Review Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-700/30 rounded-lg text-center">
                <p className="text-2xl font-bold text-white">{reviewStats.avgMood.toFixed(1)}</p>
                <p className="text-xs text-slate-500">Avg Mood</p>
              </div>
              <div className="p-3 bg-slate-700/30 rounded-lg text-center">
                <p className="text-2xl font-bold text-white">{reviewStats.avgEnergy.toFixed(1)}</p>
                <p className="text-xs text-slate-500">Avg Energy</p>
              </div>
              <div className="p-3 bg-slate-700/30 rounded-lg text-center">
                <p className="text-2xl font-bold text-amber-400">{reviewStats.avgOverall.toFixed(1)}</p>
                <p className="text-xs text-slate-500">Overall Score</p>
              </div>
            </div>

            {/* Habit Stats */}
            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-amber-400">Habit Streaks</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{habitStats.avgStreak.toFixed(1)}</p>
                  <p className="text-xs text-slate-500">Avg Streak</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-amber-400">{habitStats.maxStreak}</p>
                  <p className="text-xs text-slate-500">Best Streak</p>
                </div>
              </div>
            </div>

            {/* Top Wins */}
            {reviewStats.topWins.length > 0 && (
              <div>
                <p className="text-sm text-slate-400 mb-2">Top Wins This Period</p>
                <div className="space-y-1">
                  {reviewStats.topWins.map((win, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="truncate">{win}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Areas for Improvement */}
            {reviewStats.topImprovements.length > 0 && (
              <div>
                <p className="text-sm text-slate-400 mb-2">Areas for Improvement</p>
                <div className="space-y-1">
                  {reviewStats.topImprovements.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <Target className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="bg-gradient-to-br from-amber-900/30 to-slate-800/50 rounded-2xl p-6 border border-amber-500/20">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Key Insights & Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border ${
                insight.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : insight.type === 'warning'
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-blue-500/10 border-blue-500/30'
              }`}
            >
              <div className="flex items-start gap-3">
                {insight.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : insight.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <Brain className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-sm text-slate-300">{insight.text}</p>
              </div>
            </div>
          ))}
          {insights.length === 0 && (
            <div className="col-span-2 text-center py-8 text-slate-500">
              <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Add more data to generate insights</p>
            </div>
          )}
        </div>
      </div>

      {/* Emotion Performance */}
      {Object.keys(tradingStats.emotionStats).length > 0 && (
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-amber-500" />
            Emotion Performance This Period
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(tradingStats.emotionStats)
              .sort((a, b) => b[1].count - a[1].count)
              .slice(0, 8)
              .map(([emotion, stats]) => {
                const winRate = stats.count > 0 ? (stats.wins / stats.count) * 100 : 0;
                return (
                  <div key={emotion} className="p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-sm font-medium text-white mb-1">{emotion}</p>
                    <p className={`text-lg font-bold ${winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {winRate.toFixed(0)}% WR
                    </p>
                    <p className="text-xs text-slate-500">{stats.count} trades</p>
                    <p className={`text-xs ${stats.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {stats.pnl >= 0 ? '+' : ''}${stats.pnl.toFixed(2)}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
