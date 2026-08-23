import React, { useState } from 'react';
import { Sparkles, FileText, Briefcase, Target, ArrowRight, Check, X } from 'lucide-react';
import { useHireFlow } from '../../context/HireFlowContext';

export const OnboardingModal: React.FC = () => {
  const {
    isOnboardingOpen,
    setIsOnboardingOpen,
    addResume,
    addJob,
    saveGoal,
    updateSettings,
    loadDemoWorkspace,
    showToast,
  } = useHireFlow();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [resumeName, setResumeName] = useState('Fullstack_Resume_2026');
  const [targetRole, setTargetRole] = useState('Senior Software Engineer');
  const [skillsStr, setSkillsStr] = useState('React, TypeScript, Node.js, PostgreSQL, AWS, Docker');

  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [status, setStatus] = useState<'wishlist' | 'applied'>('applied');

  const [weeklyTarget, setWeeklyTarget] = useState(8);

  if (!isOnboardingOpen) return null;

  const handleFinish = async () => {
    // 1. Create resume if provided
    if (resumeName.trim()) {
      const skills = skillsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const createdResume = await addResume({
        name: resumeName.trim(),
        targetRole: targetRole.trim() || 'Software Engineer',
        skills: skills.length ? skills : ['JavaScript', 'React', 'TypeScript'],
        version: '1.0',
        isDefault: true,
        notes: 'Initial resume created during setup.',
      });

      // 2. Create first job if provided
      if (companyName.trim() && jobTitle.trim()) {
        await addJob({
          companyName: companyName.trim(),
          jobTitle: jobTitle.trim(),
          status: status,
          resumeId: createdResume.id,
          dateApplied: status === 'applied' ? new Date().toISOString().split('T')[0] : undefined,
          notes: 'Added during onboarding setup.',
        });
      }
    }

    // 3. Save goal
    await saveGoal({
      id: 'weekly-primary-goal',
      type: 'applications',
      title: 'Weekly job applications',
      target: weeklyTarget,
      period: 'weekly',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    });

    await updateSettings({ onboardingCompleted: true, weeklyTarget });
    setIsOnboardingOpen(false);
    showToast("You're ready to move your applications forward!", 'success');
  };

  const handleSkip = async () => {
    await updateSettings({ onboardingCompleted: true });
    setIsOnboardingOpen(false);
  };

  const handleLoadDemo = async () => {
    await loadDemoWorkspace();
    await updateSettings({ onboardingCompleted: true });
    setIsOnboardingOpen(false);
  };

  return (
    <div
      id="onboarding-modal-backdrop"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">👋</span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Welcome to HireFlow</h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Your job search deserves a better system. Let&apos;s personalize your workspace.
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'bg-emerald-600 dark:bg-emerald-500'
                    : s < step
                    ? 'bg-emerald-300 dark:bg-emerald-800'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 space-y-4">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                <FileText className="w-4 h-4" />
                <span>Step 1: Create your first resume profile</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track which resume version yields the highest interview conversions.
              </p>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Resume Profile Name
                  </label>
                  <input
                    type="text"
                    value={resumeName}
                    onChange={(e) => setResumeName(e.target.value)}
                    placeholder="e.g. SDE_Resume_v3 or QA_Lead_Resume"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Role
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Software Engineer / SDET Lead"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Core Skills (comma separated)
                  </label>
                  <input
                    type="text"
                    value={skillsStr}
                    onChange={(e) => setSkillsStr(e.target.value)}
                    placeholder="React, TypeScript, Node.js, SQL, AWS"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                <Briefcase className="w-4 h-4" />
                <span>Step 2: Add your first opportunity</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log a role you recently applied to or have on your wishlist.
              </p>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Google, Microsoft, Stripe"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Role Title
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Current Stage
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus('applied')}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                        status === 'applied'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Applied (Submitted)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('wishlist')}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border transition cursor-pointer ${
                        status === 'wishlist'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Wishlist (Planning)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                <Target className="w-4 h-4" />
                <span>Step 3: Set your weekly momentum goal</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Setting a steady weekly pace keeps your pipeline healthy and predictable.
              </p>

              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
                <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                  {weeklyTarget}
                </span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block mt-1">
                  applications per week
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Recommended for steady interview pipeline momentum.
                </p>

                <div className="flex items-center justify-center gap-2 mt-4">
                  {[5, 8, 10, 15].map((target) => (
                    <button
                      key={target}
                      type="button"
                      onClick={() => setWeeklyTarget(target)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                        weeklyTarget === target
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {target}/wk
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-between">
          <button
            type="button"
            onClick={handleLoadDemo}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Load Demo Workspace instead</span>
          </button>

          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Launch HireFlow</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
