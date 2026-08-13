import React, { useState, useEffect } from 'react';
import { ReportComparisonModal } from './ReportComparisonModal';
import { Scale, ShieldAlert, Search, ChevronRight } from 'lucide-react';

interface ReportsHistoryViewProps {
  onSelectCase?: (caseId: string) => void;
}

export const ReportsHistoryView: React.FC<ReportsHistoryViewProps> = ({ onSelectCase }) => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [compareState, setCompareState] = useState<{ caseId: string; vA: number; vB: number } | null>(null);

  const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append('case_id', searchQuery);
        if (selectedRisk !== 'ALL') params.append('risk_level', selectedRisk);

        const resp = await fetch(`${API_BASE_URL}/api/v1/investigations/reports?${params.toString()}`);
        if (resp.ok) {
          const data = await resp.json();
          setReports(data);
        }
      } catch (err) {
        console.error('Failed to load global reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [searchQuery, selectedRisk]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors font-mono">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">REPORTS</h1>
            <span className="bg-slate-100 dark:bg-[#0f1115] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#2a2e37] text-xs px-2.5 py-0.5 rounded-md font-bold">
              {reports.length} Report Versions
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-sans">
            Complete report version history across cases. Enforces rule: CURRENT REPORT = latest SUCCESSFUL report.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center font-mono transition-colors">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search Case ID or Hypothesis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-600"
          />
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="text-slate-500 uppercase font-bold">Risk Filter:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((risk) => (
            <button
              key={risk}
              onClick={() => setSelectedRisk(risk)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedRisk === risk
                  ? 'bg-teal-700 text-white font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-[#0f1115] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-[#2a2e37]'
              }`}
            >
              {risk}
            </button>
          ))}
        </div>
      </div>

      {/* Report Version List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs animate-pulse">
          Loading report version history...
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-12 text-center space-y-3 font-mono">
          <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-slate-800 dark:text-slate-200 font-bold text-sm">No Report Versions Found</h3>
          <p className="text-slate-500 text-xs">Try clearing search filters or generate a report via investigation run.</p>
        </div>
      ) : (
        <div className="space-y-4 font-mono">
          {reports.map((rep, idx) => (
            <div
              key={rep.report_id || idx}
              className="bg-white dark:bg-[#16191e] hover:bg-slate-50 dark:hover:bg-[#1e2229] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-6 space-y-4 shadow-sm transition-all"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="flex items-center space-x-3">
                  <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{rep.case_id}</span>
                  <span className="text-xs text-slate-500">({rep.transaction_id})</span>
                  <span className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800/40 text-xs px-2.5 py-0.5 rounded font-bold">
                    Version v{rep.version || 1}
                  </span>
                  {rep.is_current && (
                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 text-[10px] px-2 py-0.5 rounded font-bold">
                      CURRENT REPORT
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    rep.risk_level === 'CRITICAL' ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40' :
                    rep.risk_level === 'HIGH' ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40' :
                    rep.risk_level === 'MEDIUM' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40' :
                    'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                  }`}>
                    {rep.risk_level} ({rep.risk_score?.toFixed(2)})
                  </span>
                  <span className="text-xs text-slate-500">{new Date(rep.generated_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#0f1115] p-4 rounded-xl border border-slate-200 dark:border-[#2a2e37]">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Primary Hypothesis</span>
                <p className="text-xs text-slate-800 dark:text-slate-200 font-sans italic">"{rep.primary_hypothesis}"</p>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-200 dark:border-[#2a2e37]">
                <span className="text-slate-500">Recommendation: <strong className="text-teal-700 dark:text-teal-400">{rep.recommended_action}</strong></span>

                <div className="flex items-center space-x-3">
                  {rep.version > 1 && (
                    <button
                      onClick={() => setCompareState({ caseId: rep.case_id, vA: rep.version - 1, vB: rep.version })}
                      className="text-teal-700 dark:text-teal-400 hover:underline font-bold flex items-center space-x-1 text-xs"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Compare v{rep.version - 1} vs v{rep.version}</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (onSelectCase) onSelectCase(rep.case_id);
                    }}
                    className="text-slate-800 dark:text-slate-200 font-bold flex items-center space-x-1 text-xs"
                  >
                    <span>Open Case</span>
                    <ChevronRight className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comparison Modal */}
      {compareState && (
        <ReportComparisonModal
          caseId={compareState.caseId}
          versionA={compareState.vA}
          versionB={compareState.vB}
          onClose={() => setCompareState(null)}
        />
      )}
    </div>
  );
};
