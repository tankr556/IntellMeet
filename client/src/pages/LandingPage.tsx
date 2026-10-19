import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  Video,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  Monitor,
  Check,
  CheckCircle2,
  MessageSquare,
  FileText,
  CheckSquare,
  Loader2
} from 'lucide-react';
import api from '../api/apiClient';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [activeTheme, setActiveTheme] = useState<'Light' | 'Dark' | 'System'>(() => {
    return (localStorage.getItem('intellmeet_theme') as 'Light' | 'Dark' | 'System') || 'System';
  });

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

  const handleThemeSelect = (theme: 'Light' | 'Dark' | 'System') => {
    setActiveTheme(theme);
    localStorage.setItem('intellmeet_theme', theme);
    applyTheme(theme);
    setShowThemeDropdown(false);
  };

  const handleTryDemo = async () => {
    if (isDemoLoading) return;
    setIsDemoLoading(true);

    const guestId = Math.floor(Math.random() * 9000 + 1000);
    const demoName = 'Maple Crane';
    const demoEmail = `guest_${guestId}@intellmeet.com`;

    let guestUser: any = {
      id: `guest_${guestId}`,
      name: demoName,
      email: demoEmail,
      role: 'Member'
    };
    let token = 'demo_guest_token_' + Date.now();

    try {
      const res = await api.post('/auth/signup', {
        name: demoName,
        email: demoEmail,
        password: 'demopassword123',
        role: 'Member'
      });
      if (res.data?.user) {
        guestUser = res.data.user;
      }
      if (res.data?.accessToken) {
        token = res.data.accessToken;
      }
    } catch (apiErr) {
      console.warn('Backend waking up or offline, launching demo session locally', apiErr);
    }

    setAuth(guestUser, token);
    localStorage.setItem('intellmeet_user_name', demoName);
    setTimeout(() => {
      navigate('/lobby');
    }, 400);
  };

  return (
    <div className="min-h-screen w-screen bg-white dark:bg-[#090D16] text-slate-900 dark:text-slate-100 font-sans antialiased overflow-x-hidden flex flex-col transition-colors">
      {/* 1. TOP NAVBAR */}
      <header className="h-16 border-b border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-[#090D16]/90 backdrop-blur-md px-8 flex justify-between items-center sticky top-0 z-50 max-w-7xl w-full mx-auto transition-colors">
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-[#4F46E5] rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/20">
            IM
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">IntellMeet</span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Interactive Theme Dropdown (Matching Screenshot 2) */}
          <div className="relative">
            <button
              onClick={() => setShowThemeDropdown(!showThemeDropdown)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-xl transition flex items-center justify-center border border-slate-200/60 dark:border-slate-700"
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition ${
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition ${
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition ${
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
          
          <button
            onClick={() => navigate('/login')}
            className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-2 transition"
          >
            Sign in
          </button>

          <button
            onClick={() => navigate('/signup')}
            className="bg-[#4F46E5] hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition shadow-sm"
          >
            Get started
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="max-w-7xl w-full mx-auto px-8 pt-16 pb-20 grid md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-7 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-[#EEF2FF] dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/50 px-3.5 py-1.5 rounded-full text-[#4F46E5] dark:text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Meetings that write themselves up</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            Run the meeting.<br />
            Let IntellMeet<br />
            handle the minutes.
          </h1>

          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed max-w-xl">
            Browser-based video meetings for teams, with live chat and screen sharing. When the call ends you get a transcript, a summary, the decisions, and the action items - already assigned.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={handleTryDemo}
              disabled={isDemoLoading}
              className="bg-[#4F46E5] hover:bg-indigo-700 disabled:opacity-80 disabled:cursor-not-allowed text-white font-bold px-6 py-3.5 rounded-xl text-xs flex items-center space-x-2 shadow-md shadow-indigo-500/20 transition cursor-pointer"
            >
              {isDemoLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Entering live demo...</span>
                </>
              ) : (
                <>
                  <span>Try Live Demo</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              onClick={() => navigate('/signup')}
              className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold px-6 py-3.5 rounded-xl text-xs transition shadow-2xs"
            >
              Create a free account
            </button>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center space-x-1.5 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>No sign-up needed. You get your own guest name in a shared demo team that already has colleagues and sample meetings in it.</span>
          </p>
        </div>

        {/* Right Hero Interactive Card */}
        <div className="md:col-span-5 bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex space-x-1.5">
              <span className="w-2.5 h-2.5 bg-red-400 rounded-full inline-block" />
              <span className="w-2.5 h-2.5 bg-amber-400 rounded-full inline-block" />
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full inline-block" />
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium pl-2">Product sync - 24 min - 5 participants</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 text-[#4F46E5] dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI SUMMARY</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              The team agreed to ship the onboarding rewrite behind a flag this week, and to hold the pricing change until the billing migration lands.
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">ACTION ITEMS</p>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong className="text-slate-900 dark:text-white">Ada</strong> - Enable the onboarding flag for 10% of traffic</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong className="text-slate-900 dark:text-white">Grace</strong> - Draft the billing migration plan</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span><strong className="text-slate-900 dark:text-white">Alan</strong> - Re-run the pricing model with Q3 numbers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section className="bg-slate-50/50 dark:bg-[#0F172A]/50 py-20 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl w-full mx-auto px-8 space-y-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">How it works</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Four steps, start to finish. Nothing to install.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl shadow-2xs space-y-4">
              <div className="w-7 h-7 bg-indigo-50 dark:bg-slate-800 text-[#4F46E5] dark:text-indigo-400 font-bold rounded-lg flex items-center justify-center text-xs">
                1
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Start a meeting</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Create a room in one click and share the link, or join with a 7-character code.
              </p>
            </div>

            <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl shadow-2xs space-y-4">
              <div className="w-7 h-7 bg-indigo-50 dark:bg-slate-800 text-[#4F46E5] dark:text-indigo-400 font-bold rounded-lg flex items-center justify-center text-xs">
                2
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Meet as usual</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Video, screen share, live chat and a participant list - all in the browser.
              </p>
            </div>

            <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl shadow-2xs space-y-4">
              <div className="w-7 h-7 bg-indigo-50 dark:bg-slate-800 text-[#4F46E5] dark:text-indigo-400 font-bold rounded-lg flex items-center justify-center text-xs">
                3
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Get the write-up</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                AI turns the recording into a transcript, a summary and the decisions you made.
              </p>
            </div>

            <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl shadow-2xs space-y-4">
              <div className="w-7 h-7 bg-indigo-50 dark:bg-slate-800 text-[#4F46E5] dark:text-indigo-400 font-bold rounded-lg flex items-center justify-center text-xs">
                4
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Track the follow-ups</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Action items land on your team board with the right person already assigned.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHAT IS INSIDE SECTION */}
      <section className="py-20 bg-white dark:bg-[#090D16]">
        <div className="max-w-7xl w-full mx-auto px-8 space-y-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">What is inside</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-8 rounded-2xl shadow-2xs flex items-start space-x-4">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-slate-800 text-[#4F46E5] dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Peer-to-peer video</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  WebRTC mesh with screen sharing. Media flows between browsers, not through our servers.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-8 rounded-2xl shadow-2xs flex items-start space-x-4">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-slate-800 text-[#4F46E5] dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Real-time everything</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Chat, presence, typing indicators and notifications over a single socket.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-8 rounded-2xl shadow-2xs flex items-start space-x-4">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-slate-800 text-[#4F46E5] dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Automatic minutes</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Transcript, summary and key decisions, generated the moment a meeting ends.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-8 rounded-2xl shadow-2xs flex items-start space-x-4">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-slate-800 text-[#4F46E5] dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Action items that stick</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Every task from every meeting on one board, synced live across the team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SEE IT FOR YOURSELF SECTION */}
      <section className="py-20 bg-slate-50/50 dark:bg-[#0F172A]/50 border-t border-slate-100 dark:border-slate-800 text-center">
        <div className="max-w-2xl w-full mx-auto px-8 space-y-6">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">See it for yourself</h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Every press of Try Live Demo is a different guest in the same team. Open it again in a private window, or on a colleague's laptop, and you are two people who can meet, chat and record together. Guest accounts tidy themselves away after a few hours.
          </p>

          <div className="pt-2">
            <button
              onClick={handleTryDemo}
              disabled={isDemoLoading}
              className="bg-[#4F46E5] hover:bg-indigo-700 disabled:opacity-80 disabled:cursor-not-allowed text-white font-bold px-8 py-3.5 rounded-xl text-xs inline-flex items-center space-x-2 shadow-md shadow-indigo-500/20 transition cursor-pointer"
            >
              {isDemoLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Entering live demo...</span>
                </>
              ) : (
                <>
                  <span>Try Live Demo</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#090D16] py-8 px-8 max-w-7xl w-full mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-[#4F46E5] rounded-lg flex items-center justify-center text-white font-bold text-[10px]">
            IM
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-sm">IntellMeet</span>
        </div>

        <span>AI-powered meetings for teams.</span>
      </footer>
    </div>
  );
};

