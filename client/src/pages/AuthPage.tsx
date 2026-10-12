import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/apiClient';
import { useAuthStore } from '../store/useAuthStore';
import { validateAuthForm, type FieldErrors } from '../utils/authValidation';
import { Bot, Sparkles, ShieldCheck, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export const AuthPage: React.FC<{ mode: 'login' | 'signup' }> = ({ mode }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Member' | 'Admin'>('Member');
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const savedTheme = localStorage.getItem('intellmeet_theme');
    if (savedTheme === 'Dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const triggerToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleTryDemo = async () => {
    try {
      const demoEmail = `guest_${Math.floor(Math.random() * 10000)}@intellmeet.com`;
      const res = await api.post('/auth/signup', {
        name: 'Maple Crane',
        email: demoEmail,
        password: 'demopassword123',
        role: 'Member'
      });
      setAuth(res.data.user, res.data.accessToken);
      navigate('/lobby');
    } catch (err) {
      navigate('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    setToastMessage(null);

    const validationErrors = validateAuthForm(mode, name, email, password);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
      const payload = mode === 'login' ? { email, password } : { name, email, password, role };
      const response = await api.post(endpoint, payload);

      if (mode === 'signup') {
        triggerToast('success', 'User registered successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 1200);
      } else {
        triggerToast('success', 'Login successful!');
        setAuth(response.data.user, response.data.accessToken);
        setTimeout(() => {
          navigate('/lobby');
        }, 800);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Authentication failed.';
      setServerError(msg);
      triggerToast('error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-800 dark:text-slate-100 flex font-sans antialiased overflow-hidden relative transition-colors">
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg border flex items-center space-x-3 text-xs font-semibold backdrop-blur-xl transition-all duration-300 ${toastMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* LEFT COLUMN: Premium Dark SaaS Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] p-12 flex-col justify-between relative overflow-hidden text-white border-r border-slate-800">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-indigo-600/30 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="flex items-center space-x-3 z-10 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/40">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">IntellMeet</span>
        </div>

        <div className="max-w-lg space-y-6 z-10">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/30 px-3.5 py-1.5 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Enterprise Collaboration</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
            Transform Meetings into <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Actionable Outcomes</span>
          </h1>
          <p className="text-slate-300 text-base leading-relaxed">
            Real-time WebRTC video conferencing, live speech transcription, AI summaries, and automated Kanban task extraction for high-performing remote teams.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 z-10 text-xs text-slate-400">
          <div className="flex items-center space-x-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>JWT & httpOnly Protection</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>OpenAI Speech Intelligence</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Form Container Card (Adapts to Dark Theme) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-[#F8FAFC] dark:bg-[#090D16]">
        <div className="w-full max-w-md bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-8 rounded-3xl shadow-sm dark:shadow-2xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {mode === 'login'
                ? 'Sign in to your IntellMeet workspace.'
                : 'Start running meetings that write themselves up.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full name</label>
                <input
                  type="text"
                  placeholder="Ada Lovelace"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className={`w-full bg-white dark:bg-slate-900 border ${errors.name ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
                    } rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none transition shadow-2xs`}
                />
                {errors.name && (
                  <p className="text-red-500 text-[11px] font-medium mt-1">{errors.name}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className={`w-full bg-white dark:bg-slate-900 border ${errors.email ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
                  } rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none transition shadow-2xs`}
              />
              {errors.email && (
                <p className="text-red-500 text-[11px] font-medium mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder=""
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className={`w-full bg-white dark:bg-slate-900 border ${errors.password ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
                    } rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none transition shadow-2xs pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === 'signup' && (
                <p className="text-[11px] text-slate-400 mt-1.5 leading-tight">
                  At least 12 characters, with an uppercase letter, a lowercase letter and a number.
                </p>
              )}
              {errors.password && (
                <p className="text-red-500 text-[11px] font-medium mt-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4F46E5] hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-sm transition mt-2"
            >
              {loading
                ? 'Processing...'
                : mode === 'login'
                  ? 'Sign in'
                  : 'Create account'}
            </button>
          </form>

          {mode === 'login' && (
            <div className="space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-100 dark:border-slate-800 w-full" />
                <span className="bg-white dark:bg-[#0F172A] px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest absolute">
                  OR
                </span>
              </div>

              <button
                onClick={handleTryDemo}
                className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-4 rounded-xl text-xs shadow-2xs transition"
              >
                Try the live demo
              </button>
            </div>
          )}

          <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            {mode === 'login' ? (
              <span>
                No account?{' '}
                <Link to="/signup" className="text-[#4F46E5] dark:text-indigo-400 font-semibold hover:underline">
                  Create one
                </Link>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <Link to="/login" className="text-[#4F46E5] dark:text-indigo-400 font-semibold hover:underline">
                  Sign in
                </Link>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};



