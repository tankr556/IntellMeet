import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { useAuthStore } from '../store/useAuthStore';
import { BarChart2, Download, Table, ChevronDown, CheckCircle2, Circle, AlertTriangle, Calendar } from 'lucide-react';

interface MemberActivity {
  name: string;
  tasksDone: number;
  tasksTotal: number;
  meetingsAttended: number;
  actionItemsOwned: number;
}

export const AnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<'4 weeks' | '8 weeks' | '12 weeks'>('8 weeks');
  const [fromDate, setFromDate] = useState('2026-08-17');
  const [toDate, setToDate] = useState('2026-10-05');
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [showTable, setShowTable] = useState<{ [key: string]: boolean }>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);
  const currentUserDisplayName = user?.name || 'Rakesh Tank';

  // Read real-time kanban tasks from localStorage
  const [kanbanTasks, setKanbanTasks] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('intellmeet_kanban_tasks');
    if (saved) {
      try {
        setKanbanTasks(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Dynamic metrics calculation based on Period selection
  const periodMultiplier = period === '4 weeks' ? 0.5 : period === '12 weeks' ? 1.5 : 1;

  const totalMeetings = Math.round(23 * periodMultiplier);
  const totalActionItems = Math.round(53 * periodMultiplier);
  const doneActionItems = Math.round(35 * periodMultiplier);
  const openActionItems = Math.round(8 * periodMultiplier);
  const overdueActionItems = totalActionItems - doneActionItems - openActionItems;

  const donePct = Math.round((doneActionItems / totalActionItems) * 100);
  const openPct = Math.round((openActionItems / totalActionItems) * 100);
  const overduePct = 100 - donePct - openPct;

  const handlePeriodChange = (newPeriod: '4 weeks' | '8 weeks' | '12 weeks') => {
    setPeriod(newPeriod);
    if (newPeriod === '4 weeks') {
      setFromDate('2026-09-07');
    } else if (newPeriod === '8 weeks') {
      setFromDate('2026-08-17');
    } else {
      setFromDate('2026-07-20');
    }
    triggerToast(`Analytics updated for ${newPeriod}`);
  };

  const toggleTable = (cardId: string) => {
    setShowTable((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const handleExport = (format: 'CSV' | 'JSON' | 'PDF') => {
    setExportDropdownOpen(false);

    const exportData = {
      period,
      fromDate,
      toDate,
      metrics: {
        totalMeetings,
        timeInMeetings: '13 h 35 min',
        attendance: '3.6 people per meeting',
        actionItemsDone: `${donePct}%`,
        doneCount: doneActionItems,
        totalActionItems,
        tasksCompletedRate: '71%',
      },
      weeklyMeetings: meetingsWeeklyData,
      memberActivities,
      exportedAt: new Date().toISOString(),
    };

    if (format === 'CSV') {
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        'Metric,Value\n' +
        `Period,${period}\n` +
        `From Date,${fromDate}\n` +
        `To Date,${toDate}\n` +
        `Total Meetings,${totalMeetings}\n` +
        'Time in meetings,13 h 35 min\n' +
        'Attendance,3.6 people per meeting\n' +
        `Action items done,${donePct}%\n` +
        `Tasks completed,71%\n`;

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `intellmeet_analytics_${period.replace(' ', '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast(`Analytics exported as CSV successfully!`);
    } else if (format === 'JSON') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const link = document.createElement('a');
      link.setAttribute('href', dataStr);
      link.setAttribute('download', `intellmeet_analytics_${period.replace(' ', '_')}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast(`Analytics exported as JSON successfully!`);
    } else if (format === 'PDF') {
      // Build a clean, valid binary PDF 1.4 specification document
      const pdfTitle = `INTELLMEET ANALYTICS REPORT (${period})`;
      const pdfMeta = `Date Range: ${fromDate} to ${toDate} | Exported: ${new Date().toLocaleDateString()}`;
      
      const pdfContentLines = [
        `%PDF-1.4`,
        `1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj`,
        `2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj`,
        `3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources <</Font <</F1 4 0 R /F2 5 0 R>>>> /Contents 6 0 R>> endobj`,
        `4 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold>> endobj`,
        `5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj`,
      ];

      const streamText = [
        `BT`,
        `/F1 20 Tf 40 800 Td (${pdfTitle}) Tj`,
        `/F2 10 Tf 0 -22 Td (${pdfMeta}) Tj`,
        `0 -30 Td (--------------------------------------------------------------------------------) Tj`,
        `/F1 13 Tf 0 -25 Td (1. SUMMARY METRICS) Tj`,
        `/F2 11 Tf 0 -20 Td (Total Meetings:        ${totalMeetings} meetings) Tj`,
        `0 -18 Td (Time in Meetings:      13 h 35 min on average) Tj`,
        `0 -18 Td (Attendance Rate:       3.6 people per meeting) Tj`,
        `0 -18 Td (Action Items Done:     ${donePct}% (${doneActionItems} of ${totalActionItems})) Tj`,
        `0 -18 Td (Tasks Completed:       71% (12 of 17 tasks)) Tj`,
        `0 -30 Td (--------------------------------------------------------------------------------) Tj`,
        `/F1 13 Tf 0 -25 Td (2. MEETINGS PER WEEK) Tj`,
        `/F2 11 Tf`,
        ...meetingsWeeklyData.map(m => `0 -18 Td (${m.label.padEnd(20)} : ${m.value} meetings) Tj`),
        `0 -30 Td (--------------------------------------------------------------------------------) Tj`,
        `/F1 13 Tf 0 -25 Td (3. TEAM MEMBER ACTIVITY) Tj`,
        `/F2 11 Tf`,
        ...memberActivities.map(m => `0 -18 Td (${m.name.padEnd(20)} | Attended: ${m.meetingsAttended} | Tasks: ${m.tasksDone}/${m.tasksTotal}) Tj`),
        `0 -40 Td (Report generated automatically by IntellMeet AI Platform) Tj`,
        `ET`
      ].join('\n');

      const streamObj = `6 0 obj <</Length ${streamText.length}>> stream\n${streamText}\nendstream endobj`;
      const xrefOffset = pdfContentLines.join('\n').length + 1 + streamObj.length;

      const pdfFullBinary = [
        ...pdfContentLines,
        streamObj,
        `xref`,
        `0 7`,
        `0000000000 65535 f`,
        `0000000009 00000 n`,
        `0000000056 00000 n`,
        `0000000111 00000 n`,
        `0000000234 00000 n`,
        `0000000305 00000 n`,
        `0000000371 00000 n`,
        `trailer <</Size 7 /Root 1 0 R>>`,
        `startxref`,
        `${xrefOffset}`,
        `%%EOF`
      ].join('\n');

      const blob = new Blob([pdfFullBinary], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `intellmeet_analytics_${period.replace(' ', '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerToast(`Analytics exported as PDF successfully!`);
    }
  };

  // Dynamic Chart line coordinates based on selected Period
  const meetingsWeeklyData =
    period === '4 weeks'
      ? [
          { label: 'Sep 14', value: 4 },
          { label: 'Sep 21', value: 4 },
          { label: 'Sep 28', value: 4 },
          { label: 'Oct 5', value: 0 },
        ]
      : period === '12 weeks'
      ? [
          { label: 'Jul 20', value: 2 },
          { label: 'Jul 27', value: 3 },
          { label: 'Aug 3', value: 3 },
          { label: 'Aug 10', value: 4 },
          { label: 'Aug 17', value: 3 },
          { label: 'Aug 24', value: 4 },
          { label: 'Aug 31', value: 1 },
          { label: 'Sep 7', value: 3 },
          { label: 'Sep 14', value: 4 },
          { label: 'Sep 21', value: 4 },
          { label: 'Sep 28', value: 4 },
          { label: 'Oct 5', value: 0 },
        ]
      : [
          { label: 'Aug 17', value: 3 },
          { label: 'Aug 24', value: 4 },
          { label: 'Aug 31', value: 1 },
          { label: 'Sep 7', value: 3 },
          { label: 'Sep 14', value: 4 },
          { label: 'Sep 21', value: 4 },
          { label: 'Sep 28', value: 4 },
          { label: 'Oct 5', value: 0 },
        ];

  // Dynamic Stacked Bar chart data
  const stackedBarData =
    period === '4 weeks'
      ? [
          { week: 'Sep 14', done: 7, notDone: 4 },
          { week: 'Sep 21', done: 2, notDone: 10 },
          { week: 'Sep 28', done: 1, notDone: 11 },
          { week: 'Oct 5', done: 0, notDone: 0 },
        ]
      : [
          { week: 'Aug 17', done: 5, notDone: 0 },
          { week: 'Aug 24', done: 8, notDone: 0 },
          { week: 'Aug 31', done: 2, notDone: 0 },
          { week: 'Sep 7', done: 5, notDone: 1 },
          { week: 'Sep 14', done: 6, notDone: 3 },
          { week: 'Sep 21', done: 7, notDone: 4 },
          { week: 'Sep 28', done: 2, notDone: 10 },
          { week: 'Oct 5', done: 0, notDone: 0 },
        ];

  // Team member activity dataset
  const memberActivities: MemberActivity[] = [
    { name: 'Grace Hopper', tasksDone: 3, tasksTotal: 4, meetingsAttended: 21, actionItemsOwned: 16 },
    { name: 'Alan Turing', tasksDone: 5, tasksTotal: 7, meetingsAttended: 20, actionItemsOwned: 13 },
    { name: 'Ada Lovelace', tasksDone: 2, tasksTotal: 3, meetingsAttended: 20, actionItemsOwned: 12 },
    { name: currentUserDisplayName, tasksDone: Math.max(2, kanbanTasks.filter((t) => t.status === 'Done').length), tasksTotal: Math.max(3, kanbanTasks.length || 3), meetingsAttended: 19, actionItemsOwned: 12 },
  ];

  return (
    <div className="min-h-screen w-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-800 dark:text-slate-100 flex font-sans antialiased overflow-hidden transition-colors relative">
      <Sidebar activePage="Analytics" />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#F8FAFC] dark:bg-[#090D16]">
        <Header />

        <main className="p-8 max-w-6xl w-full mx-auto space-y-6 flex-1 pb-16">
          {/* Header Title & Subtitle */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Analytics</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Meeting time, attendance and follow-through for IntellMeet Team.
            </p>
          </div>

          {/* Top Controls Bar (Period, From, To, Export CSV) */}
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-wrap items-center gap-6">
              {/* Period Filter */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 dark:text-slate-400 mb-1">Period</label>
                <div className="bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-1 rounded-xl flex items-center space-x-1 text-xs">
                  {(['4 weeks', '8 weeks', '12 weeks'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePeriodChange(p)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                        period === p
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* From Input */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 dark:text-slate-400 mb-1">From</label>
                <div
                  onClick={(e) => {
                    const input = e.currentTarget.querySelector('input');
                    input?.showPicker?.();
                  }}
                  className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-1.5 shadow-2xs focus-within:border-indigo-500 cursor-pointer group hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="bg-transparent text-xs font-mono text-slate-800 dark:text-slate-200 outline-none cursor-pointer w-28 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
                  />
                  <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform ml-1 pointer-events-none shrink-0" />
                </div>
              </div>

              {/* To Input */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 dark:text-slate-400 mb-1">To</label>
                <div
                  onClick={(e) => {
                    const input = e.currentTarget.querySelector('input');
                    input?.showPicker?.();
                  }}
                  className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-1.5 shadow-2xs focus-within:border-indigo-500 cursor-pointer group hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="bg-transparent text-xs font-mono text-slate-800 dark:text-slate-200 outline-none cursor-pointer w-28 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
                  />
                  <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform ml-1 pointer-events-none shrink-0" />
                </div>
              </div>
            </div>

            {/* Export CSV Button dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 transition shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>Export CSV</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              </button>

              {exportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 overflow-hidden py-1">
                  <button
                    onClick={() => handleExport('CSV')}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => handleExport('JSON')}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Export JSON
                  </button>
                  <button
                    onClick={() => handleExport('PDF')}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Export PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            {fromDate} to {toDate}, weeks starting Monday (Asia/Calcutta).
          </p>

          {/* 5 KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-2xs space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Meetings</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white transition-all">{totalMeetings}</div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">in {period}</span>
            </div>

            <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-2xs space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Time in meetings</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">13 h</div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">35 min on average</span>
            </div>

            <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-2xs space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Attendance</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">3.6</div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">people per meeting</span>
            </div>

            <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-2xs space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Action items done</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white transition-all">{donePct}%</div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{doneActionItems} of {totalActionItems}, {overdueActionItems} overdue</span>
            </div>

            <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-2xs space-y-1">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tasks completed</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">71%</div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">12 of 17 tasks created</span>
            </div>
          </div>

          {/* Main Chart Section: Meetings per week */}
          <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl shadow-2xs space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Meetings per week</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {totalMeetings} meetings over {period}, {(totalMeetings / (period === '4 weeks' ? 4 : period === '8 weeks' ? 8 : 12)).toFixed(1)} a week on average.
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleTable('meetingsPerWeek')}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium flex items-center space-x-1.5 shrink-0 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-900/50"
              >
                <Table className="w-3.5 h-3.5" />
                <span>{showTable['meetingsPerWeek'] ? 'Hide table' : 'Show table'}</span>
              </button>
            </div>

            {showTable['meetingsPerWeek'] ? (
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
                  <thead className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
                    <tr>
                      <th className="pb-2.5 font-semibold">Week of</th>
                      <th className="pb-2.5 font-semibold text-center">Meetings</th>
                      <th className="pb-2.5 font-semibold text-center">Time</th>
                      <th className="pb-2.5 font-semibold text-center">Average length</th>
                      <th className="pb-2.5 font-semibold text-right">People per meeting</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {meetingsWeeklyData.map((d) => {
                      const timeStr = d.value === 0 ? '0 min' : d.value === 1 ? '40 min' : `${(d.value * 0.6).toFixed(1)} h`;
                      const avgLen = d.value === 0 ? '-' : `${30 + d.value * 3} min`;
                      const people = d.value === 0 ? '-' : (3 + (d.value % 2 === 0 ? 0.3 : 1)).toString();
                      return (
                        <tr key={d.label} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                          <td className="py-2.5 font-bold text-slate-900 dark:text-white">{d.label}</td>
                          <td className="py-2.5 text-center text-slate-800 dark:text-slate-200">{d.value}</td>
                          <td className="py-2.5 text-center text-slate-800 dark:text-slate-200">{timeStr}</td>
                          <td className="py-2.5 text-center text-slate-400 dark:text-slate-400">{avgLen}</td>
                          <td className="py-2.5 text-right text-slate-800 dark:text-slate-200">{people}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="pt-4 pb-2 space-y-4">
                <div className="relative h-60 w-full">
                  <div className="absolute inset-0 flex flex-col justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium pointer-events-none">
                    <div className="flex items-center space-x-3"><span className="w-3 text-right">4</span><div className="w-full border-b border-slate-100 dark:border-slate-800/80"></div></div>
                    <div className="flex items-center space-x-3"><span className="w-3 text-right">3</span><div className="w-full border-b border-slate-100 dark:border-slate-800/80"></div></div>
                    <div className="flex items-center space-x-3"><span className="w-3 text-right">2</span><div className="w-full border-b border-slate-100 dark:border-slate-800/80"></div></div>
                    <div className="flex items-center space-x-3"><span className="w-3 text-right">1</span><div className="w-full border-b border-slate-100 dark:border-slate-800/80"></div></div>
                    <div className="flex items-center space-x-3"><span className="w-3 text-right">0</span><div className="w-full border-b border-slate-100 dark:border-slate-800/80"></div></div>
                  </div>

                  <div className="absolute left-7 right-0 top-0 bottom-0">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
                      <polyline
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={
                          meetingsWeeklyData.length === 4
                            ? "0,0 233,0 466,0 700,200"
                            : "0,50 100,0 200,150 300,50 400,0 500,0 600,0 700,200"
                        }
                      />
                      {meetingsWeeklyData.map((m, idx) => {
                        const step = 700 / (meetingsWeeklyData.length - 1);
                        const cx = idx * step;
                        const cy = (4 - m.value) * 50;
                        return (
                          <circle key={m.label} cx={cx} cy={cy} r="4" className="fill-[#3B82F6] stroke-white dark:stroke-slate-900 stroke-2 cursor-pointer hover:r-6 transition-all" />
                        );
                      })}
                    </svg>
                  </div>
                </div>

                <div className="flex justify-between left-7 right-0 pl-7 text-[11px] text-slate-400 font-medium">
                  {meetingsWeeklyData.map((m) => (
                    <span key={m.label}>{m.label}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4 Bottom Widgets Grid (Restored!) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Action items: raised and done */}
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl shadow-2xs space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Action items: raised and done</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {doneActionItems} of {totalActionItems} action items raised in this period are done ({donePct}%).
                  </p>
                </div>
                <button
                  onClick={() => toggleTable('raisedAndDone')}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium flex items-center space-x-1 shrink-0 cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>{showTable['raisedAndDone'] ? 'Hide table' : 'Show table'}</span>
                </button>
              </div>

              {showTable['raisedAndDone'] ? (
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
                    <thead className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
                      <tr>
                        <th className="pb-2.5 font-semibold">Week of</th>
                        <th className="pb-2.5 font-semibold text-center">Raised</th>
                        <th className="pb-2.5 font-semibold text-center">Done</th>
                        <th className="pb-2.5 font-semibold text-right">Not done yet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {stackedBarData.map((w) => (
                        <tr key={w.week} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                          <td className="py-2.5 font-bold text-slate-900 dark:text-white">{w.week}</td>
                          <td className="py-2.5 text-center text-slate-800 dark:text-slate-200">{w.done + w.notDone}</td>
                          <td className="py-2.5 text-center text-slate-800 dark:text-slate-200">{w.done}</td>
                          <td className="py-2.5 text-right text-slate-800 dark:text-slate-200">{w.notDone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="pt-4 space-y-4">
                  <div className="h-44 w-full flex items-end justify-between px-2 gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
                    {stackedBarData.map((w) => {
                      const doneHeight = (w.done / 12) * 140;
                      const notDoneHeight = (w.notDone / 12) * 140;

                      return (
                        <div key={w.week} className="flex-1 flex flex-col items-center group">
                          <div className="w-full max-w-[24px] flex flex-col justify-end items-center rounded-t overflow-hidden">
                            {w.notDone > 0 && (
                              <div
                                style={{ height: `${notDoneHeight}px` }}
                                className="w-full bg-slate-400/80 dark:bg-slate-600/80 rounded-t-xs"
                                title={`Not done: ${w.notDone}`}
                              />
                            )}
                            {w.done > 0 && (
                              <div
                                style={{ height: `${doneHeight}px` }}
                                className="w-full bg-blue-500 rounded-t-xs"
                                title={`Done: ${w.done}`}
                              />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                            {w.week}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Done</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400/80 dark:bg-slate-600/80 inline-block" />
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Not done yet</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: What became of the action items */}
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl shadow-2xs space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">What became of the action items</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Of {totalActionItems} action items: {doneActionItems} done, {openActionItems} still open and {overdueActionItems} overdue.
                  </p>
                </div>
                <button
                  onClick={() => toggleTable('becameOfItems')}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium flex items-center space-x-1 shrink-0 cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>{showTable['becameOfItems'] ? 'Show chart' : 'Show table'}</span>
                </button>
              </div>

              {showTable['becameOfItems'] ? (
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
                    <thead className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
                      <tr>
                        <th className="pb-2.5 font-semibold">Outcome</th>
                        <th className="pb-2.5 font-semibold text-center">Action items</th>
                        <th className="pb-2.5 font-semibold text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        <td className="py-2.5 font-bold text-slate-900 dark:text-white">Done</td>
                        <td className="py-2.5 text-center text-slate-800 dark:text-slate-200">{doneActionItems}</td>
                        <td className="py-2.5 text-right text-slate-800 dark:text-slate-200">{donePct}%</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        <td className="py-2.5 font-bold text-slate-900 dark:text-white">Open</td>
                        <td className="py-2.5 text-center text-slate-800 dark:text-slate-200">{openActionItems}</td>
                        <td className="py-2.5 text-right text-slate-800 dark:text-slate-200">{openPct}%</td>
                      </tr>
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                        <td className="py-2.5 font-bold text-slate-900 dark:text-white">Overdue</td>
                        <td className="py-2.5 text-center text-slate-800 dark:text-slate-200">{overdueActionItems}</td>
                        <td className="py-2.5 text-right text-slate-800 dark:text-slate-200">{overduePct}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="pt-2 flex items-center justify-around h-48">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="transparent"
                        stroke="#22C55E"
                        strokeWidth="4"
                        strokeDasharray={`${(donePct * 88) / 100} 88`}
                        strokeDashoffset="0"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="transparent"
                        stroke="#475569"
                        strokeWidth="4"
                        strokeDasharray={`${(openPct * 88) / 100} 88`}
                        strokeDashoffset={`-${(donePct * 88) / 100}`}
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="transparent"
                        stroke="#EF4444"
                        strokeWidth="4"
                        strokeDasharray={`${(overduePct * 88) / 100} 88`}
                        strokeDashoffset={`-${((donePct + openPct) * 88) / 100}`}
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                        {totalActionItems}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        action items
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs font-semibold">
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-slate-800 dark:text-slate-200 w-14">Done</span>
                      <span className="text-slate-900 dark:text-white font-bold w-6">{doneActionItems}</span>
                      <span className="text-slate-400 dark:text-slate-500 text-[11px]">{donePct}%</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Circle className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-800 dark:text-slate-200 w-14">Open</span>
                      <span className="text-slate-900 dark:text-white font-bold w-6">{openActionItems}</span>
                      <span className="text-slate-400 dark:text-slate-500 text-[11px]">{openPct}%</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="text-slate-800 dark:text-slate-200 w-14">Overdue</span>
                      <span className="text-slate-900 dark:text-white font-bold w-6">{overdueActionItems}</span>
                      <span className="text-slate-400 dark:text-slate-500 text-[11px]">{overduePct}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card 3: Task completion by member */}
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl shadow-2xs space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Task completion by member</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Grace Hopper finished the largest share of their tasks: 3 of 4 (75%). Across the team: 12 of 17 tasks (71%).
                  </p>
                </div>
                <button
                  onClick={() => toggleTable('completionByMember')}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium flex items-center space-x-1 shrink-0 cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>{showTable['completionByMember'] ? 'Show chart' : 'Show table'}</span>
                </button>
              </div>

              {showTable['completionByMember'] ? (
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
                    <thead className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
                      <tr>
                        <th className="pb-2.5 font-semibold">Member</th>
                        <th className="pb-2.5 font-semibold text-center">Tasks</th>
                        <th className="pb-2.5 font-semibold text-center">Done</th>
                        <th className="pb-2.5 font-semibold text-right">Completion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {memberActivities.map((m) => (
                        <tr key={m.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                          <td className="py-2.5 font-bold text-slate-900 dark:text-white">{m.name}</td>
                          <td className="py-2.5 text-center text-slate-800 dark:text-slate-200">{m.tasksTotal}</td>
                          <td className="py-2.5 text-center text-slate-800 dark:text-slate-200">{m.tasksDone}</td>
                          <td className="py-2.5 text-right text-slate-800 dark:text-slate-200">{Math.round((m.tasksDone / m.tasksTotal) * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="pt-2 space-y-4">
                  {memberActivities.map((m) => {
                    const pct = Math.round((m.tasksDone / m.tasksTotal) * 100);
                    return (
                      <div key={m.name} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-medium">
                          <span className="text-slate-700 dark:text-slate-300">{m.name}</span>
                          <span className="text-slate-900 dark:text-white font-bold">{pct}% ({m.tasksDone}/{m.tasksTotal})</span>
                        </div>
                        <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex">
                          <div style={{ width: `${pct}%` }} className="bg-blue-500 h-full rounded-lg transition-all" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Card 4: Most active members */}
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl shadow-2xs space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Most active members</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Grace Hopper was the most active: 21 meetings attended, 16 action items owned and 3 tasks completed.
                  </p>
                </div>
                <button
                  onClick={() => toggleTable('mostActiveMembers')}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium flex items-center space-x-1 shrink-0 cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>{showTable['mostActiveMembers'] ? 'Show chart' : 'Show table'}</span>
                </button>
              </div>

              {showTable['mostActiveMembers'] ? (
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
                    <thead className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
                      <tr>
                        <th className="pb-2.5 font-semibold">Member</th>
                        <th className="pb-2.5 font-semibold text-center">Meetings attended</th>
                        <th className="pb-2.5 font-semibold text-center">Hosted</th>
                        <th className="pb-2.5 font-semibold text-center">Time in meetings</th>
                        <th className="pb-2.5 font-semibold text-center">Action items owned</th>
                        <th className="pb-2.5 font-semibold text-right">Tasks completed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {memberActivities.map((m, idx) => (
                        <tr key={m.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                          <td className="py-2.5 font-bold text-slate-900 dark:text-white">{m.name}</td>
                          <td className="py-2.5 text-center text-slate-800 dark:text-slate-200">{m.meetingsAttended}</td>
                          <td className="py-2.5 text-center text-slate-800 dark:text-slate-200">{idx + 2}</td>
                          <td className="py-2.5 text-center text-slate-800 dark:text-slate-200">13 h</td>
                          <td className="py-2.5 text-center text-slate-800 dark:text-slate-200">{m.actionItemsOwned}</td>
                          <td className="py-2.5 text-right text-slate-800 dark:text-slate-200">{m.tasksDone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="pt-2 space-y-4">
                  {memberActivities.map((m) => {
                    const totalScore = m.meetingsAttended + m.actionItemsOwned + m.tasksDone;
                    const meetingWidth = (m.meetingsAttended / 45) * 100;
                    const actionWidth = (m.actionItemsOwned / 45) * 100;
                    const taskWidth = (m.tasksDone / 45) * 100;

                    return (
                      <div key={m.name} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-medium">
                          <span className="text-slate-700 dark:text-slate-300">{m.name}</span>
                          <span className="text-slate-900 dark:text-white font-bold">{totalScore}</span>
                        </div>
                        <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex">
                          <div style={{ width: `${meetingWidth}%` }} className="bg-blue-500 h-full" title={`Meetings: ${m.meetingsAttended}`} />
                          <div style={{ width: `${actionWidth}%` }} className="bg-amber-600 dark:bg-orange-500 h-full" title={`Action items: ${m.actionItemsOwned}`} />
                          <div style={{ width: `${taskWidth}%` }} className="bg-emerald-500 h-full" title={`Tasks completed: ${m.tasksDone}`} />
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Meetings attended</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-600 dark:bg-orange-500 inline-block" />
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Action items owned</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Tasks completed</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
