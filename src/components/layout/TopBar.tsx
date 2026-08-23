import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Sparkles,
  Command,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useHireFlow } from '../../context/HireFlowContext';

export const TopBar: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    setIsCommandPaletteOpen,
    attentionItems,
    isDemoWorkspace,
    loadDemoWorkspace,
    clearWorkspace,
    settings,
    setActiveTab,
  } = useHireFlow();

  const [isAttentionOpen, setIsAttentionOpen] = useState(false);
  const attentionRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attentionRef.current && !attentionRef.current.contains(event.target as Node)) {
        setIsAttentionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const urgentCount = attentionItems.length;

  return (
    <header
      id="app-topbar"
      className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-4 transition-colors duration-200"
    >
      {/* Search Bar / Command Palette Trigger */}
      <div className="flex-1 max-w-md">
        <div
          onClick={() => setIsCommandPaletteOpen(true)}
          className="group relative flex items-center w-full px-3.5 py-2 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 rounded-xl cursor-pointer transition-all duration-150 shadow-2xs"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 mr-2.5 shrink-0 transition-colors" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Search roles, companies, skills, recruiters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
          />
          <div className="hidden sm:flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-mono font-medium text-slate-600 dark:text-slate-300 shadow-2xs shrink-0">
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Demo Workspace Helper Toggle */}
        {isDemoWorkspace ? (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Demo Workspace</span>
            <button
              onClick={clearWorkspace}
              className="ml-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Reset
            </button>
          </div>
        ) : (
          <button
            onClick={loadDemoWorkspace}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Load Demo Data</span>
          </button>
        )}

        {/* Attention / Notification Bell */}
        <div className="relative" ref={attentionRef}>
          <button
            id="topbar-attention-btn"
            onClick={() => setIsAttentionOpen((prev) => !prev)}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 transition cursor-pointer"
            title="Needs Attention"
            aria-label="Attention Center"
          >
            <Bell className="w-4 h-4" />
            {urgentCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs animate-in zoom-in">
                {urgentCount}
              </span>
            )}
          </button>

          {/* Attention Center Dropdown */}
          {isAttentionOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Needs Your Attention</span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  {urgentCount} action{urgentCount === 1 ? '' : 's'}
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto p-2 space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/40">
                {attentionItems.length === 0 ? (
                  <div className="py-6 px-4 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Pipeline is clear!</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      No overdue follow-ups or stale applications right now.
                    </p>
                  </div>
                ) : (
                  attentionItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setIsAttentionOpen(false);
                        item.onAction();
                      }}
                      className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{item.subtitle}</span>
                          </p>
                        </div>
                        <button className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-2 py-1 rounded-md shrink-0 transition">
                          {item.actionText}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  onClick={() => {
                    setIsAttentionOpen(false);
                    setActiveTab('applications');
                  }}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition cursor-pointer"
                >
                  View all in Track Applications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Initials Avatar */}
        <div
          onClick={() => setActiveTab('settings')}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 cursor-pointer transition"
          title="Account / Settings"
        >
          {settings.userFullName?.trim() ? (
            settings.userFullName
              .trim()
              .split(/\s+/)
              .map((n) => n[0])
              .filter(Boolean)
              .join('')
              .toUpperCase()
              .slice(0, 2) || 'HF'
          ) : (
            'HF'
          )}
        </div>
      </div>
    </header>
  );
};
