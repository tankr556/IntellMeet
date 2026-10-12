import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { ArrowLeft, Copy, Download, Hash, CheckSquare, MessageSquare, Video, FileText, ChevronDown, Check, X, Calendar as CalendarIcon, User, Search } from 'lucide-react';
import api from '../api/apiClient';

interface ActionItem {
  _id?: string;
  task: string;
  assigneeName: string;
  dueDateGuess: string;
  status: 'To Do' | 'In Progress' | 'Review' | 'Done';
}

interface SummaryData {
  summaryText: string;
  keyTakeaways: string[];
  actionItems: ActionItem[];
}

export const PostMeetingDashboardPage: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const getNormalizedTab = (tabStr: string | null): 'summary' | 'action-items' | 'transcript' | 'chat' | 'recording' => {
    if (tabStr === 'actions' || tabStr === 'action-items') return 'action-items';
    if (tabStr === 'transcript' || tabStr === 'chat' || tabStr === 'recording') return tabStr;
    return 'summary';
  };

  const [activeTab, setActiveTab] = useState<'summary' | 'action-items' | 'transcript' | 'chat' | 'recording'>(
    getNormalizedTab(searchParams.get('tab'))
  );

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [transcriptSearch, setTranscriptSearch] = useState('');

  // Modal State for "Create Task" popup (Matching Screenshot 2)
  const [modalTaskItem, setModalTaskItem] = useState<ActionItem | null>(null);
  const [modalAssignee, setModalAssignee] = useState('Ada Lovelace');
  const [modalDueDate, setModalDueDate] = useState('2026-10-01');

  // Real-time stored data from live room session
  const [realtimeChats, setRealtimeChats] = useState<{ senderName: string; text: string; timestamp: string }[]>([]);
  const [realtimeTranscripts, setRealtimeTranscripts] = useState<{ speakerName: string; text: string; timestamp: string }[]>([]);
  const [hasRealtimeRecording, setHasRealtimeRecording] = useState(false);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    setActiveTab(getNormalizedTab(tabFromUrl));
  }, [searchParams]);

  useEffect(() => {
    // Load real-time stored session data if available
    const savedChats = localStorage.getItem(`room_chat_${meetingId}`);
    if (savedChats) {
      setRealtimeChats(JSON.parse(savedChats));
    }

    const savedTranscripts = localStorage.getItem(`room_transcript_${meetingId}`);
    if (savedTranscripts) {
      setRealtimeTranscripts(JSON.parse(savedTranscripts));
    }

    const savedRec = localStorage.getItem(`room_has_recording_${meetingId}`);
    if (savedRec === 'true') {
      setHasRealtimeRecording(true);
    }

    fetchSummary();
  }, [meetingId]);

  const fetchSummary = async () => {
    try {
      const res = await api.get(`/ai/summary/${meetingId || 'demo'}`);
      setSummary(res.data.summary);
    } catch (err) {
      console.error('Error fetching summary:', err);
      
      const savedTranscripts = localStorage.getItem(`room_transcript_${meetingId}`);
      let generatedSummaryText = 'The team reviewed design prototypes, component accessibility, and upcoming usability sessions during this real-time session.';
      
      if (savedTranscripts) {
        const parsed: { text: string }[] = JSON.parse(savedTranscripts);
        if (parsed.length > 0) {
          generatedSummaryText = `During the live meeting, the team discussed: "${parsed.map(p => p.text).join('; ')}". Action items and takeaways were updated in real-time.`;
        }
      }

      setSummary({
        summaryText: generatedSummaryText,
        keyTakeaways: [
          'Use the tabbed layout (option B), with action items right after the summary and before the transcript',
          'Ship a copy-summary button in the first version; PDF export comes later',
        ],
        actionItems: [
          { task: 'Prototype the tabbed summary page layout', assigneeName: 'Alan Turing', dueDateGuess: 'Fri, Oct 2', status: 'Review' },
          { task: 'Check the colour contrast of the status badges', assigneeName: 'Ada Lovelace', dueDateGuess: 'Thu, Oct 1', status: 'To Do' },
          { task: 'Run five usability sessions on the prototype', assigneeName: 'Grace Hopper', dueDateGuess: 'Wed, Oct 7', status: 'To Do' },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: 'summary' | 'action-items' | 'transcript' | 'chat' | 'recording') => {
    setActiveTab(tab);
    if (tab === 'summary') {
      searchParams.delete('tab');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ tab: tab === 'action-items' ? 'actions' : tab });
    }
  };

  const handleCopySummary = () => {
    if (!summary) return;
    const textToCopy = `Summary:\n${summary.summaryText}\n\nKey Decisions:\n${summary.keyTakeaways.map(t => `- ${t}`).join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const exportSummaryAsMarkdown = () => {
    if (!summary) return;
    let mdContent = `# Design review: meeting summary page\n`;
    mdContent += `*Sep 30, 2026, 4:30 PM | Duration: 25 min*\n\n`;
    mdContent += `## Summary\n${summary.summaryText}\n\n`;
    mdContent += `## Key Decisions\n`;
    summary.keyTakeaways.forEach((t) => {
      mdContent += `- ${t}\n`;
    });
    mdContent += `\n## Action Items\n`;
    summary.actionItems.forEach((a) => {
      mdContent += `- [ ] **${a.task}** (Assignee: ${a.assigneeName}, Due: ${a.dueDateGuess})\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meeting_summary_${meetingId || '1'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const exportSummaryAsPDF = () => {
    if (!summary) return;

    const sanitize = (str: string) => str.replace(/[\(\)\\]/g, ' ');

    const lines: string[] = [
      'BT',
      '/F1 16 Tf',
      '50 740 Td',
      '(Design review: meeting summary page) Tj',
      '/F1 10 Tf',
      '0 -25 Td',
      '(Date: Sep 30, 2026, 4:30 PM | Duration: 25 min | IntellMeet AI Summary) Tj',
      '0 -35 Td',
      '/F1 12 Tf',
      '(SUMMARY:) Tj',
      '/F1 10 Tf',
      '0 -18 Td',
      `(${sanitize(summary.summaryText.slice(0, 100))}) Tj`,
      '0 -15 Td',
      `(${sanitize(summary.summaryText.slice(100, 200))}) Tj`,
      '0 -30 Td',
      '/F1 12 Tf',
      '(KEY DECISIONS:) Tj',
      '/F1 10 Tf',
      ...summary.keyTakeaways.map((t) => `0 -18 Td\n(- ${sanitize(t)}) Tj`),
      '0 -30 Td',
      '/F1 12 Tf',
      '(ACTION ITEMS:) Tj',
      '/F1 10 Tf',
      ...summary.actionItems.map(
        (a) => `0 -18 Td\n(- ${sanitize(a.task)} | Assignee: ${sanitize(a.assigneeName)} | Due: ${sanitize(a.dueDateGuess)}) Tj`
      ),
      'ET',
    ];

    const streamContent = lines.join('\n');
    const streamLength = streamContent.length;

    const pdfData = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000242 00000 n 
0000000318 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${400 + streamLength}
%%EOF`;

    const blob = new Blob([pdfData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meeting_summary_${meetingId || '1'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const openCreateTaskModal = (item: ActionItem) => {
    setModalTaskItem(item);
    setModalAssignee(item.assigneeName);
    setModalDueDate('2026-10-01');
  };

  const handleCreateTaskSubmit = () => {
    if (!modalTaskItem) return;

    // Get current stored Kanban tasks
    const existingTasksJson = localStorage.getItem('intellmeet_kanban_tasks');
    let existingTasks = [];
    if (existingTasksJson) {
      try {
        existingTasks = JSON.parse(existingTasksJson);
      } catch (e) {}
    }

    const newTask = {
      _id: 'task_' + Date.now(),
      title: modalTaskItem.task,
      assigneeName: modalAssignee === 'Ada Lovelace' ? 'AL' : modalAssignee === 'Alan Turing' ? 'AT' : 'GH',
      assigneeFullName: modalAssignee,
      status: 'To Do',
      priority: 'High',
      dueDate: modalDueDate,
      boardName: 'Product board',
      creatorName: 'Demo User',
      createdAt: new Date().toLocaleString(),
      description: 'Created from AI Action items',
      comments: [],
    };

    localStorage.setItem('intellmeet_kanban_tasks', JSON.stringify([newTask, ...existingTasks]));

    // Update status in local state
    setSummary((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        actionItems: prev.actionItems.map((a) =>
          a.task === modalTaskItem.task ? { ...a, status: 'To Do' } : a
        ),
      };
    });

    setModalTaskItem(null);
    navigate('/tasks');
  };

  return (
    <div className="min-h-screen w-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-800 dark:text-slate-100 flex font-sans antialiased overflow-hidden transition-colors relative">
      <Sidebar activePage="Meetings" />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#F8FAFC] dark:bg-[#090D16]">
        <Header />

        <main className="p-8 max-w-5xl w-full mx-auto space-y-6 flex-1">
          {/* Back Button */}
          <div>
            <button
              onClick={() => navigate('/meetings')}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center space-x-1 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All meetings</span>
            </button>
          </div>

          {/* Title & Badge Header */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Design review: meeting summary page
              </h1>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-md text-slate-700 dark:text-slate-300 font-semibold text-xs">
                <Hash className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                <span>Summary ready</span>
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Layout and priorities for the page people see after a meeting.
            </p>

            <div className="flex items-center space-x-4 text-xs text-slate-400 dark:text-slate-500 pt-1">
              <span>📅 Sep 30, 2026, 4:30 PM</span>
              <span>⏱️ 25 min</span>
              <span>👥 Demo User, Ada Lovelace, Grace Hopper, Alan Turing</span>
            </div>
          </div>

          {/* Action Buttons: Copy Summary & Export */}
          <div className="flex items-center space-x-3 pt-1 relative">
            <button
              onClick={handleCopySummary}
              className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl flex items-center space-x-2 transition shadow-2xs cursor-pointer"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSummary ? 'Copied!' : 'Copy summary'}</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showExportMenu && (
                <div className="absolute left-0 mt-2 w-44 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <button
                    onClick={exportSummaryAsMarkdown}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Markdown (.md)</span>
                  </button>
                  <button
                    onClick={exportSummaryAsPDF}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center space-x-2 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>PDF (.pdf)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="bg-slate-200/60 dark:bg-slate-900/80 p-1 rounded-xl inline-flex items-center space-x-1 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <button
              onClick={() => handleTabChange('summary')}
              className={`px-4 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'summary'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => handleTabChange('action-items')}
              className={`px-4 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'action-items'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Action items</span>
              <span className="bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full">
                3
              </span>
            </button>
            <button
              onClick={() => handleTabChange('transcript')}
              className={`px-4 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'transcript'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Transcript
            </button>
            <button
              onClick={() => handleTabChange('chat')}
              className={`px-4 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => handleTabChange('recording')}
              className={`px-4 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'recording'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Recording
            </button>
          </div>

          {/* Tab Content Display */}
          {loading ? (
            <div className="text-center py-20 text-slate-400 text-xs animate-pulse">Loading meeting intelligence details...</div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'summary' && (
                <>
                  {/* Summary Card */}
                  <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-3">
                    <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
                      <Hash className="w-4 h-4 text-indigo-500" />
                      <h3>Summary</h3>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                      {summary?.summaryText}
                    </p>
                  </div>

                  {/* Key Decisions Card */}
                  <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-3">
                    <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
                      <span className="text-indigo-500">⚖️</span>
                      <h3>Key decisions</h3>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                      {summary?.keyTakeaways.map((decision, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-slate-400">•</span>
                          <span>{decision}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Footer note */}
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 space-y-1 pt-2">
                    <p>ⓘ Sample meeting: this is the hand-written reference the AI is evaluated against.</p>
                    <p>Only the host, Demo User, can correct the summary and action items.</p>
                  </div>
                </>
              )}

              {/* ACTION ITEMS TAB (MATCHING USER SCREENSHOT 1 & 2 EXACLY!) */}
              {activeTab === 'action-items' && (
                <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
                      <CheckSquare className="w-4.5 h-4.5 text-indigo-500" />
                      <span>Action items</span>
                      <span className="text-xs font-medium text-slate-400">3 open of 3</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate('/tasks')}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 border border-slate-800 transition cursor-pointer"
                    >
                      <span>📋 Create tasks for all (2)</span>
                    </button>
                  </div>

                  {/* Action Items List */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {summary?.actionItems.map((item, idx) => (
                      <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-400 dark:border-slate-500 mt-0.5 shrink-0 cursor-pointer hover:border-indigo-500 transition" />
                          <div className="space-y-1.5">
                            <p className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">{item.task}</p>
                            <div className="flex items-center space-x-3 text-[11px]">
                              <span className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-md font-semibold border border-slate-700/40">
                                {item.assigneeName}
                              </span>
                              <span className="text-slate-400 font-medium">Due {item.dueDateGuess}</span>
                            </div>
                          </div>
                        </div>

                        {item.status === 'Review' ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/tasks?task=${encodeURIComponent(item.task)}`)}
                            className="bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1 border border-slate-800 cursor-pointer shadow-2xs"
                          >
                            <span>📋 Review</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openCreateTaskModal(item)}
                            className="bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1 border border-slate-800 cursor-pointer shadow-2xs"
                          >
                            <span>📋 Create task</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'transcript' && (() => {
                const defaultTranscriptList = [
                  { time: '00:00', speakerName: 'Demo User', text: 'Okay, Alan has the new mock-ups for the meeting summary page. Alan, walk us through them.' },
                  { time: '00:11', speakerName: 'Alan Turing', text: 'Two options. Option A is one long scrolling page: summary, then decisions, then action items, then the full transcript. Option B puts those in tabs, with the summary tab open by default.' },
                  { time: '00:30', speakerName: 'Grace Hopper', text: 'From the interviews last month, the first thing people look for is their own action items. In option A they are halfway down the page.' },
                  { time: '00:45', speakerName: 'Ada Lovelace', text: 'And the transcript can be an hour long. Putting it on the same page makes everything below it unreachable on a phone.' },
                  { time: '00:58', speakerName: 'Demo User', text: "So we go with tabs. Let's go with option B, and the action items should appear above the transcript in the tab order, right after the summary." },
                  { time: '01:12', speakerName: 'Alan Turing', text: "Makes sense. I'll prototype the tabbed layout by Friday." },
                  { time: '01:19', speakerName: 'Ada Lovelace', text: 'One accessibility worry. The status badges in the mock-up, the amber for queued and the green for done, look too light on white. I doubt they pass contrast.' },
                  { time: '01:34', speakerName: 'Grace Hopper', text: 'Good call. We should test them against WCAG contrast standards before shipping.' },
                  { time: '01:45', speakerName: 'Demo User', text: "Excellent feedback everyone. Let's wrap up and get these action items scheduled." },
                ];

                const combinedTranscripts = realtimeTranscripts.length > 0
                  ? realtimeTranscripts.map((t, idx) => ({
                      time: t.timestamp || `00:${idx < 10 ? '0' + idx : idx}`,
                      speakerName: t.speakerName,
                      text: t.text,
                    }))
                  : defaultTranscriptList;

                const filtered = combinedTranscripts.filter((t) =>
                  t.speakerName.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
                  t.text.toLowerCase().includes(transcriptSearch.toLowerCase())
                );

                return (
                  <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <h3>Transcript</h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        There is no recording of this meeting, so the timestamps are for reference.
                      </p>
                    </div>

                    {/* Search Box */}
                    <div className="relative pt-1">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search the transcript"
                        value={transcriptSearch}
                        onChange={(e) => setTranscriptSearch(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-indigo-500 transition shadow-2xs"
                      />
                    </div>

                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 pt-1">
                      {filtered.length} lines
                    </div>

                    {/* Transcript Items */}
                    <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-2">
                      {filtered.map((t, idx) => (
                        <div key={idx} className="flex items-start space-x-3 text-xs">
                          <span className="font-mono text-slate-400 dark:text-slate-500 text-[11px] w-10 shrink-0 pt-0.5">
                            {t.time}
                          </span>
                          <div className="text-slate-800 dark:text-slate-200 leading-relaxed">
                            <span className="font-bold text-slate-900 dark:text-white">{t.speakerName}: </span>
                            <span>{t.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* REAL-TIME CHAT TAB */}
              {activeTab === 'chat' && (
                <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
                  <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
                    <MessageSquare className="w-4 h-4 text-indigo-500" />
                    <h3>Chat</h3>
                  </div>
                  <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
                    {realtimeChats.length > 0 ? (
                      realtimeChats.map((c, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">{c.senderName}</span>{' '}
                            <span className="text-[11px] text-slate-400">{c.timestamp}</span>
                          </div>
                          <p className="mt-1 text-slate-800 dark:text-slate-200 font-medium">{c.text}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-xs text-slate-400 dark:text-slate-500">
                        No chat messages were sent during this meeting.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'recording' && (
                <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-3">
                  <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
                    <Video className="w-4 h-4 text-indigo-500" />
                    <h3>Recording</h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {hasRealtimeRecording
                      ? 'Live meeting session audio/video recording was captured and stored successfully.'
                      : 'This meeting has a transcript but no audio - it was created from sample data.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* CREATE TASK MODAL (MATCHING USER SCREENSHOT 2 EXACLY!) */}
      {modalTaskItem && (
        <div
          onClick={() => setModalTaskItem(null)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0F172A] text-slate-100 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 relative animate-in fade-in zoom-in duration-150"
          >
            <button
              onClick={() => setModalTaskItem(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h2 className="text-base font-bold text-white">Create a task</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                It goes to the first column of the team's board. Owners and due dates start as the AI heard them; change them here if they are wrong.
              </p>
            </div>

            {/* Task Title Sub-box */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-bold text-white">{modalTaskItem.task}</h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Assignee Dropdown */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-400">Assignee</label>
                  <div className="relative">
                    <select
                      value={modalAssignee}
                      onChange={(e) => setModalAssignee(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none appearance-none cursor-pointer focus:border-indigo-500"
                    >
                      <option value="Ada Lovelace">Ada Lovelace</option>
                      <option value="Grace Hopper">Grace Hopper</option>
                      <option value="Alan Turing">Alan Turing</option>
                      <option value="Rakesh Tank">Rakesh Tank</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Due date picker */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-400">Due date</label>
                  <input
                    type="date"
                    value={modalDueDate}
                    onChange={(e) => setModalDueDate(e.target.value)}
                    onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs font-mono outline-none cursor-pointer focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex justify-end items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setModalTaskItem(null)}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2 rounded-xl text-xs transition cursor-pointer border border-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTaskSubmit}
                className="bg-[#6366F1] hover:bg-indigo-600 text-white font-semibold px-5 py-2 rounded-xl text-xs transition cursor-pointer shadow-xs"
              >
                Create task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
