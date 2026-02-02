import React from 'react';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: 'gold' | 'emerald' | 'red' | 'blue';
  showPercentage?: boolean;
  label?: string;
  animated?: boolean;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = 'gold',
  showPercentage = true,
  label,
  animated = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const colorClasses = {
    gold: 'stroke-amber-500',
    emerald: 'stroke-emerald-500',
    red: 'stroke-red-500',
    blue: 'stroke-blue-500',
  };

  const glowColors = {
    gold: 'drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]',
    emerald: 'drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]',
    red: 'drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]',
    blue: 'drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]',
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className={`transform -rotate-90 ${animated ? glowColors[color] : ''}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-700/50"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${colorClasses[color]} ${animated ? 'transition-all duration-1000 ease-out' : ''}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <span className="text-2xl font-bold text-white">
            {Math.round(progress)}%
          </span>
        )}
        {label && (
          <span className="text-xs text-slate-400 mt-1">{label}</span>
        )}
      </div>
    </div>
  );
};

export default ProgressRing;
