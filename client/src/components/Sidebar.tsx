import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Video, Users, CheckSquare, BarChart2, Settings } from 'lucide-react';

interface SidebarProps {
  activePage: 'Dashboard' | 'Meetings' | 'Team' | 'Tasks' | 'Analytics' | 'Settings';
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage }) => {
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/lobby' },
    { name: 'Meetings', icon: Video, path: '/meetings' },
    { name: 'Team', icon: Users, path: '/team' },
    { name: 'Tasks', icon: CheckSquare, path: '/kanban' },
    { name: 'Analytics', icon: BarChart2, path: '/analytics' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ] as const;

  return (
    <aside className="w-60 bg-white dark:bg-[#090D16] border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between hidden md:flex shrink-0 transition-colors">
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center space-x-2.5 px-2 cursor-pointer" onClick={() => navigate('/lobby')}>
          <div className="w-8 h-8 bg-[#4F46E5] rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/20">
            IM
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">IntellMeet</span>
        </div>

        {/* Sidebar Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.name;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm transition ${
                  isActive
                    ? 'bg-[#EEF2FF] dark:bg-slate-800/80 text-[#4F46E5] dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#4F46E5] dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
