import React, { useState, useEffect } from 'react';
import { CaseRecord } from '../types';
import { fetchCaseLibrary } from '../api/client';
import { Search, ChevronRight, PlusCircle } from 'lucide-react';

interface CaseLibraryViewProps {
  onSelectCase: (caseId: string) => void;
  onOpenIngestModal: () => void;
}

export const CaseLibraryView: React.FC<CaseLibraryViewProps> = ({
  onSelectCase,
  onOpenIngestModal
}) => {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  useEffect(() => {
    async function loadCases() {
      setLoading(true);
      try {
        const data = await fetchCaseLibrary(searchQuery, selectedRisk, selectedStatus);
        setCases(data);
      } catch (err) {
        console.error('Failed to load case library:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCases();
  }, [searchQuery, selectedRisk, selectedStatus]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors font-mono">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">CASES</h1>
            <span className="bg-slate-100 dark:bg-[#0f1115] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#2a2e37] text-xs px-2.5 py-0.5 rounded-md font-bold">
              {cases.length} Saved Cases
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-sans">
            Enterprise case repository storing persistent investigation runs, report versions, and evidence claims.
          </p>
        </div>

        <button
          onClick={onOpenIngestModal}
          className="bg-teal-700 hover:bg-teal-600 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center space-x-2 shadow-sm transition-all border border-teal-600/30"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ New Investigation</span>
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center font-mono transition-colors">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search Case ID, Title, or Txn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-600"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto text-xs">
          <span className="text-[11px] text-slate-500 uppercase font-bold">Risk:</span>
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-600"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          <span className="text-[11px] text-slate-500 uppercase font-bold ml-2">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="HUMAN_REVIEW">Pending Human Review</option>
            <option value="DECIDED">Decided</option>
            <option value="REPORT_READY">Report Ready</option>
          </select>
        </div>
      </div>

      {/* Enterprise Data Table / List Hybrid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs animate-pulse">
          Loading case repository from database...
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-12 text-center text-slate-400 font-mono text-xs">
          No cases match the specified filters.
        </div>
      ) : (
        <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl shadow-sm overflow-hidden font-mono transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-[#0f1115] text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-[#2a2e37]">
                <tr>
                  <th className="py-3 px-4">Case ID</th>
                  <th className="py-3 px-4">Case Title</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Evidence</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#2a2e37]">
                {cases.map((c) => {
                  const currentReport = c.current_report;
                  const riskLevel = c.risk_level || currentReport?.risk_level || 'MEDIUM';
                  const riskScore = c.risk_score ?? currentReport?.risk_score ?? 0.50;

                  return (
                    <tr
                      key={c.case_id}
                      onClick={() => onSelectCase(c.case_id)}
                      className="hover:bg-slate-50 dark:hover:bg-[#1e2229] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-bold text-teal-700 dark:text-teal-400 font-mono">{c.case_id}</td>
                      <td className="py-3 px-4 font-sans font-semibold text-slate-800 dark:text-slate-100 max-w-xs truncate">
                        {c.title || `Investigation for ${c.case_id}`}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          riskLevel === 'CRITICAL' ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40' :
                          riskLevel === 'HIGH' ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40' :
                          riskLevel === 'MEDIUM' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40' :
                          'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                        }`}>
                          {riskLevel}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold font-mono text-slate-800 dark:text-slate-200">{riskScore.toFixed(2)}</td>
                      <td className="py-3 px-4 text-slate-500">{c.status}</td>
                      <td className="py-3 px-4 text-slate-500">{c.evidence?.length || 0} claims</td>
                      <td className="py-3 px-4 text-right">
                        <button className="text-teal-700 dark:text-teal-400 hover:underline font-bold text-[11px] inline-flex items-center">
                          Inspect <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
