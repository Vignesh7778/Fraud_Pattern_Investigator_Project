import React from 'react';
import { UserProfile, SystemHealth } from '../types';

interface NavbarProps {
  user: UserProfile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health: SystemHealth | null;
  onOpenIngestion: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, activeTab, setActiveTab, health, onOpenIngestion }) => {

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-rose-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              FPI
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-100">Fraud Pattern Investigator</span>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span className="bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 px-1.5 py-0.5 rounded font-mono font-semibold">AI INVESTIGATES</span>
                <span>•</span>
                <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 px-1.5 py-0.5 rounded font-mono font-semibold">HUMAN DECIDES</span>
              </div>
            </div>
          </div>

          <nav className="flex space-x-1">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'search', label: 'Search Cases' },
              { id: 'detail', label: 'Case Workspace' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 ${
                  activeTab === tab.id
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-800/60 border border-slate-700/60 rounded-full px-3 py-1 text-xs">
              <span className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-slate-300 font-mono">{health?.status === 'ok' ? 'Backend Live' : 'Connecting'}</span>
            </div>

            <button
              onClick={onOpenIngestion}
              className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs rounded-lg shadow-md shadow-cyan-600/20 transition-all flex items-center gap-1.5"
            >
              <span>➕</span> Ingest Case
            </button>

            <div className="flex items-center space-x-2 border-l border-slate-800 pl-4">
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-200">{user.name}</div>
                <span className="text-xs uppercase px-1.5 py-0.2 rounded bg-violet-950 text-violet-300 border border-violet-800/50 font-mono">
                  {user.role}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
