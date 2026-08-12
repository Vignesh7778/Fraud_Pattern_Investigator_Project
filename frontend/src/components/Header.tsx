import React from 'react';
import { ShieldAlert, Cpu, Database, Activity } from 'lucide-react';

interface HeaderProps {
  systemStatus?: string;
  dbStatus?: string;
}

export const Header: React.FC<HeaderProps> = ({ systemStatus = 'unknown', dbStatus = 'unknown' }) => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              FRAUD PATTERN INVESTIGATOR
              <span className="text-[10px] font-mono font-medium uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                FPI v0.1.0
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              AI Investigates. <span className="text-indigo-400 font-semibold">Human Decides.</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">API:</span>
            <span className={systemStatus === 'ok' ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
              {systemStatus.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">DB:</span>
            <span className={dbStatus === 'connected' ? 'text-emerald-400 font-medium' : 'text-slate-400 font-medium'}>
              {dbStatus.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>SYSTEM READY</span>
          </div>
        </div>
      </div>
    </header>
  );
};
