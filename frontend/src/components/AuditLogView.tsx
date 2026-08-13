import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');
  const [page, setPage] = useState(0);

  const limit = 25;
  const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedEventType !== 'ALL') params.append('event_type', selectedEventType);
      params.append('limit', limit.toString());
      params.append('offset', (page * limit).toString());

      const resp = await fetch(`${API_BASE_URL}/api/v1/audit/logs?${params.toString()}`);
      if (resp.ok) {
        const data = await resp.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [searchQuery, selectedEventType, page]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-slate-900/90 dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors font-mono">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">AUDIT LOG</h1>
            <span className="bg-slate-100 dark:bg-[#0f1115] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#2a2e37] text-xs px-2.5 py-0.5 rounded-md font-mono flex items-center space-x-1 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Append-Only Compliance Trail</span>
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-sans">
            Immutable log of all investigation lifecycle events, tool calls, model inferences, analyst notes, and human decisions.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center font-mono">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search event type, actor, or case ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-600"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto text-xs">
          <span className="text-slate-500 uppercase font-bold">Event Type:</span>
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-600"
          >
            <option value="ALL">All Event Types</option>
            <option value="HUMAN_DECISION">Human Decisions</option>
            <option value="TOOL_CALL">Tool Executions</option>
            <option value="LLM_CALL">LLM Calls</option>
            <option value="NOTE_ADDED">Analyst Notes</option>
            <option value="STATUS_CHANGE">Status Changes</option>
            <option value="REINVESTIGATION_TRIGGERED">Reinvestigations</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs animate-pulse">
          Querying immutable audit log trail...
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-slate-900/90 dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-12 text-center text-slate-400 font-mono text-xs">
          No audit log events match the specified search parameters.
        </div>
      ) : (
        <div className="bg-slate-900/90 dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl shadow-sm overflow-hidden font-mono">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-[#0f1115] text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-[#2a2e37]">
                <tr>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Case ID</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Description / Details</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#2a2e37]">
                {logs.map((log, idx) => (
                  <tr key={log.event_id || idx} className="hover:bg-slate-100 dark:hover:bg-[#1e2229] transition-colors">
                    <td className="py-3 px-4 font-bold text-teal-700 dark:text-teal-400 font-mono">{log.event_id || `AUD-${idx+1}`}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.event_type === 'HUMAN_DECISION' ? 'bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-800/40' :
                        log.event_type === 'TOOL_CALL' ? 'bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-800/40' :
                        'bg-slate-100 dark:bg-[#0f1115] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#2a2e37]'
                      }`}>
                        {log.event_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{log.case_id || 'SYSTEM'}</td>
                    <td className="py-3 px-4 text-slate-500">{log.user_id || 'ANALYST-001'}</td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200 max-w-md truncate font-sans">
                      {log.details?.description || JSON.stringify(log.details)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 text-[10px]">
                      {log.timestamp ? (
                        typeof log.timestamp === 'number'
                          ? new Date(log.timestamp * 1000).toLocaleString()
                          : new Date(log.timestamp).toLocaleString()
                      ) : 'Recent'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 bg-slate-100 dark:bg-[#0f1115] border-t border-slate-200 dark:border-[#2a2e37] flex items-center justify-between text-xs">
            <span className="text-slate-500">Page {page + 1} • Showing {logs.length} events</span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                className="px-3 py-1.5 bg-slate-200 dark:bg-[#16191e] border border-slate-300 dark:border-[#2a2e37] rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4 inline" /> Previous
              </button>
              <button
                disabled={logs.length < limit}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-[#16191e] border border-slate-300 dark:border-[#2a2e37] rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-40"
              >
                Next <ChevronRight className="w-4 h-4 inline" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
