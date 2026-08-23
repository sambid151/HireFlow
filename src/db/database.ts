import { openDB, IDBPDatabase } from 'idb';
import { Job, ResumeProfile, Interview, Activity, Goal, Settings, BackupData } from '../types';
import { generateDemoData } from './demoData';
import { DEFAULT_FOLLOW_UP_TEMPLATES } from './defaultTemplates';

const DB_NAME = 'hireflow-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

export async function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('jobs')) {
          const jobStore = db.createObjectStore('jobs', { keyPath: 'id' });
          jobStore.createIndex('status', 'status', { unique: false });
          jobStore.createIndex('order', 'order', { unique: false });
          jobStore.createIndex('dateApplied', 'dateApplied', { unique: false });
        }

        if (!db.objectStoreNames.contains('resumes')) {
          db.createObjectStore('resumes', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('interviews')) {
          const interviewStore = db.createObjectStore('interviews', { keyPath: 'id' });
          interviewStore.createIndex('jobId', 'jobId', { unique: false });
          interviewStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains('activities')) {
          const activityStore = db.createObjectStore('activities', { keyPath: 'id' });
          activityStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('goals')) {
          db.createObjectStore('goals', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

// ----------------- JOBS -----------------
export async function getJobs(): Promise<Job[]> {
  const db = await getDB();
  const jobs = await db.getAll('jobs');
  return jobs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getJob(id: string): Promise<Job | undefined> {
  const db = await getDB();
  return db.get('jobs', id);
}

export async function addJob(job: Job): Promise<Job> {
  const db = await getDB();
  await db.put('jobs', job);
  await addActivity({
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    jobId: job.id,
    type: 'job_created',
    description: `Added ${job.companyName} — ${job.jobTitle} to ${job.status.toUpperCase()}`,
    createdAt: new Date().toISOString(),
  });
  return job;
}

export async function updateJob(job: Job, logActivity = true): Promise<Job> {
  const db = await getDB();
  const existing = await db.get('jobs', job.id);
  const updatedJob = { ...job, updatedAt: new Date().toISOString() };
  await db.put('jobs', updatedJob);

  if (logActivity && existing) {
    if (existing.status !== job.status) {
      await addActivity({
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        jobId: job.id,
        type: 'status_changed',
        description: `Moved ${job.companyName} from ${existing.status} → ${job.status}`,
        createdAt: new Date().toISOString(),
      });
    } else {
      await addActivity({
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        jobId: job.id,
        type: 'job_updated',
        description: `Updated details for ${job.companyName} (${job.jobTitle})`,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return updatedJob;
}

export async function batchUpdateJobs(jobs: Job[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('jobs', 'readwrite');
  for (const job of jobs) {
    await tx.store.put(job);
  }
  await tx.done;
}

export async function deleteJob(id: string): Promise<void> {
  const db = await getDB();
  const job = await db.get('jobs', id);
  await db.delete('jobs', id);

  // Also clean up linked interviews
  const interviews = await db.getAll('interviews');
  for (const int of interviews) {
    if (int.jobId === id) {
      await db.delete('interviews', int.id);
    }
  }

  if (job) {
    await addActivity({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'job_updated',
      description: `Removed application for ${job.companyName} (${job.jobTitle})`,
      createdAt: new Date().toISOString(),
    });
  }
}

// ----------------- RESUMES -----------------
export async function getResumes(): Promise<ResumeProfile[]> {
  const db = await getDB();
  const resumes = await db.getAll('resumes');
  return resumes.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
}

export async function getResume(id: string): Promise<ResumeProfile | undefined> {
  const db = await getDB();
  return db.get('resumes', id);
}

export async function addResume(resume: ResumeProfile): Promise<ResumeProfile> {
  const db = await getDB();
  await db.put('resumes', resume);
  await addActivity({
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'resume_uploaded',
    description: `Uploaded resume "${resume.name}" (${resume.targetRole})`,
    createdAt: new Date().toISOString(),
  });
  return resume;
}

export async function updateResume(resume: ResumeProfile): Promise<ResumeProfile> {
  const db = await getDB();
  const updated = { ...resume, updatedAt: new Date().toISOString() };
  await db.put('resumes', updated);
  await addActivity({
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'resume_updated',
    description: `Updated skills & profile for resume "${resume.name}"`,
    createdAt: new Date().toISOString(),
  });
  return updated;
}

export async function deleteResume(id: string): Promise<void> {
  const db = await getDB();
  const resume = await db.get('resumes', id);
  await db.delete('resumes', id);

  // Set resumeId to undefined on jobs using this resume so history is preserved
  const jobs = await db.getAll('jobs');
  const jobTx = db.transaction('jobs', 'readwrite');
  for (const job of jobs) {
    if (job.resumeId === id) {
      job.resumeId = undefined;
      await jobTx.store.put(job);
    }
  }
  await jobTx.done;

  if (resume) {
    await addActivity({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'resume_deleted',
      description: `Removed resume "${resume.name}"`,
      createdAt: new Date().toISOString(),
    });
  }
}

// ----------------- INTERVIEWS -----------------
export async function getInterviews(): Promise<Interview[]> {
  const db = await getDB();
  const interviews = await db.getAll('interviews');
  return interviews.sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());
}

export async function addInterview(interview: Interview): Promise<Interview> {
  const db = await getDB();
  await db.put('interviews', interview);

  // If job exists, update job's interviewDate
  if (interview.jobId) {
    const job = await db.get('jobs', interview.jobId);
    if (job) {
      job.interviewDate = interview.date;
      if (job.status === 'wishlist' || job.status === 'applied' || job.status === 'follow-up') {
        job.status = 'interview';
      }
      await db.put('jobs', job);
    }
  }

  await addActivity({
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    jobId: interview.jobId,
    type: 'interview_added',
    description: `Scheduled ${interview.round} for ${interview.companyName || 'Job'} on ${interview.date}`,
    createdAt: new Date().toISOString(),
  });
  return interview;
}

export async function updateInterview(interview: Interview): Promise<Interview> {
  const db = await getDB();
  await db.put('interviews', interview);
  await addActivity({
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    jobId: interview.jobId,
    type: 'interview_updated',
    description: `Updated interview details: ${interview.companyName} (${interview.round})`,
    createdAt: new Date().toISOString(),
  });
  return interview;
}

export async function deleteInterview(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('interviews', id);
}

// ----------------- ACTIVITIES -----------------
export async function getActivities(limit = 50): Promise<Activity[]> {
  const db = await getDB();
  const activities = await db.getAll('activities');
  return activities
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export async function addActivity(activity: Activity): Promise<Activity> {
  const db = await getDB();
  await db.put('activities', activity);
  return activity;
}

// ----------------- GOALS -----------------
export async function getGoals(): Promise<Goal[]> {
  const db = await getDB();
  return db.getAll('goals');
}

export async function saveGoal(goal: Goal): Promise<Goal> {
  const db = await getDB();
  await db.put('goals', goal);
  return goal;
}

export async function deleteGoal(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('goals', id);
}

// ----------------- SETTINGS -----------------
const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  weeklyTarget: 10,
  onboardingCompleted: false,
  userFullName: '',
  emailSignature: '',
  followUpTemplates: DEFAULT_FOLLOW_UP_TEMPLATES,
};

export async function getSettings(): Promise<Settings> {
  const db = await getDB();
  const stored = await db.get('settings', 'app-settings');
  if (!stored) {
    return DEFAULT_SETTINGS;
  }
  return { ...DEFAULT_SETTINGS, ...stored.data };
}

export async function saveSettings(settings: Partial<Settings>): Promise<Settings> {
  const db = await getDB();
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await db.put('settings', { key: 'app-settings', data: updated });
  return updated;
}

// ----------------- BACKUP & RESTORE & DEMO -----------------
export async function loadDemoWorkspace(): Promise<void> {
  const data = generateDemoData();
  const db = await getDB();

  await clearAllData(false);

  const jobTx = db.transaction('jobs', 'readwrite');
  for (const item of data.jobs) await jobTx.store.put(item);
  await jobTx.done;

  const resTx = db.transaction('resumes', 'readwrite');
  for (const item of data.resumes) await resTx.store.put(item);
  await resTx.done;

  const intTx = db.transaction('interviews', 'readwrite');
  for (const item of data.interviews) await intTx.store.put(item);
  await intTx.done;

  const actTx = db.transaction('activities', 'readwrite');
  for (const item of data.activities) await actTx.store.put(item);
  await actTx.done;

  const goalTx = db.transaction('goals', 'readwrite');
  for (const item of data.goals) await goalTx.store.put(item);
  await goalTx.done;

  await saveSettings(data.settings);

  await addActivity({
    id: `act-${Date.now()}`,
    type: 'demo_loaded',
    description: 'Loaded realistic HireFlow demo workspace with opportunities, resumes, and upcoming interviews',
    createdAt: new Date().toISOString(),
  });
}

export async function clearAllData(logActivity = true): Promise<void> {
  const db = await getDB();
  await db.clear('jobs');
  await db.clear('resumes');
  await db.clear('interviews');
  await db.clear('activities');
  await db.clear('goals');
  await db.clear('settings');

  if (logActivity) {
    await addActivity({
      id: `act-${Date.now()}`,
      type: 'job_updated',
      description: 'Cleared local database workspace',
      createdAt: new Date().toISOString(),
    });
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function base64ToBlob(base64: string, fileType?: string): Promise<Blob> {
  const res = await fetch(base64);
  const blob = await res.blob();
  return fileType ? new Blob([blob], { type: fileType }) : blob;
}

export async function exportBackup(): Promise<string> {
  const [jobs, resumes, interviews, activities, goals, settings] = await Promise.all([
    getJobs(),
    getResumes(),
    getInterviews(),
    getActivities(200),
    getGoals(),
    getSettings(),
  ]);

  // Safely serialize blobs to Base64 for file inclusion in JSON backup
  const serializableResumes: ResumeProfile[] = await Promise.all(
    resumes.map(async (r) => {
      let base64 = r.fileBase64;
      if (r.fileBlob && !base64) {
        try {
          base64 = await blobToBase64(r.fileBlob);
        } catch (e) {
          console.warn('Failed to encode blob to base64 for export', e);
        }
      }
      // Omit direct Blob object from JSON representation, keep base64
      const { fileBlob, ...rest } = r;
      return {
        ...rest,
        fileBase64: base64,
      };
    })
  );

  const backup: BackupData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    jobs,
    resumes: serializableResumes,
    interviews,
    activities,
    goals,
    settings,
  };

  await addActivity({
    id: `act-${Date.now()}`,
    type: 'backup_exported',
    description: `Exported local JSON backup with ${jobs.length} jobs and ${resumes.length} resumes`,
    createdAt: new Date().toISOString(),
  });

  return JSON.stringify(backup, null, 2);
}

export async function importBackup(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const data: BackupData = JSON.parse(jsonString);

    if (!data.jobs || !Array.isArray(data.jobs)) {
      throw new Error('Invalid backup file: Missing "jobs" array.');
    }

    const db = await getDB();
    await clearAllData(false);

    const jobTx = db.transaction('jobs', 'readwrite');
    for (const item of data.jobs) await jobTx.store.put(item);
    await jobTx.done;

    if (data.resumes && Array.isArray(data.resumes)) {
      const resTx = db.transaction('resumes', 'readwrite');
      for (const item of data.resumes) {
        let resumeToSave: ResumeProfile = { ...item };
        if (item.fileBase64) {
          try {
            resumeToSave.fileBlob = await base64ToBlob(item.fileBase64, item.fileType);
          } catch (e) {
            console.warn('Failed to restore blob from base64 during import', e);
          }
        }
        await resTx.store.put(resumeToSave);
      }
      await resTx.done;
    }

    if (data.interviews && Array.isArray(data.interviews)) {
      const intTx = db.transaction('interviews', 'readwrite');
      for (const item of data.interviews) await intTx.store.put(item);
      await intTx.done;
    }

    if (data.activities && Array.isArray(data.activities)) {
      const actTx = db.transaction('activities', 'readwrite');
      for (const item of data.activities) await actTx.store.put(item);
      await actTx.done;
    }

    if (data.goals && Array.isArray(data.goals)) {
      const goalTx = db.transaction('goals', 'readwrite');
      for (const item of data.goals) await goalTx.store.put(item);
      await goalTx.done;
    }

    if (data.settings) {
      await saveSettings(data.settings);
    }

    await addActivity({
      id: `act-${Date.now()}`,
      type: 'backup_imported',
      description: `Restored backup containing ${data.jobs.length} jobs and ${data.resumes?.length || 0} resumes`,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Restored ${data.jobs.length} jobs, ${data.resumes?.length || 0} resumes, and ${data.interviews?.length || 0} interviews successfully.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error during import';
    return { success: false, message };
  }
}
