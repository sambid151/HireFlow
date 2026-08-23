import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Flame,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  Plus,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Award,
  Layers,
  FileText,
  Target,
  Zap,
} from 'lucide-react';
import { useHireFlow } from '../../context/HireFlowContext';
import { HealthRing } from '../common/HealthRing';
import { getDaysAgo, createGoogleCalendarUrl } from '../../utils';
import { calculateResumeHealth } from '../../services/aiService';
import { Button } from '../common/Button';
import { useTimeGreeting } from '../../utils/greeting';

export const DashboardView: React.FC = () => {
  const {
    jobs,
    resumes,
    interviews,
    activities,
    kpis,
    funnelData,
    attentionItems,
    streakData,
    settings,
    updateSettings,
    openAddOpportunity,
    setSelectedJob,
    setActiveTab,
  } = useHireFlow();

  const greeting = useTimeGreeting(settings.userFullName);

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(settings.weeklyTarget || 8);

  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const appliedThisWeek = jobs.filter(
    (j) => j.dateApplied && new Date(j.dateApplied).getTime() >= sevenDaysAgo
  ).length;

  const weeklyTarget = settings.weeklyTarget || 8;
  const weeklyProgress = Math.min(100, Math.round((appliedThisWeek / weeklyTarget) * 100));
  const remainingForGoal = Math.max(0, weeklyTarget - appliedThisWeek);

  const upcomingScheduledInterviews = interviews
    .filter((i) => i.result === 'scheduled')
    .slice(0, 4);

  // Phase 14: Next Best Action Calculation
  const nextBestAction = useMemo(() => {
    // 1. Prepare for interview within 48h
    const now = new Date();
    const imminentInterview = interviews.find((i) => {
      if (i.result !== 'scheduled' || !i.date) return false;
      const intDate = new Date(`${i.date}T${i.time || '00:00'}`);
      const diffHours = (intDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      return diffHours >= -4 && diffHours <= 48;
    });

    if (imminentInterview) {
      return {
        title: `Prepare for ${imminentInterview.companyName} (${imminentInterview.round})`,
        reason: `Interview scheduled on ${imminentInterview.date}${imminentInterview.time ? ` at ${imminentInterview.time}` : ''}. Review company brief and key talking points.`,
        actionLabel: 'Open Interview Center',
        icon: Calendar,
        color: 'text-purple-600 dark:text-purple-400',
        badgeBg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300',
        onClick: () => setActiveTab('interviews'),
      };
    }

    // 2. Follow up on application older than 7 days
    const overdueJob = jobs.find(
      (j) => j.status === 'applied' && (getDaysAgo(j.dateApplied) || 0) >= 7
    );
    if (overdueJob) {
      const days = getDaysAgo(overdueJob.dateApplied) || 7;
      return {
        title: `Follow up with ${overdueJob.companyName}`,
        reason: `Applied ${days} days ago for ${overdueJob.jobTitle} with no response logged yet. A polite follow-up email increases response rates by 2.4x.`,
        actionLabel: 'Send Follow-up',
        icon: Clock,
        color: 'text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
        onClick: () => {
          setSelectedJob(overdueJob);
          setActiveTab('applications');
        },
      };
    }

    // 3. Add next stage interview notes if completed interview with no notes
    const recentInterviewWithoutNotes = interviews.find(
      (i) => (i.result === 'passed' || i.result === 'scheduled') && !i.notes
    );
    if (recentInterviewWithoutNotes) {
      return {
        title: `Log notes for ${recentInterviewWithoutNotes.companyName}`,
        reason: `Capture questions asked and team feedback for ${recentInterviewWithoutNotes.round} while details are fresh.`,
        actionLabel: 'Update Notes',
        icon: FileText,
        color: 'text-blue-600 dark:text-blue-400',
        badgeBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300',
        onClick: () => setActiveTab('interviews'),
      };
    }

    // 4. Submit applications to meet weekly goal
    if (remainingForGoal > 0 && jobs.length > 0) {
      return {
        title: `Submit ${remainingForGoal} more application${remainingForGoal === 1 ? '' : 's'} this week`,
        reason: `You have submitted ${appliedThisWeek} of your ${weeklyTarget} target applications. Keep your pipeline full to maintain momentum.`,
        actionLabel: 'Add Opportunity',
        icon: Target,
        color: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300',
        onClick: () => openAddOpportunity('applied'),
      };
    }

    // 5. Improve resume health if low
    const lowestResume = resumes.find((r) => {
      const h = calculateResumeHealth(r);
      return h.isAvailable && h.totalScore < 70;
    });
    if (lowestResume) {
      return {
        title: `Improve Health for "${lowestResume.name}"`,
        reason: `Resume score is below optimal ATS benchmark. Add quantifiable outcomes and technical keywords to boost response rates.`,
        actionLabel: 'Review Resume',
        icon: Sparkles,
        color: 'text-teal-600 dark:text-teal-400',
        badgeBg: 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300',
        onClick: () => setActiveTab('resumes'),
      };
    }

    // 6. Add opportunities if pipeline empty
    return {
      title: 'Add your first target opportunities',
      reason: 'Track every job application, recruiter touchpoint, and interview round in one place.',
      actionLabel: 'Add Opportunity',
      icon: Zap,
      color: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300',
      onClick: () => openAddOpportunity('wishlist'),
    };
  }, [interviews, jobs, remainingForGoal, appliedThisWeek, weeklyTarget, resumes, setActiveTab, setSelectedJob, openAddOpportunity]);

  // Phase 15: Resume Performance Calculations
  const resumePerformanceList = useMemo(() => {
    return resumes.map((resume) => {
      const resumeJobs = jobs.filter((j) => j.resumeId === resume.id);
      const totalApps = resumeJobs.length;
      const interviewsCount = resumeJobs.filter((j) => j.status === 'interview' || j.status === 'offer').length;
      const offersCount = resumeJobs.filter((j) => j.status === 'offer').length;
      const interviewRate = totalApps > 0 ? Math.round((interviewsCount / totalApps) * 100) : 0;
      const health = calculateResumeHealth(resume);

      return {
        resume,
        totalApps,
        interviewsCount,
        offersCount,
        interviewRate,
        healthScore: health.totalScore,
      };
    }).sort((a, b) => b.interviewRate - a.interviewRate || b.totalApps - a.totalApps);
  }, [resumes, jobs]);

  return (
    <div id="dashboard-view" className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Hero Welcome Banner - Clean & Focused */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 p-6 sm:p-7 rounded-3xl bg-linear-to-r from-emerald-900 via-slate-900 to-slate-950 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold backdrop-blur-xs border border-emerald-400/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Private by default · Stored securely on your device</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            <div>{greeting.greetingLine}</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-100 mt-1">
              {greeting.subheadingLine}
            </div>
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Keep your applications, resumes, interviews and career momentum in one private workspace.
          </p>
        </div>

        {/* Primary CTA */}
        <div className="relative z-10 flex items-center shrink-0">
          <Button
            id="dashboard-primary-add-btn"
            onClick={() => openAddOpportunity('wishlist')}
            icon={Plus}
            size="lg"
            variant="primary"
          >
            Add Opportunity
          </Button>
        </div>
      </div>

      {/* Phase 14: Next Best Action Card */}
      {nextBestAction && (
        <div
          id="dashboard-next-best-action"
          className="p-5 sm:p-6 rounded-3xl bg-linear-to-r from-white via-emerald-50/40 to-white dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="p-3 rounded-2xl bg-emerald-600 text-white shrink-0 shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-mono">
                  Recommended Action
                </span>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {nextBestAction.title}
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-2xl">
                {nextBestAction.reason}
              </p>
            </div>
          </div>

          <Button
            onClick={nextBestAction.onClick}
            variant="emerald"
            size="md"
            icon={ArrowRight}
            iconPosition="right"
          >
            {nextBestAction.actionLabel}
          </Button>
        </div>
      )}

      {/* Top Grid: Health Score & Streak & Weekly Goal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Visual Health Score (Takes 2 cols on lg) */}
        <div className="lg:col-span-2">
          <HealthRing />
        </div>

        {/* Momentum Streak & Goal Card */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Streak Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Momentum</span>
              <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              </span>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {streakData.streakDays}
              </span>
              <span className="text-sm font-bold text-slate-500">Day Streak</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              {streakData.message}
            </p>
          </div>

          {/* Weekly Application Goal Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Weekly Target</span>
                <button
                  onClick={() => {
                    if (isEditingGoal) {
                      updateSettings({ weeklyTarget: tempGoal });
                      setIsEditingGoal(false);
                    } else {
                      setTempGoal(weeklyTarget);
                      setIsEditingGoal(true);
                    }
                  }}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {isEditingGoal ? 'Save' : 'Edit Target'}
                </button>
              </div>

              {isEditingGoal ? (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={tempGoal}
                    onChange={(e) => setTempGoal(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white"
                  />
                  <span className="text-xs text-slate-500">apps / week</span>
                </div>
              ) : (
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                    {appliedThisWeek}
                  </span>
                  <span className="text-sm font-bold text-slate-500">/ {weeklyTarget} applied</span>
                </div>
              )}

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${weeklyProgress}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {remainingForGoal > 0
                ? `${remainingForGoal} more application${remainingForGoal === 1 ? '' : 's'} to hit your weekly goal.`
                : '🎉 Weekly application target reached!'}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          {
            label: 'Total Tracked',
            value: kpis.totalApplications,
            sub: 'Opportunities',
            color: 'text-slate-900 dark:text-white',
          },
          {
            label: 'Active Pipeline',
            value: kpis.activeApplications,
            sub: 'In progress',
            color: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'Interviews',
            value: kpis.interviewCount,
            sub: 'Active rounds',
            color: 'text-purple-600 dark:text-purple-400',
          },
          {
            label: 'Offers',
            value: kpis.offerCount,
            sub: 'Received',
            color: 'text-emerald-700 dark:text-emerald-300 font-bold',
          },
          {
            label: 'Follow-ups',
            value: kpis.followUpCount,
            sub: 'Recommended',
            color: 'text-amber-600 dark:text-amber-400',
          },
          {
            label: 'Success Rate',
            value: kpis.successRate,
            sub: 'Offers / Applied',
            color: 'text-blue-600 dark:text-blue-400 font-bold',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition"
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate block">
              {kpi.label}
            </span>
            <div className={`text-2xl font-black mt-1 ${kpi.color}`}>{kpi.value}</div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block truncate">
              {kpi.sub}
            </span>
          </div>
        ))}
      </div>

      {/* Application Funnel Strip */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Application Conversion Funnel</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live funnel stages from initial discovery to signed offer.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>
              Applied → Interview:{' '}
              <strong className="text-purple-600 dark:text-purple-400">
                {funnelData.appliedToInterviewRate}%
              </strong>
            </span>
            <span>
              Interview → Offer:{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {funnelData.interviewToOfferRate}%
              </strong>
            </span>
          </div>
        </div>

        {/* Visual Funnel Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { stage: 'Wishlist', count: funnelData.wishlist, bg: 'bg-slate-50 dark:bg-slate-800/60', border: 'border-slate-200 dark:border-slate-700' },
            { stage: 'Applied', count: funnelData.applied, bg: 'bg-blue-50/60 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-900' },
            { stage: 'Follow-up', count: funnelData.followUp, bg: 'bg-amber-50/60 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-900' },
            { stage: 'Interview', count: funnelData.interview, bg: 'bg-purple-50/60 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-900' },
            { stage: 'Offer', count: funnelData.offer, bg: 'bg-emerald-50/70 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-900' },
          ].map((col, idx) => (
            <div
              key={col.stage}
              onClick={() => setActiveTab('applications')}
              className={`p-4 rounded-2xl border ${col.border} ${col.bg} flex flex-col justify-between hover:shadow-xs transition cursor-pointer`}
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>{col.stage}</span>
                <span className="text-[10px] text-slate-400">Step {idx + 1}</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {col.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phase 15: Resume Performance Breakdown */}
      {resumePerformanceList.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Resume Performance & Conversion</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real outcome metrics tracked per uploaded resume profile.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('resumes')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Manage Resumes →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumePerformanceList.map((item, idx) => (
              <div
                key={item.resume.id}
                className={`p-4 rounded-2xl border transition ${
                  idx === 0 && item.interviewRate > 0
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.resume.name}
                      </h3>
                      {idx === 0 && item.interviewRate > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-600 text-white">
                          Top Performer
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {item.resume.targetRole}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                    {item.interviewRate}% Int. Rate
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Applied</span>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">{item.totalApps}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 block">Interviews</span>
                    <span className="text-xs font-black text-purple-700 dark:text-purple-300 font-mono">{item.interviewsCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Offers</span>
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 font-mono">{item.offersCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout: Needs Attention & Upcoming Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Needs Attention Center */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Needs Your Attention</h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                {attentionItems.length} item{attentionItems.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="space-y-2.5">
              {attentionItems.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    No overdue actions!
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your applications and follow-up cadence are in top shape.
                  </p>
                </div>
              ) : (
                attentionItems.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3 hover:border-emerald-500/50 transition"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{item.subtitle}</span>
                      </p>
                    </div>

                    <button
                      onClick={item.onAction}
                      className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-2xs transition shrink-0 cursor-pointer"
                    >
                      {item.actionText}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {attentionItems.length > 4 && (
            <button
              onClick={() => setActiveTab('applications')}
              className="mt-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline block text-center cursor-pointer"
            >
              View all {attentionItems.length} attention items in pipeline →
            </button>
          )}
        </div>

        {/* Upcoming Interviews & Schedule */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Upcoming Interviews</h3>
              </div>
              <button
                onClick={() => setActiveTab('interviews')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                View Center
              </button>
            </div>

            <div className="space-y-2.5">
              {upcomingScheduledInterviews.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No upcoming interviews scheduled
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    When you move opportunities to Interview, scheduled rounds appear here.
                  </p>
                </div>
              ) : (
                upcomingScheduledInterviews.map((int) => {
                  const days = getDaysAgo(int.date);
                  const label = days === 0 ? 'Today' : days === -1 ? 'Tomorrow' : `In ${Math.abs(days || 0)} days`;
                  const gCalUrl = createGoogleCalendarUrl({
                    title: `Interview: ${int.companyName} (${int.round})`,
                    description: int.notes,
                    startDate: int.date,
                    startTime: int.time,
                    location: int.meetingUrl,
                  });

                  return (
                    <div
                      key={int.id}
                      className="p-3.5 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {int.companyName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300">
                            {label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                          {int.round} · {int.time || '10:00 AM'}
                        </p>
                      </div>

                      <a
                        href={gCalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-800 border border-purple-300 dark:border-purple-800 rounded-xl hover:bg-purple-100/50 transition flex items-center gap-1 shrink-0"
                        title="Add to Google Calendar"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Google Cal</span>
                      </a>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('interviews')}
            className="mt-4 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 block text-center cursor-pointer"
          >
            Manage all interview rounds & feedback →
          </button>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Activity</h3>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Auto-saved</span>
        </div>

        {activities.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No recent activity logged yet.
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {activities.slice(0, 6).map((act) => (
              <div key={act.id} className="flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {act.description}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                    · {new Date(act.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
