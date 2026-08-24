import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  ExternalLink,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Trash2,
  Edit2,
  Sparkles,
} from 'lucide-react';
import { Interview, InterviewResult } from '../../types';
import { useHireFlow } from '../../context/HireFlowContext';
import { createGoogleCalendarUrl, getDaysAgo } from '../../utils';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { Button } from '../common/Button';

export const InterviewCenterView: React.FC = () => {
  const {
    interviews,
    jobs,
    addInterview,
    updateInterview,
    deleteInterview,
    showToast,
  } = useHireFlow();

  const [filterResult, setFilterResult] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [interviewToDelete, setInterviewToDelete] = useState<Interview | null>(null);

  // Form states
  const [jobId, setJobId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [round, setRound] = useState('Technical Screening');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('11:00');
  const [interviewer, setInterviewer] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<InterviewResult>('scheduled');

  const openAddModal = () => {
    setEditingInterview(null);
    setJobId(jobs[0]?.id || '');
    setCompanyName(jobs[0]?.companyName || '');
    setJobTitle(jobs[0]?.jobTitle || '');
    setRound('Technical Screening');
    setDate(new Date().toISOString().split('T')[0]);
    setTime('11:00');
    setInterviewer('');
    setMeetingUrl('');
    setNotes('');
    setResult('scheduled');
    setIsModalOpen(true);
  };

  const openEditModal = (int: Interview) => {
    setEditingInterview(int);
    setJobId(int.jobId || '');
    setCompanyName(int.companyName);
    setJobTitle(int.jobTitle);
    setRound(int.round);
    setDate(int.date);
    setTime(int.time || '11:00');
    setInterviewer(int.interviewer || '');
    setMeetingUrl(int.meetingUrl || '');
    setNotes(int.notes || '');
    setResult(int.result);
    setIsModalOpen(true);
  };

  const handleJobSelect = (selectedId: string) => {
    setJobId(selectedId);
    const matched = jobs.find((j) => j.id === selectedId);
    if (matched) {
      setCompanyName(matched.companyName);
      setJobTitle(matched.jobTitle);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !round.trim()) return;

    if (editingInterview) {
      await updateInterview({
        ...editingInterview,
        jobId: jobId || undefined,
        companyName: companyName.trim(),
        jobTitle: jobTitle.trim() || 'Software Engineer',
        round: round.trim(),
        date,
        time,
        interviewer: interviewer.trim() || undefined,
        meetingUrl: meetingUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        result,
      });
      showToast('Interview round updated!', 'success');
    } else {
      await addInterview({
        jobId: jobId || undefined,
        companyName: companyName.trim(),
        jobTitle: jobTitle.trim() || 'Software Engineer',
        round: round.trim(),
        date,
        time,
        interviewer: interviewer.trim() || undefined,
        meetingUrl: meetingUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        result,
      });
      showToast('New interview round scheduled!', 'success');
    }
    setIsModalOpen(false);
  };

  const filteredInterviews = interviews.filter((i) => {
    if (filterResult === 'all') return true;
    return i.result === filterResult;
  });

  const scheduledCount = interviews.filter((i) => i.result === 'scheduled').length;
  const passedCount = interviews.filter((i) => i.result === 'passed').length;

  return (
    <div id="interview-center-view" className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Interview Center
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              {scheduledCount} upcoming
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track interview stages, schedule deep links, and prepare talking points.
          </p>
        </div>

        <Button
          id="interviews-primary-schedule-btn"
          onClick={openAddModal}
          icon={Plus}
          size="md"
          variant="emerald"
          className="self-start sm:self-auto"
        >
          Schedule Interview
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: `All Rounds (${interviews.length})` },
            { id: 'scheduled', label: `Upcoming (${scheduledCount})` },
            { id: 'passed', label: `Passed (${passedCount})` },
            { id: 'failed', label: 'Archived' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterResult(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterResult === tab.id
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interview Cards Grid */}
      {filteredInterviews.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
          <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No interview rounds found
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Schedule upcoming recruiter screens, system design rounds, and hiring manager chats.
          </p>
          <Button
            onClick={openAddModal}
            icon={Plus}
            size="md"
            variant="purple"
            className="mt-4"
          >
            Schedule First Interview
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInterviews.map((int) => {
            const daysAgo = getDaysAgo(int.date);
            const isToday = daysAgo === 0;
            const isTomorrow = daysAgo === -1;
            const isFuture = (daysAgo ?? 0) < 0;

            const timeLabel = isToday
              ? 'Today'
              : isTomorrow
              ? 'Tomorrow'
              : isFuture
              ? `In ${Math.abs(daysAgo || 0)} days`
              : `${daysAgo} days ago`;

            const gCal = createGoogleCalendarUrl({
              title: `Interview: ${int.companyName} (${int.round})`,
              description: int.notes,
              location: int.meetingUrl,
              startDate: int.date,
              startTime: int.time,
            });

            return (
              <div
                key={int.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {int.companyName}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            int.result === 'passed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : int.result === 'failed'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          }`}
                        >
                          {int.result}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{int.jobTitle}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(int)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setInterviewToDelete(int)}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Round & Date Badge */}
                  <div className="mt-3 p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                      <span>{int.round}</span>
                      <span className="text-purple-700 dark:text-purple-300 font-mono">
                        {timeLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span>
                        {int.date} at {int.time || '10:00 AM'}
                      </span>
                    </div>

                    {int.interviewer && (
                      <p className="text-xs text-slate-500">Interviewer: {int.interviewer}</p>
                    )}
                  </div>

                  {/* Notes / Prep */}
                  {int.notes && (
                    <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                      <span className="font-semibold block mb-0.5 text-slate-700 dark:text-slate-300">
                        Prep Notes:
                      </span>
                      <p className="leading-relaxed">{int.notes}</p>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {int.meetingUrl ? (
                      <a
                        href={int.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Join Call</span>
                      </a>
                    ) : null}

                    <a
                      href={gCal}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition flex items-center gap-1"
                      title="Add to Google Calendar"
                    >
                      <Calendar className="w-3.5 h-3.5 text-purple-600" />
                      <span>Calendar</span>
                    </a>
                  </div>

                  {/* Quick Outcome Toggle */}
                  <select
                    value={int.result}
                    onChange={async (e) => {
                      await updateInterview({ ...int, result: e.target.value as InterviewResult });
                    }}
                    className="px-2 py-1 text-[11px] font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="passed">Passed ✓</option>
                    <option value="failed">Archived</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Interview Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingInterview ? 'Edit Interview Round' : 'Schedule Interview Round'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Linked Job selector */}
              {jobs.length > 0 && !editingInterview && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Application
                  </label>
                  <select
                    value={jobId}
                    onChange={(e) => handleJobSelect(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  >
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.companyName} — {j.jobTitle}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
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
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Interview Round Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Technical Screening / System Design / HM Call"
                  value={round}
                  onChange={(e) => setRound(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Interviewer Name & Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rachel Adams (Director of Engineering)"
                  value={interviewer}
                  onChange={(e) => setInterviewer(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Meeting URL
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Prep Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="System design scenarios, behavioral stories..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
                >
                  Save Interview
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={interviewToDelete !== null}
        title="Delete Interview Round?"
        message={`Are you sure you want to delete ${interviewToDelete?.companyName} (${interviewToDelete?.round})?`}
        confirmLabel="Delete Round"
        onConfirm={async () => {
          if (interviewToDelete) {
            await deleteInterview(interviewToDelete.id);
            setInterviewToDelete(null);
          }
        }}
        onCancel={() => setInterviewToDelete(null)}
      />
    </div>
  );
};
