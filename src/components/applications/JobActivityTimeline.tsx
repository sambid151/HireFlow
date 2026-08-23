import React, { useMemo } from 'react';
import {
  Clock,
  ArrowRight,
  Sparkles,
  Calendar,
  Send,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Layers,
  FileText,
  Building2,
  Video,
  XCircle,
} from 'lucide-react';
import { Activity, Job, JobStatus } from '../../types';

interface JobActivityTimelineProps {
  job: Job;
  activities: Activity[];
}

interface ParsedTimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  isStatusChange?: boolean;
  fromStatus?: string;
  toStatus?: string;
  iconType: 'created' | 'status' | 'interview' | 'followup' | 'update' | 'default';
}

function formatRelativeTime(dateStr: string): string {
  try {
    const dt = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - dt.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;

    return dt.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: dt.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return dateStr;
  }
}

function getStatusBadgeClasses(statusStr: string): { bg: string; text: string; border: string } {
  const normalized = statusStr.toLowerCase().trim();
  switch (normalized) {
    case 'wishlist':
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-300 dark:border-slate-700',
      };
    case 'applied':
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/60',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
      };
    case 'follow-up':
    case 'followup':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/60',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
      };
    case 'interview':
      return {
        bg: 'bg-purple-50 dark:bg-purple-950/60',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800',
      };
    case 'offer':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/60',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
      };
    case 'rejected':
    case 'archived':
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/60',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800',
      };
    default:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
      };
  }
}

export const JobActivityTimeline: React.FC<JobActivityTimelineProps> = ({ job, activities }) => {
  const events = useMemo<ParsedTimelineEvent[]>(() => {
    const rawEvents: ParsedTimelineEvent[] = [];

    // 1. Gather all logged activities for this job
    const jobSpecificActivities = activities.filter((a) => a.jobId === job.id);

    jobSpecificActivities.forEach((act) => {
      let iconType: ParsedTimelineEvent['iconType'] = 'default';
      let title = 'Activity Logged';
      let fromStatus: string | undefined;
      let toStatus: string | undefined;
      let isStatusChange = false;

      if (act.type === 'status_changed') {
        iconType = 'status';
        isStatusChange = true;
        title = 'Stage Status Changed';

        // Check if description contains "from X → Y" or "from X to Y"
        const match = act.description.match(/(?:from\s+)?([A-Za-z\-]+)\s*(?:→|->|to)\s*([A-Za-z\-]+)/i);
        if (match) {
          fromStatus = match[1];
          toStatus = match[2];
        }
      } else if (act.type === 'job_created') {
        iconType = 'created';
        title = 'Application Added';
      } else if (act.type.startsWith('interview_')) {
        iconType = 'interview';
        title = 'Interview Activity';
      } else if (act.type.startsWith('follow')) {
        iconType = 'followup';
        title = 'Follow-Up Action';
      } else if (act.type === 'job_updated') {
        iconType = 'update';
        title = 'Details Updated';
      }

      rawEvents.push({
        id: act.id,
        type: act.type,
        title,
        description: act.description,
        timestamp: act.createdAt,
        isStatusChange,
        fromStatus,
        toStatus,
        iconType,
      });
    });

    // 2. Synthesize baseline events if needed (e.g. application date / initial creation)
    const hasJobCreated = rawEvents.some((e) => e.type === 'job_created');
    if (!hasJobCreated && job.createdAt) {
      rawEvents.push({
        id: `synth-created-${job.id}`,
        type: 'job_created',
        title: 'Opportunity Created',
        description: `Created tracking entry for ${job.companyName} (${job.jobTitle})`,
        timestamp: job.createdAt,
        iconType: 'created',
      });
    }

    if (job.dateApplied) {
      const hasApplied = rawEvents.some(
        (e) =>
          e.description.toLowerCase().includes('applied') ||
          (e.toStatus && e.toStatus.toLowerCase() === 'applied')
      );
      if (!hasApplied) {
        rawEvents.push({
          id: `synth-applied-${job.id}`,
          type: 'status_changed',
          title: 'Application Submitted',
          description: `Applied for ${job.jobTitle} position at ${job.companyName}`,
          timestamp: `${job.dateApplied}T09:00:00.000Z`,
          isStatusChange: true,
          toStatus: 'applied',
          iconType: 'status',
        });
      }
    }

    // Sort descending by timestamp (newest first)
    return rawEvents.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [job, activities]);

  const renderIcon = (event: ParsedTimelineEvent, index: number) => {
    const isLatest = index === 0;
    switch (event.iconType) {
      case 'created':
        return <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'status':
        return isLatest ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <ArrowRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        );
      case 'interview':
        return <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
      case 'followup':
        return <Send className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'update':
        return <Edit2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />;
    }
  };

  const getIconBg = (event: ParsedTimelineEvent, index: number) => {
    const isLatest = index === 0;
    if (isLatest) {
      return 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 ring-4 ring-emerald-500/10';
    }
    switch (event.iconType) {
      case 'created':
        return 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800';
      case 'status':
        return 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800';
      case 'interview':
        return 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800';
      case 'followup':
        return 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div id="job-activity-timeline-container" className="space-y-4 animate-in fade-in duration-150">
      {/* Timeline Header & Metrics */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Status History & Timeline</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {events.length} tracked pipeline {events.length === 1 ? 'event' : 'events'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Current Stage:
          </span>
          <span className={`px-2.5 py-1 text-xs font-bold rounded-lg capitalize border ${getStatusBadgeClasses(job.status).bg} ${getStatusBadgeClasses(job.status).text} ${getStatusBadgeClasses(job.status).border}`}>
            {job.status}
          </span>
        </div>
      </div>

      {/* Events List Spine */}
      {events.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            No activity logged yet
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Status movements and interviews will automatically build your application timeline.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {events.map((event, index) => {
            const isLatest = index === 0;
            const fromBadge = event.fromStatus ? getStatusBadgeClasses(event.fromStatus) : null;
            const toBadge = event.toStatus ? getStatusBadgeClasses(event.toStatus) : null;

            return (
              <div
                key={event.id}
                id={`timeline-event-${event.id}`}
                className="relative flex items-start gap-3 group"
              >
                {/* Timeline Node Icon */}
                <div
                  className={`absolute -left-6 top-1 w-7 h-7 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-110 ${getIconBg(
                    event,
                    index
                  )}`}
                >
                  {renderIcon(event, index)}
                </div>

                {/* Event Card Content */}
                <div
                  className={`flex-1 p-3.5 rounded-2xl border transition-all ${
                    isLatest
                      ? 'bg-white dark:bg-slate-850 border-emerald-200 dark:border-emerald-900/60 shadow-xs ring-1 ring-emerald-500/10'
                      : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {event.title}
                      </span>
                      {isLatest && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          Latest
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">
                        {formatRelativeTime(event.timestamp)}
                      </span>
                      <span>·</span>
                      <span className="text-[10px]">
                        {new Date(event.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Status Transition Visualizer if from -> to exists */}
                  {event.fromStatus && event.toStatus ? (
                    <div className="flex items-center gap-2 my-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-750">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md capitalize border ${
                          fromBadge?.bg
                        } ${fromBadge?.text} ${fromBadge?.border}`}
                      >
                        {event.fromStatus}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md capitalize border ${
                          toBadge?.bg
                        } ${toBadge?.text} ${toBadge?.border}`}
                      >
                        {event.toStatus}
                      </span>
                    </div>
                  ) : null}

                  {/* Description / details */}
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {event.description}
                  </p>

                  <div className="mt-1.5 text-[10px] text-slate-400">
                    {new Date(event.timestamp).toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
