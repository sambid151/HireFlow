import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Plus,
  LayoutGrid,
  List,
  Sparkles,
  Building2,
  X,
  FileText,
  Clock,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import { Job, JobStatus } from '../../types';
import { useHireFlow } from '../../context/HireFlowContext';
import { KanbanColumn } from './KanbanColumn';
import { JobCard } from './JobCard';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { JobDetailsModal } from './JobDetailsModal';
import { Button } from '../common/Button';
import { getDaysAgo, getFollowUpStatus } from '../../utils';

export const ApplicationsView: React.FC = () => {
  const {
    jobs,
    resumes,
    addJob,
    updateJob,
    deleteJob,
    moveJobStatus,
    reorderJobs,
    openAddOpportunity,
    openEditOpportunity,
    selectedJob,
    setSelectedJob,
    searchQuery,
    setSearchQuery,
    loadDemoWorkspace,
  } = useHireFlow();

  // Local View state
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [activeDragJob, setActiveDragJob] = useState<Job | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<JobStatus | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterResume, setFilterResume] = useState<string>('all');
  const [filterWorkMode, setFilterWorkMode] = useState<string>('all');
  const [filterFollowUpOnly, setFilterFollowUpOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'company' | 'role' | 'stale'>('newest');
  const [showFilterDrawer, setShowFilterDrawer] = useState<boolean>(false);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columns: {
    status: JobStatus;
    title: string;
    subtitle: string;
    colorDot: string;
    badgeBg: string;
  }[] = [
    {
      status: 'wishlist',
      title: 'Wishlist',
      subtitle: 'Saved jobs I haven’t applied to yet',
      colorDot: 'bg-slate-400',
      badgeBg: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
    },
    {
      status: 'applied',
      title: 'Applied',
      subtitle: 'Application submitted',
      colorDot: 'bg-blue-500',
      badgeBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300',
    },
    {
      status: 'follow-up',
      title: 'Follow-up',
      subtitle: 'Followed up with recruiter/referral',
      colorDot: 'bg-amber-500',
      badgeBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
    },
    {
      status: 'interview',
      title: 'Interview',
      subtitle: 'Currently in interview rounds',
      colorDot: 'bg-purple-500',
      badgeBg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300',
    },
    {
      status: 'offer',
      title: 'Offer',
      subtitle: 'Received an offer',
      colorDot: 'bg-emerald-500',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300',
    },
    {
      status: 'rejected',
      title: 'Archived / Rejected',
      subtitle: 'Closed or rejected applications',
      colorDot: 'bg-rose-500',
      badgeBg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300',
    },
  ];

  // Filtering and Sorting
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Global / Local Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          job.companyName.toLowerCase().includes(q) ||
          job.jobTitle.toLowerCase().includes(q) ||
          job.location?.toLowerCase().includes(q) ||
          job.recruiterName?.toLowerCase().includes(q) ||
          job.notes?.toLowerCase().includes(q) ||
          job.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Status
      if (filterStatus !== 'all' && job.status !== filterStatus) return false;

      // Resume
      if (filterResume !== 'all' && job.resumeId !== filterResume) return false;

      // Work Mode
      if (filterWorkMode !== 'all' && job.workMode !== filterWorkMode) return false;

      // Follow-up required only
      if (filterFollowUpOnly) {
        const fu = getFollowUpStatus(job);
        if (!fu.isRecommended) return false;
      }

      return true;
    });
  }, [jobs, searchQuery, filterStatus, filterResume, filterWorkMode, filterFollowUpOnly]);

  const sortedJobs = useMemo(() => {
    return [...filteredJobs].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'company') {
        return a.companyName.localeCompare(b.companyName);
      }
      if (sortBy === 'role') {
        return a.jobTitle.localeCompare(b.jobTitle);
      }
      if (sortBy === 'stale') {
        const daysA = getDaysAgo(a.dateApplied) ?? -1;
        const daysB = getDaysAgo(b.dateApplied) ?? -1;
        return daysB - daysA;
      }
      return 0;
    });
  }, [filteredJobs, sortBy]);

  const activeFilterCount =
    (filterStatus !== 'all' ? 1 : 0) +
    (filterResume !== 'all' ? 1 : 0) +
    (filterWorkMode !== 'all' ? 1 : 0) +
    (filterFollowUpOnly ? 1 : 0);

  const clearAllFilters = () => {
    setFilterStatus('all');
    setFilterResume('all');
    setFilterWorkMode('all');
    setFilterFollowUpOnly(false);
    setSearchQuery('');
  };

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const current = jobs.find((j) => j.id === active.id);
    if (current) {
      setActiveDragJob(current);
      setDragOverStatus(current.status);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setDragOverStatus(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeJob = jobs.find((j) => j.id === activeId);
    if (!activeJob) return;

    // Check if over a column directly
    const isOverColumn = columns.some((c) => c.status === overId);
    if (isOverColumn) {
      setDragOverStatus(overId as JobStatus);
      if (activeJob.status !== overId) {
        moveJobStatus(activeId, overId as JobStatus);
      }
      return;
    }

    // Check if over another job in a different column
    const overJob = jobs.find((j) => j.id === overId);
    if (overJob) {
      setDragOverStatus(overJob.status);
      if (activeJob.status !== overJob.status) {
        moveJobStatus(activeId, overJob.status);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragJob(null);
    setDragOverStatus(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const oldIndex = jobs.findIndex((j) => j.id === activeId);
    const newIndex = jobs.findIndex((j) => j.id === overId);

    if (oldIndex >= 0 && newIndex >= 0) {
      const reordered = arrayMove(jobs, oldIndex, newIndex).map((j, idx) => ({
        ...j,
        order: idx,
      }));
      await reorderJobs(reordered);
    }
  };

  const handleDragCancel = () => {
    setActiveDragJob(null);
    setDragOverStatus(null);
  };

  const handleAddInColumn = (colStatus: JobStatus) => {
    openAddOpportunity(colStatus);
  };

  return (
    <div id="applications-workspace" className="space-y-5 max-w-[1600px] mx-auto pb-16">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Track Applications
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              {jobs.length} total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Your opportunities, from wishlist to offer.
          </p>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          {/* Quick Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search companies, roles, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Quick Status Filter Dropdown */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter by Status"
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Stages</option>
            <option value="wishlist">Wishlist</option>
            <option value="applied">Applied</option>
            <option value="follow-up">Follow-up</option>
            <option value="interview">Interview</option>
            <option value="offer">Offer</option>
            <option value="rejected">Archived / Rejected</option>
          </select>

          {/* Resume Filter */}
          {resumes.length > 0 && (
            <select
              value={filterResume}
              onChange={(e) => setFilterResume(e.target.value)}
              aria-label="Filter by Resume Profile"
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Resumes</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          )}

          {/* Follow-up Only Quick Chip */}
          <button
            onClick={() => setFilterFollowUpOnly((prev) => !prev)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
              filterFollowUpOnly
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-800 dark:text-amber-300'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Follow-up Recommended</span>
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 px-2 py-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear filters ({activeFilterCount})</span>
            </button>
          )}
        </div>

        {/* Sort options */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Sort opportunities by"
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="company">Company A-Z</option>
            <option value="role">Role A-Z</option>
            <option value="stale">Most Days Since Applied</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {jobs.length === 0 ? (
        /* Empty State */
        <div className="py-20 px-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Your pipeline is waiting for its first opportunity.
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            Add job links, recruiters, and target salaries to track your search in one private, organized workspace.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <Button
              onClick={() => openAddOpportunity('wishlist')}
              icon={Plus}
              size="md"
              variant="emerald"
            >
              Add First Job
            </Button>
            <Button
              onClick={loadDemoWorkspace}
              icon={Sparkles}
              size="md"
              variant="secondary"
            >
              Load Demo Workspace
            </Button>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board View */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex gap-4 overflow-x-auto pb-6 pt-1">
            {columns.map((col) => {
              const colJobs = sortedJobs.filter((j) => j.status === col.status);
              return (
                <KanbanColumn
                  key={col.status}
                  status={col.status}
                  title={col.title}
                  subtitle={col.subtitle}
                  colorDot={col.colorDot}
                  badgeBg={col.badgeBg}
                  jobs={colJobs}
                  isDragOver={dragOverStatus === col.status && activeDragJob !== null}
                  onAddJobInColumn={handleAddInColumn}
                  onOpenDetails={(job) => setSelectedJob(job)}
                  onEdit={(job) => openEditOpportunity(job)}
                  onDelete={(job) => setJobToDelete(job)}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeDragJob ? (
              <div className="w-72 shadow-2xl rotate-2">
                <JobCard
                  job={activeDragJob}
                  onOpenDetails={() => {}}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Opportunity & Role</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Resume Version</th>
                  <th className="py-3 px-4">Applied Date</th>
                  <th className="py-3 px-4">Compensation</th>
                  <th className="py-3 px-4">Follow-up</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedJobs.map((job) => {
                  const resume = resumes.find((r) => r.id === job.resumeId);
                  const followUp = getFollowUpStatus(job);
                  return (
                    <tr
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {job.opportunityName || `${job.companyName} - ${job.jobTitle}`}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400">{job.companyName} · {job.jobTitle}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {resume?.name || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {job.dateApplied || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                        {job.salaryRange || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {followUp.isRecommended ? (
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                              followUp.isOverdue
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {followUp.label}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEditOpportunity(job)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Job Details Modal Drawer */}
      <JobDetailsModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onEdit={(job) => {
          setSelectedJob(null);
          openEditOpportunity(job);
        }}
        onDelete={(job) => {
          setSelectedJob(null);
          setJobToDelete(job);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={jobToDelete !== null}
        title="Delete this application?"
        message={`Are you sure you want to delete ${jobToDelete?.companyName} (${jobToDelete?.jobTitle})? This action cannot be undone.`}
        confirmLabel="Delete Application"
        onConfirm={async () => {
          if (jobToDelete) {
            await deleteJob(jobToDelete.id);
            setJobToDelete(null);
          }
        }}
        onCancel={() => setJobToDelete(null)}
      />
    </div>
  );
};
