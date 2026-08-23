import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Job, ResumeProfile, Interview, Activity, Goal, Settings, JobStatus, ViewTab } from '../types';
import * as db from '../db/database';
import { calculateJobSearchHealth, calculateStreak, getDaysAgo, getFollowUpStatus, triggerCelebration, generateJobsCSV } from '../utils';
import { extractResumeFile, analyzeResumeText } from '../utils/resumeExtractor';

export interface ToastItem {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  actionLabel?: string;
  onAction?: () => void;
}

export interface AttentionItem {
  id: string;
  job: Job;
  type: 'followup_overdue' | 'stale_applied' | 'upcoming_interview' | 'goal_behind';
  title: string;
  subtitle: string;
  actionText: string;
  severity: 'urgent' | 'warning' | 'info';
  onAction: () => void;
}

interface HireFlowContextType {
  // State
  jobs: Job[];
  resumes: ResumeProfile[];
  interviews: Interview[];
  activities: Activity[];
  goals: Goal[];
  settings: Settings;
  isLoading: boolean;
  isLoaded: boolean;
  activeTab: ViewTab;
  searchQuery: string;
  selectedJob: Job | null;
  editingJob: Job | null;
  isAddJobOpen: boolean;
  initialJobStatus: JobStatus;
  quickAddMode: boolean;
  preselectedResumeId: string | null;
  isCommandPaletteOpen: boolean;
  isOnboardingOpen: boolean;
  toasts: ToastItem[];
  theme: 'light' | 'dark';

  // Setters
  setActiveTab: (tab: ViewTab) => void;
  setSearchQuery: (query: string) => void;
  setSelectedJob: (job: Job | null) => void;
  setEditingJob: (job: Job | null) => void;
  setIsAddJobOpen: (open: boolean, quick?: boolean) => void;
  setInitialJobStatus: (status: JobStatus) => void;
  openAddOpportunity: (status?: JobStatus) => void;
  openEditOpportunity: (job: Job) => void;
  setPreselectedResumeId: (id: string | null) => void;
  setIsCommandPaletteOpen: (open: boolean) => void;
  setIsOnboardingOpen: (open: boolean) => void;
  toggleTheme: () => void;

  // Actions
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => Promise<Job>;
  updateJob: (job: Job) => Promise<Job>;
  deleteJob: (id: string) => Promise<void>;
  moveJobStatus: (jobId: string, newStatus: JobStatus) => Promise<void>;
  reorderJobs: (updatedJobs: Job[]) => Promise<void>;

  addResume: (resume: Omit<ResumeProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ResumeProfile>;
  uploadResumeFile: (file: File) => Promise<ResumeProfile>;
  updateResume: (resume: ResumeProfile) => Promise<ResumeProfile>;
  deleteResume: (id: string) => Promise<void>;

  addInterview: (interview: Omit<Interview, 'id' | 'createdAt'>) => Promise<Interview>;
  updateInterview: (interview: Interview) => Promise<Interview>;
  deleteInterview: (id: string) => Promise<void>;

  saveGoal: (goal: Goal) => Promise<Goal>;
  deleteGoal: (id: string) => Promise<void>;

  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;

  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error', actionLabel?: string, onAction?: () => void) => void;
  dismissToast: (id: string) => void;

  loadDemoWorkspace: () => Promise<void>;
  clearWorkspace: () => Promise<void>;
  clearAllData: () => Promise<void>;
  exportDataJson: () => Promise<void>;
  exportDataCsv: () => Promise<void>;
  importDataJson: (jsonString: string) => Promise<boolean>;
  refreshData: () => Promise<void>;

  // Computed metrics
  healthData: ReturnType<typeof calculateJobSearchHealth>;
  streakData: ReturnType<typeof calculateStreak>;
  attentionItems: AttentionItem[];
  kpis: {
    totalApplications: number;
    activeApplications: number;
    interviewCount: number;
    offerCount: number;
    followUpCount: number;
    successRate: string;
    hasEnoughData: boolean;
  };
  funnelData: {
    wishlist: number;
    applied: number;
    followUp: number;
    interview: number;
    offer: number;
    appliedToInterviewRate: number;
    interviewToOfferRate: number;
  };
  isDemoWorkspace: boolean;
}

const HireFlowContext = createContext<HireFlowContextType | null>(null);

export const HireFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumes, setResumes] = useState<ResumeProfile[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [settings, setSettings] = useState<Settings>({
    theme: 'light',
    themeMode: 'system',
    weeklyTarget: 8,
    defaultFollowUpDays: 7,
    onboardingCompleted: false,
    userFullName: 'Job Seeker',
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isAddJobOpen, setIsAddJobOpenState] = useState<boolean>(false);
  const [initialJobStatus, setInitialJobStatus] = useState<JobStatus>('wishlist');
  const [quickAddMode, setQuickAddMode] = useState<boolean>(false);
  const [preselectedResumeId, setPreselectedResumeId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success', actionLabel?: string, onAction?: () => void) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      setToasts((prev) => [...prev, { id, message, type, actionLabel, onAction }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setIsAddJobOpen = useCallback((open: boolean, quick = false) => {
    setIsAddJobOpenState(open);
    setQuickAddMode(quick);
    if (!open) {
      setEditingJob(null);
    }
  }, []);

  const openAddOpportunity = useCallback((status: JobStatus = 'wishlist') => {
    setEditingJob(null);
    setInitialJobStatus(status);
    setIsAddJobOpenState(true);
    setQuickAddMode(false);
  }, []);

  const openEditOpportunity = useCallback((job: Job) => {
    setEditingJob(job);
    setIsAddJobOpenState(true);
    setQuickAddMode(false);
  }, []);

  // Initial load
  const refreshData = useCallback(async () => {
    try {
      const [j, r, i, a, g, s] = await Promise.all([
        db.getJobs(),
        db.getResumes(),
        db.getInterviews(),
        db.getActivities(50),
        db.getGoals(),
        db.getSettings(),
      ]);

      setJobs(j);
      setResumes(r);
      setInterviews(i);
      setActivities(a);
      setGoals(g);
      setSettings(s);

      // Check if first-time onboarding needed
      if (!s.onboardingCompleted && j.length === 0 && r.length === 0) {
        setIsOnboardingOpen(true);
      }
    } catch (err) {
      console.error('Failed to load data from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Global Keyboard shortcuts: Cmd+K / Ctrl+K, 'N' for new job, '/' for search, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Esc closes overlays
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsAddJobOpenState(false);
        setSelectedJob(null);
        setIsOnboardingOpen(false);
        return;
      }

      // If user is typing in a form, don't trigger single letter shortcuts
      if (isInput) return;

      // 'N' opens Quick Add
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsAddJobOpen(true, true);
      }

      // '/' opens search / command palette
      if (e.key === '/') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsAddJobOpen]);

  // Actions
  const toggleTheme = useCallback(async () => {
    const nextTheme = settings.theme === 'light' ? 'dark' : 'light';
    const updated = await db.saveSettings({ theme: nextTheme, themeMode: nextTheme });
    setSettings(updated);
    showToast(`Switched to ${nextTheme} mode`, 'info');
  }, [settings.theme, showToast]);

  const addJob = useCallback(
    async (jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
      const newJob: Job = {
        ...jobData,
        id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: jobs.filter((j) => j.status === jobData.status).length,
      };

      const saved = await db.addJob(newJob);
      setJobs((prev) => [...prev, saved]);
      const act = await db.getActivities(50);
      setActivities(act);
      showToast(`Added ${newJob.companyName} (${newJob.jobTitle})`, 'success');
      return saved;
    },
    [jobs, showToast]
  );

  const updateJob = useCallback(
    async (job: Job) => {
      const updated = await db.updateJob(job);
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
      if (selectedJob?.id === updated.id) {
        setSelectedJob(updated);
      }
      const act = await db.getActivities(50);
      setActivities(act);
      showToast(`Updated ${job.companyName}`, 'success');
      return updated;
    },
    [selectedJob, showToast]
  );

  const deleteJob = useCallback(
    async (id: string) => {
      const target = jobs.find((j) => j.id === id);
      await db.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      setInterviews((prev) => prev.filter((i) => i.jobId !== id));
      if (selectedJob?.id === id) {
        setSelectedJob(null);
      }
      const act = await db.getActivities(50);
      setActivities(act);
      showToast(`Deleted ${target?.companyName || 'opportunity'}`, 'info');
    },
    [jobs, selectedJob, showToast]
  );

  const moveJobStatus = useCallback(
    async (jobId: string, newStatus: JobStatus) => {
      const target = jobs.find((j) => j.id === jobId);
      if (!target || target.status === newStatus) return;

      const previousStatus = target.status;
      const updated: Job = {
        ...target,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        dateApplied: newStatus === 'applied' && !target.dateApplied ? new Date().toISOString().split('T')[0] : target.dateApplied,
      };

      await db.updateJob(updated);
      setJobs((prev) => prev.map((j) => (j.id === jobId ? updated : j)));
      if (selectedJob?.id === jobId) {
        setSelectedJob(updated);
      }

      if (newStatus === 'offer') {
        triggerCelebration();
        showToast(`🎉 Congratulations! Offer received from ${target.companyName}!`, 'success');
      } else {
        const formattedStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
        showToast(`Moved to ${formattedStatus}`, 'success', 'Undo', async () => {
          await moveJobStatus(jobId, previousStatus);
        });
      }

      const act = await db.getActivities(50);
      setActivities(act);
    },
    [jobs, selectedJob, showToast]
  );

  const reorderJobs = useCallback(async (updatedJobs: Job[]) => {
    setJobs(updatedJobs);
    await db.batchUpdateJobs(updatedJobs);
  }, []);

  const addResume = useCallback(
    async (resumeData: Omit<ResumeProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newResume: ResumeProfile = {
        ...resumeData,
        id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const saved = await db.addResume(newResume);
      setResumes((prev) => [saved, ...prev]);
      const act = await db.getActivities(50);
      setActivities(act);
      showToast(`Created resume "${saved.name}"`, 'success');
      return saved;
    },
    [showToast]
  );

  const uploadResumeFile = useCallback(
    async (file: File): Promise<ResumeProfile> => {
      // 1. Validate file type
      const validExtensions = ['.pdf', '.docx', '.txt'];
      const fileNameLower = file.name.toLowerCase();
      const isValid = validExtensions.some((ext) => fileNameLower.endsWith(ext)) ||
        file.type.includes('pdf') ||
        file.type.includes('word') ||
        file.type.includes('text');

      if (!isValid) {
        showToast('Please upload a PDF, DOCX, or TXT resume file.', 'error');
        throw new Error('Unsupported file format');
      }

      // 2. Validate reasonable size (max 15MB)
      if (file.size > 15 * 1024 * 1024) {
        showToast('Resume file is too large (max 15MB).', 'error');
        throw new Error('File exceeds maximum size limit');
      }

      // 3. Extract text
      const { text, error: extractionError } = await extractResumeFile(file);
      if (extractionError) {
        console.warn('Text extraction warning:', extractionError);
      }

      // 4. Analyze extracted text locally
      const analyzed = analyzeResumeText(text, file.name);

      // Clean name from file name (e.g. SDE_Resume_v3.pdf -> SDE_Resume_v3)
      const cleanBaseName = file.name.replace(/\.[^/.]+$/, '');

      const newResume: ResumeProfile = {
        id: `res-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: cleanBaseName,
        originalFileName: file.name,
        fileType: file.type || (fileNameLower.endsWith('.pdf') ? 'application/pdf' : fileNameLower.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain'),
        fileSize: file.size,
        fileBlob: file,
        extractedText: text || '',
        targetRole: analyzed.targetRole || 'Software Engineer',
        skills: analyzed.skills.length > 0 ? analyzed.skills : ['Engineering', 'Problem Solving'],
        yearsOfExperience: analyzed.yearsOfExperience,
        experienceSignals: analyzed.experienceSignals,
        suggestedImprovements: analyzed.suggestedImprovements,
        version: 'v1.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
      };

      const saved = await db.addResume(newResume);
      setResumes((prev) => [saved, ...prev]);

      // Set as preselected resume for Track Applications "+ Add Job"
      setPreselectedResumeId(saved.id);

      const act = await db.getActivities(50);
      setActivities(act);

      // Show success toast per Section 3
      showToast('Resume uploaded successfully.', 'success');

      return saved;
    },
    [showToast]
  );

  const updateResume = useCallback(
    async (resume: ResumeProfile) => {
      const updated = await db.updateResume(resume);
      setResumes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      const act = await db.getActivities(50);
      setActivities(act);
      showToast(`Updated resume profile`, 'success');
      return updated;
    },
    [showToast]
  );

  const deleteResume = useCallback(
    async (id: string) => {
      await db.deleteResume(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
      const act = await db.getActivities(50);
      setActivities(act);
      showToast(`Resume removed`, 'info');
    },
    [showToast]
  );

  const addInterview = useCallback(
    async (interviewData: Omit<Interview, 'id' | 'createdAt'>) => {
      const newInterview: Interview = {
        ...interviewData,
        id: `int-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      const saved = await db.addInterview(newInterview);
      setInterviews((prev) => [...prev, saved]);
      await refreshData();
      showToast(`Interview scheduled with ${saved.companyName || 'Company'}`, 'success');
      return saved;
    },
    [refreshData, showToast]
  );

  const updateInterview = useCallback(
    async (interview: Interview) => {
      const updated = await db.updateInterview(interview);
      setInterviews((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      await refreshData();
      showToast(`Interview updated`, 'success');
      return updated;
    },
    [refreshData, showToast]
  );

  const deleteInterview = useCallback(
    async (id: string) => {
      await db.deleteInterview(id);
      setInterviews((prev) => prev.filter((i) => i.id !== id));
      showToast(`Interview removed`, 'info');
    },
    [showToast]
  );

  const saveGoal = useCallback(
    async (goal: Goal) => {
      const saved = await db.saveGoal(goal);
      setGoals((prev) => {
        const idx = prev.findIndex((g) => g.id === goal.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [...prev, saved];
      });
      showToast(`Saved goal target`, 'success');
      return saved;
    },
    [showToast]
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      await db.deleteGoal(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
      showToast(`Goal deleted`, 'info');
    },
    [showToast]
  );

  const updateSettings = useCallback(
    async (newSettings: Partial<Settings>) => {
      const updated = await db.saveSettings(newSettings);
      setSettings(updated);
      showToast(`Settings updated`, 'success');
    },
    [showToast]
  );

  const loadDemoWorkspace = useCallback(async () => {
    setIsLoading(true);
    await db.loadDemoWorkspace();
    await refreshData();
    showToast('Loaded demo workspace with opportunities, resumes & interviews', 'success');
  }, [refreshData, showToast]);

  const clearWorkspace = useCallback(async () => {
    setIsLoading(true);
    await db.clearAllData();
    await refreshData();
    showToast('Workspace data cleared', 'info');
  }, [refreshData, showToast]);

  const clearAllData = useCallback(async () => {
    await clearWorkspace();
  }, [clearWorkspace]);

  const exportDataJson = useCallback(async () => {
    const backupJson = await db.exportBackup();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hireflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported HireFlow backup successfully!', 'success');
  }, [showToast]);

  const exportDataCsv = useCallback(async () => {
    const csvContent = generateJobsCSV(jobs, resumes);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hireflow-applications-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${jobs.length} job applications to CSV successfully!`, 'success');
  }, [jobs, resumes, showToast]);

  const importDataJson = useCallback(
    async (jsonString: string) => {
      setIsLoading(true);
      const success = await db.importBackup(jsonString);
      if (success) {
        await refreshData();
        showToast('Backup restored successfully!', 'success');
      } else {
        setIsLoading(false);
        showToast('Failed to import backup.', 'error');
      }
      return success;
    },
    [refreshData, showToast]
  );

  // Computed Metrics
  const healthData = useMemo(() => {
    return calculateJobSearchHealth(jobs, interviews, activities, settings.weeklyTarget || 10);
  }, [jobs, interviews, activities, settings.weeklyTarget]);

  const streakData = useMemo(() => {
    return calculateStreak(activities);
  }, [activities]);

  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];

    // 1. Follow-up overdue or due
    for (const job of jobs) {
      const followUp = getFollowUpStatus(job);
      if (followUp.isOverdue) {
        items.push({
          id: `att-overdue-${job.id}`,
          job,
          type: 'followup_overdue',
          title: `${job.companyName} — ${job.jobTitle}`,
          subtitle: followUp.label,
          actionText: 'Follow Up Now',
          severity: 'urgent',
          onAction: () => {
            setSelectedJob(job);
          },
        });
      } else if (job.status === 'applied') {
        const days = getDaysAgo(job.dateApplied);
        if (days !== null && days >= 8) {
          items.push({
            id: `att-stale-${job.id}`,
            job,
            type: 'stale_applied',
            title: `${job.companyName} — ${job.jobTitle}`,
            subtitle: `Applied ${days} days ago ⚠ Follow-up recommended`,
            actionText: 'Move to Follow-up',
            severity: 'warning',
            onAction: () => {
              moveJobStatus(job.id, 'follow-up');
              setSelectedJob(job);
            },
          });
        }
      }
    }

    // 2. Upcoming interviews in next 3 days
    for (const int of interviews) {
      if (int.result === 'scheduled') {
        const days = getDaysAgo(int.date);
        if (days !== null && days <= 0 && days >= -3) {
          const matchedJob = jobs.find((j) => j.id === int.jobId);
          if (matchedJob) {
            const timeLabel = days === 0 ? 'Today' : days === -1 ? 'Tomorrow' : `In ${Math.abs(days)} days`;
            items.push({
              id: `att-int-${int.id}`,
              job: matchedJob,
              type: 'upcoming_interview',
              title: `${matchedJob.companyName} — ${int.round}`,
              subtitle: `Scheduled for ${timeLabel} at ${int.time || '10:00 AM'}`,
              actionText: 'Prepare & Review',
              severity: 'urgent',
              onAction: () => {
                setSelectedJob(matchedJob);
              },
            });
          }
        }
      }
    }

    return items;
  }, [jobs, interviews, moveJobStatus]);

  const kpis = useMemo(() => {
    const totalApplications = jobs.length;
    const activeApplications = jobs.filter((j) => ['wishlist', 'applied', 'follow-up', 'interview'].includes(j.status)).length;
    const interviewCount = jobs.filter((j) => j.status === 'interview').length;
    const offerCount = jobs.filter((j) => j.status === 'offer').length;
    const followUpCount = jobs.filter((j) => j.status === 'follow-up' || getFollowUpStatus(j).isRecommended).length;

    const hasEnoughData = totalApplications >= 3;
    const successRateNum = totalApplications > 0 ? (offerCount / totalApplications) * 100 : 0;
    const successRate = hasEnoughData ? `${successRateNum.toFixed(0)}%` : 'Not enough data yet';

    return {
      totalApplications,
      activeApplications,
      interviewCount,
      offerCount,
      followUpCount,
      successRate,
      hasEnoughData,
    };
  }, [jobs]);

  const funnelData = useMemo(() => {
    const wishlist = jobs.filter((j) => j.status === 'wishlist').length;
    const applied = jobs.filter((j) => j.status === 'applied').length;
    const followUp = jobs.filter((j) => j.status === 'follow-up').length;
    const interview = jobs.filter((j) => j.status === 'interview').length;
    const offer = jobs.filter((j) => j.status === 'offer').length;

    const totalAppliedPool = applied + followUp + interview + offer;
    const appliedToInterviewRate = totalAppliedPool > 0 ? Math.round(((interview + offer) / totalAppliedPool) * 100) : 0;
    const interviewToOfferRate = interview + offer > 0 ? Math.round((offer / (interview + offer)) * 100) : 0;

    return {
      wishlist,
      applied,
      followUp,
      interview,
      offer,
      appliedToInterviewRate,
      interviewToOfferRate,
    };
  }, [jobs]);

  const isDemoWorkspace = useMemo(() => {
    return jobs.some((j) => j.id.startsWith('job-google') || j.id.startsWith('job-microsoft'));
  }, [jobs]);

  return (
    <HireFlowContext.Provider
      value={{
        jobs,
        resumes,
        interviews,
        activities,
        goals,
        settings,
        isLoading,
        isLoaded: !isLoading,
        activeTab,
        searchQuery,
        selectedJob,
        editingJob,
        isAddJobOpen,
        initialJobStatus,
        quickAddMode,
        preselectedResumeId,
        isCommandPaletteOpen,
        isOnboardingOpen,
        toasts,
        theme: settings.theme,

        setActiveTab,
        setSearchQuery,
        setSelectedJob,
        setEditingJob,
        setIsAddJobOpen,
        setInitialJobStatus,
        openAddOpportunity,
        openEditOpportunity,
        setPreselectedResumeId,
        setIsCommandPaletteOpen,
        setIsOnboardingOpen,
        toggleTheme,

        addJob,
        updateJob,
        deleteJob,
        moveJobStatus,
        reorderJobs,

        addResume,
        uploadResumeFile,
        updateResume,
        deleteResume,

        addInterview,
        updateInterview,
        deleteInterview,

        saveGoal,
        deleteGoal,

        updateSettings,

        showToast,
        dismissToast,

        loadDemoWorkspace,
        clearWorkspace,
        clearAllData,
        exportDataJson,
        exportDataCsv,
        importDataJson,
        refreshData,

        healthData,
        streakData,
        attentionItems,
        kpis,
        funnelData,
        isDemoWorkspace,
      }}
    >
      {children}
    </HireFlowContext.Provider>
  );
};

export const useHireFlow = (): HireFlowContextType => {
  const context = useContext(HireFlowContext);
  if (!context) {
    throw new Error('useHireFlow must be used within a HireFlowProvider');
  }
  return context;
};
