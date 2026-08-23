import React from 'react';
import { LayoutDashboard, Kanban, FileText, CalendarCheck, BarChart3, Plus } from 'lucide-react';
import { useHireFlow } from '../../context/HireFlowContext';
import { ViewTab } from '../../types';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab, setIsAddJobOpen, jobs } = useHireFlow();

  const activeCount = jobs.filter((j) => ['wishlist', 'applied', 'follow-up', 'interview'].includes(j.status)).length;

  const items: { id: ViewTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'applications', label: 'Track Apps', icon: Kanban, badge: activeCount || undefined },
    { id: 'resumes', label: 'Resumes', icon: FileText },
    { id: 'interviews', label: 'Interviews', icon: CalendarCheck },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 px-2 flex items-center justify-around"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[11px] font-medium transition cursor-pointer ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : ''}`} />
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}

      {/* Floating Add for Mobile */}
      <button
        onClick={() => setIsAddJobOpen(true, false)}
        className="fixed bottom-20 right-5 w-13 h-13 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
        aria-label="Add Job"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>
    </nav>
  );
};
