import React, { useState } from 'react';
import {
  X,
  Building2,
  Briefcase,
  ExternalLink,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  User,
  Mail,
  Users,
  Edit2,
  Trash2,
  FileText,
  Sparkles,
  CheckCircle2,
  Copy,
  Send,
  Plus,
  ArrowRight,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { Job, JobStatus, ResumeProfile, Interview, FollowUpTemplate } from '../../types';
import { useHireFlow } from '../../context/HireFlowContext';
import { Button } from '../common/Button';
import {
  formatDaysAgoText,
  getFollowUpStatus,
  createGoogleCalendarUrl,
  generateEmailUrl,
  getLinkedInSearchUrl,
} from '../../utils';
import { matchResumeToJobDescription, AIJobMatchResult } from '../../services/aiService';
import { JobActivityTimeline } from './JobActivityTimeline';

interface JobDetailsModalProps {
  job: Job | null;
  onClose: () => void;
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  onClose,
  onEdit,
  onDelete,
}) => {
  const {
    resumes,
    interviews,
    activities,
    moveJobStatus,
    updateJob,
    addInterview,
    deleteInterview,
    settings,
    showToast,
  } = useHireFlow();

  const [activeTab, setActiveTab] = useState<'overview' | 'resume_match' | 'email_followup' | 'interviews' | 'activity'>('overview');

  // Resume Match state
  const [jobDescriptionInput, setJobDescriptionInput] = useState('');
  const [matchResult, setMatchResult] = useState<AIJobMatchResult | null>(null);

  // Email Follow-up state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    settings.followUpTemplates?.[0]?.id || 'tpl-1'
  );
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [customDaysFollowUp, setCustomDaysFollowUp] = useState<number>(7);

  // New Interview Round state
  const [isAddingInterview, setIsAddingInterview] = useState(false);
  const [intRound, setIntRound] = useState('Technical Round');
  const [intDate, setIntDate] = useState(new Date().toISOString().split('T')[0]);
  const [intTime, setIntTime] = useState('14:00');
  const [intInterviewer, setIntInterviewer] = useState('');
  const [intUrl, setIntUrl] = useState('');
  const [intNotes, setIntNotes] = useState('');

  if (!job) return null;

  const resume = resumes.find((r) => r.id === job.resumeId);
  const followUp = getFollowUpStatus(job);
  const jobInterviews = interviews.filter((i) => i.jobId === job.id);
  const jobActivities = activities.filter((a) => a.jobId === job.id);

  const templates: FollowUpTemplate[] = settings.followUpTemplates || [];
  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const handleRunResumeMatch = () => {
    if (!resume) {
      showToast('Please attach a resume profile to this job first.', 'warning');
      return;
    }
    const result = matchResumeToJobDescription(resume, jobDescriptionInput);
    setMatchResult(result);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      const generated = generateEmailUrl({
        template: tpl,
        job,
        resume,
        myFullName: settings.userFullName,
      });
      setEmailSubject(generated.subject);
      setEmailBody(generated.body);
      setCustomDaysFollowUp(tpl.defaultDaysAfter);
    }
  };

  // Compute email content if empty
  const activeEmailData = currentTemplate
    ? generateEmailUrl({
        template: currentTemplate,
        job,
        resume,
        myFullName: settings.userFullName,
      })
    : null;

  const effectiveSubject = emailSubject || activeEmailData?.subject || '';
  const effectiveBody = emailBody || activeEmailData?.body || '';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(`Subject: ${effectiveSubject}\n\n${effectiveBody}`);
    showToast('Follow-up email template copied to clipboard!', 'success');
  };

  const handleLogFollowUpSent = async () => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + customDaysFollowUp);
    const nextDateStr = nextDate.toISOString().split('T')[0];

    await updateJob({
      ...job,
      status: job.status === 'applied' ? 'follow-up' : job.status,
      nextFollowUpDate: nextDateStr,
    });

    showToast(`Logged follow-up! Next reminder set for ${nextDateStr}.`, 'success');
  };

  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    await addInterview({
      jobId: job.id,
      companyName: job.companyName,
      jobTitle: job.jobTitle,
      round: intRound,
      date: intDate,
      time: intTime,
      interviewer: intInterviewer || undefined,
      meetingUrl: intUrl || undefined,
      notes: intNotes || undefined,
      result: 'scheduled',
    });
    setIsAddingInterview(false);
    setIntInterviewer('');
    setIntNotes('');
    setIntUrl('');
  };

  return (
    <div
      id="job-details-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
      >
        {/* Modal Top Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {job.opportunityName && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-0.5">
                {job.opportunityName}
              </span>
            )}
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                {job.companyName}
              </h2>
              {(job.applicationUrl || job.linkedinUrl || job.jobUrl) && (
                <a
                  href={job.applicationUrl || job.linkedinUrl || job.jobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 transition"
                  title="Open Job Posting"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
              {job.jobTitle}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Stage selector dropdown */}
              <select
                value={job.status}
                onChange={(e) => moveJobStatus(job.id, e.target.value as JobStatus)}
                className="px-2.5 py-1 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg focus:outline-none capitalize cursor-pointer"
              >
                <option value="wishlist">Wishlist</option>
                <option value="applied">Applied</option>
                <option value="follow-up">Follow-up</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Archived / Rejected</option>
              </select>

              {job.dateApplied && (
                <span className="text-xs text-slate-500 font-medium">
                  {formatDaysAgoText(job.dateApplied)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onEdit(job)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Edit Job"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(job)}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
              title="Delete Job"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 bg-white dark:bg-slate-900 shrink-0 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'resume_match', label: 'Resume Match' },
            { id: 'email_followup', label: 'Email Follow-up' },
            { id: 'interviews', label: `Interviews (${jobInterviews.length})` },
            { id: 'activity', label: `Activity Log (${jobActivities.length || (job.dateApplied ? 1 : 0)})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition cursor-pointer ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Follow-up Banner if recommended */}
              {followUp.isRecommended && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-300">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{followUp.label}</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('email_followup')}
                    className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-2xs transition cursor-pointer"
                  >
                    Draft Email →
                  </button>
                </div>
              )}

              {/* Core Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Resume Profile
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-1 truncate">
                    {resume?.name || 'No resume linked'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Compensation
                  </span>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 truncate">
                    {job.salaryRange || 'Not disclosed'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Location & Mode
                  </span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
                    {job.location || 'Remote'} ({job.workMode || 'remote'})
                  </p>
                </div>

                {job.source && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Source
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-1 capitalize">
                      {job.source}
                    </p>
                  </div>
                )}

                {job.deadline && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Deadline
                    </span>
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-1">
                      {job.deadline}
                    </p>
                  </div>
                )}

                {job.dateApplied && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Date Applied
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                      {job.dateApplied}
                    </p>
                  </div>
                )}
              </div>

              {/* LinkedIn Activity (if recorded) */}
              {(job.linkedinPostUrl || job.linkedinPostNote) && (
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                      LinkedIn Post Activity
                    </h4>
                    {job.linkedinPostUrl && (
                      <a
                        href={job.linkedinPostUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <span>Open Post</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {job.linkedinPostNote && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {job.linkedinPostNote}
                    </p>
                  )}
                </div>
              )}

              {/* Job Description (if available) */}
              {job.jobDescription && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Job Description
                    </h4>
                    <button
                      onClick={() => {
                        setJobDescriptionInput(job.jobDescription || '');
                        setActiveTab('resume_match');
                      }}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Analyze in Resume Match →
                    </button>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {job.jobDescription}
                  </div>
                </div>
              )}

              {/* Recruiter & Outreach Box */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Recruiter & Networking
                  </h4>
                  <a
                    href={getLinkedInSearchUrl(
                      job.recruiterName || `${job.companyName} recruiter`,
                      'people'
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>Search LinkedIn</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Recruiter Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {job.recruiterName || 'None assigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Recruiter Email</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {job.recruiterEmail || 'No email saved'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Referral Contact</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {job.referralName || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Next Follow-up</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {job.nextFollowUpDate || 'None scheduled'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {job.tags && job.tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Tags & Domains
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {job.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Personal Notes
                </h4>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {job.notes || 'No notes added yet for this opportunity.'}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOCAL RESUME MATCH */}
          {activeTab === 'resume_match' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 dark:text-emerald-300">
                  <p className="font-bold">Instant Keyword & Skill Match</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    Analyzes skills on <strong>{resume?.name || 'Resume'}</strong> against role requirements to highlight top keyword matches.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Paste Job Description / Requirements
                </label>
                <textarea
                  rows={4}
                  placeholder="Paste the requirements, qualifications, and tech stack from the job posting..."
                  value={jobDescriptionInput}
                  onChange={(e) => setJobDescriptionInput(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleRunResumeMatch}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Analyze Resume Match Score</span>
              </button>

              {matchResult && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 animate-in zoom-in-95 duration-150">
                  {/* Score */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase font-bold text-slate-400">Estimated Match</span>
                      <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {matchResult.matchScore}% Match
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        {matchResult.matchedSkills.length} matching skills
                      </span>
                      <span className="text-xs text-slate-400">
                        {matchResult.missingSkills.length} missing keywords
                      </span>
                    </div>
                  </div>

                  {/* Matching Skills */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Matching Skills</span>
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {matchResult.matchedSkills.length === 0 ? (
                        <span className="text-xs text-slate-400">No direct skill matches identified.</span>
                      ) : (
                        matchResult.matchedSkills.map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                          >
                            ✓ {sk}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Missing Keywords */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Missing Keywords</span>
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {matchResult.missingSkills.length === 0 ? (
                        <span className="text-xs text-slate-400">No missing keywords detected!</span>
                      ) : (
                        matchResult.missingSkills.map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60"
                          >
                            + {sk}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Potential Gaps */}
                  {matchResult.potentialGaps && matchResult.potentialGaps.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span>Potential Gaps</span>
                      </h5>
                      <div className="space-y-1">
                        {matchResult.potentialGaps.map((gap, i) => (
                          <div key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                            <span className="text-rose-500 font-bold mt-0.5">●</span>
                            <span>{gap}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Improvements */}
                  {matchResult.recommendedImprovements && matchResult.recommendedImprovements.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Recommended Improvements</span>
                      </h5>
                      <div className="space-y-1.5">
                        {matchResult.recommendedImprovements.map((imp, i) => (
                          <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                            <span className="text-emerald-600 font-bold mt-0.5">→</span>
                            <span className="leading-relaxed">{imp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendation Box */}
                  <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-200">
                    <span className="font-bold block mb-1 text-emerald-950 dark:text-emerald-100">
                      Summary Recommendation:
                    </span>
                    <p className="leading-relaxed">{matchResult.recommendation}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EMAIL FOLLOW-UP CENTER */}
          {activeTab === 'email_followup' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Template Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Choose Follow-up Template
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleTemplateChange(tpl.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${
                        selectedTemplateId === tpl.id
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={effectiveSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Body (customizable)
                </label>
                <textarea
                  rows={8}
                  value={effectiveBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </button>

                  {activeEmailData && (
                    <a
                      href={activeEmailData.gmailUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Open in Gmail</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Remind in</span>
                  <select
                    value={customDaysFollowUp}
                    onChange={(e) => setCustomDaysFollowUp(Number(e.target.value))}
                    className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
                  >
                    <option value={3}>3 days</option>
                    <option value={5}>5 days</option>
                    <option value={7}>7 days</option>
                    <option value={10}>10 days</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleLogFollowUpSent}
                    className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Log Follow-up Sent</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INTERVIEWS */}
          {activeTab === 'interviews' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Interview Rounds
                </h4>
                <Button
                  onClick={() => setIsAddingInterview((prev) => !prev)}
                  icon={Plus}
                  size="sm"
                  variant="emerald"
                >
                  Schedule Interview
                </Button>
              </div>

              {isAddingInterview && (
                <form
                  onSubmit={handleCreateInterview}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 animate-in zoom-in-95 duration-150"
                >
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Schedule New Round
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Round Title
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Technical Round 1 / System Design"
                        value={intRound}
                        onChange={(e) => setIntRound(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Interviewer
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Hiring Manager"
                        value={intInterviewer}
                        onChange={(e) => setIntInterviewer(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        required
                        value={intDate}
                        onChange={(e) => setIntDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={intTime}
                        onChange={(e) => setIntTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Meeting Link (Google Meet / Zoom / Teams)
                    </label>
                    <input
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={intUrl}
                      onChange={(e) => setIntUrl(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Notes & Prep Topics
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Key questions, architecture scenarios to review..."
                      value={intNotes}
                      onChange={(e) => setIntNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingInterview(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                    >
                      Save Interview
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2.5">
                {jobInterviews.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No interview rounds scheduled for this opportunity yet.
                  </div>
                ) : (
                  jobInterviews.map((int) => {
                    const gCal = createGoogleCalendarUrl({
                      title: `Interview: ${job.companyName} (${int.round})`,
                      description: int.notes,
                      location: int.meetingUrl,
                      startDate: int.date,
                      startTime: int.time,
                    });

                    return (
                      <div
                        key={int.id}
                        className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {int.round}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 capitalize">
                                {int.result}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {int.date} at {int.time || '10:00 AM'}{' '}
                              {int.interviewer && `· with ${int.interviewer}`}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <a
                              href={gCal}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition"
                              title="Add to Google Calendar"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => deleteInterview(int.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer"
                              title="Remove Round"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {int.meetingUrl && (
                          <a
                            href={int.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Join Meeting</span>
                          </a>
                        )}

                        {int.notes && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                            {int.notes}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 5: TIMELINE / ACTIVITY */}
          {activeTab === 'activity' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <JobActivityTimeline job={job} activities={activities} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
