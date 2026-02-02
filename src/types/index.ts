// Elite Trading & Life OS Types

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  identity_statement: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: 'trading' | 'health' | 'mindset' | 'productivity' | 'general';
  frequency: 'daily' | 'weekly';
  target_count: number;
  icon: string;
  color: string;
  is_active: boolean;
  created_at: string;
  currentStreak?: number;
  longestStreak?: number;
  completedToday?: boolean;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
  notes?: string;
  created_at: string;
}

export interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  trade_type: 'long' | 'short';
  entry_price?: number;
  exit_price?: number;
  position_size?: number;
  profit_loss?: number;
  profit_loss_percent?: number;
  entry_date?: string;
  exit_date?: string;
  timeframe?: string;
  strategy?: string;
  setup_type?: string;
  screenshot_url?: string;
  pre_trade_emotion?: string;
  post_trade_emotion?: string;
  discipline_score?: number;
  followed_plan: boolean;
  lessons_learned?: string;
  tags?: string[];
  notes?: string;
  created_at: string;
  // New fields for pre-trade checklist
  checklist_completed?: boolean;
  checklist_items?: string[];
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: 'trading' | 'financial' | 'health' | 'personal' | 'career';
  target_value: number;
  current_value: number;
  unit: string;
  deadline?: string;
  status: 'active' | 'completed' | 'paused';
  milestones: Milestone[];
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  title: string;
  target_value: number;
  completed: boolean;
  completed_at?: string;
}

export interface BudgetItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  is_recurring: boolean;
  recurrence_period?: 'weekly' | 'monthly' | 'yearly';
  due_date?: string;
  is_paid: boolean;
  notes?: string;
  created_at: string;
}

export interface DailyReview {
  id: string;
  user_id: string;
  review_date: string;
  morning_mindset?: string;
  energy_level?: number;
  focus_level?: number;
  mood_score?: number;
  wins?: string[];
  improvements?: string[];
  gratitude?: string[];
  tomorrow_priorities?: string[];
  overall_score?: number;
  notes?: string;
  created_at: string;
}

export interface MindsetLog {
  id: string;
  user_id: string;
  log_type: 'pre_trade' | 'post_trade' | 'daily_checkin';
  emotion?: string;
  intensity?: number;
  triggers?: string[];
  coping_strategies?: string[];
  cognitive_biases?: string[];
  notes?: string;
  logged_at: string;
}

export interface DashboardMetrics {
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  avgDisciplineScore: number;
  currentHabitStreak: number;
  longestHabitStreak: number;
  habitsCompletedToday: number;
  totalHabits: number;
  goalsProgress: number;
  weeklyPnL: number;
  monthlyPnL: number;
  identityScore: number;
}

// Trading Rules for Pre-Trade Checklist
export interface TradingRule {
  id: string;
  text: string;
  isActive: boolean;
}

export interface AppSettings {
  identityStatement: string;
  displayName: string;
  theme: 'dark' | 'light';
  notifications: boolean;
  dailyReminderTime?: string;
  // Trading rules for pre-trade checklist
  tradingRules?: TradingRule[];
  // Max consecutive losses before alert
  maxConsecutiveLosses?: number;
  // Max daily loss limit
  maxDailyLoss?: number;
}

export type ViewType = 'dashboard' | 'trades' | 'habits' | 'analytics' | 'goals' | 'psychology' | 'review' | 'reports' | 'settings';
