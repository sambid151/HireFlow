import React from 'react';
import {
  LayoutDashboard,
  Kanban,
  FileText,
  CalendarCheck,
  BarChart3,
  Target,
  Settings as SettingsIcon,
  Sun,
  Moon,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useHireFlow } from '../../context/HireFlowContext';
import { ViewTab } from '../../types';

interface NavItem {
  id: ViewTab;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
}

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    jobs,
    resumes,
    interviews,
    theme,
    toggleTheme,
    isDemoWorkspace,
    loadDemoWorkspace,
  } = useHireFlow();

  const activeCount = jobs.filter((j) => ['wishlist', 'applied', 'follow-up', 'interview'].includes(j.status)).length;
  const upcomingInterviews = interviews.filter((i) => i.result === 'scheduled').length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'applications', label: 'Track Applications', icon: Kanban, badge: activeCount || undefined },
    { id: 'resumes', label: 'Resume Intelligence', icon: FileText, badge: resumes.length || undefined },
    { id: 'interviews', label: 'Interviews', icon: CalendarCheck, badge: upcomingInterviews || undefined },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'goals', label: 'Career Goals', icon: Target },
  ];

  return (
    <aside
      id="main-sidebar"
      className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen select-none z-30 transition-colors duration-200"
    >
      {/* Brand Header */}
      <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-9 h-9 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center font-black text-lg shadow-sm shadow-emerald-500/20 group">
            <svg
              className="w-5 h-5 transition-transform group-hover:-translate-y-0.5 duration-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Minimal H + Upward Growth Arrow */}
              <path d="M4 4v16" />
              <path d="M12 4v16" />
              <path d="M4 12h8" />
              <path d="M16 12l4-4m0 0l-4-4m4 4H14" />
              <path d="M16 19l4-4" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-lg leading-tight">
                Hire<span className="text-emerald-600 dark:text-emerald-400">Flow</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded-md">
                OS
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
              Move every application forward
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation Items */}
      <div className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
          Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400 stroke-[2.3]'
                      : 'text-slate-400 dark:text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive
                      ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
          Preferences
        </div>
        <button
          id="nav-settings"
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <SettingsIcon
            className={`w-4 h-4 ${
              activeTab === 'settings'
                ? 'text-emerald-600 dark:text-emerald-400 stroke-[2.3]'
                : 'text-slate-400 dark:text-slate-400'
            }`}
          />
          <span>Settings & Backup</span>
        </button>

        {!isDemoWorkspace && jobs.length === 0 && (
          <div className="mt-4 p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 dark:text-emerald-300 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Explore Demo Workspace</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2.5 leading-relaxed">
              Instantly preview realistic applications, resumes, and interview loops.
            </p>
            <button
              onClick={loadDemoWorkspace}
              className="w-full py-1.5 px-2.5 text-xs font-semibold bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-700/60 rounded-lg hover:bg-emerald-100/50 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Load Demo Workspace
            </button>
          </div>
        )}
      </div>

      {/* Footer / Privacy & Theme Toggle */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
        {/* Privacy Badge */}
        <div
          title="Your job-search data is stored privately on your device. No account, external servers, or tracking."
          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs"
        >
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold">Private by default · Stored on your device</span>
          </div>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>

        {/* Theme and Shortcut Bar */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
            <span>Cmd+K</span>
            <span>·</span>
            <span>Palette</span>
          </div>
          <button
            id="sidebar-theme-toggle"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
