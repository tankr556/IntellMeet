import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import { Bell, Sun, Moon, Monitor, LogOut, Trash2, Check } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  link?: string;
  read?: boolean;
}

export const Header: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const isCleared = localStorage.getItem('intellmeet_notifications_cleared');
    if (isCleared === 'true') {
      return [];
    }

    const saved = localStorage.getItem('intellmeet_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }

    return [
      { id: '1', title: 'Meeting Summary Ready', desc: 'Design review summary & action items are ready.', time: 'Just now', link: '/meetings' },
      { id: '2', title: 'New Team Invitation', desc: 'You joined IntellMeet Demo Team.', time: '1h ago', link: '/team' },
      { id: '3', title: 'Action Item Assigned', desc: 'Check status badge contrast assigned to Ada.', time: '2h ago', link: '/kanban' },
    ];
  });

  const [hasUnread, setHasUnread] = useState(() => {
    const isCleared = localStorage.getItem('intellmeet_notifications_cleared');
    return isCleared !== 'true';
  });

  const [activeTheme, setActiveTheme] = useState<'Light' | 'Dark' | 'System'>(() => {
    return (localStorage.getItem('intellmeet_theme') as 'Light' | 'Dark' | 'System') || 'System';
  });

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  // Listen to Socket.io for Real-time Notifications (e.g., meeting created, action item assigned)
  useEffect(() => {
    const socket = io('http://localhost:5000', { withCredentials: true });

    socket.on('notification', (data: any) => {
      const newNotif: NotificationItem = {
        id: Date.now().toString(),
        title: data.title || 'New Notification',
        desc: data.message || data.desc || 'Activity updated in your meeting workspace.',
        time: 'Just now',
        link: data.link || '/meetings',
      };
      setNotifications((prev) => {
        const updated = [newNotif, ...prev];
        localStorage.setItem('intellmeet_notifications', JSON.stringify(updated));
        localStorage.removeItem('intellmeet_notifications_cleared');
        return updated;
      });
      setHasUnread(true);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const applyTheme = (theme: 'Light' | 'Dark' | 'System') => {
    if (theme === 'Dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'Light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  useEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleThemeSelect = (theme: 'Light' | 'Dark' | 'System') => {
    setActiveTheme(theme);
    localStorage.setItem('intellmeet_theme', theme);
    applyTheme(theme);
    setShowThemeDropdown(false);
  };

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    setHasUnread(false);
    setShowThemeDropdown(false);
    setShowProfileDropdown(false);
  };

  const handleNotificationClick = (link?: string) => {
    setShowNotifications(false);
    setHasUnread(false);
    if (link) {
      navigate(link);
    } else {
      navigate('/meetings');
    }
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    setHasUnread(false);
    localStorage.setItem('intellmeet_notifications', JSON.stringify([]));
    localStorage.setItem('intellmeet_notifications_cleared', 'true');
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-8 flex justify-end items-center space-x-4 shrink-0 relative z-30 transition-colors">
      
      {/* 1. REAL-TIME NOTIFICATIONS BELL DROPDOWN */}
      <div className="relative">
        <button
          onClick={handleOpenNotifications}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl transition relative cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          {hasUnread && notifications.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-indigo-500 absolute top-2 right-2 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3 z-50 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAllNotifications}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="py-6 text-center text-slate-400 dark:text-slate-500">No new notifications</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n.link)}
                    className="p-3 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 transition cursor-pointer space-y-1"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">{n.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. THEME DROPDOWN */}
      <div className="relative">
        <button
          onClick={() => {
            setShowThemeDropdown(!showThemeDropdown);
            setShowNotifications(false);
            setShowProfileDropdown(false);
          }}
          className="p-2 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition flex items-center justify-center border border-slate-200/60 dark:border-slate-700 cursor-pointer"
        >
          {activeTheme === 'Dark' ? (
            <Moon className="w-4 h-4 text-indigo-400" />
          ) : activeTheme === 'Light' ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Sun className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          )}
        </button>

        {showThemeDropdown && (
          <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 space-y-0.5 text-xs text-slate-700 dark:text-slate-200 z-50">
            <button
              onClick={() => handleThemeSelect('Light')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer ${
                activeTheme === 'Light' ? 'bg-indigo-50 dark:bg-slate-800 font-bold text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light</span>
              </div>
              {activeTheme === 'Light' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
            </button>

            <button
              onClick={() => handleThemeSelect('Dark')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer ${
                activeTheme === 'Dark' ? 'bg-indigo-50 dark:bg-slate-800 font-bold text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Dark</span>
              </div>
              {activeTheme === 'Dark' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
            </button>

            <button
              onClick={() => handleThemeSelect('System')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition cursor-pointer ${
                activeTheme === 'System' ? 'bg-indigo-50 dark:bg-slate-800 font-bold text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Monitor className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>System</span>
              </div>
              {activeTheme === 'System' && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
            </button>
          </div>
        )}
      </div>

      {/* 3. PROFILE DROPDOWN */}
      <div className="relative">
        <button
          onClick={() => {
            setShowProfileDropdown(!showProfileDropdown);
            setShowNotifications(false);
            setShowThemeDropdown(false);
          }}
          className="w-9 h-9 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          {user?.name?.slice(0, 2).toUpperCase() || 'MC'}
        </button>

        {showProfileDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 space-y-3 text-xs z-50">
            <div className="space-y-1 pb-2 border-b border-slate-100 dark:border-slate-800">
              <p className="font-bold text-slate-900 dark:text-white text-sm">{user?.name || 'Maple Crane'}</p>
              <p className="text-slate-400 text-[11px]">
                Demo guest - rename yourself in Settings
              </p>
            </div>

            <div className="space-y-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl font-medium transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>Sign out</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2.5 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl font-medium transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>End demo session</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};



