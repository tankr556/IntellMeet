import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { useAuthStore } from '../store/useAuthStore';
import { Video, Calendar, Hash } from 'lucide-react';
import api from '../api/apiClient';

export const LobbyPage: React.FC = () => {
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('IntellMeet Demo Team');
  const [scheduleForLater, setScheduleForLater] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [meetingIdInput, setMeetingIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);

  // Recent meetings stored locally so newly created meeting appears immediately (limit to last 5)
  const [recentMeetings, setRecentMeetings] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('user_created_meetings') || '[]');
    const defaultMeetings = [
      { id: '1', title: 'Design review: meeting summary page', date: 'Sep 23, 2026, 4:30 PM' },
      { id: '2', title: 'Design critique: the board on a phone', date: 'Sep 23, 2026, 3:30 PM' },
      { id: '3', title: 'Weekly product sync', date: 'Sep 22, 2026, 2:00 PM' },
      { id: '4', title: 'Sprint 14 planning', date: 'Sep 21, 2026, 3:00 PM' },
    ];
    return [...saved, ...defaultMeetings].slice(0, 5);
  });

  const handleStartNow = async (e: React.FormEvent) => {
    e.preventDefault();
    const titleToUse = meetingTitle.trim() || 'Weekly sync';

    if (scheduleForLater) {
      const formattedDate = scheduledDateTime
        ? new Date(scheduledDateTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true })
        : 'Scheduled for later';

      const newMeetingItem = {
        id: 'meeting_' + Date.now(),
        title: titleToUse,
        date: formattedDate,
        status: 'Upcoming',
      };

      setRecentMeetings((prev) => [newMeetingItem, ...prev].slice(0, 5));

      const savedMeetings = JSON.parse(localStorage.getItem('user_created_meetings') || '[]');
      localStorage.setItem('user_created_meetings', JSON.stringify([newMeetingItem, ...savedMeetings]));

      setShowNewMeetingModal(false);
      setMeetingTitle('');
      setScheduledDateTime('');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/meetings', { title: titleToUse });
      const createdMeeting = res.data.meeting;

      const newMeetingItem = {
        id: createdMeeting._id,
        title: titleToUse,
        date: 'Just now',
        status: 'Live',
      };
      setRecentMeetings((prev) => [newMeetingItem, ...prev]);

      const savedMeetings = JSON.parse(localStorage.getItem('user_created_meetings') || '[]');
      localStorage.setItem('user_created_meetings', JSON.stringify([newMeetingItem, ...savedMeetings]));

      setShowNewMeetingModal(false);
      navigate(`/room/${createdMeeting._id}`);
    } catch (err) {
      console.error('Error creating meeting:', err);
      const fallbackRoomId = 'XVCMQMM';
      const newMeetingItem = {
        id: fallbackRoomId,
        title: titleToUse,
        date: 'Just now',
        status: 'Live',
      };
      setRecentMeetings((prev) => [newMeetingItem, ...prev]);
      const savedMeetings = JSON.parse(localStorage.getItem('user_created_meetings') || '[]');
      localStorage.setItem('user_created_meetings', JSON.stringify([newMeetingItem, ...savedMeetings]));

      setShowNewMeetingModal(false);
      navigate(`/room/${fallbackRoomId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    let codeToUse = meetingIdInput.trim() || 'T6G59G3';
    if (codeToUse.includes('/room/')) {
      codeToUse = codeToUse.split('/room/').pop()?.split('?')[0] || codeToUse;
    }
    navigate(`/room/${codeToUse}`);
  };

  return (
    <div className="min-h-screen w-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-800 dark:text-slate-100 flex font-sans antialiased overflow-hidden transition-colors relative">
      {/* 1. LIGHT/DARK THEME NAVIGATION SIDEBAR */}
      <Sidebar activePage="Dashboard" />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#F8FAFC] dark:bg-[#090D16]">
        {/* Top Header Navbar with Theme Dropdown */}
        <Header />

        {/* Dashboard Main Workspace */}
        <main className="p-8 max-w-5xl w-full mx-auto space-y-8 flex-1">
          {/* Welcome Header */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Welcome back, {user?.name || 'Maple'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Start a meeting, join with a code, or pick up where your team left off.
            </p>
          </div>

          {/* Action Cards Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* 1. Start a Meeting Card */}
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-2xl shadow-xs hover:shadow-md transition flex flex-col justify-between min-h-[170px]">
              <div>
                <div className="flex items-center space-x-2.5 text-slate-900 dark:text-white font-bold text-base mb-1">
                  <Video className="w-5 h-5 text-[#4F46E5] dark:text-indigo-400" />
                  <h2>Start a meeting</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Start now or schedule for later. Everyone in the team you pick is notified.
                </p>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewMeetingModal(true)}
                  className="bg-[#4F46E5] hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition shadow-xs cursor-pointer"
                >
                  <Video className="w-4 h-4 text-white" />
                  <span>New meeting</span>
                </button>
              </div>
            </div>

            {/* 2. Join with a Code Card */}
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-2xl shadow-xs hover:shadow-md transition flex flex-col justify-between min-h-[170px]">
              <div>
                <div className="flex items-center space-x-2.5 text-slate-900 dark:text-white font-bold text-base mb-1">
                  <Calendar className="w-5 h-5 text-[#4F46E5] dark:text-indigo-400" />
                  <h2>Join with a code</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  The 7-character room code, or the whole meeting link. A team's 8-character invite code works here too.
                </p>
              </div>

              <form onSubmit={handleJoinMeeting} className="mt-5 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="T6G59G3"
                  value={meetingIdInput}
                  onChange={(e) => setMeetingIdInput(e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-hidden transition"
                />
                <button
                  type="submit"
                  className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold px-4 py-2 rounded-xl text-xs transition shadow-2xs"
                >
                  Join
                </button>
              </form>
            </div>
          </div>

          {/* Recent Meetings Section */}
          <div className="space-y-4 pt-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent meetings</h2>

            <div className="space-y-3">
              {recentMeetings.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/summary/${item.id}`)}
                  className="bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer shadow-2xs"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                    {item.title}
                  </span>

                  <div className="flex items-center space-x-3 text-xs shrink-0">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-md text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                      <Hash className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                      <span>Summary ready</span>
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-[11px] font-medium">
                      ended
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                      {item.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* NEW MEETING MODAL (MATCHING USER SCREENSHOT 2) */}
      {showNewMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">New meeting</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Meetings belong to a team - everyone in it can join and is notified when it starts.
                </p>
              </div>
              <button
                onClick={() => setShowNewMeetingModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStartNow} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Team
                </label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 transition cursor-pointer"
                >
                  <option value="IntellMeet Demo Team">IntellMeet Demo Team</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Weekly sync"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="w-full bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-2xs"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="scheduleCheck"
                  checked={scheduleForLater}
                  onChange={(e) => setScheduleForLater(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="scheduleCheck" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  Schedule for later
                </label>
              </div>

              {scheduleForLater && (
                <div className="pt-1">
                  <input
                    type="datetime-local"
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    style={{ colorScheme: 'dark' }}
                    className="w-full bg-white dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 transition shadow-2xs font-sans"
                  />
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewMeetingModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#090D16] hover:bg-slate-200 dark:hover:bg-slate-800 border border-transparent dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#4F46E5] hover:bg-indigo-600 text-white font-semibold rounded-xl text-xs flex items-center space-x-2 transition shadow-sm cursor-pointer"
                >
                  {scheduleForLater ? (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Schedule</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4" />
                      <span>{loading ? 'Starting...' : 'Start now'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
