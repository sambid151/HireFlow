import React, { useState } from 'react';
import { Target, Flame, Trophy, Award, CheckCircle2, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useHireFlow } from '../../context/HireFlowContext';

export const GoalsView: React.FC = () => {
  const { jobs, streakData, settings, updateSettings, showToast } = useHireFlow();

  const weeklyTarget = settings.weeklyTarget || 8;
  const [tempTarget, setTempTarget] = useState(weeklyTarget);

  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const appliedThisWeek = jobs.filter(
    (j) => j.dateApplied && new Date(j.dateApplied).getTime() >= sevenDaysAgo
  ).length;

  const progressPercent = Math.min(100, Math.round((appliedThisWeek / weeklyTarget) * 100));
  const isGoalAchieved = appliedThisWeek >= weeklyTarget && weeklyTarget > 0;

  const handleUpdateTarget = async (newVal: number) => {
    setTempTarget(newVal);
    await updateSettings({ weeklyTarget: newVal });
    showToast(`Weekly target updated to ${newVal} applications/week`, 'success');
  };

  const handleCelebrate = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const milestones = [
    { title: 'First 5 Applications', target: 5, current: jobs.length, icon: '🌱' },
    { title: 'Double Digits (10+)', target: 10, current: jobs.length, icon: '🚀' },
    { title: 'Pipeline Veteran (25+)', target: 25, current: jobs.length, icon: '⭐' },
    { title: 'Momentum Master (50+)', target: 50, current: jobs.length, icon: '👑' },
  ];

  return (
    <div id="goals-view" className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Goals & Momentum
          </h1>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
            Pacing System
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Set weekly output targets to maintain pipeline velocity and stay on track.
        </p>
      </div>

      {/* Primary Goal Banner */}
      <div className="p-8 rounded-3xl bg-linear-to-br from-white to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/30 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-600" />
              <span>Current Weekly Pace</span>
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {appliedThisWeek}{' '}
              <span className="text-lg font-bold text-slate-400 font-sans">
                / {weeklyTarget} applications
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {[5, 8, 10, 15, 20].map((t) => (
              <button
                key={t}
                onClick={() => handleUpdateTarget(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  weeklyTarget === t
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {t}/wk
              </button>
            ))}
          </div>
        </div>

        {/* Large Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>Progress this week</span>
            <span className="font-mono">{progressPercent}%</span>
          </div>
          <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isGoalAchieved ? 'bg-emerald-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {isGoalAchieved ? (
          <div className="p-4 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>
                <strong>Fantastic job!</strong> You reached your weekly target of {weeklyTarget} applications.
              </span>
            </div>
            <button
              onClick={handleCelebrate}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              🎉 Celebrate
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            {weeklyTarget - appliedThisWeek} more applications needed in the next {7 - new Date().getDay()} days to hit target.
          </p>
        )}
      </div>

      {/* Two Column: Streak & Milestones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Streak Details */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Momentum Streak</span>
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono">
              {streakData.streakDays} Days
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {streakData.message}
          </p>

          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 space-y-1">
            <span className="font-bold block">How streaks work:</span>
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
              Logging applications, updating stage statuses, scheduling interview rounds, or sending recruiter follow-ups counts toward your continuous search momentum.
            </p>
          </div>
        </div>

        {/* Search Milestones */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Career Milestones</span>
            </h3>
          </div>

          <div className="space-y-3">
            {milestones.map((m) => {
              const reached = m.current >= m.target;
              return (
                <div
                  key={m.title}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                    reached
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="text-lg">{m.icon}</span>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {m.title}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {Math.min(m.current, m.target)} / {m.target} logged
                      </span>
                    </div>
                  </div>

                  {reached ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400">In Progress</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
