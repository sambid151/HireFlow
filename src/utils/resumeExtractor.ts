import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker if available
try {
  if (typeof window !== 'undefined') {
    // Use bundled cdn or standard worker url
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.warn('PDF.js worker setup warning:', e);
}

export interface ExtractedResumeData {
  text: string;
  detectedName?: string;
  targetRole?: string;
  skills: string[];
  yearsOfExperience?: number;
  experienceSignals: string[];
  suggestedImprovements: string[];
}

// Common dictionary for technical & functional skills
const SKILL_DATABASE = [
  // Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Golang', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'SQL', 'HTML', 'CSS',
  // Frontend
  'React', 'Next.js', 'Vue', 'Vue.js', 'Angular', 'Svelte', 'Tailwind CSS', 'Redux', 'Zustand', 'GraphQL', 'Webpack', 'Vite', 'Responsive Design',
  // Backend & Cloud
  'Node.js', 'Express', 'NestJS', 'Django', 'FastAPI', 'Spring Boot', '.NET', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'GitHub Actions', 'Jenkins', 'Kafka', 'RabbitMQ', 'Microservices', 'REST API', 'gRPC',
  // QA & Testing
  'Selenium', 'Playwright', 'Cypress', 'Jest', 'PyTest', 'JUnit', 'Appium', 'Postman', 'Test Automation', 'Manual Testing', 'Performance Testing',
  // Data & AI
  'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Data Analysis', 'Tableau', 'Power BI', 'ETL', 'Airflow',
  // Methodologies & Soft Skills
  'Agile', 'Scrum', 'System Design', 'Distributed Systems', 'Git', 'Linux', 'Leadership', 'Mentorship', 'Cross-Functional Collaboration', 'Problem Solving'
];

/**
 * Extract raw text from PDF ArrayBuffer
 */
async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdfDoc = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (err) {
    console.warn('PDF.js extraction failed, attempting fallback text parsing:', err);
    // Fallback: search for ascii strings if pdfjs fails
    try {
      const uint8 = new Uint8Array(arrayBuffer);
      let text = '';
      for (let i = 0; i < uint8.length; i++) {
        const charCode = uint8[i];
        if ((charCode >= 32 && charCode <= 126) || charCode === 10 || charCode === 13) {
          text += String.fromCharCode(charCode);
        } else if (text.endsWith(' ') === false) {
          text += ' ';
        }
      }
      return text.slice(0, 10000);
    } catch {
      return '';
    }
  }
}

/**
 * Extract raw text from DOCX ArrayBuffer
 */
async function extractTextFromDOCX(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || '';
  } catch (err) {
    console.warn('Mammoth DOCX extraction failed:', err);
    return '';
  }
}

/**
 * Main file text extraction entry point
 */
export async function extractResumeFile(file: File): Promise<{ text: string; error?: string }> {
  try {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      const buffer = await file.arrayBuffer();
      const text = await extractTextFromPDF(buffer);
      return { text };
    }

    if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      const buffer = await file.arrayBuffer();
      const text = await extractTextFromDOCX(buffer);
      return { text };
    }

    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      const text = await file.text();
      return { text };
    }

    // Default fallback try text
    const text = await file.text();
    return { text };
  } catch (err: any) {
    return { text: '', error: err?.message || 'Failed to read file' };
  }
}

/**
 * Analyzes extracted resume text locally using deterministic NLP heuristics
 */
export function analyzeResumeText(rawText: string, fileName?: string): ExtractedResumeData {
  if (!rawText || !rawText.trim()) {
    // Generate sensible defaults from filename if text extraction was empty
    const fallbackRole = inferRoleFromText('', fileName);
    return {
      text: rawText || '',
      detectedName: '',
      targetRole: fallbackRole,
      skills: ['Software Engineering', 'Problem Solving', 'Communication'],
      yearsOfExperience: 3,
      experienceSignals: ['Standard technical profile'],
      suggestedImprovements: [
        'Add measurable metrics (% improvements, latency reductions, scale numbers)',
        'Include links to active GitHub or deployed project portfolios',
        'Tailor core technical keywords to match specific job descriptions'
      ]
    };
  }

  const lowerText = rawText.toLowerCase();

  // 1. Detect Skills
  const detectedSkills: string[] = [];
  for (const skill of SKILL_DATABASE) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(rawText)) {
      detectedSkills.push(skill);
    }
  }

  // Ensure unique and sorted
  const uniqueSkills = Array.from(new Set(detectedSkills));

  // 2. Detect Years of Experience
  let yearsOfExp = 0;
  const expMatch = lowerText.match(/(\d{1,2})\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience/i);
  if (expMatch && expMatch[1]) {
    yearsOfExp = parseInt(expMatch[1], 10);
  } else {
    // Heuristic based on graduation dates or year counts
    const yearMatches = rawText.match(/20\d{2}/g);
    if (yearMatches && yearMatches.length >= 2) {
      const years = yearMatches.map(Number).filter((y) => y <= new Date().getFullYear() && y >= 2000);
      if (years.length >= 2) {
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        const diff = maxYear - minYear;
        yearsOfExp = Math.max(1, Math.min(20, diff));
      }
    }
  }

  if (!yearsOfExp || isNaN(yearsOfExp)) {
    yearsOfExp = uniqueSkills.length > 8 ? 4 : 2;
  }

  // 3. Detect Target Role
  const targetRole = inferRoleFromText(rawText, fileName);

  // 4. Experience Signals
  const experienceSignals: string[] = [];
  if (yearsOfExp > 0) {
    experienceSignals.push(`~${yearsOfExp} ${yearsOfExp === 1 ? 'Year' : 'Years'} Estimated Experience`);
  }
  if (lowerText.includes('lead') || lowerText.includes('senior') || lowerText.includes('architect') || lowerText.includes('staff')) {
    experienceSignals.push('Senior / Leadership Signals Present');
  }
  if (lowerText.includes('distributed') || lowerText.includes('microservices') || lowerText.includes('scale') || lowerText.includes('high throughput')) {
    experienceSignals.push('High-scale Systems Experience');
  }
  if (lowerText.includes('mentored') || lowerText.includes('managed') || lowerText.includes('team lead')) {
    experienceSignals.push('Team Mentorship & Coordination');
  }
  if (experienceSignals.length === 0) {
    experienceSignals.push('Hands-on Individual Contributor');
  }

  // 5. Suggested Improvements
  const suggestions: string[] = [];

  // Check metrics
  const hasMetrics = /\d+[%xXkKM]|\$\d+|\d+\s*ms|\d+\s*users|\d+\s*requests/i.test(rawText);
  if (!hasMetrics) {
    suggestions.push('Add measurable achievements: quantify impact with percentages, latency drops, revenue, or user counts.');
  }

  // Check action verbs
  const actionVerbs = ['architected', 'spearheaded', 'engineered', 'optimized', 'delivered', 'automated', 'streamlined', 'deployed'];
  const foundVerbs = actionVerbs.filter((v) => lowerText.includes(v));
  if (foundVerbs.length < 3) {
    suggestions.push('Strengthen bullet points with strong action verbs (e.g. "Architected", "Automated", "Optimized").');
  }

  // Check automated testing
  if (!lowerText.includes('test') && !lowerText.includes('jest') && !lowerText.includes('cypress') && !lowerText.includes('playwright')) {
    suggestions.push('Highlight automated testing, CI/CD pipelines, and software quality frameworks.');
  }

  // Check cloud/infra
  if (!lowerText.includes('aws') && !lowerText.includes('gcp') && !lowerText.includes('docker') && !lowerText.includes('cloud')) {
    suggestions.push('Mention deployment and containerization experience (e.g. Docker, AWS, Cloud services).');
  }

  if (suggestions.length === 0) {
    suggestions.push('Profile is strong and well-structured. Tailor keyword density to match each specific target job description.');
  }

  return {
    text: rawText,
    detectedName: inferNameFromText(rawText),
    targetRole,
    skills: uniqueSkills.length > 0 ? uniqueSkills : ['Software Engineering', 'Problem Solving', 'Git', 'Agile'],
    yearsOfExperience: yearsOfExp,
    experienceSignals,
    suggestedImprovements: suggestions.slice(0, 4),
  };
}

/**
 * Infer target role from text or file name
 */
function inferRoleFromText(text: string, fileName?: string): string {
  const combined = (text.slice(0, 2000) + ' ' + (fileName || '')).toLowerCase();

  if (combined.includes('sdet') || combined.includes('automation engineer') || combined.includes('qa lead') || combined.includes('test lead')) {
    return 'Software Development Engineer in Test (SDET)';
  }
  if (combined.includes('full stack') || combined.includes('fullstack')) {
    return 'Full Stack Software Engineer';
  }
  if (combined.includes('frontend') || combined.includes('front-end') || combined.includes('react developer')) {
    return 'Frontend Engineer';
  }
  if (combined.includes('backend') || combined.includes('back-end') || combined.includes('api developer')) {
    return 'Backend Engineer';
  }
  if (combined.includes('devops') || combined.includes('sre') || combined.includes('site reliability')) {
    return 'DevOps / Site Reliability Engineer';
  }
  if (combined.includes('data engineer') || combined.includes('analytics engineer')) {
    return 'Data Engineer';
  }
  if (combined.includes('machine learning') || combined.includes('ml engineer') || combined.includes('ai engineer')) {
    return 'Machine Learning Engineer';
  }
  if (combined.includes('product manager') || combined.includes('technical pm')) {
    return 'Technical Product Manager';
  }

  return 'Software Development Engineer';
}

/**
 * Infer candidate name from first few lines
 */
function inferNameFromText(text: string): string {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine.length > 2 && firstLine.length < 40 && !firstLine.includes('@') && !firstLine.includes('http')) {
      return firstLine;
    }
  }
  return '';
}
