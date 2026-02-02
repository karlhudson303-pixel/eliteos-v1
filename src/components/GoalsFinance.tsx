import React, { useState } from 'react';
import {
  Target,
  Plus,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Circle,
  Trash2,
  Edit2,
  AlertCircle,
  PiggyBank,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
} from 'lucide-react';
import { Goal, BudgetItem, Milestone } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';
import ProgressRing from './ui/ProgressRing';

interface GoalsFinanceProps {
  goals: Goal[];
  budgetItems: BudgetItem[];
  onAddGoal: (goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateGoal: (goalId: string, updates: Partial<Goal>) => void;
  onDeleteGoal: (goalId: string) => void;
  onAddBudgetItem: (item: Omit<BudgetItem, 'id' | 'created_at'>) => void;
  onToggleBudgetPaid: (itemId: string) => void;
  onDeleteBudgetItem: (itemId: string) => void;
}

const goalCategories = ['trading', 'financial', 'health', 'personal', 'career'] as const;

const categoryColors: Record<string, string> = {
  trading: 'from-emerald-500 to-emerald-600',
  financial: 'from-amber-500 to-amber-600',
  health: 'from-blue-500 to-blue-600',
  personal: 'from-purple-500 to-purple-600',
  career: 'from-red-500 to-red-600',
};

const budgetCategories = [
  'Housing', 'Utilities', 'Food', 'Transportation', 'Insurance', 
  'Healthcare', 'Savings', 'Investment', 'Entertainment', 'Subscriptions', 'Other'
];

const GoalsFinance: React.FC<GoalsFinanceProps> = ({
  goals,
  budgetItems,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAddBudgetItem,
  onToggleBudgetPaid,
  onDeleteBudgetItem,
}) => {
  const [activeTab, setActiveTab] = useState<'goals' | 'budget'>('goals');
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [newGoal, setNewGoal] = useState({
    user_id: 'user-1',
    title: '',
    description: '',
    category: 'financial' as Goal['category'],
    target_value: 0,
    current_value: 0,
    unit: 'USD',
    deadline: '',
    status: 'active' as Goal['status'],
    milestones: [] as Milestone[],
  });

  const [newBudgetItem, setNewBudgetItem] = useState({
    user_id: 'user-1',
    name: '',
    category: 'Other',
    amount: 0,
    type: 'expense' as BudgetItem['type'],
    is_recurring: false,
    recurrence_period: 'monthly' as BudgetItem['recurrence_period'],
    due_date: '',
    is_paid: false,
    notes: '',
  });

  // Goal statistics
  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const totalGoalProgress = activeGoals.length > 0
    ? activeGoals.reduce((sum, g) => sum + (g.current_value / g.target_value) * 100, 0) / activeGoals.length
    : 0;

  // Budget statistics
  const totalIncome = budgetItems
    .filter(b => b.type === 'income')
    .reduce((sum, b) => sum + b.amount, 0);
  const totalExpenses = budgetItems
    .filter(b => b.type === 'expense')
    .reduce((sum, b) => sum + b.amount, 0);
  const netCashFlow = totalIncome - totalExpenses;
  const upcomingPayments = budgetItems.filter(b => 
    b.type === 'expense' && 
    !b.is_paid && 
    b.due_date && 
    new Date(b.due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );

  const handleAddGoal = () => {
    if (newGoal.title && newGoal.target_value > 0) {
      onAddGoal(newGoal);
      setNewGoal({
        user_id: 'user-1',
        title: '',
        description: '',
        category: 'financial',
        target_value: 0,
        current_value: 0,
        unit: 'USD',
        deadline: '',
        status: 'active',
        milestones: [],
      });
      setIsAddGoalOpen(false);
    }
  };

  const handleAddBudgetItem = () => {
    if (newBudgetItem.name && newBudgetItem.amount > 0) {
      onAddBudgetItem(newBudgetItem);
      setNewBudgetItem({
        user_id: 'user-1',
        name: '',
        category: 'Other',
        amount: 0,
        type: 'expense',
        is_recurring: false,
        recurrence_period: 'monthly',
        due_date: '',
        is_paid: false,
        notes: '',
      });
      setIsAddBudgetOpen(false);
    }
  };

  const handleUpdateProgress = (goalId: string, newValue: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      const status = newValue >= goal.target_value ? 'completed' : 'active';
      onUpdateGoal(goalId, { current_value: newValue, status });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Goals & Finance</h1>
          <p className="text-slate-400 mt-1">Track your progress and manage your money</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'goals' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('goals')}
            leftIcon={<Target className="w-4 h-4" />}
          >
            Goals
          </Button>
          <Button
            variant={activeTab === 'budget' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('budget')}
            leftIcon={<Wallet className="w-4 h-4" />}
          >
            Budget
          </Button>
        </div>
      </div>

      {activeTab === 'goals' ? (
        <>
          {/* Goals Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Overall Progress</h3>
                  <p className="text-4xl font-black text-white">{totalGoalProgress.toFixed(0)}%</p>
                  <p className="text-sm text-slate-500 mt-2">
                    {activeGoals.length} active • {completedGoals.length} completed
                  </p>
                </div>
                <ProgressRing progress={totalGoalProgress} size={120} color="gold" />
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex flex-col items-center justify-center">
              <Target className="w-8 h-8 text-amber-500 mb-2" />
              <p className="text-3xl font-black text-white">{activeGoals.length}</p>
              <p className="text-sm text-slate-400">Active Goals</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex flex-col items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
              <p className="text-3xl font-black text-white">{completedGoals.length}</p>
              <p className="text-sm text-slate-400">Completed</p>
            </div>
          </div>

          {/* Add Goal Button */}
          <div className="flex justify-end">
            <Button onClick={() => setIsAddGoalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Add Goal
            </Button>
          </div>

          {/* Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => {
              const progress = (goal.current_value / goal.target_value) * 100;
              const isCompleted = goal.status === 'completed';
              const daysLeft = goal.deadline
                ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <div
                  key={goal.id}
                  className={`bg-slate-800/50 rounded-2xl p-6 border transition-all ${
                    isCompleted ? 'border-emerald-500/30' : 'border-slate-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryColors[goal.category]} flex items-center justify-center`}>
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      {daysLeft !== null && daysLeft > 0 && !isCompleted && (
                        <span className={`text-xs px-2 py-1 rounded-lg ${
                          daysLeft <= 7 ? 'bg-red-500/20 text-red-400' : 'bg-slate-700/50 text-slate-400'
                        }`}>
                          {daysLeft} days left
                        </span>
                      )}
                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-sm text-slate-400 mb-4">{goal.description}</p>
                  )}

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-400">Progress</span>
                      <span className={`font-bold ${isCompleted ? 'text-emerald-400' : 'text-amber-500'}`}>
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-amber-400'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                      <span>${goal.current_value.toLocaleString()}</span>
                      <span>${goal.target_value.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Update Progress */}
                  {!isCompleted && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Update progress"
                        className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500/50"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const value = parseFloat((e.target as HTMLInputElement).value);
                            if (!isNaN(value)) {
                              handleUpdateProgress(goal.id, value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleUpdateProgress(goal.id, goal.target_value)}
                      >
                        Complete
                      </Button>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Goal Achieved!</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Goal Card */}
            <button
              onClick={() => setIsAddGoalOpen(true)}
              className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-700/50 hover:border-amber-500/50 text-slate-500 hover:text-amber-500 transition-all min-h-[200px]"
            >
              <Plus className="w-8 h-8 mb-2" />
              <span className="font-medium">Add New Goal</span>
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Budget Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Income</span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">${totalIncome.toLocaleString()}</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <ArrowDownRight className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Expenses</span>
              </div>
              <p className="text-2xl font-bold text-red-400">${totalExpenses.toLocaleString()}</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <PiggyBank className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Net Cash Flow</span>
              </div>
              <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {netCashFlow >= 0 ? '+' : ''}${netCashFlow.toLocaleString()}
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <Bell className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Due Soon</span>
              </div>
              <p className="text-2xl font-bold text-amber-400">{upcomingPayments.length}</p>
              <p className="text-xs text-slate-500">payments this week</p>
            </div>
          </div>

          {/* Upcoming Payments Alert */}
          {upcomingPayments.length > 0 && (
            <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-400 mb-3">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Upcoming Payments</span>
              </div>
              <div className="space-y-2">
                {upcomingPayments.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                    <span className="text-sm text-slate-300">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500">
                        {new Date(item.due_date!).toLocaleDateString()}
                      </span>
                      <span className="text-sm font-bold text-amber-400">${item.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Budget Item Button */}
          <div className="flex justify-end">
            <Button onClick={() => setIsAddBudgetOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Add Item
            </Button>
          </div>

          {/* Budget Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                Income
              </h3>
              <div className="space-y-2">
                {budgetItems.filter(b => b.type === 'income').map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">+${item.amount}</span>
                      <button
                        onClick={() => onDeleteBudgetItem(item.id)}
                        className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {budgetItems.filter(b => b.type === 'income').length === 0 && (
                  <p className="text-center py-4 text-slate-500 text-sm">No income items</p>
                )}
              </div>
            </div>

            {/* Expenses */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ArrowDownRight className="w-5 h-5 text-red-500" />
                Expenses
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {budgetItems.filter(b => b.type === 'expense').map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                      item.is_paid ? 'bg-slate-700/20 opacity-60' : 'bg-slate-700/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleBudgetPaid(item.id)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                          item.is_paid ? 'bg-emerald-500' : 'border-2 border-slate-600 hover:border-amber-500'
                        }`}
                      >
                        {item.is_paid && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>
                      <div>
                        <p className={`text-sm font-medium ${item.is_paid ? 'text-slate-500 line-through' : 'text-white'}`}>
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{item.category}</span>
                          {item.due_date && (
                            <>
                              <span>•</span>
                              <span>Due {new Date(item.due_date).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${item.is_paid ? 'text-slate-500' : 'text-red-400'}`}>
                        -${item.amount}
                      </span>
                      <button
                        onClick={() => onDeleteBudgetItem(item.id)}
                        className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {budgetItems.filter(b => b.type === 'expense').length === 0 && (
                  <p className="text-center py-4 text-slate-500 text-sm">No expense items</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Goal Modal */}
      <Modal isOpen={isAddGoalOpen} onClose={() => setIsAddGoalOpen(false)} title="Create New Goal" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Goal Title</label>
            <input
              type="text"
              value={newGoal.title}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              placeholder="e.g., Save $10,000 for trading account"
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {goalCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setNewGoal({ ...newGoal, category: cat })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                    newGoal.category === cat
                      ? 'bg-amber-500 text-black'
                      : 'bg-slate-800/50 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Target Amount</label>
              <input
                type="number"
                value={newGoal.target_value || ''}
                onChange={(e) => setNewGoal({ ...newGoal, target_value: parseFloat(e.target.value) || 0 })}
                placeholder="10000"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Current Progress</label>
              <input
                type="number"
                value={newGoal.current_value || ''}
                onChange={(e) => setNewGoal({ ...newGoal, current_value: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Deadline (optional)</label>
            <input
              type="date"
              value={newGoal.deadline}
              onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsAddGoalOpen(false)} fullWidth>Cancel</Button>
            <Button onClick={handleAddGoal} disabled={!newGoal.title || newGoal.target_value <= 0} fullWidth>
              Create Goal
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Budget Item Modal */}
      <Modal isOpen={isAddBudgetOpen} onClose={() => setIsAddBudgetOpen(false)} title="Add Budget Item" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setNewBudgetItem({ ...newBudgetItem, type: 'income' })}
                className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  newBudgetItem.type === 'income'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-5 h-5" /> Income
              </button>
              <button
                onClick={() => setNewBudgetItem({ ...newBudgetItem, type: 'expense' })}
                className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  newBudgetItem.type === 'expense'
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-800/50 text-slate-400 hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-5 h-5" /> Expense
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
            <input
              type="text"
              value={newBudgetItem.name}
              onChange={(e) => setNewBudgetItem({ ...newBudgetItem, name: e.target.value })}
              placeholder="e.g., Rent, Salary, Groceries"
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
              <input
                type="number"
                value={newBudgetItem.amount || ''}
                onChange={(e) => setNewBudgetItem({ ...newBudgetItem, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
              <select
                value={newBudgetItem.category}
                onChange={(e) => setNewBudgetItem({ ...newBudgetItem, category: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
              >
                {budgetCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          {newBudgetItem.type === 'expense' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Due Date (optional)</label>
              <input
                type="date"
                value={newBudgetItem.due_date}
                onChange={(e) => setNewBudgetItem({ ...newBudgetItem, due_date: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsAddBudgetOpen(false)} fullWidth>Cancel</Button>
            <Button onClick={handleAddBudgetItem} disabled={!newBudgetItem.name || newBudgetItem.amount <= 0} fullWidth>
              Add Item
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GoalsFinance;
