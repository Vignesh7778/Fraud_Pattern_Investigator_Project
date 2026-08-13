import React, { useState } from 'react';
import { ShieldAlert, Play, Search, ChevronRight, AlertCircle, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardViewProps {
  stats: {
    total_investigations: number;
    flagged_high_risk: number;
    pending_human_decisions: number;
    avg_confidence: number;
    active_analysts: number;
  };
  onRunNewInvestigation: (txnId: string) => void;
  onSelectCase: (caseId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  onRunNewInvestigation,
  onSelectCase
}) => {
  const navigate = useNavigate();
  const [txnInput, setTxnInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (txnInput.trim()) {
      onRunNewInvestigation(txnInput.trim());
    }
  };

  const priorityCases = [
    { case_id: 'CASE-ATO-1001', transaction_id: 'TXN-ATO-1001', title: 'Account Takeover & Device Sharing', risk_level: 'CRITICAL', risk_score: 0.94, evidence_count: 12, status: 'HUMAN_REVIEW' },
    { case_id: 'CASE-VEL-2002', transaction_id: 'TXN-VEL-2002', title: 'Bot Velocity Micro-Transactions', risk_level: 'HIGH', risk_score: 0.88, evidence_count: 8, status: 'HUMAN_REVIEW' },
    { case_id: 'CASE-GEO-3003', transaction_id: 'TXN-GEO-3003', title: 'Geographic Impossible Travel Anomaly', risk_level: 'CRITICAL', risk_score: 0.91, evidence_count: 14, status: 'HUMAN_REVIEW' }
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-sans">Good morning, Analyst</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-mono">
            Review active investigations and resolve high-priority cases. Standardized CASE-ID format for seamless navigation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Enter Txn ID (e.g. TXN-1001)"
            value={txnInput}
            onChange={e => setTxnInput(e.target.value)}
            className="bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] text-slate-800 dark:text-slate-100 px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:border-teal-600 font-mono w-56"
          />
          <button
            type="submit"
            className="bg-teal-700 hover:bg-teal-600 dark:bg-teal-600/90 dark:hover:bg-teal-600 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-sm transition-all font-mono"
          >
            Investigate
          </button>
        </form>
      </div>

      {/* Quick Start Panel */}
      <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-5 shadow-sm space-y-3 font-mono transition-colors">
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Quick Start Actions</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => onRunNewInvestigation('TXN-QUICK-101')}
            className="p-3 bg-slate-50 dark:bg-[#0f1115] hover:bg-slate-100 dark:hover:bg-[#1e2229] border border-slate-200 dark:border-[#2a2e37] rounded-xl text-left space-y-1 transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span>New Investigation</span>
              <Play className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-[10px] text-slate-500">Run automated AI harness</div>
          </button>

          <button
            onClick={() => onSelectCase('CASE-ATO-1001')}
            className="p-3 bg-slate-50 dark:bg-[#0f1115] hover:bg-slate-100 dark:hover:bg-[#1e2229] border border-slate-200 dark:border-[#2a2e37] rounded-xl text-left space-y-1 transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span>Open Pending Review</span>
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-[10px] text-slate-500">Review critical CASE-ATO-1001</div>
          </button>

          <button
            onClick={() => navigate('/cases')}
            className="p-3 bg-slate-50 dark:bg-[#0f1115] hover:bg-slate-100 dark:hover:bg-[#1e2229] border border-slate-200 dark:border-[#2a2e37] rounded-xl text-left space-y-1 transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span>Browse Cases</span>
              <Search className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-[10px] text-slate-500">View saved case repository</div>
          </button>

          <button
            onClick={() => navigate('/audit')}
            className="p-3 bg-slate-50 dark:bg-[#0f1115] hover:bg-slate-100 dark:hover:bg-[#1e2229] border border-slate-200 dark:border-[#2a2e37] rounded-xl text-left space-y-1 transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span>View Audit Trail</span>
              <Activity className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-[10px] text-slate-500">Compliance & activity logs</div>
          </button>
        </div>
      </div>

      {/* Compact Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-4 shadow-sm space-y-2 transition-colors">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">HIGH RISK CASES</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{stats.flagged_high_risk}</span>
            <span className="text-xs text-slate-500">Risk Score ≥ 0.70</span>
          </div>
          <div className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">→ 3 require human review</div>
        </div>

        <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-4 shadow-sm space-y-2 transition-colors">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">AWAITING REVIEW</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{stats.pending_human_decisions}</span>
            <span className="text-xs text-slate-500">Pending analyst decision</span>
          </div>
          <div className="text-[10px] text-slate-500">Highest risk: CASE-ATO-1001</div>
        </div>

        <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-4 shadow-sm space-y-2 transition-colors">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">INVESTIGATIONS RUNNING</div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">02</span>
            <span className="text-xs text-slate-500">Active harness workers</span>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">● Operational</div>
        </div>
      </div>

      {/* Priority Queue Cards */}
      <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-6 shadow-sm space-y-4 font-mono transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">PRIORITY REVIEW QUEUE</h2>
          </div>
          <span className="text-xs text-slate-500">Sorted by Risk Score</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {priorityCases.map((c) => (
            <div
              key={c.case_id}
              onClick={() => onSelectCase(c.case_id)}
              className="bg-slate-50 dark:bg-[#0f1115] hover:bg-slate-100 dark:hover:bg-[#1e2229] border border-slate-200 dark:border-[#2a2e37] rounded-xl p-4 space-y-3 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{c.case_id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800/40">
                    {(c.risk_score * 100).toFixed(0)}% RISK
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans line-clamp-2">{c.title}</div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-[#2a2e37] flex items-center justify-between text-[10px] text-slate-500">
                <span>{c.evidence_count} Evidence Items</span>
                <span className="text-teal-600 dark:text-teal-400 font-bold flex items-center">
                  Open Case <ChevronRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
