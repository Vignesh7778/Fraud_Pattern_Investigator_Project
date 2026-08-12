import React, { useState } from 'react';

interface SearchViewProps {
  onSelectCase: (caseId: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ onSelectCase }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');

  const cases = [
    { case_id: 'CASE-8910', transaction_id: 'TXN-9001', risk_level: 'CRITICAL', risk_score: 0.94, status: 'HUMAN_REVIEW', pattern: 'shared_device', created: '2026-08-12 12:30' },
    { case_id: 'CASE-8911', transaction_id: 'TXN-9002', risk_level: 'HIGH', risk_score: 0.78, status: 'HUMAN_REVIEW', pattern: 'velocity', created: '2026-08-12 13:10' },
    { case_id: 'CASE-8912', transaction_id: 'TXN-9003', risk_level: 'MEDIUM', risk_score: 0.52, status: 'FINAL_DECISION', pattern: 'legitimate_shared_device', created: '2026-08-12 14:05' },
    { case_id: 'CASE-8913', transaction_id: 'TXN-9004', risk_level: 'LOW', risk_score: 0.12, status: 'FINAL_DECISION', pattern: 'normal_behavior', created: '2026-08-12 14:45' }
  ];

  const filtered = cases.filter(c => {
    const matchesSearch = c.case_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.pattern.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'ALL' || c.risk_level === filterRisk;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h1 className="text-xl font-bold text-slate-100">Investigation Case Search & Filtering</h1>

        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by Case ID, Txn ID, or Pattern..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 flex-1"
          />

          <select
            value={filterRisk}
            onChange={e => setFilterRisk(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800/60 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Case ID</th>
              <th className="py-3 px-4">Transaction ID</th>
              <th className="py-3 px-4">Risk Level</th>
              <th className="py-3 px-4">Risk Score</th>
              <th className="py-3 px-4">Detected Pattern</th>
              <th className="py-3 px-4">Created Timestamp</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map(c => (
              <tr key={c.case_id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-4 font-mono font-semibold text-indigo-400">{c.case_id}</td>
                <td className="py-3.5 px-4 font-mono">{c.transaction_id}</td>
                <td className="py-3.5 px-4">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono ${
                    c.risk_level === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                    c.risk_level === 'HIGH' ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40' :
                    c.risk_level === 'MEDIUM' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                    'bg-emerald-950 text-emerald-400 border border-emerald-800'
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
                <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{c.created}</td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => onSelectCase(c.case_id)}
                    className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  >
                    Open Workspace
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
