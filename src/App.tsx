/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { HireFlowProvider, useHireFlow } from './context/HireFlowContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { MobileNav } from './components/layout/MobileNav';
import { ToastContainer } from './components/common/ToastContainer';
import { CommandPalette } from './components/common/CommandPalette';
import { OnboardingModal } from './components/common/OnboardingModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { ApplicationsView } from './components/applications/ApplicationsView';
import { ResumeIntelligenceView } from './components/resumes/ResumeIntelligenceView';
import { InterviewCenterView } from './components/interviews/InterviewCenterView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { GoalsView } from './components/goals/GoalsView';
import { SettingsView } from './components/settings/SettingsView';
import { JobDrawer } from './components/applications/JobDrawer';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    settings,
    isLoaded,
    isAddJobOpen,
    editingJob,
    initialJobStatus,
    quickAddMode,
    setIsAddJobOpen,
    setEditingJob,
  } = useHireFlow();

  // Apply dark mode theme class based on settings
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark =
        settings.themeMode === 'dark' ||
        (settings.themeMode === 'system' && mediaQuery.matches) ||
        (!settings.themeMode && settings.theme === 'dark');

      if (isDark) {
        root.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        root.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    };

    applyTheme();

    const handleMediaChange = () => {
      if (settings.themeMode === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, [settings.themeMode, settings.theme]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg animate-pulse">
          <span className="font-black text-xl tracking-tight">H</span>
        </div>
        <p className="text-xs font-semibold text-slate-500 animate-pulse">
          Loading workspace...
        </p>
      </div>
    );
  }

  return (
    <div id="hireflow-root" className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-150">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        {/* Top Sticky Bar */}
        <TopBar />

        {/* Dynamic View Container */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-5 pb-20 md:pb-8 max-w-full overflow-x-hidden">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'applications' && <ApplicationsView />}
          {activeTab === 'resumes' && <ResumeIntelligenceView />}
          {activeTab === 'interviews' && <InterviewCenterView />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'goals' && <GoalsView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Global Modals & Overlays */}
      <JobDrawer
        isOpen={isAddJobOpen || editingJob !== null}
        jobToEdit={editingJob}
        initialStatus={initialJobStatus}
        quickAddMode={quickAddMode}
        onClose={() => {
          setIsAddJobOpen(false, false);
          setEditingJob(null);
        }}
      />
      <ToastContainer />
      <CommandPalette />
      <OnboardingModal />
    </div>
  );
};

export default function App() {
  return (
    <HireFlowProvider>
      <MainLayout />
    </HireFlowProvider>
  );
}
