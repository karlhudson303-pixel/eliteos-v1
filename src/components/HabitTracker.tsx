import React, { useState } from 'react';
import {
  Plus,
  Flame,
  CheckCircle2,
  Circle,
  Trophy,
  Zap,
  Target,
  Brain,
  Dumbbell,
  BookOpen,
  Coffee,
  Moon,
  Sun,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { Habit } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';

interface HabitTrackerProps {
  habits: Habit[];
  onToggleHabit: (habitId: string) => void;
  onAddHabit: (habit: Omit<Habit, 'id' | 'created_at' | 'currentStreak' | 'longestStreak' | 'completedToday'>) => void;
  onDeleteHabit: (habitId: string) => void;
  onResetStreak?: (habitId: string) => void;
}
const categoryIcons: Record<string, React.ReactNode> = {
  trading: <Target className="w-5 h-5" />,
  health: <Dumbbell className="w-5 h-5" />,
  mindset: <Brain className="w-5 h-5" />,
  productivity: <Zap className="w-5 h-5" />,
  general: <CheckCircle2 className="w-5 h-5" />,
};

const categoryColors: Record<string, string> = {
  trading: 'from-emerald-500 to-emerald-600',
  health: 'from-blue-500 to-blue-600',
  mindset: 'from-purple-500 to-purple-600',
  productivity: 'from-amber-500 to-amber-600',
  general: 'from-slate-500 to-slate-600',
};

const HabitTracker: React.FC<HabitTrackerProps> = ({
  habits,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    category: 'general' as Habit['category'],
    frequency: 'daily' as Habit['frequency'],
    target_count: 1,
    icon: 'check',
    color: 'gold',
    is_active: true,
    user_id: 'user-1',
  });

  const categories = ['all', 'trading', 'health', 'mindset', 'productivity', 'general'];
  const filteredHabits = selectedCategory === 'all'
    ? habits
    : habits.filter(h => h.category === selectedCategory);

  const completedToday = habits.filter(h => h.completedToday && h.is_active).length;
  const totalActive = habits.filter(h => h.is_active).length;
  const completionRate = totalActive > 0 ? (completedToday / totalActive) * 100 : 0;

  const handleAddHabit = () => {
    if (newHabit.name.trim()) {
      onAddHabit(newHabit);
      setNewHabit({
        name: '',
        description: '',
        category: 'general',
        frequency: 'daily',
        target_count: 1,
        icon: 'check',
        color: 'gold',
        is_active: true,
        user_id: 'user-1',
      });
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Habit Tracker</h1>
          <p className="text-slate-400 mt-1">Build discipline through consistent action</p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Habit
        </Button>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Today's Progress</h3>
            <span className="text-2xl font-black text-amber-500">{completedToday}/{totalActive}</span>
          </div>
          <div className="h-4 bg-slate-700/50 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{completionRate.toFixed(0)}% complete</span>
            {completionRate === 100 && (
              <span className="text-emerald-400 flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                Perfect day!
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 flex flex-col items-center justify-center">
          <Flame className="w-10 h-10 text-amber-500 mb-2" />
          <p className="text-3xl font-black text-white">
            {habits.length > 0 ? Math.max(...habits.map(h => h.currentStreak || 0), 0) : 0}
          </p>
          <p className="text-sm text-slate-400">Best Current Streak</p>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 flex flex-col items-center justify-center">
          <Trophy className="w-10 h-10 text-amber-500 mb-2" />
          <p className="text-3xl font-black text-white">
            {habits.length > 0 ? Math.max(...habits.map(h => h.longestStreak || 0), 0) : 0}
          </p>
          <p className="text-sm text-slate-400">All-Time Best</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-amber-500 text-black'
                : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Habits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHabits.filter(h => h.is_active).map((habit) => (
          <div
            key={habit.id}
            className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
              habit.completedToday
                ? 'bg-gradient-to-br from-emerald-900/30 to-slate-800/50 border-emerald-500/30'
                : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
            }`}
          >
            {/* Completion celebration effect */}
            {habit.completedToday && (
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 animate-shimmer" />
            )}

            <div className="relative p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryColors[habit.category]} flex items-center justify-center shadow-lg`}>
                  {categoryIcons[habit.category]}
                </div>
                <div className="flex items-center gap-2">
                  {habit.currentStreak && habit.currentStreak > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 rounded-lg">
                      <Flame className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-bold text-amber-500">{habit.currentStreak}</span>
                    </div>
                  )}
                  <button
                    onClick={() => onDeleteHabit(habit.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{habit.name}</h3>
              {habit.description && (
                <p className="text-sm text-slate-400 mb-4">{habit.description}</p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase tracking-wider">
                  {habit.category}
                </span>
                <button
                  onClick={() => onToggleHabit(habit.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
                    habit.completedToday
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-amber-500 hover:text-black'
                  }`}
                >
                  {habit.completedToday ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Done!
                    </>
                  ) : (
                    <>
                      <Circle className="w-5 h-5" />
                      Complete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Habit Card */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-700/50 hover:border-amber-500/50 text-slate-500 hover:text-amber-500 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-800/50 group-hover:bg-amber-500/20 flex items-center justify-center mb-3 transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-medium">Add New Habit</span>
        </button>
      </div>

      {/* Add Habit Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Habit"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Habit Name
            </label>
            <input
              type="text"
              value={newHabit.name}
              onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
              placeholder="e.g., Morning meditation"
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={newHabit.description}
              onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
              placeholder="Why is this habit important to you?"
              rows={2}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['trading', 'health', 'mindset', 'productivity', 'general'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setNewHabit({ ...newHabit, category: cat })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    newHabit.category === cat
                      ? 'bg-amber-500 text-black'
                      : 'bg-slate-800/50 text-slate-400 hover:text-white'
                  }`}
                >
                  {categoryIcons[cat]}
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddHabit}
              disabled={!newHabit.name.trim()}
              fullWidth
            >
              Create Habit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HabitTracker;
