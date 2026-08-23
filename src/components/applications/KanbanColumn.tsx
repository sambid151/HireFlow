import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Job, JobStatus } from '../../types';
import { JobCard } from './JobCard';

interface KanbanColumnProps {
  status: JobStatus;
  title: string;
  subtitle: string;
  colorDot: string;
  badgeBg: string;
  jobs: Job[];
  isDragOver?: boolean;
  onAddJobInColumn: (status: JobStatus) => void;
  onOpenDetails: (job: Job) => void;
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  subtitle,
  colorDot,
  badgeBg,
  jobs,
  isDragOver = false,
  onAddJobInColumn,
  onOpenDetails,
  onEdit,
  onDelete,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: 'Column',
      status,
    },
  });

  const isHighlighted = isOver || isDragOver;

  return (
    <div
      id={`kanban-column-${status}`}
      className={`flex flex-col w-72 sm:w-80 shrink-0 rounded-2xl p-3 transition-all duration-200 ${
        isHighlighted
          ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-2 border-emerald-500 dark:border-emerald-400 ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/10'
          : 'bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-1 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full ${colorDot} shrink-0`} />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {title}
          </h3>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-bold ${badgeBg}`}
          >
            {jobs.length}
          </span>
        </div>

        <button
          onClick={() => onAddJobInColumn(status)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
          title={`Add job to ${title}`}
          aria-label={`Add job to ${title}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Sortable Cards Container */}
      <div
        ref={setNodeRef}
        className="flex-1 space-y-2.5 overflow-y-auto min-h-[160px] p-0.5"
      >
        <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onOpenDetails={onOpenDetails}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>

        {jobs.length === 0 && (
          <div
            onClick={() => onAddJobInColumn(status)}
            className={`h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-3 text-center transition-all cursor-pointer group ${
              isHighlighted
                ? 'border-emerald-500 bg-emerald-100/50 dark:bg-emerald-900/30'
                : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400/60 dark:hover:border-emerald-600/60'
            }`}
          >
            <p
              className={`text-xs font-bold transition-colors ${
                isHighlighted
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
              }`}
            >
              {isHighlighted ? `Drop here for ${title}` : `Add ${title}`}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">{subtitle}</p>
          </div>
        )}
      </div>
    </div>
  );
};
