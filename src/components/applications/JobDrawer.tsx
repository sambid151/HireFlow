import React from 'react';
import { X, Briefcase } from 'lucide-react';
import { Job, JobStatus } from '../../types';
import { AddJobForm } from './AddJobForm';
import { useHireFlow } from '../../context/HireFlowContext';

interface JobDrawerProps {
  isOpen: boolean;
  jobToEdit: Job | null;
  initialStatus?: JobStatus;
  quickAddMode?: boolean;
  onClose: () => void;
}

export const JobDrawer: React.FC<JobDrawerProps> = ({
  isOpen,
  jobToEdit,
  initialStatus = 'wishlist',
  quickAddMode = false,
  onClose,
}) => {
  const { setActiveTab, setSelectedJob } = useHireFlow();

  if (!isOpen) return null;

  return (
    <div
      id="job-drawer-backdrop"
      onClick={onClose}
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex justify-end animate-in fade-in duration-150"
    >
      <div
        id="job-drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-drawer-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-xl md:max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
          <div>
            <h2 id="job-drawer-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{jobToEdit ? 'Edit Opportunity' : 'Add Opportunity'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {jobToEdit
                ? 'Update opportunity details, pipeline status & recruiter notes'
                : 'Track a new opportunity in your private pipeline'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Form Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <AddJobForm
            jobToEdit={jobToEdit}
            initialStatus={initialStatus}
            quickAddMode={quickAddMode}
            onSuccess={(savedJob) => {
              setActiveTab('applications');
              setSelectedJob(savedJob);
            }}
            onClose={onClose}
            isModalOrDrawer={true}
          />
        </div>
      </div>
    </div>
  );
};
