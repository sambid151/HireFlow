import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Upload,
  UploadCloud,
  Star,
  CheckCircle2,
  TrendingUp,
  MoreVertical,
  Edit2,
  Trash2,
  Download,
  Eye,
  Sparkles,
  Briefcase,
  AlertCircle,
  Check,
  X,
  Copy,
  RefreshCw,
  ShieldCheck,
  Layers,
  Search,
  ArrowRight,
} from 'lucide-react';
import { ResumeProfile } from '../../types';
import { useHireFlow } from '../../context/HireFlowContext';
import { ConfirmationModal } from '../common/ConfirmationModal';
import {
  calculateResumeHealth,
  analyzeResumeReview,
  improveBulletPoint,
  AISuggestionItem,
  BulletImprovementResult,
} from '../../services/aiService';
import { Button } from '../common/Button';

export const ResumeIntelligenceView: React.FC = () => {
  const {
    resumes,
    jobs,
    addResume,
    uploadResumeFile,
    updateResume,
    deleteResume,
    showToast,
  } = useHireFlow();

  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dropdown menu state
  const [openMenuResumeId, setOpenMenuResumeId] = useState<string | null>(null);

  // Modals state
  const [previewResume, setPreviewResume] = useState<ResumeProfile | null>(null);
  const [reviewResume, setReviewResume] = useState<ResumeProfile | null>(null);
  const [bulletModalResume, setBulletModalResume] = useState<ResumeProfile | null>(null);
  const [editResume, setEditResume] = useState<ResumeProfile | null>(null);
  const [resumeToDelete, setResumeToDelete] = useState<ResumeProfile | null>(null);

  // AI Privacy Confirmation State
  const [privacyConsentGiven, setPrivacyConsentGiven] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [pendingAIAction, setPendingAIAction] = useState<(() => void) | null>(null);

  // AI Review Suggestions state
  const [suggestions, setSuggestions] = useState<AISuggestionItem[]>([]);
  const [analysisMode, setAnalysisMode] = useState<'Instant Review' | 'Deep AI Review'>('Instant Review');

  // Bullet Improver state
  const [customBulletInput, setCustomBulletInput] = useState('');
  const [bulletResult, setBulletResult] = useState<BulletImprovementResult | null>(null);

  // Edit / Rename form state
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editVersion, setEditVersion] = useState('1.0');
  const [editIsDefault, setEditIsDefault] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.resume-dropdown-menu-container')) {
        setOpenMenuResumeId(null);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  // Filtered resumes
  const filteredResumes = resumes.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.targetRole.toLowerCase().includes(q) ||
      r.skills.some((s) => s.toLowerCase().includes(q))
    );
  });

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      await uploadResumeFile(file);
      showToast(`Uploaded and extracted ${file.name}`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      showToast(`Upload error: ${msg}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDownload = (resume: ResumeProfile) => {
    if (resume.fileBlob) {
      const url = URL.createObjectURL(resume.fileBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resume.originalFileName || `${resume.name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Downloaded ${resume.name}`, 'success');
    } else if (resume.extractedText) {
      const blob = new Blob([resume.extractedText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resume.name}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Downloaded text of ${resume.name}`, 'success');
    } else {
      showToast('No raw file content available for download.', 'info');
    }
  };

  const handleSetDefault = async (resume: ResumeProfile) => {
    for (const r of resumes) {
      if (r.id === resume.id && !r.isDefault) {
        await updateResume({ ...r, isDefault: true });
      } else if (r.id !== resume.id && r.isDefault) {
        await updateResume({ ...r, isDefault: false });
      }
    }
    showToast(`"${resume.name}" is now your default resume.`, 'success');
  };

  // Trigger AI Review with Privacy Check
  const openAIReview = (resume: ResumeProfile) => {
    setReviewResume(resume);
    const initialSuggestions = analyzeResumeReview(resume);
    setSuggestions(initialSuggestions);
    setAnalysisMode('Instant Review');
  };

  const requestCloudAIReview = () => {
    if (!privacyConsentGiven) {
      setPendingAIAction(() => () => {
        setAnalysisMode('Deep AI Review');
        showToast('Deep AI Resume Review refreshed via secure pipeline.', 'success');
      });
      setShowPrivacyDialog(true);
    } else {
      setAnalysisMode('Deep AI Review');
      showToast('Deep AI Resume Review refreshed.', 'success');
    }
  };

  const handleApplySuggestion = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isApplied: true, isIgnored: false } : s))
    );
    showToast('Suggestion marked as applied to your checklist.', 'success');
  };

  const handleIgnoreSuggestion = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isIgnored: true, isApplied: false } : s))
    );
  };

  // Bullet Improver trigger
  const openBulletImprover = (resume: ResumeProfile) => {
    setBulletModalResume(resume);
    // Find a sample bullet from extracted text
    const lines = (resume.extractedText || '')
      .split('\n')
      .map((l) => l.trim().replace(/^[-•*]\s*/, ''))
      .filter((l) => l.length > 25);
    const sample = lines[0] || 'Worked on backend APIs and helped team with deployments';
    setCustomBulletInput(sample);
    const result = improveBulletPoint(sample, resume.targetRole);
    setBulletResult(result);
  };

  const handleGenerateBulletImprovement = () => {
    if (!customBulletInput.trim()) return;
    const result = improveBulletPoint(customBulletInput, bulletModalResume?.targetRole);
    setBulletResult(result);
  };

  const handleCopyImprovedBullet = () => {
    if (bulletResult?.improvedBullet) {
      navigator.clipboard.writeText(bulletResult.improvedBullet);
      showToast('Improved bullet copied to clipboard!', 'success');
    }
  };

  // Open Edit / Rename modal
  const openEditModal = (resume: ResumeProfile) => {
    setEditResume(resume);
    setEditName(resume.name);
    setEditRole(resume.targetRole);
    setEditVersion(resume.version || '1.0');
    setEditIsDefault(!!resume.isDefault);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editResume || !editName.trim()) return;

    await updateResume({
      ...editResume,
      name: editName.trim(),
      targetRole: editRole.trim() || 'Software Engineer',
      version: editVersion.trim() || '1.0',
      isDefault: editIsDefault,
    });

    if (editIsDefault) {
      for (const r of resumes) {
        if (r.id !== editResume.id && r.isDefault) {
          await updateResume({ ...r, isDefault: false });
        }
      }
    }

    setEditResume(null);
    showToast('Resume profile updated!', 'success');
  };

  return (
    <div id="resume-intelligence-view" className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Resume Intelligence
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              Private & Secure
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Understand, improve and tailor your resume for every opportunity.
          </p>
        </div>

        {/* ONE Primary CTA: Upload Resume */}
        <div className="flex items-center gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(file);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }
            }}
            className="hidden"
          />
          <Button
            id="resume-upload-primary-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            loading={isUploading}
            loadingText="Extracting Resume..."
            icon={Upload}
            size="md"
            variant="emerald"
          >
            Upload Resume
          </Button>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-6 sm:p-8 rounded-3xl border-2 border-dashed transition-all duration-200 text-center cursor-pointer flex flex-col items-center justify-center ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 scale-[0.99]'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-emerald-500/70 dark:hover:border-emerald-500/70 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 shadow-2xs">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Drag & drop your resume file here, or <span className="text-emerald-600 dark:text-emerald-400 underline">browse</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
          Supports PDF, DOCX, and TXT files up to 15MB. Stored 100% privately and securely on your device.
        </p>
      </div>

      {/* Search & Filter Bar */}
      {resumes.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search resumes by name, role, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {filteredResumes.length} profile{filteredResumes.length === 1 ? '' : 's'} managed
          </span>
        </div>
      )}

      {/* Resumes Grid */}
      {resumes.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No resumes added yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Upload your master resume or specialized profiles to unlock health scoring, AI bullet improvements, and job match analytics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResumes.map((resume) => {
            const health = calculateResumeHealth(resume);
            const resumeJobs = jobs.filter((j) => j.resumeId === resume.id);
            const totalApps = resumeJobs.length;
            const interviewApps = resumeJobs.filter((j) => j.status === 'interview' || j.status === 'offer').length;
            const offerApps = resumeJobs.filter((j) => j.status === 'offer').length;
            const interviewRate = totalApps > 0 ? Math.round((interviewApps / totalApps) * 100) : 0;

            const isMenuOpen = openMenuResumeId === resume.id;

            return (
              <div
                key={resume.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs flex flex-col justify-between transition relative"
              >
                <div>
                  {/* Top Row: Name + Target Role + "..." menu */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {resume.name}
                        </h2>
                        {resume.isDefault && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                            Default
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400">
                          v{resume.version || '1.0'}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mt-0.5 truncate">
                        {resume.targetRole}
                      </p>
                    </div>

                    {/* Single "..." Dropdown Menu */}
                    <div className="relative resume-dropdown-menu-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuResumeId(isMenuOpen ? null : resume.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Resume Actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                          <button
                            onClick={() => {
                              setOpenMenuResumeId(null);
                              setPreviewResume(resume);
                            }}
                            className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>View Extracted Text</span>
                          </button>

                          <button
                            onClick={() => {
                              setOpenMenuResumeId(null);
                              openAIReview(resume);
                            }}
                            className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            <span>AI Resume Review</span>
                          </button>

                          <button
                            onClick={() => {
                              setOpenMenuResumeId(null);
                              openBulletImprover(resume);
                            }}
                            className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                            <span>AI Bullet Improver</span>
                          </button>

                          <button
                            onClick={() => {
                              setOpenMenuResumeId(null);
                              openEditModal(resume);
                            }}
                            className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Rename / Edit</span>
                          </button>

                          <button
                            onClick={() => {
                              setOpenMenuResumeId(null);
                              handleDownload(resume);
                            }}
                            className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-400" />
                            <span>Download File</span>
                          </button>

                          {!resume.isDefault && (
                            <button
                              onClick={() => {
                                setOpenMenuResumeId(null);
                                handleSetDefault(resume);
                              }}
                              className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer"
                            >
                              <Star className="w-3.5 h-3.5 text-amber-500" />
                              <span>Set as Default</span>
                            </button>
                          )}

                          <div className="border-t border-slate-100 dark:border-slate-700/80 my-1" />

                          <button
                            onClick={() => {
                              setOpenMenuResumeId(null);
                              setResumeToDelete(resume);
                            }}
                            className="w-full px-3.5 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>Delete Profile</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resume Health Indicator */}
                  <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500 dark:text-slate-400">Resume Health</span>
                      {health.isAvailable ? (
                        <span
                          className={`font-mono font-bold ${
                            health.totalScore >= 75
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : health.totalScore >= 50
                              ? 'text-teal-600 dark:text-teal-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {health.totalScore}/100
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Text Unavailable</span>
                      )}
                    </div>
                    {health.isAvailable && (
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${health.totalScore}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Skills preview tags */}
                  {resume.skills && resume.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {resume.skills.slice(0, 4).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                      {resume.skills.length > 4 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">
                          +{resume.skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Metrics Row: Applications / Interviews / Offers */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Apps
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white font-mono text-sm">
                      {totalApps}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-purple-50/40 dark:bg-purple-950/20">
                    <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 block">
                      Interviews
                    </span>
                    <span className="font-extrabold text-purple-700 dark:text-purple-300 font-mono text-sm">
                      {interviewApps}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                      Offers
                    </span>
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-300 font-mono text-sm">
                      {offerApps}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Resume Review Modal (Phase 8 & 11) */}
      {reviewResume && (
        <div
          id="ai-resume-review-modal"
          onClick={() => setReviewResume(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600 text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    AI Resume Review · {reviewResume.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Target: {reviewResume.targetRole}</span>
                    <span>·</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {analysisMode}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setReviewResume(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Resume Health Breakdown */}
              {(() => {
                const health = calculateResumeHealth(reviewResume);
                if (!health.isAvailable) {
                  return (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                      <p className="font-bold">{health.statusText}</p>
                    </div>
                  );
                }
                return (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Calculated Resume Health Score
                      </span>
                      <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                        {health.totalScore}/100
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      {[
                        { label: 'Content', score: health.contentScore },
                        { label: 'Structure', score: health.structureScore },
                        { label: 'Keywords', score: health.keywordsScore },
                        { label: 'Impact', score: health.impactScore },
                        { label: 'ATS Readiness', score: health.atsScore },
                      ].map((item) => (
                        <div key={item.label} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center">
                          <span className="text-[10px] text-slate-400 block truncate">{item.label}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{item.score}/20</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Suggestions List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Actionable Improvement Suggestions
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {suggestions.filter((s) => !s.isIgnored).length} available
                  </span>
                </div>

                {suggestions.filter((s) => !s.isIgnored).length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      All suggestions reviewed!
                    </p>
                  </div>
                ) : (
                  suggestions
                    .filter((s) => !s.isIgnored)
                    .map((sug) => (
                      <div
                        key={sug.id}
                        className={`p-4 rounded-2xl border transition space-y-2.5 ${
                          sug.isApplied
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>{sug.problem}</span>
                          </span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {sug.category}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          <strong className="text-slate-700 dark:text-slate-300">Why it matters: </strong>
                          {sug.whyItMatters}
                        </p>

                        <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/60 text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
                          <strong className="text-emerald-800 dark:text-emerald-400">Suggested Improvement: </strong>
                          {sug.suggestedImprovement}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => handleIgnoreSuggestion(sug.id)}
                            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer"
                          >
                            Ignore
                          </button>
                          <button
                            onClick={() => handleApplySuggestion(sug.id)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                              sug.isApplied
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-emerald-600 hover:text-white'
                            }`}
                          >
                            {sug.isApplied ? 'Applied ✓' : 'Mark Applied'}
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Original resume text is never overwritten automatically.
              </span>
              <button
                onClick={() => setReviewResume(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Bullet Improvement Modal (Phase 9) */}
      {bulletModalResume && (
        <div
          id="ai-bullet-improver-modal"
          onClick={() => setBulletModalResume(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  AI Bullet Point Improver
                </h3>
              </div>
              <button
                onClick={() => setBulletModalResume(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Enter or paste a resume bullet point:
                </label>
                <textarea
                  rows={3}
                  value={customBulletInput}
                  onChange={(e) => setCustomBulletInput(e.target.value)}
                  placeholder="e.g. Worked on database queries and improved speed"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleGenerateBulletImprovement}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Improve Bullet</span>
                </button>
              </div>

              {bulletResult && (
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
                  {/* CURRENT */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      CURRENT
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-mono text-[11px]">
                      {bulletResult.currentBullet}
                    </p>
                  </div>

                  {/* IMPROVED */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block mb-1">
                      IMPROVED
                    </span>
                    <p className="text-emerald-950 dark:text-emerald-100 font-semibold leading-relaxed">
                      {bulletResult.improvedBullet}
                    </p>
                  </div>

                  {/* WHY */}
                  <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-900/60 text-xs">
                    <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-400 block mb-1">
                      WHY
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {bulletResult.why}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setBulletResult(null)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 transition cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={handleGenerateBulletImprovement}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Try Again</span>
                    </button>
                    <button
                      onClick={handleCopyImprovedBullet}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Use Suggestion</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Extracted Text Modal */}
      {previewResume && (
        <div
          id="preview-text-modal"
          onClick={() => setPreviewResume(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Extracted Text · {previewResume.name}
              </h3>
              <button
                onClick={() => setPreviewResume(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {previewResume.extractedText || 'No text extracted for this profile.'}
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(previewResume.extractedText || '');
                  showToast('Resume text copied to clipboard!', 'success');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Full Text</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename / Edit Details Modal */}
      {editResume && (
        <div
          id="edit-resume-modal"
          onClick={() => setEditResume(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Resume Profile
              </h3>
              <button
                onClick={() => setEditResume(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Profile Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Role Title
                </label>
                <input
                  type="text"
                  required
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={editVersion}
                  onChange={(e) => setEditVersion(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-is-default"
                  checked={editIsDefault}
                  onChange={(e) => setEditIsDefault(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="edit-is-default" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Set as default resume for new applications
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditResume(null)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Phase 16: Deleting a resume must NOT delete jobs) */}
      <ConfirmationModal
        isOpen={!!resumeToDelete}
        title={`Delete "${resumeToDelete?.name}"?`}
        message="This will remove the resume file from this device. Any past job applications linked to this resume will be preserved (their resume link will simply be unassigned)."
        confirmText="Delete Profile"
        isDestructive={true}
        onConfirm={async () => {
          if (resumeToDelete) {
            await deleteResume(resumeToDelete.id);
            setResumeToDelete(null);
            showToast('Resume profile deleted. Linked job applications preserved.', 'info');
          }
        }}
        onCancel={() => setResumeToDelete(null)}
      />

      {/* AI Privacy Notice Modal (Phase 11) */}
      {showPrivacyDialog && (
        <div
          id="ai-privacy-dialog"
          onClick={() => setShowPrivacyDialog(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                AI Privacy Notice
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Your resume data is stored privately on your device. AI analysis will securely process extracted text to provide personalized improvement suggestions. Continue?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowPrivacyDialog(false);
                  setPendingAIAction(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setPrivacyConsentGiven(true);
                  setShowPrivacyDialog(false);
                  if (pendingAIAction) {
                    pendingAIAction();
                    setPendingAIAction(null);
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
