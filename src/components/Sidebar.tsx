import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  CheckSquare,
  BarChart3,
  Target,
  Brain,
  BookOpen,
  Settings,
  Crown,
  Zap,
  FileText,
} from 'lucide-react';
import { ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  streakCount: number;
  identityScore: number;
  identityStatement?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  streakCount,
  identityScore,
  identityStatement = "I am becoming an elite trader with unwavering discipline.",
}) => {
  const navItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Command Center', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'trades', label: 'Trade Journal', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'habits', label: 'Habit Tracker', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-5 h-5" /> },
    { id: 'goals', label: 'Goals & Finance', icon: <Target className="w-5 h-5" /> },
    { id: 'psychology', label: 'Psychology', icon: <Brain className="w-5 h-5" /> },
    { id: 'review', label: 'Daily Review', icon: <BookOpen className="w-5 h-5" /> },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900/95 border-r border-slate-700/50 backdrop-blur-xl z-40 flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">ELITE OS</h1>
            <p className="text-xs text-slate-500 uppercase tracking-wider">Performance System</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Streak</span>
            </div>
            <p className="text-xl font-bold text-white">{streakCount}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
            <div className="flex items-center gap-2 text-emerald-500 mb-1">
              <Crown className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Score</span>
            </div>
            <p className="text-xl font-bold text-white">{identityScore}%</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl
              transition-all duration-200 text-left
              ${currentView === item.id
                ? 'bg-gradient-to-r from-amber-500/20 to-transparent border border-amber-500/30 text-amber-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }
            `}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
            {currentView === item.id && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
        ))}
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-slate-700/50">
        <button 
          onClick={() => onViewChange('settings')}
          className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
            ${currentView === 'settings'
              ? 'bg-gradient-to-r from-amber-500/20 to-transparent border border-amber-500/30 text-amber-500'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }
          `}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
          {currentView === 'settings' && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* Identity Statement */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="bg-gradient-to-br from-amber-900/30 to-slate-800/50 rounded-xl p-4 border border-amber-500/20">
          <p className="text-xs text-amber-500/80 uppercase tracking-wider mb-2">Identity Anchor</p>
          <p className="text-sm text-slate-300 italic leading-relaxed">
            "{identityStatement}"
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
