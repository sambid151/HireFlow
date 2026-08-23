import { ResumeProfile, Job } from '../types';

export interface ResumeHealthBreakdown {
  contentScore: number; // 0 - 20
  structureScore: number; // 0 - 20
  keywordsScore: number; // 0 - 20
  impactScore: number; // 0 - 20
  atsScore: number; // 0 - 20
  totalScore: number; // 0 - 100
  isAvailable: boolean;
  statusText: string;
  reasons: string[];
}

export interface AISuggestionItem {
  id: string;
  category: 'impact' | 'clarity' | 'structure' | 'keywords' | 'role_alignment' | 'ats_readability';
  problem: string;
  whyItMatters: string;
  suggestedImprovement: string;
  originalSnippet?: string;
  isApplied?: boolean;
  isIgnored?: boolean;
}

export interface BulletImprovementResult {
  currentBullet: string;
  improvedBullet: string;
  why: string;
  appliedRule: string;
}

export interface AIJobMatchResult {
  matchScore: number; // 0 - 100
  matchingSkills: string[];
  missingKeywords: string[];
  potentialGaps: string[];
  recommendedImprovements: string[];
  analysisType: 'Deep AI Review' | 'Instant Match';
}

/**
 * Calculates deterministic, evidence-grounded Resume Health Score
 */
export function calculateResumeHealth(resume: ResumeProfile): ResumeHealthBreakdown {
  const text = resume.extractedText || '';
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  if (!text || wordCount < 25) {
    return {
      contentScore: 0,
      structureScore: 0,
      keywordsScore: 0,
      impactScore: 0,
      atsScore: 0,
      totalScore: 0,
      isAvailable: false,
      statusText: 'Insufficient text extracted from file. Upload a text-based PDF, DOCX or TXT.',
      reasons: ['Resume file contained minimal or unextractable text.'],
    };
  }

  const lower = text.toLowerCase();
  const reasons: string[] = [];

  // 1. Content (0 - 20): Word count, role clarity, length balance
  let contentScore = 0;
  if (wordCount >= 250 && wordCount <= 1200) {
    contentScore = 20;
  } else if (wordCount >= 150) {
    contentScore = 15;
    reasons.push('Word count is somewhat brief; expand on key project scopes.');
  } else {
    contentScore = 10;
    reasons.push('Resume is very short for standard multi-year experience.');
  }

  // 2. Structure (0 - 20): Standard section headers (Experience, Education, Skills, Summary/Projects)
  let structureScore = 5;
  const hasExperience = /experience|employment|work history/i.test(text);
  const hasEducation = /education|university|degree|college/i.test(text);
  const hasSkills = /skills|technologies|technical proficiencies/i.test(text);
  const hasProjects = /projects|portfolio|achievements/i.test(text);

  if (hasExperience) structureScore += 5;
  if (hasEducation) structureScore += 4;
  if (hasSkills) structureScore += 3;
  if (hasProjects) structureScore += 3;

  if (structureScore < 15) {
    reasons.push('Missing common section headings like Experience, Education, or Skills.');
  }

  // 3. Keywords & Technical Stack (0 - 20)
  let keywordsScore = 0;
  const skillsCount = resume.skills?.length || 0;
  if (skillsCount >= 8) keywordsScore = 20;
  else if (skillsCount >= 5) keywordsScore = 16;
  else if (skillsCount >= 2) keywordsScore = 12;
  else {
    keywordsScore = 8;
    reasons.push('Limited technical keyword density detected.');
  }

  // 4. Impact & Metrics (0 - 20): Quantifiable numbers, percentages, metrics ($/%, ms, Xx)
  let impactScore = 4;
  const metricsMatches = text.match(/\d+[%xXkKM]|\$\d+|\d+\s*ms|\d+\s*users|\d+\s*requests|\d+\s*(?:million|billion|thousand)/gi);
  const metricCount = metricsMatches ? metricsMatches.length : 0;

  if (metricCount >= 5) impactScore = 20;
  else if (metricCount >= 3) impactScore = 16;
  else if (metricCount >= 1) impactScore = 12;
  else {
    impactScore = 6;
    reasons.push('Lacks quantifiable metrics (% improvements, scale numbers, latency reductions).');
  }

  // 5. ATS Readiness & Formatting (0 - 20): Email, phone/links, bullet points, clean structure
  let atsScore = 6;
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/i.test(text);
  const hasLinks = /linkedin\.com|github\.com|http/i.test(text);
  const hasBulletMarkers = /•|\*|-|\d+\./i.test(text);

  if (hasEmail) atsScore += 5;
  if (hasLinks) atsScore += 5;
  if (hasBulletMarkers) atsScore += 4;

  const totalScore = Math.min(100, Math.max(0, contentScore + structureScore + keywordsScore + impactScore + atsScore));

  let statusText = 'Strong ATS Profile';
  if (totalScore < 50) statusText = 'Needs Fundamental Polish';
  else if (totalScore < 75) statusText = 'Good Baseline';

  return {
    contentScore,
    structureScore,
    keywordsScore,
    impactScore,
    atsScore,
    totalScore,
    isAvailable: true,
    statusText,
    reasons,
  };
}

/**
 * Generates structured AI Resume Review suggestions
 */
export function analyzeResumeReview(resume: ResumeProfile): AISuggestionItem[] {
  const text = resume.extractedText || '';
  const lower = text.toLowerCase();
  const suggestions: AISuggestionItem[] = [];

  // Check 1: Missing quantifiable impact in bullets
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 20);
  const weakMetricLine = lines.find(
    (l) => !/\d+[%xXkKM]|\$\d+|\d+\s*ms|\d+\s*users/i.test(l) && (l.startsWith('•') || l.startsWith('-') || l.length > 40)
  );

  if (weakMetricLine) {
    suggestions.push({
      id: 'rev-metric-1',
      category: 'impact',
      problem: 'Experience bullets describe tasks without measurable business or technical outcomes.',
      whyItMatters: 'Recruiters and hiring managers prioritize measurable impact (e.g. latency cut by 40%, supported 100k+ MAU) over passive task lists.',
      suggestedImprovement: 'Rewrite action statements using the formula: "Accomplished [X], as measured by [Y], by doing [Z]" (e.g. "Optimized API response times by 35% by implementing Redis caching").',
      originalSnippet: weakMetricLine.slice(0, 120),
    });
  }

  // Check 2: Action Verbs strength
  const weakVerbs = ['worked on', 'responsible for', 'helped with', 'assisted in', 'handled'];
  const foundWeakVerb = weakVerbs.find((v) => lower.includes(v));
  if (foundWeakVerb) {
    suggestions.push({
      id: 'rev-verb-1',
      category: 'clarity',
      problem: `Passive phrasing detected (e.g. "${foundWeakVerb}").`,
      whyItMatters: 'Passive voice weakens candidate authority and obscures individual engineering ownership.',
      suggestedImprovement: 'Replace passive phrases with decisive action verbs like "Architected", "Spearheaded", "Streamlined", "Engineered", or "Automated".',
    });
  }

  // Check 3: Cloud / Testing / Infrastructure
  const hasTesting = /jest|cypress|playwright|selenium|unit test|integration test|qa/i.test(text);
  if (!hasTesting) {
    suggestions.push({
      id: 'rev-testing-1',
      category: 'keywords',
      problem: 'Automated testing and quality validation frameworks are not clearly highlighted.',
      whyItMatters: 'Modern software engineering teams look for test automation (Jest, Playwright, CI/CD) as a core quality indicator.',
      suggestedImprovement: 'Add specific testing tools and coverage improvements (e.g. "Authored E2E test suites with Playwright, achieving 90%+ branch coverage").',
    });
  }

  // Check 4: Cloud and Deployment Tools
  const hasCloud = /aws|gcp|azure|docker|kubernetes|terraform|ci\/cd/i.test(text);
  if (!hasCloud) {
    suggestions.push({
      id: 'rev-cloud-1',
      category: 'keywords',
      problem: 'Cloud platforms or container orchestration tools are absent.',
      whyItMatters: 'Almost all top tech roles require familiarity with deployment environments (Docker, AWS, Kubernetes).',
      suggestedImprovement: 'List specific infrastructure tools utilized in development or production pipelines.',
    });
  }

  // Check 5: ATS Contact Information & Links
  const hasGithubOrPortfolio = /github\.com|portfolio|\.dev|\.io/i.test(text);
  if (!hasGithubOrPortfolio) {
    suggestions.push({
      id: 'rev-ats-1',
      category: 'ats_readability',
      problem: 'Missing link to active GitHub profile or technical portfolio.',
      whyItMatters: 'Engineering recruiters frequently click through to inspect code quality and open-source contributions.',
      suggestedImprovement: 'Include a clean GitHub or personal domain link directly in your header section.',
    });
  }

  // Check 6: Role Alignment
  if (resume.targetRole && !lower.includes(resume.targetRole.toLowerCase().split(' ')[0])) {
    suggestions.push({
      id: 'rev-role-1',
      category: 'role_alignment',
      problem: `Headline does not explicitly mirror your target role "${resume.targetRole}".`,
      whyItMatters: 'ATS parsers and recruiters spend ~6 seconds scanning the top fold for exact role title matches.',
      suggestedImprovement: `Add a 2-line executive summary placing "${resume.targetRole}" prominently beneath your contact info.`,
    });
  }

  return suggestions;
}

/**
 * AI Bullet Improvement Engine (CURRENT, IMPROVED, WHY)
 */
export function improveBulletPoint(currentBullet: string, targetRole?: string): BulletImprovementResult {
  const trimmed = currentBullet.trim().replace(/^[-•*]\s*/, '');

  if (!trimmed) {
    return {
      currentBullet: '',
      improvedBullet: 'Engineered high-performance RESTful microservices in TypeScript, reducing endpoint latency by 28% across 500k daily requests.',
      why: 'Added explicit technical stack, measurable latency reduction, and production scale context.',
      appliedRule: 'Action Verb + Technical Stack + Quantified Impact',
    };
  }

  let improved = trimmed;
  let why = '';
  let appliedRule = 'Action-Impact Transformation';

  // Rule 1: Replace passive openers
  if (/^(responsible for|worked on|helped with|assisted in|handled)/i.test(improved)) {
    improved = improved.replace(/^(responsible for|worked on|helped with|assisted in|handled)\s*/i, 'Architected and delivered ');
    why += 'Replaced passive phrasing with decisive action ownership. ';
    appliedRule = 'Active Voice Ownership';
  } else if (/^[a-z]/i.test(improved) && !/^(engineered|developed|built|designed|implemented|spearheaded|automated|optimized|architected)/i.test(improved)) {
    improved = 'Engineered ' + improved.charAt(0).toLowerCase() + improved.slice(1);
    why += 'Anchored statement with a high-impact technical action verb. ';
  }

  // Rule 2: Metric insertion guidance if missing numbers
  const hasMetric = /\d+[%xXkKM]|\$\d+|\d+\s*ms|\d+\s*users|\d+\s*requests/i.test(improved);
  if (!hasMetric) {
    if (improved.endsWith('.')) improved = improved.slice(0, -1);
    improved += ', improving processing throughput by [X%] and reducing latency across [Y] active users.';
    why += 'Added standard quantified placeholder metric ([X%], [Y] users) to highlight engineering business value without fabricating facts.';
    appliedRule = 'Quantifiable Metric Anchor';
  } else {
    why += 'Maintained original metrics while tightening syntax for ATS scanning.';
  }

  // Capitalize and format bullet cleanly
  improved = improved.charAt(0).toUpperCase() + improved.slice(1);
  if (!improved.endsWith('.')) improved += '.';

  return {
    currentBullet: trimmed,
    improvedBullet: improved,
    why: why.trim() || 'Structured statement to clearly communicate scope, engineering actions, and business results.',
    appliedRule,
  };
}

/**
 * AI Job Match (Selected Resume vs Job Description)
 */
export function matchResumeToJobDescription(
  resume: ResumeProfile,
  jobDescription: string
): AIJobMatchResult {
  if (!jobDescription || !jobDescription.trim()) {
    return {
      matchScore: 0,
      matchingSkills: [],
      missingKeywords: resume.skills || [],
      potentialGaps: ['Paste a job description to perform deep AI keyword and requirements matching.'],
      recommendedImprovements: ['Ensure your resume highlights the core tech stack required for this job.'],
      analysisType: 'Instant Match',
    };
  }

  const jdText = jobDescription.toLowerCase();
  const resumeText = (resume.extractedText || resume.skills.join(' ')).toLowerCase();

  const SKILL_TAXONOMY = [
    'react', 'typescript', 'javascript', 'next.js', 'vue', 'angular', 'node.js', 'express', 'python',
    'django', 'fastapi', 'java', 'spring boot', 'go', 'golang', 'rust', 'c++', 'c#', '.net', 'sql',
    'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'graphql', 'rest api', 'microservices',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ci/cd', 'github actions', 'jenkins',
    'selenium', 'playwright', 'cypress', 'jest', 'kafka', 'system design', 'agile', 'scrum', 'leadership'
  ];

  const matchingSkills: string[] = [];
  const missingKeywords: string[] = [];

  // Match resume skills with JD
  for (const skill of resume.skills) {
    const sLower = skill.toLowerCase();
    if (jdText.includes(sLower)) {
      matchingSkills.push(skill);
    }
  }

  // Check which taxonomy skills are requested in JD but missing in resume
  for (const keyword of SKILL_TAXONOMY) {
    if (jdText.includes(keyword)) {
      const inResume = resumeText.includes(keyword);
      const formatted = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      if (inResume) {
        if (!matchingSkills.includes(formatted)) {
          matchingSkills.push(formatted);
        }
      } else {
        if (!missingKeywords.includes(formatted)) {
          missingKeywords.push(formatted);
        }
      }
    }
  }

  const totalKeywords = matchingSkills.length + missingKeywords.length;
  let rawRatio = totalKeywords > 0 ? matchingSkills.length / totalKeywords : 0.5;
  const matchScore = Math.min(95, Math.max(15, Math.round(rawRatio * 100)));

  const potentialGaps: string[] = [];
  if (missingKeywords.length > 0) {
    potentialGaps.push(`Key requirements like ${missingKeywords.slice(0, 3).join(', ')} were identified in the job description but are absent in this resume.`);
  }
  if (!jdText.includes('remote') && (resume.targetRole || '').toLowerCase().includes('remote')) {
    potentialGaps.push('Role may require on-site or hybrid presence. Verify location constraints.');
  }
  if (potentialGaps.length === 0) {
    potentialGaps.push('No critical skill gaps detected against standard requirements for this title.');
  }

  const recommendedImprovements: string[] = [];
  if (missingKeywords.length > 0) {
    recommendedImprovements.push(`Incorporate experience with ${missingKeywords.slice(0, 2).join(' and ')} into your bullet points or technical skills section.`);
  }
  recommendedImprovements.push(`Mirror the exact terminology used in the job description (e.g. "${matchingSkills[0] || 'core engineering'}") in your top summary.`);

  return {
    matchScore,
    matchingSkills,
    missingKeywords: missingKeywords.slice(0, 8),
    potentialGaps,
    recommendedImprovements,
    analysisType: 'Instant Match',
  };
}
