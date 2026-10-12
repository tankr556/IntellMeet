import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Video, Search, Hash, Calendar } from 'lucide-react';
import api from '../api/apiClient';

export const MeetingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'All' | 'Upcoming' | 'Live' | 'Past'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // New Meeting Modal States
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('IntellMeet Demo Team');
  const [scheduleForLater, setScheduleForLater] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  const [meetings, setMeetings] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('user_created_meetings') || '[]');
    const defaultMeetings = [
      {
        id: '1',
        title: 'Design review: meeting summary page',
        date: 'Sep 23, 2026, 4:30 PM',
        duration: '25 min',
        attendees: 4,
        summary:
          'The team reviewed two layouts for the meeting summary page and chose the tabbed design, with action items placed right after the summary and before the transcript...',
        decisions: 2,
        actionItems: 3,
        openItems: 3,
        status: 'Ended',
      },
      {
        id: '2',
        title: 'Design critique: the board on a phone',
        date: 'Sep 23, 2026, 3:30 PM',
        duration: '36 min',
        attendees: 4,
        summary:
          'On phones the board scrolls sideways one column at a time. Dragging needs a long press, so that a swipe still scrolls.',
        decisions: 1,
        actionItems: 2,
        openItems: 1,
        status: 'Ended',
      },
      {
        id: '3',
        title: 'Weekly product sync & roadmap review',
        date: 'Oct 12, 2026, 10:00 AM',
        duration: '45 min',
        attendees: 5,
        summary: 'Upcoming team meeting to review Q4 deliverables, AI action extraction, and sprint targets.',
        decisions: 0,
        actionItems: 0,
        openItems: 0,
        status: 'Upcoming',
      },
      {
        id: '4',
        title: 'Sprint demo & AI intelligence spike',
        date: 'Oct 5, 2026, 4:00 PM',
        duration: 'Live now',
        attendees: 3,
        summary: 'Live meeting in progress with real-time audio transcription and chat extraction.',
        decisions: 1,
        actionItems: 2,
        openItems: 2,
        status: 'Live',
      },
    ];

    const formattedSaved = saved.map((item: any) => ({
      id: item.id,
      title: item.title,
      date: item.date || 'Just now',
      duration: item.status === 'Upcoming' ? 'Scheduled' : 'Just started',
      attendees: 1,
      summary: item.status === 'Upcoming' ? `Scheduled for ${item.date}` : 'Meeting in progress or recently ended. AI summary and key takeaways will generate upon conclusion.',
      decisions: 0,
      actionItems: 0,
      openItems: 0,
      status: item.status || 'Live',
    }));

    return [...formattedSaved, ...defaultMeetings];
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

      const saved = JSON.parse(localStorage.getItem('user_created_meetings') || '[]');
      localStorage.setItem('user_created_meetings', JSON.stringify([newMeetingItem, ...saved]));
      
      setMeetings((prev) => [{
        id: newMeetingItem.id,
        title: titleToUse,
        date: formattedDate,
        duration: 'Scheduled',
        attendees: 1,
        summary: `Scheduled meeting for team ${selectedTeam}.`,
        decisions: 0,
        actionItems: 0,
        openItems: 0,
        status: 'Upcoming',
      }, ...prev]);

      setShowNewMeetingModal(false);
      setScheduleForLater(false);
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

      const saved = JSON.parse(localStorage.getItem('user_created_meetings') || '[]');
      localStorage.setItem('user_created_meetings', JSON.stringify([newMeetingItem, ...saved]));

      setShowNewMeetingModal(false);
      navigate(`/room/${createdMeeting._id}`);
    } catch (err) {
      console.error('Error starting meeting:', err);
      const fallbackRoomId = 'XVCMQMM';
      const newMeetingItem = {
        id: fallbackRoomId,
        title: titleToUse,
        date: 'Just now',
        status: 'Live',
      };
      const saved = JSON.parse(localStorage.getItem('user_created_meetings') || '[]');
      localStorage.setItem('user_created_meetings', JSON.stringify([newMeetingItem, ...saved]));

      setShowNewMeetingModal(false);
      navigate(`/room/${fallbackRoomId}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredMeetings = meetings.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.summary.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'All') return true;
    if (activeTab === 'Upcoming') return m.status === 'Upcoming';
    if (activeTab === 'Live') return m.status === 'Live';
    if (activeTab === 'Past') return m.status === 'Ended' || m.status === 'Past';

    return true;
  });

  return (
    <div className="min-h-screen w-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-800 dark:text-slate-100 flex font-sans antialiased overflow-hidden transition-colors relative">
      <Sidebar activePage="Meetings" />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#F8FAFC] dark:bg-[#090D16]">
        <Header />

        <main className="p-8 max-w-5xl w-full mx-auto space-y-6 flex-1">
          {/* Header Title & New Meeting Button */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
                <span>Meetings</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Every meeting in your teams. Search finds words in titles, summaries and transcripts.
              </p>
            </div>

            <button
              onClick={() => setShowNewMeetingModal(true)}
              className="bg-[#4F46E5] hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-sm transition cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>New meeting</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search titles, summaries and transcripts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-indigo-500 transition shadow-2xs"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-1 border-b border-slate-200 dark:border-slate-800 pb-2">
            {(['All', 'Upcoming', 'Live', 'Past'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === tab
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="text-xs font-medium text-slate-400 dark:text-slate-500">{filteredMeetings.length} meetings</div>

          {/* Meetings List */}
          <div className="space-y-4">
            {filteredMeetings.length === 0 ? (
              <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl mx-auto flex items-center justify-center text-xl">
                  📅
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  No {activeTab.toLowerCase()} meetings
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {activeTab === 'Upcoming'
                    ? 'There are no scheduled upcoming meetings right now. Click "New meeting" to schedule one for later.'
                    : activeTab === 'Live'
                    ? 'No live meetings in progress right now. Click "New meeting" to start an instant live meeting.'
                    : activeTab === 'Past'
                    ? 'No past completed meetings found.'
                    : 'No meetings matched your search query.'}
                </p>
              </div>
            ) : (
              filteredMeetings.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/summary/${item.id}`)}
                  className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-2xs hover:shadow-md transition cursor-pointer space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">{item.title}</h3>
                      <div className="flex items-center space-x-3 text-xs text-slate-400 dark:text-slate-500 mt-1">
                        <span>{item.date}</span>
                        <span>•</span>
                        <span>{item.duration}</span>
                        <span>•</span>
                        <span>{item.attendees} attended</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md text-[11px] font-semibold">
                        {item.status}
                      </span>
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-md text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                        <Hash className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                        <span>Summary ready</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.summary}</p>

                  <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>{item.decisions} decisions</span>
                    <span>•</span>
                    <span>{item.actionItems} action items, {item.openItems} open</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* NEW MEETING MODAL */}
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
