import React, { useEffect, useState } from 'react';
import { Flame, Zap, Trophy, Star } from 'lucide-react';

interface StreakCounterProps {
  count: number;
  label?: string;
  showMilestone?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'fire' | 'lightning' | 'trophy' | 'star';
}

const StreakCounter: React.FC<StreakCounterProps> = ({
  count,
  label = 'Day Streak',
  showMilestone = true,
  size = 'md',
  variant = 'fire',
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevCount, setPrevCount] = useState(count);

  useEffect(() => {
    if (count > prevCount) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
    setPrevCount(count);
  }, [count, prevCount]);

  const sizeClasses = {
    sm: { container: 'p-3', icon: 'w-6 h-6', text: 'text-2xl', label: 'text-xs' },
    md: { container: 'p-4', icon: 'w-8 h-8', text: 'text-4xl', label: 'text-sm' },
    lg: { container: 'p-6', icon: 'w-12 h-12', text: 'text-6xl', label: 'text-base' },
  };

  const icons = {
    fire: Flame,
    lightning: Zap,
    trophy: Trophy,
    star: Star,
  };

  const Icon = icons[variant];

  const getMilestone = (streak: number): string | null => {
    if (streak >= 365) return '1 YEAR LEGEND';
    if (streak >= 100) return 'CENTURION';
    if (streak >= 30) return 'MONTHLY MASTER';
    if (streak >= 7) return 'WEEKLY WARRIOR';
    if (streak >= 3) return 'BUILDING MOMENTUM';
    return null;
  };

  const milestone = getMilestone(count);

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl
        bg-gradient-to-br from-amber-900/40 via-slate-800/60 to-red-900/30
        border border-amber-500/30
        ${sizeClasses[size].container}
        ${isAnimating ? 'animate-bounce-once' : ''}
      `}
    >
      {/* Animated background particles */}
      {count > 0 && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-amber-400/30 rounded-full animate-float"
              style={{
                left: `${20 + i * 15}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + i}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center">
        <div className={`${isAnimating ? 'animate-pulse' : ''}`}>
          <Icon
            className={`
              ${sizeClasses[size].icon}
              ${count > 0 ? 'text-amber-500' : 'text-slate-600'}
              ${isAnimating ? 'animate-wiggle' : ''}
            `}
          />
        </div>

        <div className={`font-black text-white ${sizeClasses[size].text} mt-2 tracking-tighter`}>
          {count}
        </div>

        <div className={`text-slate-400 ${sizeClasses[size].label} uppercase tracking-wider`}>
          {label}
        </div>

        {showMilestone && milestone && (
          <div className="mt-3 px-3 py-1 bg-amber-500/20 rounded-full border border-amber-500/30">
            <span className="text-xs font-bold text-amber-400 tracking-wider">
              {milestone}
            </span>
          </div>
        )}
      </div>

      {/* Glow effect */}
      {count > 7 && (
        <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent pointer-events-none" />
      )}
    </div>
  );
};

export default StreakCounter;
