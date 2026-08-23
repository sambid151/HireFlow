import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Trash2,
  ShieldCheck,
  Mail,
  User,
  Moon,
  Sun,
  Laptop,
  Check,
  Plus,
  Edit2,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';
import { useHireFlow } from '../../context/HireFlowContext';
import { FollowUpTemplate } from '../../types';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportDataJson,
    exportDataCsv,
    importDataJson,
    loadDemoWorkspace,
    clearAllData,
    showToast,
  } = useHireFlow();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form state
  const [userFullName, setUserFullName] = useState(settings.userFullName ?? '');
  const [defaultFollowUpDays, setDefaultFollowUpDays] = useState(settings.defaultFollowUpDays || 7);
  const [weeklyTarget, setWeeklyTarget] = useState(settings.weeklyTarget || 8);
  const [themeMode, setThemeMode] = useState<'system' | 'light' | 'dark'>(settings.themeMode || 'system');

  // Keep form fields in sync when settings are loaded or updated from IndexedDB
  useEffect(() => {
    setUserFullName(settings.userFullName ?? '');
    setDefaultFollowUpDays(settings.defaultFollowUpDays || 7);
    setWeeklyTarget(settings.weeklyTarget || 8);
    setThemeMode(settings.themeMode || 'system');
    setTemplates(settings.followUpTemplates || []);
  }, [settings]);

  // Follow-up Template Editor
  const [templates, setTemplates] = useState<FollowUpTemplate[]>(
    settings.followUpTemplates || []
  );
  const [editingTemplate, setEditingTemplate] = useState<FollowUpTemplate | null>(null);

  // Clear confirmation
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      userFullName: userFullName.trim(),
      defaultFollowUpDays,
      weeklyTarget,
      themeMode,
      followUpTemplates: templates,
    });
    showToast('Preferences saved successfully!', 'success');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = await importDataJson(content);
        if (success) {
          showToast('Workspace backup restored successfully!', 'success');
        } else {
          showToast('Invalid backup file format.', 'error');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveTemplate = async (updated: FollowUpTemplate) => {
    const nextTemplates = templates.map((t) => (t.id === updated.id ? updated : t));
    setTemplates(nextTemplates);
    await updateSettings({ followUpTemplates: nextTemplates });
    setEditingTemplate(null);
    showToast(`Template "${updated.name}" updated!`, 'success');
  };

  return (
    <div id="settings-view" className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Settings & Data Management
          </h1>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
            Private & Secure
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Configure personal details, follow-up templates, and workspace data backups.
        </p>
      </div>

      {/* Privacy Notice Card */}
      <div className="p-5 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 flex items-start gap-3.5">
        <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-emerald-950 dark:text-emerald-200">
          <h3 className="font-bold text-sm">100% Private Device Storage Guarantee</h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            HireFlow keeps all jobs, resumes, notes, interview records, and email drafts completely private on your device. No third-party servers, tracking, or external databases receive your career data.
          </p>
        </div>
      </div>

      {/* Profile & Search Preferences */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            <span>Profile & Search Defaults</span>
          </h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Your Full Name (used in email signatures)
              </label>
              <input
                type="text"
                value={userFullName}
                onChange={(e) => setUserFullName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Default Follow-up Cadence (days)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={defaultFollowUpDays}
                onChange={(e) => setDefaultFollowUpDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Weekly Application Goal
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={weeklyTarget}
                onChange={(e) => setWeeklyTarget(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Appearance Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'system', label: 'System', icon: Laptop },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setThemeMode(t.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                      themeMode === t.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>

      {/* Follow-up Email Templates Customizer */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-600" />
              <span>Automated Follow-up Templates</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize standard templates for post-application follow-ups, thank you notes, and check-ins.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {tpl.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                    +{tpl.defaultDaysAfter}d
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {tpl.subject}
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(tpl)}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Customize Template</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Backup & Restore */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-600" />
              <span>Backup, Import & Reset</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Export your full workspace into a portable JSON backup file or restore previously saved data.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 pt-2">
          {/* Export CSV */}
          <button
            onClick={exportDataCsv}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-left space-y-2 transition cursor-pointer group"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Export Applications (CSV)
              </span>
              <span className="text-[11px] text-slate-500">
                Spreadsheet ready for Excel & Google Sheets.
              </span>
            </div>
          </button>

          {/* Export JSON */}
          <button
            onClick={exportDataJson}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-left space-y-2 transition cursor-pointer group"
          >
            <Download className="w-5 h-5 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Export JSON Backup
              </span>
              <span className="text-[11px] text-slate-500">
                Download all jobs, resumes, and notes.
              </span>
            </div>
          </button>

          {/* Import */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-left space-y-2 transition cursor-pointer"
          >
            <Upload className="w-5 h-5 text-blue-600" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Import Backup File
              </span>
              <span className="text-[11px] text-slate-500">
                Restore from a hireflow-backup.json file.
              </span>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </button>

          {/* Load Demo Data */}
          <button
            onClick={() => setIsDemoModalOpen(true)}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-left space-y-2 transition cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                Load Demo Workspace
              </span>
              <span className="text-[11px] text-slate-500">
                Populate 8 realistic jobs & resumes.
              </span>
            </div>
          </button>

          {/* Clear All Data */}
          <button
            onClick={() => setIsClearModalOpen(true)}
            className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/60 text-left space-y-2 transition cursor-pointer"
          >
            <Trash2 className="w-5 h-5 text-rose-600" />
            <div>
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300 block">
                Clear All Data
              </span>
              <span className="text-[11px] text-rose-600/70 dark:text-rose-400/70">
                Permanently erase workspace data.
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Edit Template: {editingTemplate.name}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Line (Supports {'{{company}}'}, {'{{role}}'}, etc.)
                </label>
                <input
                  type="text"
                  value={editingTemplate.subject}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, subject: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Body Template
                </label>
                <textarea
                  rows={8}
                  value={editingTemplate.body}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, body: e.target.value })
                  }
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 leading-relaxed font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveTemplate(editingTemplate)}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation */}
      <ConfirmationModal
        isOpen={isClearModalOpen}
        title="Erase All Workspace Data?"
        message="This will wipe all tracked jobs, resumes, interviews, goals, and history from this device. Be sure you have exported a JSON backup if you wish to keep your records."
        confirmLabel="Wipe Everything"
        onConfirm={async () => {
          await clearAllData();
          setIsClearModalOpen(false);
          showToast('Workspace wiped successfully.', 'warning');
        }}
        onCancel={() => setIsClearModalOpen(false)}
      />

      {/* Demo Load Confirmation */}
      <ConfirmationModal
        isOpen={isDemoModalOpen}
        title="Load Demo Workspace?"
        message="This will populate 8 high-signal job applications, multiple resume profiles, scheduled interviews, and real conversion metrics."
        confirmLabel="Load Demo Data"
        onConfirm={async () => {
          await loadDemoWorkspace();
          setIsDemoModalOpen(false);
          showToast('Loaded demo workspace!', 'success');
        }}
        onCancel={() => setIsDemoModalOpen(false)}
      />
    </div>
  );
};
