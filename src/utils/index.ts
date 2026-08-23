import confetti from 'canvas-confetti';
import { Job, ResumeProfile, Interview, Activity, ResumeMatchResult, FollowUpTemplate } from '../types';

/**
 * Calculates days between given date string (YYYY-MM-DD) and today
 */
export function getDaysAgo(dateStr?: string): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;

  const now = new Date();
  // Normalize both to midnight UTC for clean day delta
  const d1 = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const d2 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

/**
 * Returns human-readable relative days text
 */
export function formatDaysAgoText(dateStr?: string): string {
  const days = getDaysAgo(dateStr);
  if (days === null) return 'No date';
  if (days < 0) return `In ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
  if (days === 0) return 'Applied today';
  if (days === 1) return 'Applied yesterday';
  return `Applied ${days} days ago`;
}

/**
 * Returns follow-up status severity
 */
export function getFollowUpStatus(job: Job): {
  isOverdue: boolean;
  isRecommended: boolean;
  label: string;
  days: number | null;
} {
  const daysSinceApplied = getDaysAgo(job.dateApplied);
  const daysUntilNextFollowUp = job.nextFollowUpDate ? getDaysAgo(job.nextFollowUpDate) : null;

  // Explicit follow-up date set
  if (daysUntilNextFollowUp !== null) {
    if (daysUntilNextFollowUp > 0) {
      return {
        isOverdue: true,
        isRecommended: true,
        label: `Follow-up overdue by ${daysUntilNextFollowUp}d`,
        days: daysUntilNextFollowUp,
      };
    } else if (daysUntilNextFollowUp === 0) {
      return {
        isOverdue: false,
        isRecommended: true,
        label: 'Follow-up due today',
        days: 0,
      };
    } else {
      return {
        isOverdue: false,
        isRecommended: false,
        label: `Follow-up in ${Math.abs(daysUntilNextFollowUp)}d`,
        days: daysUntilNextFollowUp,
      };
    }
  }

  // Automatic heuristic based on status and application age
  if (job.status === 'applied' && daysSinceApplied !== null) {
    if (daysSinceApplied >= 8) {
      return {
        isOverdue: false,
        isRecommended: true,
        label: 'Follow-up recommended',
        days: daysSinceApplied,
      };
    } else if (daysSinceApplied >= 4) {
      return {
        isOverdue: false,
        isRecommended: false,
        label: 'Awaiting response',
        days: daysSinceApplied,
      };
    }
  }

  if (job.status === 'follow-up') {
    return {
      isOverdue: false,
      isRecommended: true,
      label: 'Follow-up in progress',
      days: daysSinceApplied,
    };
  }

  return {
    isOverdue: false,
    isRecommended: false,
    label: '',
    days: daysSinceApplied,
  };
}

/**
 * Calculates deterministic Job Search Health Score (0 - 100)
 */
export function calculateJobSearchHealth(
  jobs: Job[],
  interviews: Interview[],
  activities: Activity[],
  weeklyGoalTarget: number
): {
  score: number;
  rating: 'Strong momentum' | 'Good progress' | 'Needs attention' | 'Getting started';
  summary: string;
  breakdown: { label: string; score: number; max: number; note: string }[];
} {
  if (jobs.length === 0) {
    return {
      score: 0,
      rating: 'Getting started',
      summary: 'Add your first job opportunity or load demo workspace to calculate your search health.',
      breakdown: [
        { label: 'Active Pipeline', score: 0, max: 25, note: 'No applications tracked yet' },
        { label: 'Interview Velocity', score: 0, max: 25, note: 'No interview rounds active' },
        { label: 'Follow-up Hygiene', score: 0, max: 25, note: 'No follow-ups pending' },
        { label: 'Weekly Momentum', score: 0, max: 25, note: 'Set and hit weekly targets' },
      ],
    };
  }

  // 1. Active Pipeline Score (Max 25 pts)
  const activeJobs = jobs.filter((j) => ['wishlist', 'applied', 'follow-up', 'interview'].includes(j.status));
  let pipelineScore = 0;
  if (activeJobs.length >= 10) pipelineScore = 25;
  else if (activeJobs.length >= 5) pipelineScore = 20;
  else if (activeJobs.length >= 2) pipelineScore = 14;
  else if (activeJobs.length >= 1) pipelineScore = 8;

  // 2. Interview & Offer Score (Max 25 pts)
  const upcomingInterviews = interviews.filter((i) => i.result === 'scheduled');
  const totalOffers = jobs.filter((j) => j.status === 'offer').length;
  let interviewScore = 0;
  if (totalOffers > 0) interviewScore = 25;
  else if (upcomingInterviews.length >= 3) interviewScore = 24;
  else if (upcomingInterviews.length >= 1) interviewScore = 18;
  else if (jobs.some((j) => j.status === 'interview')) interviewScore = 14;
  else if (jobs.length > 5) interviewScore = 6;
  else interviewScore = 4;

  // 3. Follow-up & Stale Hygiene (Max 25 pts)
  const staleApplied = jobs.filter((j) => j.status === 'applied' && (getDaysAgo(j.dateApplied) || 0) >= 8);
  const overdueFollowUps = jobs.filter((j) => getFollowUpStatus(j).isOverdue);
  let hygieneScore = 25;
  hygieneScore -= staleApplied.length * 4;
  hygieneScore -= overdueFollowUps.length * 6;
  hygieneScore = Math.max(5, Math.min(25, hygieneScore));

  // 4. Weekly Momentum & Recent Activity (Max 25 pts)
  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const recentActivities = activities.filter((a) => new Date(a.createdAt).getTime() >= sevenDaysAgo);
  const appliedThisWeek = jobs.filter(
    (j) => j.dateApplied && new Date(j.dateApplied).getTime() >= sevenDaysAgo
  ).length;

  let momentumScore = 0;
  const goalProgressRatio = weeklyGoalTarget > 0 ? appliedThisWeek / weeklyGoalTarget : 0.5;
  if (goalProgressRatio >= 1) momentumScore += 15;
  else momentumScore += Math.round(goalProgressRatio * 15);

  if (recentActivities.length >= 7) momentumScore += 10;
  else if (recentActivities.length >= 3) momentumScore += 6;
  else if (recentActivities.length >= 1) momentumScore += 3;
  momentumScore = Math.min(25, momentumScore);

  const totalScore = Math.round(pipelineScore + interviewScore + hygieneScore + momentumScore);

  let rating: 'Strong momentum' | 'Good progress' | 'Needs attention' | 'Getting started' = 'Good progress';
  if (totalScore >= 78) rating = 'Strong momentum';
  else if (totalScore >= 55) rating = 'Good progress';
  else if (totalScore >= 35) rating = 'Needs attention';
  else rating = 'Getting started';

  let summary = '';
  if (totalOffers > 0) {
    summary = `Outstanding! You have ${totalOffers} active offer${totalOffers > 1 ? 's' : ''} in your pipeline.`;
  } else if (staleApplied.length > 0) {
    summary = `Your pipeline is active, but ${staleApplied.length} application${staleApplied.length > 1 ? 's' : ''} may need follow-up.`;
  } else if (upcomingInterviews.length > 0) {
    summary = `High interview activity! ${upcomingInterviews.length} upcoming interview round${upcomingInterviews.length > 1 ? 's' : ''} scheduled.`;
  } else {
    summary = `Keep building pipeline volume and logging follow-ups to maximize response rates.`;
  }

  return {
    score: totalScore,
    rating,
    summary,
    breakdown: [
      {
        label: 'Active Pipeline',
        score: pipelineScore,
        max: 25,
        note: `${activeJobs.length} active opportunities`,
      },
      {
        label: 'Interview Velocity',
        score: interviewScore,
        max: 25,
        note: totalOffers > 0 ? `${totalOffers} offer received` : `${upcomingInterviews.length} upcoming round(s)`,
      },
      {
        label: 'Follow-up Hygiene',
        score: hygieneScore,
        max: 25,
        note: `${staleApplied.length} stale / ${overdueFollowUps.length} overdue`,
      },
      {
        label: 'Weekly Momentum',
        score: momentumScore,
        max: 25,
        note: `${appliedThisWeek}/${weeklyGoalTarget} weekly target hit`,
      },
    ],
  };
}

/**
 * Calculates streak in days based on activities
 */
export function calculateStreak(activities: Activity[]): {
  streakDays: number;
  message: string;
  hasActivityToday: boolean;
} {
  if (activities.length === 0) {
    return {
      streakDays: 0,
      message: 'Start your first job-search action today.',
      hasActivityToday: false,
    };
  }

  // Get distinct calendar dates (YYYY-MM-DD)
  const uniqueDates = Array.from(
    new Set(
      activities.map((a) => {
        const d = new Date(a.createdAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })
    )
  ).sort().reverse();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const hasActivityToday = uniqueDates.includes(todayStr);
  const hasActivityYesterday = uniqueDates.includes(yesterdayStr);

  if (!hasActivityToday && !hasActivityYesterday) {
    return {
      streakDays: 0,
      message: 'Start your first job-search action today.',
      hasActivityToday: false,
    };
  }

  let streak = 0;
  let checkDate = new Date(hasActivityToday ? today : yesterday);

  while (true) {
    const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (uniqueDates.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  let message = '';
  if (streak >= 7) {
    message = `You have taken meaningful job-search actions for ${streak} consecutive days. Outstanding consistency!`;
  } else if (streak >= 3) {
    message = `You have taken meaningful job-search actions for ${streak} consecutive days. Great momentum!`;
  } else if (streak > 0) {
    message = `You're on a ${streak}-day active streak. Keep the momentum going!`;
  } else {
    message = 'Start your first job-search action today.';
  }

  return {
    streakDays: streak,
    message,
    hasActivityToday,
  };
}

/**
 * Local Resume Match Keyword Analyzer
 */
export function analyzeResumeMatch(resume: ResumeProfile, jobDescription: string): ResumeMatchResult {
  if (!jobDescription || !jobDescription.trim()) {
    return {
      matchScore: 0,
      matchedSkills: [],
      missingSkills: resume.skills,
      recommendation: 'Paste a job description or key requirements above to see instant keyword alignment.',
      jobKeywordsFound: [],
    };
  }

  const jdText = jobDescription.toLowerCase();

  // Common high-frequency tech & soft skill lexicon for matching
  const COMMON_SKILL_LEXICON = [
    'react', 'next.js', 'vue', 'angular', 'svelte', 'typescript', 'javascript', 'html', 'css', 'tailwind',
    'node.js', 'express', 'nestjs', 'python', 'django', 'fastapi', 'java', 'spring boot', 'go', 'golang',
    'rust', 'c++', 'c#', '.net', 'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
    'graphql', 'rest api', 'microservices', 'grpc', 'kafka', 'rabbitmq', 'aws', 'azure', 'gcp', 'docker',
    'kubernetes', 'ci/cd', 'github actions', 'terraform', 'system design', 'distributed systems', 'linux',
    'jest', 'cypress', 'playwright', 'selenium', 'unit testing', 'e2e testing', 'performance optimization',
    'security', 'agile', 'scrum', 'leadership', 'mentorship', 'communication', 'cross-functional', 'product sense'
  ];

  // Skills present in resume that match JD
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of resume.skills) {
    const cleanSkill = skill.toLowerCase().trim();
    // Check direct inclusion or token presence
    if (jdText.includes(cleanSkill) || cleanSkill.split(/\s+/).some((token) => token.length > 3 && jdText.includes(token))) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  // Find extra skills mentioned in JD that aren't on this resume
  const extraKeywordsInJD: string[] = [];
  for (const keyword of COMMON_SKILL_LEXICON) {
    if (jdText.includes(keyword)) {
      const alreadyInResume = resume.skills.some((s) => s.toLowerCase().includes(keyword) || keyword.includes(s.toLowerCase()));
      if (!alreadyInResume) {
        extraKeywordsInJD.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    }
  }

  const totalEvaluated = resume.skills.length + Math.min(extraKeywordsInJD.length, 6);
  const matchRatio = totalEvaluated > 0 ? (matchedSkills.length / Math.max(1, matchedSkills.length + missingSkills.length + Math.min(extraKeywordsInJD.length, 3))) : 0;
  const matchScore = Math.min(96, Math.max(20, Math.round(matchRatio * 100)));

  let recommendation = '';
  if (extraKeywordsInJD.length > 0) {
    const topMissing = extraKeywordsInJD.slice(0, 3).join(', ');
    recommendation = `The role mentions requirements like ${topMissing}. Consider highlighting relevant projects or coursework covering these tools.`;
  } else if (matchedSkills.length >= 5) {
    recommendation = `Strong keyword alignment! Your profile covers core competencies requested in the role.`;
  } else {
    recommendation = `Consider tailoring your bullet points to mirror the specific terminology and technical domain used in this job description.`;
  }

  return {
    matchScore,
    matchedSkills,
    missingSkills: extraKeywordsInJD.slice(0, 6),
    recommendation,
    jobKeywordsFound: matchedSkills.concat(extraKeywordsInJD.slice(0, 6)),
  };
}

/**
 * Generate Google Calendar Deep Link for Interviews or Follow-ups
 */
export function createGoogleCalendarUrl({
  title,
  description,
  location,
  startDate, // YYYY-MM-DD
  startTime, // HH:mm
  durationMinutes = 45,
}: {
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  startTime?: string;
  durationMinutes?: number;
}): string {
  const [year, month, day] = startDate.split('-').map(Number);
  let [hours, minutes] = [10, 0];
  if (startTime) {
    const parts = startTime.split(':').map(Number);
    if (parts.length >= 2) {
      hours = parts[0];
      minutes = parts[1];
    }
  }

  const start = new Date(year, month - 1, day, hours, minutes);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  const formatGCalTime = (d: Date) => {
    return d.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const datesParam = `${formatGCalTime(start)}/${formatGCalTime(end)}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: datesParam,
    details: description || 'Scheduled via HireFlow',
    location: location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Mailto / Gmail URL with template variables replaced
 */
export function generateEmailUrl({
  recruiterEmail,
  template,
  job,
  resume,
  myFullName,
}: {
  recruiterEmail?: string;
  template: FollowUpTemplate;
  job: Job;
  resume?: ResumeProfile;
  myFullName?: string;
}): {
  subject: string;
  body: string;
  mailtoUrl: string;
  gmailUrl: string;
} {
  const replaceVars = (text: string) => {
    return text
      .replace(/\{\{company\}\}/gi, job.companyName || 'your team')
      .replace(/\{\{role\}\}/gi, job.jobTitle || 'the open role')
      .replace(/\{\{recruiter\}\}/gi, job.recruiterName || 'Hiring Team')
      .replace(/\{\{my_name\}\}/gi, myFullName || 'Alex Candidate')
      .replace(/\{\{applied_source\}\}/gi, job.linkedinUrl ? 'LinkedIn' : 'your careers site')
      .replace(/\{\{key_skills\}\}/gi, resume ? resume.skills.slice(0, 4).join(', ') : 'modern software engineering');
  };

  const subject = replaceVars(template.subject);
  const body = replaceVars(template.body);

  const emailTo = recruiterEmail || job.recruiterEmail || '';
  const mailtoParams = new URLSearchParams({
    subject,
    body,
  });

  const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?${mailtoParams.toString()}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailTo)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return {
    subject,
    body,
    mailtoUrl,
    gmailUrl,
  };
}

/**
 * Generate LinkedIn search link for company/recruiter
 */
export function getLinkedInSearchUrl(query: string, type: 'people' | 'company' | 'job' = 'people'): string {
  if (type === 'people') {
    return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
  }
  if (type === 'company') {
    return `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(query)}`;
  }
  return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}`;
}

/**
 * Fire celebrate confetti
 */
export function triggerCelebration(): void {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#059669', '#34d399', '#6ee7b7', '#f59e0b', '#3b82f6'],
    });
  } catch (e) {
    // Ignore if in iframe or blocked
  }
}

// Export greeting utilities
export * from './greeting';
export * from './csvExport';
