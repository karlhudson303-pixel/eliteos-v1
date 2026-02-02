import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Flame,
  Trophy,
  Brain,
  DollarSign,
  Activity,
  CheckCircle2,
  Calendar,
  Zap,
  Award,
} from 'lucide-react';
import MetricCard from './ui/MetricCard';
import ProgressRing from './ui/ProgressRing';
import StreakCounter from './ui/StreakCounter';
import { Habit, Trade, Goal, DailyReview } from '../types';

interface DashboardProps {
  habits: Habit[];
  trades: Trade[];
  goals: Goal[];
  todayReview: DailyReview | null;
  onQuickAction: (action: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  habits,
  trades,
  goals,
  todayReview,
  onQuickAction,
}) => {
  // Calculate metrics
  const today = new Date().toISOString().split('T')[0];
  const habitsCompletedToday = habits.filter(h => h.completedToday).length;
  const totalActiveHabits = habits.filter(h => h.is_active).length;
  const habitCompletionRate = totalActiveHabits > 0 ? (habitsCompletedToday / totalActiveHabits) * 100 : 0;

  const winningTrades = trades.filter(t => (t.profit_loss || 0) > 0).length;
  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
  const totalPnL = trades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
  const avgDiscipline = trades.length > 0
    ? trades.reduce((sum, t) => sum + (t.discipline_score || 5), 0) / trades.length
    : 0;

  const currentStreak = habits.length > 0 ? Math.max(...habits.map(h => h.currentStreak || 0), 0) : 0;
  const longestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.longestStreak || 0), 0) : 0;
  const activeGoals = goals.filter(g => g.status === 'active');
  const goalsProgress = activeGoals.length > 0
    ? activeGoals.reduce((sum, g) => sum + (g.current_value / g.target_value) * 100, 0) / activeGoals.length
    : 0;

  // Calculate identity score (composite of all metrics)
  const identityScore = Math.round(
    (habitCompletionRate * 0.3) +
    (winRate * 0.25) +
    ((avgDiscipline / 10) * 100 * 0.25) +
    (goalsProgress * 0.2)
  );

  // Recent trades for quick view
  const recentTrades = trades.slice(0, 5);

  // Weekly P&L calculation
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyTrades = trades.filter(t => new Date(t.created_at) >= weekAgo);
  const weeklyPnL = weeklyTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Command Center</h1>
          <p className="text-slate-400 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onQuickAction('trade')}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Log Trade
          </button>
          <button
            onClick={() => onQuickAction('review')}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-lg font-semibold hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Daily Review
          </button>
        </div>
      </div>

      {/* Identity Score & Streaks Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Identity Score */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Identity Score</h3>
              <p className="text-5xl font-black text-white">{identityScore}<span className="text-2xl text-amber-500">%</span></p>
              <p className="text-sm text-slate-500 mt-2">Your composite performance metric</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-xs text-slate-400">Habits 30%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-slate-400">Trading 50%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs text-slate-400">Goals 20%</span>
                </div>
              </div>
            </div>
            <ProgressRing progress={identityScore} size={140} color="gold" label="ELITE" />
          </div>
        </div>

        {/* Streak Counters */}
        <StreakCounter count={currentStreak} label="Current Streak" size="md" variant="fire" />
        <StreakCounter count={longestStreak} label="Best Streak" size="md" variant="trophy" />
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          subtitle={`${winningTrades}/${trades.length} trades`}
          trend={winRate >= 50 ? 'up' : 'down'}
          icon={<Trophy className="w-5 h-5" />}
          variant={winRate >= 50 ? 'success' : 'danger'}
        />
        <MetricCard
          title="Total P&L"
          value={`${totalPnL >= 0 ? '+' : ''}$${totalPnL.toLocaleString()}`}
          subtitle="All time"
          trend={totalPnL >= 0 ? 'up' : 'down'}
          icon={<DollarSign className="w-5 h-5" />}
          variant={totalPnL >= 0 ? 'success' : 'danger'}
        />
        <MetricCard
          title="Weekly P&L"
          value={`${weeklyPnL >= 0 ? '+' : ''}$${weeklyPnL.toLocaleString()}`}
          subtitle={`${weeklyTrades.length} trades`}
          trend={weeklyPnL >= 0 ? 'up' : 'down'}
          icon={<Activity className="w-5 h-5" />}
          variant={weeklyPnL >= 0 ? 'success' : 'danger'}
        />
        <MetricCard
          title="Discipline"
          value={`${avgDiscipline.toFixed(1)}/10`}
          subtitle="Average score"
          trend={avgDiscipline >= 7 ? 'up' : avgDiscipline >= 5 ? 'neutral' : 'down'}
          icon={<Brain className="w-5 h-5" />}
          variant={avgDiscipline >= 7 ? 'gold' : 'default'}
        />
      </div>

      {/* Today's Progress & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Habits */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Today's Habits</h3>
            <span className="text-sm text-amber-500 font-semibold">
              {habitsCompletedToday}/{totalActiveHabits}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${habitCompletionRate}%` }}
            />
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {habits.filter(h => h.is_active).slice(0, 6).map((habit) => (
              <div
                key={habit.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  habit.completedToday
                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                    : 'bg-slate-700/30 border border-slate-600/30'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  habit.completedToday ? 'bg-emerald-500' : 'bg-slate-600'
                }`}>
                  {habit.completedToday && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <span className={`text-sm ${habit.completedToday ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {habit.name}
                </span>
                {habit.currentStreak && habit.currentStreak > 0 && (
                  <span className="ml-auto text-xs text-amber-500 flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    {habit.currentStreak}
                  </span>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => onQuickAction('habits')}
            className="w-full mt-4 py-2 text-sm text-amber-500 hover:text-amber-400 font-medium transition-colors"
          >
            View All Habits →
          </button>
        </div>

        {/* Recent Trades */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Recent Trades</h3>
            <span className="text-sm text-slate-400">{trades.length} total</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentTrades.length > 0 ? recentTrades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 border border-slate-600/30"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    trade.trade_type === 'long' ? 'bg-emerald-500/20' : 'bg-red-500/20'
                  }`}>
                    {trade.trade_type === 'long' ? (
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{trade.symbol}</p>
                    <p className="text-xs text-slate-500">{trade.strategy || 'No strategy'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${
                    (trade.profit_loss || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {(trade.profit_loss || 0) >= 0 ? '+' : ''}${(trade.profit_loss || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {trade.discipline_score}/10 discipline
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-500">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No trades logged yet</p>
              </div>
            )}
          </div>

          <button
            onClick={() => onQuickAction('trades')}
            className="w-full mt-4 py-2 text-sm text-amber-500 hover:text-amber-400 font-medium transition-colors"
          >
            View Trade Journal →
          </button>
        </div>

        {/* Goals Progress */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Active Goals</h3>
            <span className="text-sm text-slate-400">{activeGoals.length} goals</span>
          </div>

          <div className="space-y-4 max-h-48 overflow-y-auto">
            {activeGoals.length > 0 ? activeGoals.slice(0, 4).map((goal) => {
              const progress = (goal.current_value / goal.target_value) * 100;
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{goal.title}</span>
                    <span className="text-xs text-amber-500 font-medium">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>${goal.current_value.toLocaleString()}</span>
                    <span>${goal.target_value.toLocaleString()}</span>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-8 text-slate-500">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active goals</p>
              </div>
            )}
          </div>

          <button
            onClick={() => onQuickAction('goals')}
            className="w-full mt-4 py-2 text-sm text-amber-500 hover:text-amber-400 font-medium transition-colors"
          >
            Manage Goals →
          </button>
        </div>
      </div>

      {/* Motivational Quote / Daily Focus */}
      <div className="bg-gradient-to-r from-amber-900/30 via-slate-800/50 to-red-900/30 rounded-2xl p-6 border border-amber-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Daily Focus</h3>
            <p className="text-slate-300 italic">
              "Discipline is choosing between what you want now and what you want most."
            </p>
            <p className="text-sm text-slate-500 mt-2">— Abraham Lincoln</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-amber-500 font-semibold">Stay focused</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
