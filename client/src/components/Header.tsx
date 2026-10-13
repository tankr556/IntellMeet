import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import {
  Bell,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Trash2,
  Check,
  Menu,
  X,
  LayoutDashboard,
  Video,
  Users,
  CheckSquare,
  BarChart2,
  Settings,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  link?: string;
  read?: boolean;
}

export const Header: React.FC = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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

  useEffect(() => {
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.PROD
        ? 'https://intellmeet-zidio-ff1v.onrender.com'
        : 'http://localhost:5000');
    const socket = io(socketUrl, { withCredentials: true });

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
    <>
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-8 flex justify-between items-center shrink-0 relative z-30 transition-colors">
        {/* Left Side: Mobile Hamburger Menu & Logo (Visible on mobile/tablet < md) */}
        <div className="flex items-center space-x-3 md:hidden">
          <button
            onClick={() => setShowMobileMenu(true)}
            className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/lobby')}>
            <div className="w-7 h-7 bg-[#4F46E5] rounded-lg flex items-center justify-center text-white font-black text-xs shadow-sm">
              IM
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">IntellMeet</span>
          </div>
        </div>

        {/* Desktop Spacer (keeps right controls pushed to right) */}
        <div className="hidden md:block" />

        {/* Right Side: Notifications, Theme & Profile Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
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
        </div>
      </header>

      {/* 4. MOBILE SLIDE-OVER NAVIGATION DRAWER */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowMobileMenu(false)}
          />
          {/* Slide-out drawer panel */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-[#090D16] border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shadow-2xl z-50">
            <div className="space-y-6">
              {/* Header with Logo and Close button */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 bg-[#4F46E5] rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/20">
                    IM
                  </div>
                  <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">IntellMeet</span>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1.5">
                {[
                  { name: 'Dashboard', icon: LayoutDashboard, path: '/lobby' },
                  { name: 'Meetings', icon: Video, path: '/meetings' },
                  { name: 'Team', icon: Users, path: '/team' },
                  { name: 'Tasks', icon: CheckSquare, path: '/kanban' },
                  { name: 'Analytics', icon: BarChart2, path: '/analytics' },
                  { name: 'Settings', icon: Settings, path: '/settings' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = window.location.pathname === item.path;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        navigate(item.path);
                        setShowMobileMenu(false);
                      }}
                      className={`w-full flex items-center space-x-3.5 px-3.5 py-3 rounded-xl text-sm transition ${
                        isActive
                          ? 'bg-[#EEF2FF] dark:bg-slate-800 text-[#4F46E5] dark:text-indigo-400 font-semibold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-medium'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#4F46E5] dark:text-indigo-400' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom User info and Logout */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center space-x-3 px-1">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'RT'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name || 'Rakesh Tank'}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email || 'tankr556@gmail.com'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center space-x-2 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};



