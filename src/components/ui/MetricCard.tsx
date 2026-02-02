import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'gold' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  animated?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  icon,
  variant = 'default',
  size = 'md',
  onClick,
  animated = false,
}) => {
  const variantStyles = {
    default: 'bg-slate-800/50 border-slate-700/50',
    gold: 'bg-gradient-to-br from-amber-900/30 to-slate-800/50 border-amber-500/30',
    success: 'bg-gradient-to-br from-emerald-900/30 to-slate-800/50 border-emerald-500/30',
    danger: 'bg-gradient-to-br from-red-900/30 to-slate-800/50 border-red-500/30',
  };

  const sizeStyles = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const valueSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-slate-400',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl border backdrop-blur-sm
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${onClick ? 'cursor-pointer hover:border-amber-500/50 transition-all duration-300 hover:scale-[1.02]' : ''}
        ${animated ? 'animate-pulse-slow' : ''}
      `}
    >
      {/* Glow effect for gold variant */}
      {variant === 'gold' && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 animate-shimmer" />
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {title}
          </span>
          {icon && (
            <div className="text-amber-500/80">
              {icon}
            </div>
          )}
        </div>

        <div className={`font-bold text-white ${valueSizes[size]} tracking-tight`}>
          {value}
        </div>

        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-2">
            {trend && (
              <div className={`flex items-center gap-1 ${trendColors[trend]}`}>
                <TrendIcon className="w-3 h-3" />
                {trendValue && <span className="text-xs font-medium">{trendValue}</span>}
              </div>
            )}
            {subtitle && (
              <span className="text-xs text-slate-500">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
