import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Target,
  Brain,
  Flame,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Zap,
  Heart,
} from 'lucide-react';
import { Trade, Habit, Goal, DailyReview } from '../types';

interface AnalyticsProps {
  trades: Trade[];
  habits: Habit[];
  goals: Goal[];
  dailyReviews?: DailyReview[];
}

const Analytics: React.FC<AnalyticsProps> = ({ trades, habits, goals, dailyReviews = [] }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');

  // Filter trades by time range
  const getFilteredTrades = () => {
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0);
    }
    
    return trades.filter(t => new Date(t.created_at) >= startDate);
  };

  const filteredTrades = getFilteredTrades();

  // Trading Statistics
  const totalTrades = filteredTrades.length;
  const winningTrades = filteredTrades.filter(t => (t.profit_loss || 0) > 0);
  const losingTrades = filteredTrades.filter(t => (t.profit_loss || 0) < 0);
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
  const totalPnL = filteredTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
  const avgWin = winningTrades.length > 0
    ? winningTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0) / winningTrades.length
    : 0;
  const avgLoss = losingTrades.length > 0
    ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0) / losingTrades.length)
    : 0;
  const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
  const avgDiscipline = totalTrades > 0
    ? filteredTrades.reduce((sum, t) => sum + (t.discipline_score || 5), 0) / totalTrades
    : 0;

  // ===== NEW: Time-of-Day Analysis =====
  const timeOfDayStats = useMemo(() => {
    const periods = {
      'Early Morning (4-8 AM)': { wins: 0, losses: 0, pnl: 0, count: 0 },
      'Morning (8-12 PM)': { wins: 0, losses: 0, pnl: 0, count: 0 },
      'Afternoon (12-4 PM)': { wins: 0, losses: 0, pnl: 0, count: 0 },
      'Evening (4-8 PM)': { wins: 0, losses: 0, pnl: 0, count: 0 },
      'Night (8 PM-4 AM)': { wins: 0, losses: 0, pnl: 0, count: 0 },
    };

    filteredTrades.forEach(trade => {
      const hour = new Date(trade.entry_date || trade.created_at).getHours();
      let period: keyof typeof periods;
      
      if (hour >= 4 && hour < 8) period = 'Early Morning (4-8 AM)';
      else if (hour >= 8 && hour < 12) period = 'Morning (8-12 PM)';
      else if (hour >= 12 && hour < 16) period = 'Afternoon (12-4 PM)';
      else if (hour >= 16 && hour < 20) period = 'Evening (4-8 PM)';
      else period = 'Night (8 PM-4 AM)';

      periods[period].count++;
      periods[period].pnl += trade.profit_loss || 0;
      if ((trade.profit_loss || 0) > 0) periods[period].wins++;
      else if ((trade.profit_loss || 0) < 0) periods[period].losses++;
    });

    return periods;
  }, [filteredTrades]);

  // Find best trading time
  const bestTradingTime = useMemo(() => {
    let best = { period: '', winRate: 0, pnl: 0 };
    Object.entries(timeOfDayStats).forEach(([period, stats]) => {
      if (stats.count >= 3) {
        const wr = stats.count > 0 ? (stats.wins / stats.count) * 100 : 0;
        if (wr > best.winRate || (wr === best.winRate && stats.pnl > best.pnl)) {
          best = { period, winRate: wr, pnl: stats.pnl };
        }
      }
    });
    return best;
  }, [timeOfDayStats]);

  // ===== NEW: Consecutive Loss Tracking =====
  const consecutiveLossStats = useMemo(() => {
    let currentStreak = 0;
    let maxStreak = 0;
    let streaks: number[] = [];

    // Sort trades by date
    const sortedTrades = [...filteredTrades].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    sortedTrades.forEach(trade => {
      if ((trade.profit_loss || 0) < 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        if (currentStreak > 0) streaks.push(currentStreak);
        currentStreak = 0;
      }
    });
    if (currentStreak > 0) streaks.push(currentStreak);

    // Current losing streak (if last trades are losses)
    const recentTrades = sortedTrades.slice(-10);
    let currentLosingStreak = 0;
    for (let i = recentTrades.length - 1; i >= 0; i--) {
      if ((recentTrades[i].profit_loss || 0) < 0) currentLosingStreak++;
      else break;
    }

    return {
      maxConsecutiveLosses: maxStreak,
      currentLosingStreak,
      avgLossStreak: streaks.length > 0 ? streaks.reduce((a, b) => a + b, 0) / streaks.length : 0,
    };
  }, [filteredTrades]);

  // ===== NEW: Max Drawdown Calculation =====
  const drawdownStats = useMemo(() => {
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnL = 0;
    let currentDrawdown = 0;

    const sortedTrades = [...filteredTrades].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    sortedTrades.forEach(trade => {
      runningPnL += trade.profit_loss || 0;
      if (runningPnL > peak) {
        peak = runningPnL;
        currentDrawdown = 0;
      } else {
        currentDrawdown = peak - runningPnL;
        maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
      }
    });

    return {
      maxDrawdown,
      currentDrawdown,
      recoveryNeeded: currentDrawdown > 0 ? (currentDrawdown / (peak - currentDrawdown + 0.01)) * 100 : 0,
    };
  }, [filteredTrades]);

  // ===== NEW: Monthly P&L Data =====
  const monthlyPnL = useMemo(() => {
    const months: Record<string, { pnl: number; trades: number; wins: number }> = {};
    
    filteredTrades.forEach(trade => {
      const date = new Date(trade.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!months[monthKey]) {
        months[monthKey] = { pnl: 0, trades: 0, wins: 0 };
      }
      months[monthKey].pnl += trade.profit_loss || 0;
      months[monthKey].trades++;
      if ((trade.profit_loss || 0) > 0) months[monthKey].wins++;
    });

    return Object.entries(months)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        ...data,
        winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
      }));
  }, [filteredTrades]);

  // ===== ENHANCED: Emotion Analysis with Clear Win Rates =====
  const emotionStats = useMemo(() => {
    const stats: Record<string, { count: number; wins: number; totalPnL: number }> = {};
    
    filteredTrades.forEach(trade => {
      const emotion = trade.pre_trade_emotion || 'Unknown';
      if (!stats[emotion]) {
        stats[emotion] = { count: 0, wins: 0, totalPnL: 0 };
      }
      stats[emotion].count++;
      if ((trade.profit_loss || 0) > 0) stats[emotion].wins++;
      stats[emotion].totalPnL += trade.profit_loss || 0;
    });

    return Object.entries(stats)
      .map(([emotion, data]) => ({
        emotion,
        ...data,
        winRate: data.count > 0 ? (data.wins / data.count) * 100 : 0,
        avgPnL: data.count > 0 ? data.totalPnL / data.count : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate);
  }, [filteredTrades]);

  // Best and worst emotions
  const bestEmotion = emotionStats.find(e => e.count >= 3) || emotionStats[0];
  const worstEmotion = [...emotionStats].filter(e => e.count >= 3).sort((a, b) => a.winRate - b.winRate)[0];

  // ===== NEW: Habit-Trade Correlation =====
  const habitTradeCorrelation = useMemo(() => {
    // Group trades by date
    const tradesByDate: Record<string, { pnl: number; wins: number; total: number }> = {};
    
    filteredTrades.forEach(trade => {
      const date = new Date(trade.created_at).toISOString().split('T')[0];
      if (!tradesByDate[date]) {
        tradesByDate[date] = { pnl: 0, wins: 0, total: 0 };
      }
      tradesByDate[date].pnl += trade.profit_loss || 0;
      tradesByDate[date].total++;
      if ((trade.profit_loss || 0) > 0) tradesByDate[date].wins++;
    });

    // Get habit completion data from daily reviews
    const habitCompletionByDate: Record<string, number> = {};
    dailyReviews.forEach(review => {
      // Estimate habit completion from overall score or mood
      habitCompletionByDate[review.review_date] = review.overall_score || 5;
    });

    // Correlate
    let highHabitDays = { pnl: 0, wins: 0, total: 0, days: 0 };
    let lowHabitDays = { pnl: 0, wins: 0, total: 0, days: 0 };

    Object.entries(tradesByDate).forEach(([date, data]) => {
      const habitScore = habitCompletionByDate[date] || 5;
      if (habitScore >= 7) {
        highHabitDays.pnl += data.pnl;
        highHabitDays.wins += data.wins;
        highHabitDays.total += data.total;
        highHabitDays.days++;
      } else {
        lowHabitDays.pnl += data.pnl;
        lowHabitDays.wins += data.wins;
        lowHabitDays.total += data.total;
        lowHabitDays.days++;
      }
    });

    return {
      highHabitDays: {
        ...highHabitDays,
        winRate: highHabitDays.total > 0 ? (highHabitDays.wins / highHabitDays.total) * 100 : 0,
        avgPnL: highHabitDays.days > 0 ? highHabitDays.pnl / highHabitDays.days : 0,
      },
      lowHabitDays: {
        ...lowHabitDays,
        winRate: lowHabitDays.total > 0 ? (lowHabitDays.wins / lowHabitDays.total) * 100 : 0,
        avgPnL: lowHabitDays.days > 0 ? lowHabitDays.pnl / lowHabitDays.days : 0,
      },
    };
  }, [filteredTrades, dailyReviews]);

  // Strategy breakdown
  const strategyStats = filteredTrades.reduce((acc, trade) => {
    const strategy = trade.strategy || 'Unknown';
    if (!acc[strategy]) {
      acc[strategy] = { wins: 0, losses: 0, pnl: 0 };
    }
    if ((trade.profit_loss || 0) > 0) {
      acc[strategy].wins++;
    } else {
      acc[strategy].losses++;
    }
    acc[strategy].pnl += trade.profit_loss || 0;
    return acc;
  }, {} as Record<string, { wins: number; losses: number; pnl: number }>);

  // Habit Statistics
  const activeHabits = habits.filter(h => h.is_active);
  const totalCompletedToday = activeHabits.filter(h => h.completedToday).length;
  const habitCompletionRate = activeHabits.length > 0
    ? (totalCompletedToday / activeHabits.length) * 100
    : 0;
  const avgStreak = activeHabits.length > 0
    ? activeHabits.reduce((sum, h) => sum + (h.currentStreak || 0), 0) / activeHabits.length
    : 0;
  const longestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.longestStreak || 0), 0) : 0;

  // Goals Statistics
  const activeGoals = goals.filter(g => g.status === 'active');
  const avgGoalProgress = activeGoals.length > 0
    ? activeGoals.reduce((sum, g) => sum + (g.current_value / g.target_value) * 100, 0) / activeGoals.length
    : 0;

  // Weekly P&L data for chart
  const weeklyPnL = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayTrades = trades.filter(t => {
      const tradeDate = new Date(t.created_at);
      return tradeDate.toDateString() === date.toDateString();
    });
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      pnl: dayTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0),
      trades: dayTrades.length,
    };
  });

  const maxPnL = Math.max(...weeklyPnL.map(d => Math.abs(d.pnl)), 100);
  const maxMonthlyPnL = Math.max(...monthlyPnL.map(d => Math.abs(d.pnl)), 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Analytics Center</h1>
          <p className="text-slate-400 mt-1">Deep insights into your performance</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
          {(['week', 'month', 'year', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeRange === range
                  ? 'bg-amber-500 text-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Win Rate</span>
          </div>
          <p className={`text-3xl font-black ${winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
            {winRate.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-500 mt-1">{winningTrades.length}W / {losingTrades.length}L</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Total P&L</span>
          </div>
          <p className={`text-3xl font-black ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">{totalTrades} trades</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">R:R Ratio</span>
          </div>
          <p className={`text-3xl font-black ${riskRewardRatio >= 1 ? 'text-amber-400' : 'text-slate-300'}`}>
            {riskRewardRatio.toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Avg Win/Loss</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Brain className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Discipline</span>
          </div>
          <p className={`text-3xl font-black ${avgDiscipline >= 7 ? 'text-amber-400' : 'text-slate-300'}`}>
            {avgDiscipline.toFixed(1)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Avg score /10</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Flame className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Best Streak</span>
          </div>
          <p className="text-3xl font-black text-amber-400">{longestStreak}</p>
          <p className="text-xs text-slate-500 mt-1">Days</p>
        </div>
      </div>

      {/* ===== NEW: Psychology-Performance Correlation Banner ===== */}
      {bestEmotion && worstEmotion && totalTrades >= 5 && (
        <div className="bg-gradient-to-r from-purple-900/40 via-slate-800/50 to-blue-900/40 rounded-2xl p-6 border border-purple-500/20">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Emotion-Performance Correlation
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Best State: {bestEmotion.emotion}</span>
              </div>
              <p className="text-3xl font-black text-white">{bestEmotion.winRate.toFixed(0)}% Win Rate</p>
              <p className="text-sm text-slate-400 mt-1">
                {bestEmotion.count} trades • Avg P&L: ${bestEmotion.avgPnL.toFixed(2)}
              </p>
            </div>
            <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-bold">Avoid: {worstEmotion?.emotion || 'N/A'}</span>
              </div>
              <p className="text-3xl font-black text-white">{worstEmotion?.winRate.toFixed(0) || 0}% Win Rate</p>
              <p className="text-sm text-slate-400 mt-1">
                {worstEmotion?.count || 0} trades • Avg P&L: ${worstEmotion?.avgPnL.toFixed(2) || 0}
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-4 italic">
            Trade when you feel <span className="text-emerald-400 font-medium">{bestEmotion.emotion}</span>. 
            Avoid trading when feeling <span className="text-red-400 font-medium">{worstEmotion?.emotion || 'anxious'}</span>.
          </p>
        </div>
      )}

      {/* ===== NEW: Risk Management Alerts ===== */}
      {(consecutiveLossStats.currentLosingStreak >= 2 || drawdownStats.currentDrawdown > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {consecutiveLossStats.currentLosingStreak >= 2 && (
            <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <AlertOctagon className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h4 className="font-bold text-red-400">Consecutive Losses Alert</h4>
                  <p className="text-2xl font-black text-white">{consecutiveLossStats.currentLosingStreak} losses in a row</p>
                  <p className="text-sm text-slate-400">Consider taking a break to reset mentally</p>
                </div>
              </div>
            </div>
          )}
          {drawdownStats.currentDrawdown > 0 && (
            <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-400">Current Drawdown</h4>
                  <p className="text-2xl font-black text-white">${drawdownStats.currentDrawdown.toFixed(2)}</p>
                  <p className="text-sm text-slate-400">Max drawdown: ${drawdownStats.maxDrawdown.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly P&L Chart */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            Weekly P&L
          </h3>
          <div className="flex items-end justify-between h-48 gap-2">
            {weeklyPnL.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center justify-end h-40">
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      day.pnl >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                    style={{
                      height: `${Math.abs(day.pnl) / maxPnL * 100}%`,
                      minHeight: day.pnl !== 0 ? '8px' : '2px',
                    }}
                  />
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs text-slate-500">{day.day}</p>
                  <p className={`text-xs font-medium ${day.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {day.pnl >= 0 ? '+' : ''}${day.pnl.toFixed(0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== NEW: Monthly P&L Chart ===== */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            Monthly P&L
          </h3>
          {monthlyPnL.length > 0 ? (
            <div className="flex items-end justify-between h-48 gap-1 overflow-x-auto">
              {monthlyPnL.map((month, i) => (
                <div key={i} className="flex-1 min-w-[40px] flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-40">
                    <div
                      className={`w-full rounded-t-lg transition-all ${
                        month.pnl >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                      style={{
                        height: `${Math.abs(month.pnl) / maxMonthlyPnL * 100}%`,
                        minHeight: month.pnl !== 0 ? '8px' : '2px',
                      }}
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-xs text-slate-500">{month.month}</p>
                    <p className={`text-xs font-medium ${month.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      ${month.pnl.toFixed(0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500">
              <p>No monthly data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== NEW: Time of Day Analysis ===== */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          Time-of-Day Performance
          {bestTradingTime.period && (
            <span className="ml-auto text-sm font-normal text-emerald-400">
              Best: {bestTradingTime.period} ({bestTradingTime.winRate.toFixed(0)}% WR)
            </span>
          )}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(timeOfDayStats).map(([period, stats]) => {
            const winRate = stats.count > 0 ? (stats.wins / stats.count) * 100 : 0;
            const isBest = period === bestTradingTime.period;
            return (
              <div
                key={period}
                className={`p-4 rounded-xl border ${
                  isBest 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-slate-700/30 border-slate-600/30'
                }`}
              >
                <p className="text-xs text-slate-400 mb-1">{period.split(' ')[0]}</p>
                <p className="text-xs text-slate-500 mb-2">{period.split(' ').slice(1).join(' ')}</p>
                <p className={`text-2xl font-bold ${winRate >= 50 ? 'text-emerald-400' : winRate > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                  {stats.count > 0 ? `${winRate.toFixed(0)}%` : '-'}
                </p>
                <p className="text-xs text-slate-500">{stats.count} trades</p>
                <p className={`text-xs ${stats.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {stats.pnl >= 0 ? '+' : ''}${stats.pnl.toFixed(0)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== NEW: Habit-Trade Correlation ===== */}
      <div className="bg-gradient-to-r from-amber-900/30 via-slate-800/50 to-emerald-900/30 rounded-2xl p-6 border border-amber-500/20">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Habit-Trading Correlation
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 font-bold">High Discipline Days</span>
            </div>
            <p className="text-3xl font-black text-white">
              {habitTradeCorrelation.highHabitDays.winRate.toFixed(0)}% Win Rate
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {habitTradeCorrelation.highHabitDays.total} trades over {habitTradeCorrelation.highHabitDays.days} days
            </p>
            <p className={`text-sm mt-1 ${habitTradeCorrelation.highHabitDays.avgPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              Avg Daily P&L: ${habitTradeCorrelation.highHabitDays.avgPnL.toFixed(2)}
            </p>
          </div>
          <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-slate-400" />
              <span className="text-slate-400 font-bold">Low Discipline Days</span>
            </div>
            <p className="text-3xl font-black text-white">
              {habitTradeCorrelation.lowHabitDays.winRate.toFixed(0)}% Win Rate
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {habitTradeCorrelation.lowHabitDays.total} trades over {habitTradeCorrelation.lowHabitDays.days} days
            </p>
            <p className={`text-sm mt-1 ${habitTradeCorrelation.lowHabitDays.avgPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              Avg Daily P&L: ${habitTradeCorrelation.lowHabitDays.avgPnL.toFixed(2)}
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-400 mt-4 italic">
          Complete your morning habits to improve trading performance. High discipline correlates with better results.
        </p>
      </div>

      {/* Strategy Performance & Emotion Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategy Performance */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-amber-500" />
            Strategy Performance
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {Object.entries(strategyStats).length > 0 ? (
              Object.entries(strategyStats)
                .sort((a, b) => b[1].pnl - a[1].pnl)
                .map(([strategy, stats]) => {
                  const total = stats.wins + stats.losses;
                  const winRate = total > 0 ? (stats.wins / total) * 100 : 0;
                  return (
                    <div key={strategy} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-white">{strategy}</p>
                        <p className="text-xs text-slate-500">{stats.wins}W / {stats.losses}L ({winRate.toFixed(0)}%)</p>
                      </div>
                      <p className={`text-sm font-bold ${stats.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {stats.pnl >= 0 ? '+' : ''}${stats.pnl.toFixed(2)}
                      </p>
                    </div>
                  );
                })
            ) : (
              <div className="text-center py-8 text-slate-500">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No strategy data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Emotion Analysis */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-amber-500" />
            Detailed Emotion Analysis
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {emotionStats.length > 0 ? (
              emotionStats.map((stat) => (
                <div key={stat.emotion} className="p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{stat.emotion}</span>
                    <span className={`text-sm font-bold ${stat.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {stat.winRate.toFixed(0)}% WR
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${stat.winRate >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ width: `${stat.winRate}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">{stat.count} trades</span>
                    <span className={`text-xs ${stat.avgPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      ${stat.avgPnL.toFixed(0)}/trade
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No emotion data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Risk Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <AlertOctagon className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Max Consecutive Losses</span>
          </div>
          <p className={`text-2xl font-bold ${consecutiveLossStats.maxConsecutiveLosses >= 3 ? 'text-red-400' : 'text-white'}`}>
            {consecutiveLossStats.maxConsecutiveLosses}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Max Drawdown</span>
          </div>
          <p className="text-2xl font-bold text-red-400">${drawdownStats.maxDrawdown.toFixed(2)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Avg Win</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">${avgWin.toFixed(2)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Avg Loss</span>
          </div>
          <p className="text-2xl font-bold text-red-400">${avgLoss.toFixed(2)}</p>
        </div>
      </div>

      {/* Habit Progress */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-amber-500" />
          Habit Performance
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-slate-700/30 rounded-xl text-center">
            <p className="text-3xl font-black text-amber-400">{habitCompletionRate.toFixed(0)}%</p>
            <p className="text-xs text-slate-500 mt-1">Today's Completion</p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-xl text-center">
            <p className="text-3xl font-black text-white">{avgStreak.toFixed(1)}</p>
            <p className="text-xs text-slate-500 mt-1">Avg Streak Days</p>
          </div>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {activeHabits.map((habit) => (
            <div key={habit.id} className="flex items-center justify-between p-2 bg-slate-700/20 rounded-lg">
              <span className="text-sm text-slate-300">{habit.name}</span>
              <div className="flex items-center gap-2">
                {habit.currentStreak && habit.currentStreak > 0 && (
                  <span className="text-xs text-amber-500 flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    {habit.currentStreak}
                  </span>
                )}
                {habit.completedToday ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="bg-gradient-to-br from-amber-900/30 to-slate-800/50 rounded-2xl p-6 border border-amber-500/20">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          AI Insights & Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {winRate < 50 && totalTrades > 5 && (
            <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Win Rate Below 50%</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Consider reviewing your entry criteria and waiting for higher probability setups.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {avgDiscipline < 7 && totalTrades > 3 && (
            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-400">Discipline Needs Work</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Your average discipline score is {avgDiscipline.toFixed(1)}. Use the pre-trade checklist.
                  </p>
                </div>
              </div>
            </div>
          )}

          {consecutiveLossStats.maxConsecutiveLosses >= 3 && (
            <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
              <div className="flex items-start gap-3">
                <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Loss Streaks Detected</p>
                  <p className="text-xs text-slate-400 mt-1">
                    You've had {consecutiveLossStats.maxConsecutiveLosses} consecutive losses. Consider stopping after 2-3 losses.
                  </p>
                </div>
              </div>
            </div>
          )}

          {bestTradingTime.period && bestTradingTime.winRate >= 60 && (
            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">Optimal Trading Time</p>
                  <p className="text-xs text-slate-400 mt-1">
                    You perform best during {bestTradingTime.period} with {bestTradingTime.winRate.toFixed(0)}% win rate.
                  </p>
                </div>
              </div>
            </div>
          )}

          {riskRewardRatio >= 1.5 && (
            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">Great Risk:Reward</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Your R:R of {riskRewardRatio.toFixed(2)} is excellent. Keep letting winners run!
                  </p>
                </div>
              </div>
            </div>
          )}

          {habitCompletionRate >= 80 && (
            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <div className="flex items-start gap-3">
                <Flame className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">Habit Consistency</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {habitCompletionRate.toFixed(0)}% completion rate today. You're building strong discipline!
                  </p>
                </div>
              </div>
            </div>
          )}

          {totalTrades === 0 && (
            <div className="p-4 bg-slate-500/10 rounded-xl border border-slate-500/20">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-300">Start Logging Trades</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Begin tracking your trades to unlock powerful analytics and insights.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-400">Daily Review Reminder</p>
                <p className="text-xs text-slate-400 mt-1">
                  Complete your daily review to maintain self-awareness and continuous improvement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
