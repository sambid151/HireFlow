export type JobStatus = 'wishlist' | 'applied' | 'follow-up' | 'interview' | 'offer' | 'rejected';

export type WorkMode = 'remote' | 'hybrid' | 'onsite';
export type EmploymentType = 'full-time' | 'contract' | 'part-time' | 'internship';
export type InterviewResult = 'scheduled' | 'passed' | 'rejected' | 'failed' | 'cancelled' | 'pending';

export interface Job {
  id: string;
  opportunityName?: string;
  companyName: string;
  jobTitle: string;
  applicationDeadline?: string; // YYYY-MM-DD
  dateApplied?: string; // YYYY-MM-DD
  status: JobStatus;
  salaryRange?: string; // or compensation
  jobDescription?: string;
  notes?: string;
  applicationUrl?: string;
  source?: string;
  linkedinUrl?: string;
  linkedinPostUrl?: string;
  linkedinPostNote?: string;
  resumeId?: string;
  location?: string;
  employmentType?: EmploymentType;
  workMode?: WorkMode;
  recruiterName?: string;
  recruiterEmail?: string;
  referralName?: string;
  nextFollowUpDate?: string; // YYYY-MM-DD
  interviewDate?: string; // YYYY-MM-DD
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  order: number;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

export interface ResumeProfile {
  id: string;
  name: string;
  originalFileName?: string;
  fileType?: string;
  fileSize?: number;
  fileBlob?: Blob;
  fileBase64?: string;
  extractedText?: string;
  targetRole: string;
  skills: string[];
  version: string;
  notes?: string;
  isDefault?: boolean;
  fileUrl?: string;
  yearsOfExperience?: number;
  experienceSignals?: string[];
  suggestedImprovements?: string[];
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

export interface Interview {
  id: string;
  jobId?: string;
  companyName: string;
  jobTitle: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  round: string; // e.g. "Recruiter Screen", "Technical Round 1", "System Design", "Hiring Manager"
  interviewer?: string;
  meetingUrl?: string;
  format?: 'video' | 'phone' | 'onsite';
  notes?: string;
  result: InterviewResult;
  createdAt: string;
}

export type ActivityType =
  | 'job_created'
  | 'job_updated'
  | 'status_changed'
  | 'job_deleted'
  | 'resume_uploaded'
  | 'resume_added'
  | 'resume_updated'
  | 'resume_deleted'
  | 'interview_created'
  | 'interview_added'
  | 'interview_updated'
  | 'interview_deleted'
  | 'goal_updated'
  | 'goal_completed'
  | 'follow_up_completed'
  | 'followup_sent'
  | 'backup_exported'
  | 'backup_imported'
  | 'backup_restored'
  | 'demo_loaded';

export interface Activity {
  id: string;
  jobId?: string;
  type: ActivityType;
  description: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  type: 'applications' | 'interviews' | 'followups' | 'custom';
  title?: string;
  target: number;
  period: 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface FollowUpTemplate {
  id: string;
  name: string;
  stage: 'post_application' | 'post_interview' | 'status_check' | 'reconnection';
  subject: string;
  body: string;
  defaultDaysAfter: number;
}

export interface Settings {
  theme: 'light' | 'dark';
  themeMode?: 'light' | 'dark' | 'system';
  weeklyTarget: number;
  defaultFollowUpDays?: number;
  onboardingCompleted: boolean;
  userFullName?: string;
  emailSignature?: string;
  followUpTemplates?: FollowUpTemplate[];
}

export interface ResumeMatchResult {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendation: string;
  jobKeywordsFound: string[];
}

export interface BackupData {
  version: string;
  exportDate: string;
  jobs: Job[];
  resumes: ResumeProfile[];
  interviews: Interview[];
  activities: Activity[];
  goals: Goal[];
  settings: Settings;
}

export type ViewTab = 'dashboard' | 'applications' | 'resumes' | 'interviews' | 'analytics' | 'goals' | 'settings';

