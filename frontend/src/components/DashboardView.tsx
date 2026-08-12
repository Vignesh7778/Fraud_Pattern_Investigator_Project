import React, { useState } from 'react';


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
  const [txnInput, setTxnInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (txnInput.trim()) {
      onRunNewInvestigation(txnInput.trim());
    }
  };

  const sampleCases = [
    { case_id: 'CASE-8910', transaction_id: 'TXN-9001', risk_level: 'CRITICAL', risk_score: 0.94, status: 'HUMAN_REVIEW', pattern: 'shared_device' },
    { case_id: 'CASE-8911', transaction_id: 'TXN-9002', risk_level: 'HIGH', risk_score: 0.78, status: 'HUMAN_REVIEW', pattern: 'velocity' },
    { case_id: 'CASE-8912', transaction_id: 'TXN-9003', risk_level: 'MEDIUM', risk_score: 0.52, status: 'FINAL_DECISION', pattern: 'legitimate_shared_device' },
    { case_id: 'CASE-8913', transaction_id: 'TXN-9004', risk_level: 'LOW', risk_score: 0.12, status: 'FINAL_DECISION', pattern: 'normal_behavior' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Autonomous Fraud Investigation Hub</h1>
            <p className="text-slate-400 text-sm mt-1">
              AI evaluates ML risk, patterns, graph links & RAG policies. <span className="text-indigo-300 font-medium">Human analyst retains final authority.</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Enter Transaction ID (e.g. TXN-1001)"
              value={txnInput}
              onChange={e => setTxnInput(e.target.value)}
              className="bg-slate-900/90 border border-slate-700 text-slate-100 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-indigo-500 w-64 shadow-inner"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all"
            >
              Investigate
            </button>
          </form>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Investigations', val: stats.total_investigations, sub: 'All cases evaluated', color: 'border-slate-800 text-slate-100' },
          { label: 'High/Critical Risk', val: stats.flagged_high_risk, sub: 'Risk score ≥ 0.70', color: 'border-rose-900/40 text-rose-400' },
          { label: 'Pending Human Review', val: stats.pending_human_decisions, sub: 'Requires analyst action', color: 'border-amber-900/40 text-amber-400' },
          { label: 'Avg AI Confidence', val: `${(stats.avg_confidence * 100).toFixed(0)}%`, sub: 'Grounded evidence score', color: 'border-emerald-900/40 text-emerald-400' }
        ].map((m, i) => (
          <div key={i} className={`bg-slate-900/80 border ${m.color} rounded-2xl p-5 shadow-md flex flex-col justify-between`}>
            <div className="text-slate-400 text-xs uppercase font-semibold tracking-wider">{m.label}</div>
            <div className="text-3xl font-extrabold my-2">{m.val}</div>
            <div className="text-xs text-slate-500">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Active Queue Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-100">Pending Analyst Review Queue</h2>
          <span className="text-xs text-slate-400 font-mono">Sorted by Risk Score</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/60 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Pattern Signature</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sampleCases.map(c => (
                <tr key={c.case_id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-indigo-400">{c.case_id}</td>
                  <td className="py-3.5 px-4 font-mono">{c.transaction_id}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono ${
                      c.risk_level === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-800/60' :
                      c.risk_level === 'HIGH' ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40' :
                      c.risk_level === 'MEDIUM' ? 'bg-amber-950 text-amber-400 border border-amber-800/60' :
                      'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                    }`}>
                      {c.risk_level}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-200">{c.risk_score.toFixed(2)}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs font-mono">
                      {c.pattern}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs text-amber-400 font-medium">
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onSelectCase(c.case_id)}
                      className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    >
                      Open Case
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
