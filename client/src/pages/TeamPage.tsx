import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Users, ArrowLeft, Link as LinkIcon, Copy } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface TeamItem {
  id: string;
  name: string;
  membersCount: number;
  avatar: string;
  isAdmin?: boolean;
}

export const TeamPage: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [selectedTeam, setSelectedTeam] = useState<TeamItem | null>(null);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [inviteLinkCreated, setInviteLinkCreated] = useState(false);

  const [teams, setTeams] = useState<TeamItem[]>(() => {
    const saved = JSON.parse(localStorage.getItem('user_teams') || '[]');
    const defaultTeam = [
      { id: '1', name: 'IntellMeet Demo Team', membersCount: 5, avatar: 'IN', isAdmin: false }
    ];
    return [...saved, ...defaultTeam];
  });

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamNameInput.trim()) return;
    const newTeam: TeamItem = {
      id: Date.now().toString(),
      name: teamNameInput.trim(),
      membersCount: 1,
      avatar: teamNameInput.trim().slice(0, 2).toUpperCase(),
      isAdmin: true
    };
    const updated = [newTeam, ...teams];
    setTeams(updated);
    localStorage.setItem('user_teams', JSON.stringify(updated.filter(t => t.id !== '1')));
    setTeamNameInput('');
  };

  const handleJoinTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return;
    alert(`Joined team with code: ${inviteCodeInput}`);
    setInviteCodeInput('');
  };

  const displayName = currentUser?.name || 'Cobalt Walrus (you)';
  const displayEmail = currentUser?.email || 'cobalt-walrus-a2b1a978@guest.intellmeet.invalid';
  const userInitials = displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'CW';

  return (
    <div className="min-h-screen w-screen bg-[#F8FAFC] dark:bg-[#090D16] text-slate-800 dark:text-slate-100 flex font-sans antialiased overflow-hidden transition-colors relative">
      <Sidebar activePage="Team" />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#F8FAFC] dark:bg-[#090D16]">
        <Header />

        {/* 1. TEAM DETAIL VIEW */}
        {selectedTeam ? (
          <main className="p-8 max-w-5xl w-full mx-auto space-y-6 flex-1">
            <div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center space-x-1 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Teams</span>
              </button>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {selectedTeam.name}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedTeam.id === '1' ? '5 members - you are a member' : `${selectedTeam.membersCount} member - you are an admin`}
              </p>
            </div>

            {/* How people join OR Invite people Box */}
            {selectedTeam.id === '1' ? (
              <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl shadow-2xs space-y-3">
                <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
                  <LinkIcon className="w-4 h-4 text-indigo-500" />
                  <h3>How people join</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Everyone who uses <strong className="text-slate-700 dark:text-slate-200">Try Live Demo</strong> is put in <strong className="text-slate-700 dark:text-slate-200">IntellMeet Demo Team</strong>, so nobody needs an invite. Send them a meeting link and ask them to choose <strong className="text-slate-700 dark:text-slate-200">Try Live Demo</strong>. Somebody signed in with their own account cannot join this team's meetings; for that, create a team of your own and share its invite link.
                </p>

                <div className="pt-2">
                  <button
                    onClick={() => setSelectedTeam(null)}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                  >
                    Create a team
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl shadow-2xs space-y-3">
                <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
                  <LinkIcon className="w-4 h-4 text-indigo-500" />
                  <h3>Invite people</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Generates a link that expires. Anyone with an account can redeem it once.
                </p>

                <div className="pt-2">
                  {inviteLinkCreated ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`https://intellmeet-ai.vercel.app/invite/${selectedTeam.id}`}
                        className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-indigo-500 dark:text-indigo-400 outline-none"
                      />
                      <button
                        onClick={() => alert('Invite link copied!')}
                        className="bg-[#6366F1] hover:bg-indigo-600 text-white font-semibold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setInviteLinkCreated(true)}
                      className="bg-[#6366F1] hover:bg-indigo-600 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-2xs"
                    >
                      Create invite link
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Members Section */}
            <div className="space-y-3 pt-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Members</h2>

              {selectedTeam.id === '1' ? (
                <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 shadow-2xs">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg flex items-center justify-center font-bold text-xs">
                        DU
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-xs">Demo User</h3>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">demo@intellmeet.app</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 rounded-md text-[11px] font-semibold">
                      owner
                    </span>
                  </div>

                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg flex items-center justify-center font-bold text-xs">
                        AL
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-xs">Ada Lovelace</h3>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">ada@intellmeet.app</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 rounded-md text-[11px] font-semibold">
                      admin
                    </span>
                  </div>

                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg flex items-center justify-center font-bold text-xs">
                        GH
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-xs">Grace Hopper</h3>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">grace@intellmeet.app</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 rounded-md text-[11px] font-semibold">
                      member
                    </span>
                  </div>

                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg flex items-center justify-center font-bold text-xs">
                        AT
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-xs">Alan Turing</h3>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">alan@intellmeet.app</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 rounded-md text-[11px] font-semibold">
                      member
                    </span>
                  </div>

                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg flex items-center justify-center font-bold text-xs">
                        OC
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-xs">Olive Crane (you)</h3>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">olive-crane-e497fe57@guest.intellmeet.invalid</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 rounded-md text-[11px] font-semibold">
                      member
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg flex items-center justify-center font-bold text-xs">
                      {userInitials}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-xs">{displayName}</h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{displayEmail}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 rounded-md text-[11px] font-semibold">
                    owner
                  </span>
                </div>
              )}
            </div>
          </main>
        ) : (
          /* 2. TEAMS LIST VIEW (MATCHING FIRST USER SCREENSHOT) */
          <main className="p-8 max-w-5xl w-full mx-auto space-y-8 flex-1">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Teams
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                A team is the boundary for everything: meetings, tasks and history all belong to one.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Create a Team Card */}
              <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl shadow-2xs space-y-4">
                <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-base">
                  <span className="text-[#4F46E5] dark:text-indigo-400 font-bold text-lg">+</span>
                  <h2>Create a team</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  You become its admin and can invite people straight away.
                </p>

                <form onSubmit={handleCreateTeam} className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Team name
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Platform team"
                      value={teamNameInput}
                      onChange={(e) => setTeamNameInput(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition"
                    />
                    <button
                      type="submit"
                      className="bg-[#6366F1] hover:bg-indigo-600 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-2xs shrink-0"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>

              {/* Join a Team Card */}
              <div className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl shadow-2xs space-y-4">
                <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-base">
                  <Users className="w-4 h-4 text-[#4F46E5] dark:text-indigo-400" />
                  <h2>Join a team</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Paste the invite code a team admin sent you.
                </p>

                <form onSubmit={handleJoinTeam} className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Invite code
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="ABC23XYZ"
                      value={inviteCodeInput}
                      onChange={(e) => setInviteCodeInput(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 transition"
                    />
                    <button
                      type="submit"
                      className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-2xs shrink-0"
                    >
                      Join
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Your Teams Section */}
            <div className="space-y-4 pt-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Your teams</h2>

              <div className="grid md:grid-cols-2 gap-4">
                {teams.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTeam(t)}
                    className="bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-2xs hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                        {t.avatar}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{t.membersCount} member{t.membersCount > 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {t.isAdmin && (
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] rounded-md">
                        Admin
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
};


