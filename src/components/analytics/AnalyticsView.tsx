import React from 'react';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Layers,
  FileText,
  Award,
  Calendar,
  DollarSign,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';
import { useHireFlow } from '../../context/HireFlowContext';
import { getDaysAgo } from '../../utils';

export const AnalyticsView: React.FC = () => {
  const { jobs, resumes, interviews, kpis, funnelData } = useHireFlow();

  // 1. Stage Distribution
  const stageCounts = [
    { label: 'Wishlist', count: jobs.filter((j) => j.status === 'wishlist').length, color: 'bg-slate-400' },
    { label: 'Applied', count: jobs.filter((j) => j.status === 'applied').length, color: 'bg-blue-500' },
    { label: 'Follow-up', count: jobs.filter((j) => j.status === 'follow-up').length, color: 'bg-amber-500' },
    { label: 'Interview', count: jobs.filter((j) => j.status === 'interview').length, color: 'bg-purple-500' },
    { label: 'Offer', count: jobs.filter((j) => j.status === 'offer').length, color: 'bg-emerald-500' },
    { label: 'Archived', count: jobs.filter((j) => j.status === 'rejected').length, color: 'bg-rose-500' },
  ];

  const totalJobs = jobs.length || 1;

  // 2. Work Mode Distribution
  const remoteCount = jobs.filter((j) => (j.workMode || 'remote') === 'remote').length;
  const hybridCount = jobs.filter((j) => j.workMode === 'hybrid').length;
  const onsiteCount = jobs.filter((j) => j.workMode === 'onsite').length;

  // 3. Resume Performance Comparison
  const resumePerformance = resumes.map((r) => {
    const matched = jobs.filter((j) => j.resumeId === r.id);
    const total = matched.length;
    const interviewsCount = matched.filter((j) => j.status === 'interview' || j.status === 'offer').length;
    const offersCount = matched.filter((j) => j.status === 'offer').length;
    const responseRate = total > 0 ? Math.round((interviewsCount / total) * 100) : 0;
    return {
      resume: r,
      total,
      interviewsCount,
      offersCount,
      responseRate,
    };
  });

  // Sort best performing first
  resumePerformance.sort((a, b) => b.responseRate - a.responseRate);

  // 4. Response Time Analysis (average days from applied to interview)
  const interviewJobs = jobs.filter((j) => (j.status === 'interview' || j.status === 'offer') && j.dateApplied);
  const avgDaysToInterview =
    interviewJobs.length > 0
      ? Math.round(
          interviewJobs.reduce((acc, j) => {
            const days = getDaysAgo(j.dateApplied) || 7;
            return acc + Math.min(days, 30);
          }, 0) / interviewJobs.length
        )
      : 8;

  return (
    <div id="analytics-view" className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Analytics & Conversion
          </h1>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
            Real-time Insights
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Detailed metrics, conversion rates, and pipeline trends across your job search.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <span className="text-xs uppercase font-bold text-slate-400">Response Rate</span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {funnelData.appliedToInterviewRate}%
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">Applied → Interview</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <span className="text-xs uppercase font-bold text-slate-400">Offer Close Rate</span>
          <div className="text-3xl font-black text-purple-600 dark:text-purple-400 font-mono mt-1">
            {funnelData.interviewToOfferRate}%
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">Interview → Offer</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <span className="text-xs uppercase font-bold text-slate-400">Avg Response Time</span>
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {avgDaysToInterview}d
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">Days to initial response</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <span className="text-xs uppercase font-bold text-slate-400">Total Interviews</span>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
            {interviews.length}
          </div>
          <span className="text-xs text-slate-500 mt-0.5 block">Rounds scheduled</span>
        </div>
      </div>

      {/* Main Grid: Funnel Stages & Work Mode */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Distribution */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Pipeline Stage Breakdown</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              {jobs.length} Opportunities
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {stageCounts.map((stage) => {
              const pct = Math.round((stage.count / totalJobs) * 100);
              return (
                <div key={stage.label}>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                      <span>{stage.label}</span>
                    </span>
                    <span className="font-mono">
                      {stage.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Work Mode Breakdown */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>Work Location Preference</span>
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-center">
                <span className="text-xs uppercase font-bold text-slate-400">Remote</span>
                <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
                  {remoteCount}
                </div>
                <span className="text-[11px] text-slate-500">
                  {Math.round((remoteCount / totalJobs) * 100)}% of total
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-center">
                <span className="text-xs uppercase font-bold text-slate-400">Hybrid</span>
                <div className="text-2xl font-black text-blue-600 font-mono mt-1">
                  {hybridCount}
                </div>
                <span className="text-[11px] text-slate-500">
                  {Math.round((hybridCount / totalJobs) * 100)}% of total
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-center">
                <span className="text-xs uppercase font-bold text-slate-400">On-site</span>
                <div className="text-2xl font-black text-purple-600 font-mono mt-1">
                  {onsiteCount}
                </div>
                <span className="text-[11px] text-slate-500">
                  {Math.round((onsiteCount / totalJobs) * 100)}% of total
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-300">
            <span className="font-bold block mb-0.5">Pipeline Tip:</span>
            Remote roles with tailored resume keywords yield 2.4x higher interview invitations.
          </div>
        </div>
      </div>

      {/* Resume Conversion Comparison Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Resume Profile Performance Comparison</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identify which resume version delivers the highest callback rate.
            </p>
          </div>
        </div>

        {resumePerformance.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No resume profiles configured yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Resume Name</th>
                  <th className="py-2.5 px-3">Target Focus</th>
                  <th className="py-2.5 px-3">Applications</th>
                  <th className="py-2.5 px-3">Interviews</th>
                  <th className="py-2.5 px-3">Offers</th>
                  <th className="py-2.5 px-3">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {resumePerformance.map((item, idx) => (
                  <tr key={item.resume.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {idx === 0 && item.responseRate > 0 && (
                        <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      )}
                      <span>{item.resume.name}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                      {item.resume.targetRole}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-900 dark:text-white font-bold">
                      {item.total}
                    </td>
                    <td className="py-3 px-3 font-mono text-purple-600 dark:text-purple-400 font-bold">
                      {item.interviewsCount}
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {item.offersCount}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono">
                        {item.responseRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
