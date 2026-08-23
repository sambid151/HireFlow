import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  LayoutDashboard,
  Kanban,
  FileText,
  CalendarCheck,
  BarChart3,
  Target,
  Settings,
  Sun,
  Moon,
  Sparkles,
  Download,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { useHireFlow } from '../../context/HireFlowContext';
import * as db from '../../db/database';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    setActiveTab,
    setIsAddJobOpen,
    toggleTheme,
    theme,
    jobs,
    setSelectedJob,
    loadDemoWorkspace,
    showToast,
  } = useHireFlow();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isCommandPaletteOpen]);

  const staticActions = useMemo(
    () => [
      {
        id: 'action-add-job',
        title: 'Add New Job Opportunity',
        category: 'Actions',
        icon: Plus,
        shortcut: 'N',
        run: () => setIsAddJobOpen(true, false),
      },
      {
        id: 'nav-dashboard',
        title: 'Go to Dashboard',
        category: 'Navigation',
        icon: LayoutDashboard,
        run: () => setActiveTab('dashboard'),
      },
      {
        id: 'nav-applications',
        title: 'Go to Track Applications (Pipeline)',
        category: 'Navigation',
        icon: Kanban,
        run: () => setActiveTab('applications'),
      },
      {
        id: 'nav-resumes',
        title: 'Go to Resume Intelligence',
        category: 'Navigation',
        icon: FileText,
        run: () => setActiveTab('resumes'),
      },
      {
        id: 'nav-interviews',
        title: 'Go to Interviews Center',
        category: 'Navigation',
        icon: CalendarCheck,
        run: () => setActiveTab('interviews'),
      },
      {
        id: 'nav-analytics',
        title: 'Go to Analytics & Funnel',
        category: 'Navigation',
        icon: BarChart3,
        run: () => setActiveTab('analytics'),
      },
      {
        id: 'nav-goals',
        title: 'Go to Career Goals',
        category: 'Navigation',
        icon: Target,
        run: () => setActiveTab('goals'),
      },
      {
        id: 'action-toggle-theme',
        title: `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`,
        category: 'Settings',
        icon: theme === 'light' ? Moon : Sun,
        run: () => toggleTheme(),
      },
      {
        id: 'action-export-backup',
        title: 'Export Backup JSON',
        category: 'Data',
        icon: Download,
        run: async () => {
          const json = await db.exportBackup();
          const blob = new Blob([json], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `hireflow-backup-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          URL.revokeObjectURL(url);
          showToast('Backup JSON exported successfully', 'success');
        },
      },
      {
        id: 'action-demo-workspace',
        title: 'Load Realistic Demo Workspace',
        category: 'Data',
        icon: Sparkles,
        run: () => loadDemoWorkspace(),
      },
      {
        id: 'nav-settings',
        title: 'Go to Settings',
        category: 'Navigation',
        icon: Settings,
        run: () => setActiveTab('settings'),
      },
    ],
    [theme, setIsAddJobOpen, setActiveTab, toggleTheme, loadDemoWorkspace, showToast]
  );

  // Dynamic job results based on query
  const matchingJobs = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return jobs
      .filter(
        (j) =>
          j.companyName.toLowerCase().includes(q) ||
          j.jobTitle.toLowerCase().includes(q) ||
          j.recruiterName?.toLowerCase().includes(q) ||
          j.tags?.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [jobs, query]);

  const filteredActions = useMemo(() => {
    if (!query.trim()) return staticActions;
    const q = query.toLowerCase();
    return staticActions.filter(
      (a) => a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
    );
  }, [staticActions, query]);

  const allItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle?: string;
      category: string;
      icon: React.ElementType;
      shortcut?: string;
      run: () => void;
    }> = [];

    matchingJobs.forEach((j) => {
      items.push({
        id: `job-${j.id}`,
        title: `${j.companyName} — ${j.jobTitle}`,
        subtitle: `Status: ${j.status.toUpperCase()} ${j.salaryRange ? `· ${j.salaryRange}` : ''}`,
        category: 'Applications',
        icon: Building2,
        run: () => {
          setSelectedJob(j);
          setActiveTab('applications');
        },
      });
    });

    filteredActions.forEach((a) => items.push(a));

    return items;
  }, [matchingJobs, filteredActions, setSelectedJob, setActiveTab]);

  const handleSelect = (idx: number) => {
    if (allItems[idx]) {
      setIsCommandPaletteOpen(false);
      allItems[idx].run();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < allItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : allItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(selectedIndex);
    }
  };

  if (!isCommandPaletteOpen) return null;

  return (
    <div
      id="command-palette-backdrop"
      onClick={() => setIsCommandPaletteOpen(false)}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-start justify-center pt-20 sm:pt-28 p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            id="command-palette-input"
            autoFocus
            type="text"
            placeholder="Type a command, role, company or shortcut..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 text-base placeholder-slate-400 focus:outline-none"
          />
          <span className="text-[11px] font-mono font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/40">
          {allItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No matching commands or opportunities found for &quot;{query}&quot;
            </div>
          ) : (
            allItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => handleSelect(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-100 ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected
                          ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate flex items-center gap-2">
                        <span>{item.title}</span>
                        {item.category && (
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 tracking-wider">
                            · {item.category}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.shortcut && (
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {item.shortcut}
                      </span>
                    )}
                    {isSelected && <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>HireFlow OS</span>
        </div>
      </div>
    </div>
  );
};
