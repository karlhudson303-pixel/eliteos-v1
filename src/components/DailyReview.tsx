import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Zap,
  Target,
  Brain,
  Heart,
  Trophy,
  ArrowUp,
  Star,
  CheckCircle2,
  Plus,
  X,
  Calendar,
  Flame,
  Award,
} from 'lucide-react';
import { DailyReview as DailyReviewType, Habit, Trade } from '../types';
import Button from './ui/Button';

interface DailyReviewProps {
  todayReview: DailyReviewType | null;
  habits: Habit[];
  trades: Trade[];
  onSaveReview: (review: Omit<DailyReviewType, 'id' | 'created_at'>) => void;
}

const DailyReview: React.FC<DailyReviewProps> = ({
  todayReview,
  habits,
  trades,
  onSaveReview,
}) => {
  const today = new Date().toISOString().split('T')[0];
  
  const [review, setReview] = useState<Omit<DailyReviewType, 'id' | 'created_at'>>({
    user_id: 'user-1',
    review_date: today,
    morning_mindset: todayReview?.morning_mindset || '',
    energy_level: todayReview?.energy_level || 5,
    focus_level: todayReview?.focus_level || 5,
    mood_score: todayReview?.mood_score || 5,
    wins: todayReview?.wins || [],
    improvements: todayReview?.improvements || [],
    gratitude: todayReview?.gratitude || [],
    tomorrow_priorities: todayReview?.tomorrow_priorities || [],
    overall_score: todayReview?.overall_score || 5,
    notes: todayReview?.notes || '',
  });

  const [newWin, setNewWin] = useState('');
  const [newImprovement, setNewImprovement] = useState('');
  const [newGratitude, setNewGratitude] = useState('');
  const [newPriority, setNewPriority] = useState('');

  // Calculate today's stats
  const todayTrades = trades.filter(t => 
    new Date(t.created_at).toDateString() === new Date().toDateString()
  );
  const todayPnL = todayTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
  const todayWinRate = todayTrades.length > 0
    ? (todayTrades.filter(t => (t.profit_loss || 0) > 0).length / todayTrades.length) * 100
    : 0;

  const habitsCompletedToday = habits.filter(h => h.completedToday && h.is_active).length;
  const totalActiveHabits = habits.filter(h => h.is_active).length;
  const habitCompletion = totalActiveHabits > 0 
    ? (habitsCompletedToday / totalActiveHabits) * 100 
    : 0;

  const addToArray = (
    array: string[],
    value: string,
    setter: (arr: string[]) => void,
    clearInput: () => void
  ) => {
    if (value.trim()) {
      setter([...array, value.trim()]);
      clearInput();
    }
  };

  const removeFromArray = (array: string[], index: number, setter: (arr: string[]) => void) => {
    setter(array.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSaveReview(review);
  };

  const ScoreSlider = ({ 
    label, 
    value, 
    onChange, 
    icon: Icon,
    color = 'amber'
  }: { 
    label: string; 
    value: number; 
    onChange: (v: number) => void;
    icon: React.ElementType;
    color?: string;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 text-${color}-500`} />
          <span className="text-sm font-medium text-slate-300">{label}</span>
        </div>
        <span className={`text-lg font-bold text-${color}-500`}>{value}/10</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-amber-500"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Daily Review</h1>
          <p className="text-slate-400 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <Button onClick={handleSave} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
          Save Review
        </Button>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <Trophy className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Habits Done</span>
          </div>
          <p className="text-2xl font-bold text-white">{habitsCompletedToday}/{totalActiveHabits}</p>
          <div className="h-2 bg-slate-700/50 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${habitCompletion}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Trades Today</span>
          </div>
          <p className="text-2xl font-bold text-white">{todayTrades.length}</p>
          <p className="text-xs text-slate-500 mt-1">
            {todayWinRate.toFixed(0)}% win rate
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Today's P&L</span>
          </div>
          <p className={`text-2xl font-bold ${todayPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {todayPnL >= 0 ? '+' : ''}${todayPnL.toFixed(2)}
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-purple-500 mb-2">
            <Flame className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Best Streak</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {habits.length > 0 ? Math.max(...habits.map(h => h.currentStreak || 0), 0) : 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">days</p>
        </div>
      </div>

      {/* Main Review Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Scores & Mindset */}
        <div className="space-y-6">
          {/* Energy & Focus Scores */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Energy & Focus
            </h3>
            <div className="space-y-6">
              <ScoreSlider
                label="Energy Level"
                value={review.energy_level || 5}
                onChange={(v) => setReview({ ...review, energy_level: v })}
                icon={Zap}
                color="amber"
              />
              <ScoreSlider
                label="Focus Level"
                value={review.focus_level || 5}
                onChange={(v) => setReview({ ...review, focus_level: v })}
                icon={Target}
                color="blue"
              />
              <ScoreSlider
                label="Mood Score"
                value={review.mood_score || 5}
                onChange={(v) => setReview({ ...review, mood_score: v })}
                icon={Heart}
                color="pink"
              />
            </div>
          </div>

          {/* Morning Mindset */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              Morning Mindset
            </h3>
            <textarea
              value={review.morning_mindset || ''}
              onChange={(e) => setReview({ ...review, morning_mindset: e.target.value })}
              placeholder="How did you start your day? What's your intention?"
              rows={4}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-none"
            />
          </div>

          {/* Overall Score */}
          <div className="bg-gradient-to-br from-amber-900/30 to-slate-800/50 rounded-2xl p-6 border border-amber-500/20">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Overall Day Score
            </h3>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-6xl font-black text-amber-500">{review.overall_score}</p>
                <p className="text-sm text-slate-400 mt-1">out of 10</p>
              </div>
              <div className="flex-1">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={review.overall_score || 5}
                  onChange={(e) => setReview({ ...review, overall_score: parseInt(e.target.value) })}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Rough day</span>
                  <span>Average</span>
                  <span>Elite day</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Lists */}
        <div className="space-y-6">
          {/* Today's Wins */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-500" />
              Today's Wins
            </h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newWin}
                onChange={(e) => setNewWin(e.target.value)}
                placeholder="What went well today?"
                className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addToArray(review.wins || [], newWin, (arr) => setReview({ ...review, wins: arr }), () => setNewWin(''));
                  }
                }}
              />
              <Button
                size="sm"
                variant="success"
                onClick={() => addToArray(review.wins || [], newWin, (arr) => setReview({ ...review, wins: arr }), () => setNewWin(''))}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {(review.wins || []).map((win, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-slate-300 flex-1">{win}</span>
                  <button
                    onClick={() => removeFromArray(review.wins || [], i, (arr) => setReview({ ...review, wins: arr }))}
                    className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ArrowUp className="w-5 h-5 text-amber-500" />
              Areas for Improvement
            </h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newImprovement}
                onChange={(e) => setNewImprovement(e.target.value)}
                placeholder="What could you do better?"
                className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addToArray(review.improvements || [], newImprovement, (arr) => setReview({ ...review, improvements: arr }), () => setNewImprovement(''));
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => addToArray(review.improvements || [], newImprovement, (arr) => setReview({ ...review, improvements: arr }), () => setNewImprovement(''))}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {(review.improvements || []).map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <ArrowUp className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span className="text-sm text-slate-300 flex-1">{item}</span>
                  <button
                    onClick={() => removeFromArray(review.improvements || [], i, (arr) => setReview({ ...review, improvements: arr }))}
                    className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Gratitude */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Gratitude
            </h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newGratitude}
                onChange={(e) => setNewGratitude(e.target.value)}
                placeholder="What are you grateful for?"
                className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addToArray(review.gratitude || [], newGratitude, (arr) => setReview({ ...review, gratitude: arr }), () => setNewGratitude(''));
                  }
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => addToArray(review.gratitude || [], newGratitude, (arr) => setReview({ ...review, gratitude: arr }), () => setNewGratitude(''))}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {(review.gratitude || []).map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-pink-500/10 rounded-lg border border-pink-500/20">
                  <Star className="w-4 h-4 text-pink-500 flex-shrink-0" />
                  <span className="text-sm text-slate-300 flex-1">{item}</span>
                  <button
                    onClick={() => removeFromArray(review.gratitude || [], i, (arr) => setReview({ ...review, gratitude: arr }))}
                    className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tomorrow's Priorities */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Moon className="w-5 h-5 text-blue-500" />
              Tomorrow's Priorities
            </h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                placeholder="What's most important tomorrow?"
                className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addToArray(review.tomorrow_priorities || [], newPriority, (arr) => setReview({ ...review, tomorrow_priorities: arr }), () => setNewPriority(''));
                  }
                }}
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => addToArray(review.tomorrow_priorities || [], newPriority, (arr) => setReview({ ...review, tomorrow_priorities: arr }), () => setNewPriority(''))}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {(review.tomorrow_priorities || []).map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <Target className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-sm text-slate-300 flex-1">{item}</span>
                  <button
                    onClick={() => removeFromArray(review.tomorrow_priorities || [], i, (arr) => setReview({ ...review, tomorrow_priorities: arr }))}
                    className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-amber-500" />
          Additional Reflections
        </h3>
        <textarea
          value={review.notes || ''}
          onChange={(e) => setReview({ ...review, notes: e.target.value })}
          placeholder="Any other thoughts, lessons learned, or observations from today..."
          rows={4}
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-none"
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" leftIcon={<CheckCircle2 className="w-5 h-5" />}>
          Save Daily Review
        </Button>
      </div>
    </div>
  );
};

export default DailyReview;
