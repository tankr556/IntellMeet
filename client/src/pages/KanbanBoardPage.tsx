import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { useAuthStore } from '../store/useAuthStore';
import { LayoutGrid, Plus, Calendar, GripVertical, CheckCircle2, User, X, Lock, MessageSquare, ChevronDown } from 'lucide-react';

export interface KanbanTask {
  _id: string;
  title: string;
  assigneeName: string;
  assigneeFullName?: string;
  status: 'To Do' | 'In Progress' | 'Review' | 'Done';
  priority?: 'High' | 'Low';
  dueDate?: string;
  isOverdue?: boolean;
  boardName?: string;
  creatorName?: string;
  createdAt?: string;
  description?: string;
  comments?: { id: string; author: string; text: string; time: string }[];
}

const INITIAL_TASKS: KanbanTask[] = [
  {
    _id: '1',
    title: 'Set up a staging OAuth client for the calendar spike',
    assigneeName: 'AL',
    assigneeFullName: 'Ada Lovelace',
    status: 'To Do',
    priority: 'High',
    dueDate: 'Sat, Oct 10',
    boardName: 'Product board',
    creatorName: 'Demo User',
    createdAt: 'Sep 29, 2026, 5:32 AM',
    description: 'The spike needs a Google Cloud project with test users. Ask IT for an internal consent screen so the refresh tokens do not expire every week.',
    comments: [],
  },
  {
    _id: '2',
    title: 'Write the release notes for 1.4',
    assigneeName: 'DU',
    assigneeFullName: 'Demo User',
    status: 'To Do',
    priority: 'Low',
    dueDate: 'Mon, Oct 12',
    boardName: 'Product board',
    creatorName: 'Demo User',
    createdAt: 'Sep 28, 2026, 2:15 PM',
    description: 'Summarize all recent features, AI summary updates, and bug fixes for the 1.4 release.',
    comments: [],
  },
  {
    _id: '3',
    title: 'Fix the recording upload retry bug and merge it',
    assigneeName: 'GH',
    assigneeFullName: 'Grace Hopper',
    status: 'In Progress',
    priority: 'High',
    dueDate: 'Wed, Oct 7',
    boardName: 'Product board',
    creatorName: 'Demo User',
    createdAt: 'Sep 30, 2026, 10:11 AM',
    description: 'Ensure retry logic uses exponential backoff when S3 upload fails.',
    comments: [],
  },
  {
    _id: '4',
    title: 'Triage the accessibility audit findings',
    assigneeName: 'AT',
    assigneeFullName: 'Alan Turing',
    status: 'In Progress',
    priority: 'High',
    dueDate: 'Sat, Oct 3',
    isOverdue: true,
    boardName: 'Product board',
    creatorName: 'Demo User',
    createdAt: 'Sep 25, 2026, 11:00 AM',
    description: 'Review contrast ratios and focus outlines across all dashboard components.',
    comments: [],
  },
  {
    _id: '5',
    title: 'Prototype the tabbed summary page layout',
    assigneeName: 'AT',
    assigneeFullName: 'Alan Turing',
    status: 'Review',
    dueDate: 'Tue, Oct 6',
    boardName: 'Product board',
    creatorName: 'Demo User',
    createdAt: 'Sep 26, 2026, 4:20 PM',
    description: 'Create interactive tabs for Summary, Transcript, and Action Items.',
    comments: [],
  },
  {
    _id: '6',
    title: 'Draft the launch checklist and share it for comments',
    assigneeName: 'MC',
    assigneeFullName: 'Marie Curie',
    status: 'Done',
    dueDate: 'Fri, Oct 2',
    boardName: 'Product board',
    creatorName: 'Demo User',
    createdAt: 'Sep 20, 2026, 9:00 AM',
    description: 'Finalize production deployment checklist with DevOps.',
    comments: [],
  },
  {
    _id: '7',
    title: 'Add the long-press touch-screens',
    assigneeName: 'RT',
    assigneeFullName: 'Rakesh Tank',
    status: 'Done',
    dueDate: 'Mon, Oct 5',
    boardName: 'Product board',
    creatorName: 'Demo User',
    createdAt: 'Sep 22, 2026, 1:45 PM',
    description: 'Support touch long-press gestures to initiate card dragging on mobile devices.',
    comments: [],
  },
  {
    _id: '8',
    title: 'Build keyboard drag for the board',
    assigneeName: 'RT',
    assigneeFullName: 'Rakesh Tank',
    status: 'Done',
    dueDate: 'Mon, Sep 28',
    boardName: 'Product board',
    creatorName: 'Demo User',
    createdAt: 'Sep 18, 2026, 11:30 AM',
    description: 'Enable keyboard accessibility controls for moving cards across columns.',
    comments: [],
  },
];

export const KanbanBoardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);

  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'RT';

  const [tasks, setTasks] = useState<KanbanTask[]>(() => {
    const saved = localStorage.getItem('intellmeet_kanban_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_TASKS;
  });

  const viewParam = searchParams.get('view');
  const taskIdParam = searchParams.get('task');
  const activeTab: 'Board' | 'My tasks' = viewParam === 'mine' ? 'My tasks' : 'Board';

  // Modal Task Selection
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [newComment, setNewComment] = useState('');

  // Inline Task Creation state
  const [addingToColumn, setAddingToColumn] = useState<KanbanTask['status'] | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'High' | 'Low'>('High');
  const [assignToMe, setAssignToMe] = useState(true);

  // Drag and Drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanTask['status'] | null>(null);

  // Synchronize URL task query param with Modal
  useEffect(() => {
    if (taskIdParam) {
      const found = tasks.find(
        (t) => t._id === taskIdParam || t.title.toLowerCase().trim() === taskIdParam.toLowerCase().trim()
      );
      if (found) {
        setSelectedTask(found);
      }
    } else {
      setSelectedTask(null);
    }
  }, [taskIdParam, tasks]);

  // Persist tasks to localStorage
  useEffect(() => {
    localStorage.setItem('intellmeet_kanban_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleTabChange = (tab: 'Board' | 'My tasks') => {
    if (tab === 'My tasks') {
      setSearchParams({ view: 'mine' });
    } else {
      setSearchParams({});
    }
  };

  const openTaskModal = (task: KanbanTask) => {
    setSelectedTask(task);
    const params: any = {};
    if (viewParam) params.view = viewParam;
    params.task = task._id;
    setSearchParams(params);
  };

  const closeTaskModal = () => {
    setSelectedTask(null);
    const params: any = {};
    if (viewParam) params.view = viewParam;
    setSearchParams(params);
  };

  const handleAddTask = (columnStatus: KanbanTask['status']) => {
    if (!newTitle.trim()) return;

    const newTask: KanbanTask = {
      _id: 'task_' + Date.now(),
      title: newTitle.trim(),
      assigneeName: assignToMe ? userInitials : 'AL',
      assigneeFullName: assignToMe ? (user?.name || 'Rakesh Tank') : 'Ada Lovelace',
      status: columnStatus,
      priority: newPriority,
      dueDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      boardName: 'Product board',
      creatorName: user?.name || 'Demo User',
      createdAt: new Date().toLocaleString(),
      description: 'New task created in ' + columnStatus,
      comments: [],
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTitle('');
    setAddingToColumn(null);
  };

  const moveTaskStatus = (taskId: string, targetStatus: KanbanTask['status']) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: targetStatus } : t))
    );
    if (selectedTask && selectedTask._id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, status: targetStatus } : null));
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;

    const commentObj = {
      id: Date.now().toString(),
      author: user?.name || 'Demo User',
      text: newComment.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedTasks = tasks.map((t) => {
      if (t._id === selectedTask._id) {
        return {
          ...t,
          comments: [...(t.comments || []), commentObj],
        };
      }
      return t;
    });

    setTasks(updatedTasks);
    setSelectedTask((prev) => (prev ? { ...prev, comments: [...(prev.comments || []), commentObj] } : null));
    setNewComment('');
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, status: KanbanTask['status']) => {
    e.preventDefault();
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: KanbanTask['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      moveTaskStatus(taskId, targetStatus);
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const columnStatuses: KanbanTask['status'][] = ['To Do', 'In Progress', 'Review', 'Done'];

  const displayedTasks = activeTab === 'My tasks'
    ? tasks.filter((t) => t.assigneeName === userInitials)
    : tasks;

  return (
    <div className="min-h-screen w-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-800 dark:text-slate-100 flex font-sans antialiased overflow-hidden transition-colors relative">
      <Sidebar activePage="Tasks" />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#F8FAFC] dark:bg-[#090D16]">
        <Header />

        <main className="p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6 flex-1">
          {/* Header Title & View Switcher */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
                <LayoutGrid className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Tasks</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {activeTab === 'Board'
                  ? 'Drag cards between columns; everyone on the board sees it happen.'
                  : 'Everything assigned to you, on every board.'}
              </p>
            </div>

            {/* Board / My Tasks Switcher */}
            <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center space-x-1 border border-slate-200/80 dark:border-slate-700/80">
              <button
                onClick={() => handleTabChange('Board')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'Board'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Board
              </button>
              <button
                onClick={() => handleTabChange('My tasks')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'My tasks'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                My tasks
              </button>
            </div>
          </div>

          {/* Column Board Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start overflow-x-auto pb-6">
            {columnStatuses.map((status) => {
              const columnTasks = displayedTasks.filter((t) => t.status === status);
              const isOver = dragOverColumn === status;

              return (
                <div
                  key={status}
                  onDragOver={(e) => handleDragOver(e, status)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, status)}
                  className={`bg-slate-100/70 dark:bg-[#0F172A]/70 border ${
                    isOver
                      ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20'
                      : 'border-slate-200/80 dark:border-slate-800/80'
                  } rounded-2xl p-4 space-y-3 min-w-[260px] transition-all`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <div className="flex items-center space-x-2">
                      <span>{status}</span>
                      <span className="text-slate-400 dark:text-slate-500 font-normal">
                        {columnTasks.length}
                      </span>
                    </div>
                    {status === 'Done' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </div>

                  {/* Task Cards List */}
                  <div className="space-y-3 min-h-[50px]">
                    {columnTasks.map((t) => (
                      <div
                        key={t._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t._id)}
                        onClick={() => openTaskModal(t)}
                        className={`bg-white dark:bg-[#0F172A] border ${
                          t.status === 'Done' ? 'opacity-80 border-slate-200 dark:border-slate-800' : 'border-slate-200/80 dark:border-slate-800'
                        } rounded-xl p-4 shadow-2xs hover:border-indigo-500/50 hover:shadow-md transition cursor-pointer space-y-3 group`}
                      >
                        <div className="flex items-start justify-between space-x-2">
                          <p className={`text-xs font-bold ${t.status === 'Done' ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'} leading-snug flex-1`}>
                            {t.title}
                          </p>
                          <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition shrink-0" />
                        </div>

                        <div className="flex justify-between items-center text-[11px]">
                          <div className="flex items-center space-x-2">
                            {t.priority === 'High' && (
                              <span className="text-red-500 font-bold flex items-center space-x-0.5">
                                <span>↑</span>
                                <span>High</span>
                              </span>
                            )}
                            {t.priority === 'Low' && (
                              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center space-x-0.5">
                                <span>↓</span>
                                <span>Low</span>
                              </span>
                            )}

                            {t.dueDate && (
                              <span
                                className={`flex items-center space-x-1 ${
                                  t.isOverdue
                                    ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded font-semibold'
                                    : 'text-slate-400 dark:text-slate-500'
                                }`}
                              >
                                <Calendar className="w-3 h-3" />
                                <span>{t.dueDate}</span>
                              </span>
                            )}
                          </div>

                          <div
                            title={`Assigned to ${t.assigneeFullName || t.assigneeName}`}
                            className={`w-6 h-6 ${
                              t.assigneeName === userInitials
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            } font-bold rounded-full flex items-center justify-center text-[10px] shrink-0`}
                          >
                            {t.assigneeName}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Inline Add Task matching exact user screenshot */}
                    {addingToColumn === status ? (
                      <div className="space-y-3 pt-1">
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddTask(status);
                            if (e.key === 'Escape') setAddingToColumn(null);
                          }}
                          placeholder="What needs doing?"
                          autoFocus
                          className="w-full bg-slate-900 border-2 border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none shadow-md placeholder-slate-400"
                        />

                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => handleAddTask(status)}
                            className="bg-[#6366F1] hover:bg-indigo-600 text-white font-semibold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-xs"
                          >
                            Add task
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddingToColumn(null);
                              setNewTitle('');
                            }}
                            className="text-slate-200 hover:text-white font-semibold text-xs transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAddingToColumn(status);
                          setNewTitle('');
                        }}
                        className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-medium flex items-center justify-center space-x-1 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add a task</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* TASK DETAIL MODAL (Matching exact Screenshot 2!) */}
      {selectedTask && (
        <div
          onClick={closeTaskModal}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0F172A] text-slate-100 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800/80 space-y-2 relative">
              <button
                onClick={closeTaskModal}
                className="absolute right-5 top-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-lg font-bold text-white pr-8 leading-snug">
                {selectedTask.title}
              </h2>
              <p className="text-xs text-slate-400">
                On {selectedTask.boardName || 'Product board'}, added by {selectedTask.creatorName || 'Demo User'} on {selectedTask.createdAt || 'Sep 29, 2026, 5:32 AM'}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Notice Box */}
              <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-400 flex items-start space-x-3">
                <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  A sample task everyone trying the demo shares. Move it to any column; only a team admin can change or delete it.
                </p>
              </div>

              {/* Column Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">Column</label>
                <div className="relative max-w-sm">
                  <select
                    value={selectedTask.status}
                    onChange={(e) => moveTaskStatus(selectedTask._id, e.target.value as KanbanTask['status'])}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium outline-none appearance-none cursor-pointer focus:border-indigo-500"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Done">Done</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Properties Grid (Assignee, Due date, Priority) */}
              <div className="grid grid-cols-3 gap-4 text-xs pt-1">
                <div>
                  <span className="block text-slate-400 mb-1">Assignee</span>
                  <span className="font-bold text-white">{selectedTask.assigneeFullName || 'Ada Lovelace'}</span>
                </div>
                <div>
                  <span className="block text-slate-400 mb-1">Due date</span>
                  <span className="font-bold text-white">{selectedTask.dueDate || 'Sat, Oct 10'}</span>
                </div>
                <div>
                  <span className="block text-slate-400 mb-1">Priority</span>
                  <span className="font-bold text-white">{selectedTask.priority || 'High'}</span>
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-1.5 pt-2">
                <h4 className="text-xs font-semibold text-slate-400">Description</h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-800/40">
                  {selectedTask.description || 'The spike needs a Google Cloud project with test users. Ask IT for an internal consent screen so the refresh tokens do not expire every week.'}
                </p>
              </div>

              {/* Comments Section */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <h4>Comments</h4>
                </div>

                {(!selectedTask.comments || selectedTask.comments.length === 0) ? (
                  <p className="text-xs text-slate-500">
                    No comments yet. Type @ to mention a team-mate; they get a notification.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedTask.comments.map((c) => (
                      <div key={c.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-indigo-400">{c.author}</span>
                          <span className="text-slate-500">{c.time}</span>
                        </div>
                        <p className="text-xs text-slate-300">{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Input & Button */}
                <form onSubmit={handleAddComment} className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-slate-400">Add a comment</label>
                  <textarea
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type @ to mention someone"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-indigo-500 resize-none"
                  />
                  <button
                    type="submit"
                    className="bg-[#6366F1] hover:bg-indigo-600 text-white font-semibold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-xs"
                  >
                    Comment
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
