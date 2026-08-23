import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Building2,
  ExternalLink,
  MoreVertical,
  Calendar,
  AlertCircle,
  FileText,
  User,
  Users,
  DollarSign,
  MapPin,
  Clock,
  Trash2,
  Edit2,
  CheckCircle,
} from 'lucide-react';
import { Job, JobStatus } from '../../types';
import { useHireFlow } from '../../context/HireFlowContext';
import { formatDaysAgoText, getFollowUpStatus } from '../../utils';

interface JobCardProps {
  job: Job;
  onOpenDetails: (job: Job) => void;
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onOpenDetails, onEdit, onDelete }) => {
  const { resumes, moveJobStatus } = useHireFlow();
  const [showMenu, setShowMenu] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: job.id,
    data: {
      type: 'Job',
      job,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const resume = resumes.find((r) => r.id === job.resumeId);
  const followUp = getFollowUpStatus(job);
  const daysText = job.dateApplied ? formatDaysAgoText(job.dateApplied) : null;

  // Status border / accent
  const statusBorderMap: Record<JobStatus, string> = {
    wishlist: 'border-l-slate-400 dark:border-l-slate-600',
    applied: 'border-l-blue-500',
    'follow-up': 'border-l-amber-500',
    interview: 'border-l-purple-500',
    offer: 'border-l-emerald-500',
    rejected: 'border-l-rose-500',
  };

  const companyInitials = job.companyName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={`job-card-${job.id}`}
      onClick={() => onOpenDetails(job)}
      className={`group relative p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 border-l-4 ${
        statusBorderMap[job.status]
      } shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-150 cursor-pointer select-none ${
        isDragging ? 'opacity-40 ring-2 ring-emerald-500 shadow-xl' : ''
      }`}
    >
      {/* Top Header: Company Avatar + Name + Menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0" {...attributes} {...listeners}>
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 shrink-0 shadow-2xs">
            {companyInitials || <Building2 className="w-4 h-4 text-slate-400" />}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {job.companyName}
            </h4>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
              {job.jobTitle}
            </p>
          </div>
        </div>

        {/* 3-dot Action Menu */}
        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Job actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onEdit(job);
                }}
                className="w-full px-3 py-1.5 text-xs text-left font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>

              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/60 mt-1 pt-1">
                Move Stage
              </div>
              {(['wishlist', 'applied', 'follow-up', 'interview', 'offer', 'rejected'] as JobStatus[]).map(
                (st) =>
                  st !== job.status && (
                    <button
                      key={st}
                      onClick={() => {
                        setShowMenu(false);
                        moveJobStatus(job.id, st);
                      }}
                      className="w-full px-3 py-1 text-xs text-left text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 capitalize cursor-pointer"
                    >
                      → {st}
                    </button>
                  )
              )}

              <div className="border-t border-slate-100 dark:border-slate-700/60 my-1" />
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete(job);
                }}
                className="w-full px-3 py-1.5 text-xs text-left font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Job</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mid Info: Resume tag + Salary + Work mode */}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {resume && (
          <span
            title={`Resume Profile: ${resume.name}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono font-medium max-w-[140px] truncate"
          >
            <FileText className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{resume.name}</span>
          </span>
        )}

        {job.salaryRange && (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
            <span>{job.salaryRange}</span>
          </span>
        )}

        {job.workMode && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {job.workMode}
          </span>
        )}
      </div>

      {/* Follow-up / Warning Badge */}
      {followUp.isRecommended && (
        <div
          className={`mt-2 px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 ${
            followUp.isOverdue
              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/60'
              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{followUp.label}</span>
        </div>
      )}

      {/* Bottom Footer: Date applied & Meta indicators */}
      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1 truncate">
          {daysText && (
            <span className="flex items-center gap-1 truncate text-slate-500 dark:text-slate-400 font-medium">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{daysText}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {job.recruiterName && (
            <span title={`Recruiter: ${job.recruiterName}`} className="text-slate-400 hover:text-slate-600">
              <User className="w-3.5 h-3.5" />
            </span>
          )}
          {job.referralName && (
            <span title={`Referral: ${job.referralName}`} className="text-emerald-500">
              <Users className="w-3.5 h-3.5" />
            </span>
          )}
          {job.linkedinUrl && (
            <a
              href={job.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-slate-400 hover:text-blue-600 transition"
              title="Open LinkedIn Job"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
