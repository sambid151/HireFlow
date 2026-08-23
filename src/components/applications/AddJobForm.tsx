import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Briefcase,
  Link as LinkIcon,
  Calendar,
  DollarSign,
  MapPin,
  Sparkles,
  Check,
  Tag,
  Share2,
  FileText,
  Clock,
  AlertCircle,
  Linkedin,
  X,
  ExternalLink,
} from 'lucide-react';
import { Job, JobStatus, WorkMode, EmploymentType } from '../../types';
import { useHireFlow } from '../../context/HireFlowContext';

export interface AddJobFormProps {
  jobToEdit?: Job | null;
  initialStatus?: JobStatus;
  quickAddMode?: boolean;
  onClose?: () => void;
  onSuccess?: (job: Job) => void;
  isModalOrDrawer?: boolean;
}

export const AddJobForm: React.FC<AddJobFormProps> = ({
  jobToEdit = null,
  initialStatus = 'wishlist',
  quickAddMode = false,
  onClose,
  onSuccess,
  isModalOrDrawer = false,
}) => {
  const {
    addJob,
    updateJob,
    resumes,
    preselectedResumeId,
    showToast,
  } = useHireFlow();

  // Form State
  const [opportunityName, setOpportunityName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  // Application Details
  const [status, setStatus] = useState<JobStatus>(initialStatus);
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [dateApplied, setDateApplied] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [source, setSource] = useState('LinkedIn');

  // Compensation
  const [salaryRange, setSalaryRange] = useState('');

  // Job Details
  const [jobDescription, setJobDescription] = useState('');
  const [notes, setNotes] = useState('');

  // LinkedIn Activity Section
  const [linkedinPostUrl, setLinkedinPostUrl] = useState('');
  const [linkedinPostNote, setLinkedinPostNote] = useState('');

  // Resume Selection
  const [resumeId, setResumeId] = useState('');

  // Additional Optional Fields
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState<WorkMode>('remote');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('full-time');
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [referralName, setReferralName] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [tagsStr, setTagsStr] = useState('');

  // UI / Validation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Field Refs for Auto-focusing on Validation Error
  const opportunityNameRef = useRef<HTMLInputElement>(null);
  const companyNameRef = useRef<HTMLInputElement>(null);
  const jobTitleRef = useRef<HTMLInputElement>(null);
  const applicationUrlRef = useRef<HTMLInputElement>(null);
  const linkedinPostUrlRef = useRef<HTMLInputElement>(null);

  const defaultResume = resumes.find((r) => r.isDefault) || resumes[0];

  // Initialize or reset form values
  useEffect(() => {
    if (jobToEdit) {
      setOpportunityName(jobToEdit.opportunityName || `${jobToEdit.companyName} - ${jobToEdit.jobTitle}`);
      setCompanyName(jobToEdit.companyName || '');
      setJobTitle(jobToEdit.jobTitle || '');
      setStatus(jobToEdit.status || 'wishlist');
      setApplicationDeadline(jobToEdit.applicationDeadline || '');
      setDateApplied(jobToEdit.dateApplied || '');
      setApplicationUrl(jobToEdit.applicationUrl || jobToEdit.linkedinUrl || '');
      setSource(jobToEdit.source || 'LinkedIn');
      setSalaryRange(jobToEdit.salaryRange || '');
      setJobDescription(jobToEdit.jobDescription || '');
      setNotes(jobToEdit.notes || '');
      setLinkedinPostUrl(jobToEdit.linkedinPostUrl || '');
      setLinkedinPostNote(jobToEdit.linkedinPostNote || '');
      setResumeId(jobToEdit.resumeId || '');
      setLocation(jobToEdit.location || '');
      setWorkMode(jobToEdit.workMode || 'remote');
      setEmploymentType(jobToEdit.employmentType || 'full-time');
      setRecruiterName(jobToEdit.recruiterName || '');
      setRecruiterEmail(jobToEdit.recruiterEmail || '');
      setReferralName(jobToEdit.referralName || '');
      setNextFollowUpDate(jobToEdit.nextFollowUpDate || '');
      setInterviewDate(jobToEdit.interviewDate || '');
      setTagsStr(jobToEdit.tags?.join(', ') || '');
      setShowAdvanced(
        Boolean(
          jobToEdit.location ||
          jobToEdit.recruiterName ||
          jobToEdit.referralName ||
          jobToEdit.nextFollowUpDate ||
          jobToEdit.interviewDate ||
          jobToEdit.tags?.length
        )
      );
    } else {
      const initStatus = initialStatus || 'wishlist';
      setOpportunityName('');
      setCompanyName('');
      setJobTitle('');
      setStatus(initStatus);
      setApplicationDeadline('');
      setDateApplied(initStatus === 'applied' ? new Date().toISOString().split('T')[0] : '');
      setApplicationUrl('');
      setSource('LinkedIn');
      setSalaryRange('');
      setJobDescription('');
      setNotes('');
      setLinkedinPostUrl('');
      setLinkedinPostNote('');
      setResumeId(preselectedResumeId || defaultResume?.id || '');
      setLocation('');
      setWorkMode('remote');
      setEmploymentType('full-time');
      setRecruiterName('');
      setRecruiterEmail('');
      setReferralName('');
      setNextFollowUpDate('');
      setInterviewDate('');
      setTagsStr('');
      setShowAdvanced(false);
    }
    setErrors({});
    setIsSubmitting(false);
  }, [jobToEdit, initialStatus, preselectedResumeId, defaultResume]);

  // Sync opportunity name if user hasn't explicitly overridden it
  const handleCompanyChange = (val: string) => {
    setCompanyName(val);
    if (!jobToEdit && (!opportunityName || opportunityName === `${companyName} - ${jobTitle}`)) {
      setOpportunityName(jobTitle ? `${val} - ${jobTitle}` : val);
    }
    if (errors.companyName) {
      setErrors((prev) => ({ ...prev, companyName: '' }));
    }
  };

  const handleRoleChange = (val: string) => {
    setJobTitle(val);
    if (!jobToEdit && (!opportunityName || opportunityName === `${companyName} - ${jobTitle}`)) {
      setOpportunityName(companyName ? `${companyName} - ${val}` : val);
    }
    if (errors.jobTitle) {
      setErrors((prev) => ({ ...prev, jobTitle: '' }));
    }
  };

  const handleStatusChange = (newStatus: JobStatus) => {
    setStatus(newStatus);
    if (newStatus === 'applied' && !dateApplied) {
      setDateApplied(new Date().toISOString().split('T')[0]);
    }
  };

  // URL Helper Validation
  const isValidUrl = (urlStr: string) => {
    let clean = urlStr.trim();
    if (!clean) return true;
    if (!/^https?:\/\//i.test(clean)) {
      clean = `https://${clean}`;
    }
    try {
      const parsed = new URL(clean);
      return Boolean(parsed.hostname && parsed.hostname.includes('.'));
    } catch {
      return false;
    }
  };

  const formatUrl = (urlStr: string) => {
    let clean = urlStr.trim();
    if (!clean) return undefined;
    if (!/^https?:\/\//i.test(clean)) {
      clean = `https://${clean}`;
    }
    return clean;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors: Record<string, string> = {};

    const cleanCompany = companyName.trim();
    const cleanRole = jobTitle.trim();
    const cleanOpportunityName = opportunityName.trim() || (cleanCompany && cleanRole ? `${cleanCompany} - ${cleanRole}` : cleanCompany || cleanRole);

    // Mandatory field validation for Company and Role
    if (!cleanCompany) {
      newErrors.companyName = 'Company name is required.';
    }
    if (!cleanRole) {
      newErrors.jobTitle = 'Role is required.';
    }
    if (!cleanOpportunityName) {
      newErrors.opportunityName = 'Opportunity title is required.';
    }
    if (!status) {
      newErrors.status = 'Status is required.';
    }

    // Validate Application URL if provided
    if (applicationUrl.trim() && !isValidUrl(applicationUrl)) {
      newErrors.applicationUrl = 'Please enter a valid URL (e.g. https://company.com/jobs/123)';
    }

    // Validate LinkedIn Post URL if provided
    if (linkedinPostUrl.trim() && !isValidUrl(linkedinPostUrl)) {
      newErrors.linkedinPostUrl = 'Please enter a valid LinkedIn URL';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      // Auto-focus first invalid mandatory field
      if (newErrors.companyName) {
        companyNameRef.current?.focus();
      } else if (newErrors.jobTitle) {
        jobTitleRef.current?.focus();
      } else if (newErrors.opportunityName) {
        opportunityNameRef.current?.focus();
      } else if (newErrors.applicationUrl) {
        applicationUrlRef.current?.focus();
      } else if (newErrors.linkedinPostUrl) {
        linkedinPostUrlRef.current?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const parsedTags = tagsStr
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const formattedAppUrl = formatUrl(applicationUrl);
      const formattedLinkedinPostUrl = formatUrl(linkedinPostUrl);

      // Auto-set Date Applied if status is applied and no date was picked
      const resolvedDateApplied =
        dateApplied || (status === 'applied' ? new Date().toISOString().split('T')[0] : undefined);

      let savedJob: Job;

      if (jobToEdit) {
        const updatedPayload: Job = {
          ...jobToEdit,
          opportunityName: cleanOpportunityName,
          companyName: cleanCompany,
          jobTitle: cleanRole,
          status,
          applicationDeadline: applicationDeadline || undefined,
          dateApplied: resolvedDateApplied,
          applicationUrl: formattedAppUrl,
          linkedinUrl: formattedAppUrl, // Keep backwards compatibility
          source: source || undefined,
          salaryRange: salaryRange.trim() || undefined,
          jobDescription: jobDescription.trim() || undefined,
          notes: notes.trim() || undefined,
          linkedinPostUrl: formattedLinkedinPostUrl,
          linkedinPostNote: linkedinPostNote.trim() || undefined,
          resumeId: resumeId || undefined,
          location: location.trim() || undefined,
          workMode,
          employmentType,
          recruiterName: recruiterName.trim() || undefined,
          recruiterEmail: recruiterEmail.trim() || undefined,
          referralName: referralName.trim() || undefined,
          nextFollowUpDate: nextFollowUpDate || undefined,
          interviewDate: interviewDate || undefined,
          tags: parsedTags.length ? parsedTags : undefined,
          updatedAt: new Date().toISOString(),
        };
        await updateJob(updatedPayload);
        savedJob = updatedPayload;
        showToast('Opportunity updated successfully.', 'success');
      } else {
        const newJob = await addJob({
          opportunityName: cleanOpportunityName,
          companyName: cleanCompany,
          jobTitle: cleanRole,
          status,
          applicationDeadline: applicationDeadline || undefined,
          dateApplied: resolvedDateApplied,
          applicationUrl: formattedAppUrl,
          linkedinUrl: formattedAppUrl,
          source: source || undefined,
          salaryRange: salaryRange.trim() || undefined,
          jobDescription: jobDescription.trim() || undefined,
          notes: notes.trim() || undefined,
          linkedinPostUrl: formattedLinkedinPostUrl,
          linkedinPostNote: linkedinPostNote.trim() || undefined,
          resumeId: resumeId || undefined,
          location: location.trim() || undefined,
          workMode,
          employmentType,
          recruiterName: recruiterName.trim() || undefined,
          recruiterEmail: recruiterEmail.trim() || undefined,
          referralName: referralName.trim() || undefined,
          nextFollowUpDate: nextFollowUpDate || undefined,
          interviewDate: interviewDate || undefined,
          tags: parsedTags.length ? parsedTags : undefined,
        });
        savedJob = newJob;
        // Trigger the Opportunity created successfully toast
        showToast('Opportunity created successfully.', 'success');
      }

      onSuccess?.(savedJob);
      onClose?.();
    } catch (err) {
      console.error('Failed to save opportunity:', err);
      setErrors({ form: 'An unexpected error occurred while saving the opportunity. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      id="add-job-form"
      onSubmit={handleSubmit}
      className="flex-1 flex flex-col justify-between space-y-6 text-slate-800 dark:text-slate-200"
    >
      {errors.form && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      {/* SECTION 1 — OPPORTUNITY INFO */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
            1. Opportunity Details
          </span>
          <span className="text-[11px] text-slate-400">
            <span className="text-rose-500 font-bold">*</span> Mandatory fields
          </span>
        </div>

        {/* Company & Role (Mandatory Fields) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Company <span className="text-rose-500 font-bold ml-0.5" aria-hidden="true">*</span>
              <span className="sr-only">(mandatory)</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                ref={companyNameRef}
                id="add-job-company-input"
                type="text"
                placeholder="e.g. Stripe, Google, Linear"
                value={companyName}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className={`w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border ${
                  errors.companyName
                    ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                } rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none transition`}
              />
            </div>
            {errors.companyName && (
              <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.companyName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Role / Title <span className="text-rose-500 font-bold ml-0.5" aria-hidden="true">*</span>
              <span className="sr-only">(mandatory)</span>
            </label>
            <div className="relative">
              <Sparkles className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                ref={jobTitleRef}
                id="add-job-role-input"
                type="text"
                placeholder="e.g. Senior Frontend Engineer"
                value={jobTitle}
                onChange={(e) => handleRoleChange(e.target.value)}
                className={`w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border ${
                  errors.jobTitle
                    ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30 dark:bg-rose-950/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                } rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none transition`}
              />
            </div>
            {errors.jobTitle && (
              <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.jobTitle}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Opportunity Headline <span className="text-rose-500 font-bold ml-0.5" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              ref={opportunityNameRef}
              id="add-job-opportunity-headline"
              type="text"
              placeholder="e.g. Stripe - Senior Frontend Engineer"
              value={opportunityName}
              onChange={(e) => {
                setOpportunityName(e.target.value);
                if (errors.opportunityName) setErrors((prev) => ({ ...prev, opportunityName: '' }));
              }}
              className={`w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border ${
                errors.opportunityName
                  ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30 dark:bg-rose-950/20'
                  : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
              } rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none transition`}
            />
          </div>
          {errors.opportunityName && (
            <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.opportunityName}</p>
          )}
        </div>
      </div>

      {/* SECTION 2 — APPLICATION DETAILS */}
      <div className="space-y-4 pt-2">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
            2. Application Details
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Pipeline Stage <span className="text-rose-500 font-bold ml-0.5" aria-hidden="true">*</span>
            </label>
            <select
              id="add-job-status-select"
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as JobStatus)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 capitalize cursor-pointer font-medium"
            >
              <option value="wishlist">Wishlist</option>
              <option value="applied">Applied</option>
              <option value="follow-up">Follow-up</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected / Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Application Deadline
            </label>
            <input
              type="date"
              value={applicationDeadline}
              onChange={(e) => setApplicationDeadline(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Date Applied {status === 'wishlist' && <span className="text-slate-400 font-normal">(optional)</span>}
            </label>
            <input
              type="date"
              value={dateApplied}
              onChange={(e) => setDateApplied(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Application URL / Careers Link
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                ref={applicationUrlRef}
                type="text"
                placeholder="https://jobs.lever.co/... or careers page"
                value={applicationUrl}
                onChange={(e) => {
                  setApplicationUrl(e.target.value);
                  if (errors.applicationUrl) setErrors((prev) => ({ ...prev, applicationUrl: '' }));
                }}
                className={`w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border ${
                  errors.applicationUrl
                    ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30'
                    : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                } rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none transition`}
              />
            </div>
            {errors.applicationUrl && (
              <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.applicationUrl}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Application Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="LinkedIn">LinkedIn</option>
              <option value="Company Website">Company Careers Page</option>
              <option value="Referral">Employee Referral</option>
              <option value="Indeed">Indeed</option>
              <option value="Wellfound">Wellfound / AngelList</option>
              <option value="Job Board">Job Board (Other)</option>
              <option value="Recruiter">Direct Recruiter Outreach</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 3 — COMPENSATION */}
      <div className="space-y-3 pt-2">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
            3. Compensation
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Salary / Compensation <span className="text-slate-400 font-normal">(flexible format)</span>
          </label>
          <div className="relative">
            <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="e.g. $150,000 - $180,000, ₹25–30 LPA, Competitive"
              value={salaryRange}
              onChange={(e) => setSalaryRange(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Track base, bonus or total OTE in any currency format.
          </p>
        </div>
      </div>

      {/* SECTION 4 — RESUME SELECTION */}
      <div className="space-y-3 pt-2">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
            4. Resume Variant
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Resume Profile from Resume Intelligence
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <select
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">No specific resume selected</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.isDefault ? '(Default)' : ''} — {r.targetRole || 'General'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 5 — LINKEDIN ACTIVITY (Dedicated LinkedIn Activity Section) */}
      <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-900/60 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#0A66C2] text-white shadow-2xs">
              <Linkedin className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                5. LinkedIn Activity
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Record outreach, job post links, or network engagement
              </span>
            </div>
          </div>
          {linkedinPostUrl && isValidUrl(linkedinPostUrl) && (
            <a
              href={formatUrl(linkedinPostUrl)}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <span>Preview Link</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              LinkedIn Post / Activity URL <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                ref={linkedinPostUrlRef}
                id="add-job-linkedin-url-input"
                type="text"
                placeholder="https://www.linkedin.com/feed/update/urn:li:activity:..."
                value={linkedinPostUrl}
                onChange={(e) => {
                  setLinkedinPostUrl(e.target.value);
                  if (errors.linkedinPostUrl) setErrors((prev) => ({ ...prev, linkedinPostUrl: '' }));
                }}
                className={`w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border ${
                  errors.linkedinPostUrl
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                } rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none`}
              />
            </div>
            {errors.linkedinPostUrl && (
              <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.linkedinPostUrl}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              LinkedIn Activity Notes & Context
            </label>
            <input
              id="add-job-linkedin-note-input"
              type="text"
              placeholder="e.g. Connected with hiring manager, commented on engineering team post, applied via LinkedIn 1-click"
              value={linkedinPostNote}
              onChange={(e) => setLinkedinPostNote(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION 6 — JOB DETAILS & NOTES */}
      <div className="space-y-4 pt-2">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
            6. Job Description & Notes
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Job Description / Requirements
          </label>
          <textarea
            id="add-job-description-textarea"
            rows={4}
            placeholder="Paste job description text for keyword match analysis and resume tailoring..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Personal Notes & Follow-up Reminders
          </label>
          <textarea
            id="add-job-notes-textarea"
            rows={3}
            placeholder="Key takeaways, referral info, interview insights..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 leading-relaxed"
          />
        </div>
      </div>

      {/* Advanced / Optional Fields Toggle */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <span>{showAdvanced ? 'Hide Additional Details' : 'Show Additional Details (Work Mode, Recruiter, Tags)'}</span>
        </button>

        {showAdvanced && (
          <div className="space-y-4 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Work Mode
                </label>
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 capitalize cursor-pointer"
                >
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Employment Type
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 capitalize cursor-pointer"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recruiter Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={recruiterName}
                  onChange={(e) => setRecruiterName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recruiter Email
                </label>
                <input
                  type="email"
                  placeholder="recruiter@company.com"
                  value={recruiterEmail}
                  onChange={(e) => setRecruiterEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Referral Contact
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Mercer (Staff SWE)"
                  value={referralName}
                  onChange={(e) => setReferralName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Tier 1, React, High Growth"
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit / Action Footer */}
      <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs py-3 -mx-5 px-5 sm:-mx-6 sm:px-6">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
        )}

        <button
          id="add-job-submit-btn"
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>{jobToEdit ? 'Saving changes...' : 'Creating opportunity...'}</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{jobToEdit ? 'Save Changes' : 'Create Opportunity'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
