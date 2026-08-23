import React from 'react';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useHireFlow } from '../../context/HireFlowContext';

interface HealthRingProps {
  size?: number;
  strokeWidth?: number;
}

export const HealthRing: React.FC<HealthRingProps> = ({ size = 130, strokeWidth = 10 }) => {
  const { healthData } = useHireFlow();
  const { score, rating, summary, breakdown } = healthData;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let colorClass = 'text-emerald-500 stroke-emerald-500';
  let badgeBg = 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';

  if (score < 40) {
    colorClass = 'text-amber-500 stroke-amber-500';
    badgeBg = 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  } else if (score < 70) {
    colorClass = 'text-teal-500 stroke-teal-500';
    badgeBg = 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800';
  }

  return (
    <div
      id="job-search-health-card"
      className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs transition-all"
    >
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Animated Circular Ring */}
        <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
          <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className="stroke-slate-100 dark:stroke-slate-800"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress Arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className={`${colorClass} transition-all duration-1000 ease-out`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Center Value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
              {score}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 mt-0.5">/ 100</span>
          </div>
        </div>

        {/* Text Details & Rating */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 dark:text-slate-400">
              Job Search Health
            </h3>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${badgeBg} flex items-center gap-1`}>
              <TrendingUp className="w-3 h-3" />
              <span>{rating}</span>
            </span>
          </div>

          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed max-w-xl">
            {summary}
          </p>

          {/* Breakdown Mini Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            {breakdown.map((item) => (
              <div key={item.label} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span className="truncate">{item.label}</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {item.score}/{item.max}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${(item.score / item.max) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 truncate block mt-1">
                  {item.note}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
