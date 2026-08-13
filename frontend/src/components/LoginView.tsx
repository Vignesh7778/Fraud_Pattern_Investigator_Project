import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

import { loginUser } from '../api/client';
import { UserProfile } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile, token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [emailOrUserId, setEmailOrUserId] = useState('USR-001');
  const [password, setPassword] = useState('analyst123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUserId.trim() || !password.trim()) {
      setError('Please provide Analyst ID/Email and Password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await loginUser(emailOrUserId.trim(), password.trim());
      onLoginSuccess(res.user, res.access_token);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPreset = (presetId: string, presetPass: string) => {
    setEmailOrUserId(presetId);
    setPassword(presetPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Graphic Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative z-10 font-mono transition-all">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-600/20 border border-teal-500/30 flex items-center justify-center mx-auto text-teal-400 shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-100 tracking-wider">FPI CONSOLE</h1>
          <p className="text-xs text-slate-400 font-sans">
            Enterprise AI Fraud Pattern Investigator — Analyst Authentication
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-start space-x-2 font-sans animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Analyst ID or Email</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="e.g. USR-001 or analyst@fpi.io"
                value={emailOrUserId}
                onChange={(e) => setEmailOrUserId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Security Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-700 hover:bg-teal-600 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-teal-900/30 transition-all font-mono border border-teal-500/30"
          >
            {loading ? (
              <span>Authenticating Session...</span>
            ) : (
              <>
                <span>Access Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Presets */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-500 text-center">Quick Preset Accounts</div>
          <div className="grid grid-cols-1 gap-2 text-xs font-mono">
            <button
              onClick={() => handleQuickPreset('USR-001', 'analyst123')}
              className="p-2.5 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left flex items-center justify-between transition-all group"
            >
              <div>
                <div className="text-slate-200 font-bold">Sarah Jenkins</div>
                <div className="text-[10px] text-slate-500">ID: USR-001 • Lead Fraud Analyst</div>
              </div>
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 opacity-60 group-hover:opacity-100" />
            </button>

            <button
              onClick={() => handleQuickPreset('USR-002', 'auditor123')}
              className="p-2.5 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left flex items-center justify-between transition-all group"
            >
              <div>
                <div className="text-slate-200 font-bold">Marcus Vance</div>
                <div className="text-[10px] text-slate-500">ID: USR-002 • Senior Compliance Auditor</div>
              </div>
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 opacity-60 group-hover:opacity-100" />
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-[10px] text-slate-500 text-center font-mono">
          Protected by Supabase JWT Security • FPI v1.0
        </div>
      </div>
    </div>
  );
};
