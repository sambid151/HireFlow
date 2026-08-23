import { Job, ResumeProfile } from '../types';

/**
 * Escapes a single CSV field value per RFC 4180 rules.
 * If the value contains commas, double quotes, or newlines, it wraps it in double quotes
 * and escapes internal double quotes by doubling them.
 */
function escapeCSVField(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts status codes to clean, human-readable spreadsheet values
 */
function formatStatus(status: string): string {
  switch (status) {
    case 'wishlist':
      return 'Wishlist';
    case 'applied':
      return 'Applied';
    case 'follow-up':
      return 'Follow-up';
    case 'interview':
      return 'Interview';
    case 'offer':
      return 'Offer';
    case 'rejected':
      return 'Archived / Rejected';
    default:
      return status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
  }
}

/**
 * Normalizes and formats ISO dates to YYYY-MM-DD for reliable spreadsheet date parsing
 */
function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  try {
    const dt = new Date(dateStr);
    if (!isNaN(dt.getTime())) {
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {
    // fallback to original string
  }
  return dateStr;
}

/**
 * Formats timestamps into standard spreadsheet-compatible YYYY-MM-DD HH:mm:ss format
 */
function formatDateTime(isoString?: string): string {
  if (!isoString) return '';
  try {
    const dt = new Date(isoString);
    if (!isNaN(dt.getTime())) {
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      const hours = String(dt.getHours()).padStart(2, '0');
      const minutes = String(dt.getMinutes()).padStart(2, '0');
      const seconds = String(dt.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
  } catch {
    // fallback
  }
  return isoString;
}

/**
 * Capitalizes enum values (e.g. 'full-time' -> 'Full-Time', 'remote' -> 'Remote')
 */
function formatEnum(val?: string): string {
  if (!val) return '';
  return val
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}

/**
 * Generates a complete RFC-4180 compliant CSV string with a UTF-8 BOM
 * for cross-platform spreadsheet software (Excel, Google Sheets, Numbers).
 */
export function generateJobsCSV(jobs: Job[], resumes: ResumeProfile[]): string {
  const resumeMap = new Map<string, string>();
  resumes.forEach((r) => resumeMap.set(r.id, r.name));

  const headers = [
    'Opportunity Name',
    'Company',
    'Job Title',
    'Status',
    'Date Applied',
    'Application Deadline',
    'Next Follow-Up Date',
    'Interview Date',
    'Compensation / Salary',
    'Work Mode',
    'Employment Type',
    'Location',
    'Attached Resume',
    'Priority',
    'Recruiter Name',
    'Recruiter Email',
    'Referral Name',
    'Job Posting URL',
    'LinkedIn Post URL',
    'Tags',
    'Notes',
    'Date Created',
    'Last Updated',
  ];

  const rows = jobs.map((job) => {
    const attachedResumeName = job.resumeId
      ? resumeMap.get(job.resumeId) || 'Attached Resume'
      : 'None';

    return [
      escapeCSVField(job.opportunityName || `${job.companyName} - ${job.jobTitle}`),
      escapeCSVField(job.companyName),
      escapeCSVField(job.jobTitle),
      escapeCSVField(formatStatus(job.status)),
      escapeCSVField(formatDate(job.dateApplied)),
      escapeCSVField(formatDate(job.applicationDeadline)),
      escapeCSVField(formatDate(job.nextFollowUpDate)),
      escapeCSVField(formatDate(job.interviewDate)),
      escapeCSVField(job.salaryRange || ''),
      escapeCSVField(formatEnum(job.workMode)),
      escapeCSVField(formatEnum(job.employmentType)),
      escapeCSVField(job.location || ''),
      escapeCSVField(attachedResumeName),
      escapeCSVField(job.priority ? job.priority.toUpperCase() : 'MEDIUM'),
      escapeCSVField(job.recruiterName || ''),
      escapeCSVField(job.recruiterEmail || ''),
      escapeCSVField(job.referralName || ''),
      escapeCSVField(job.applicationUrl || ''),
      escapeCSVField(job.linkedinPostUrl || job.linkedinUrl || ''),
      escapeCSVField(job.tags && job.tags.length > 0 ? job.tags.join('; ') : ''),
      escapeCSVField(job.notes || ''),
      escapeCSVField(formatDateTime(job.createdAt)),
      escapeCSVField(formatDateTime(job.updatedAt)),
    ].join(',');
  });

  // Prepend UTF-8 BOM (\uFEFF) so Microsoft Excel opens it seamlessly with UTF-8 encoding
  return '\uFEFF' + [headers.map(escapeCSVField).join(','), ...rows].join('\r\n');
}
