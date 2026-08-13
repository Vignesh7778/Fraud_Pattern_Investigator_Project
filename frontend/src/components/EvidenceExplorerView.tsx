import React, { useState, useEffect } from 'react';
import { EvidenceItem } from '../types';
import { Search, ShieldAlert, FileText, ChevronRight, X, CheckCircle2, AlertTriangle } from 'lucide-react';


interface EvidenceExplorerViewProps {
  onSelectCase?: (caseId: string) => void;
}

export const EvidenceExplorerView: React.FC<EvidenceExplorerViewProps> = ({ onSelectCase }) => {
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);

  const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

  const loadEvidence = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedSource !== 'ALL') params.append('source_type', selectedSource);

      const resp = await fetch(`${API_BASE_URL}/api/v1/investigations/evidence?${params.toString()}`);
      if (resp.ok) {
        const data = await resp.json();
        setEvidenceList(data);
      }
    } catch (err) {
      console.error('Failed to load global evidence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvidence();
  }, [searchQuery, selectedSource]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-slate-900/90 dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors font-mono">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">EVIDENCE EXPLORER</h1>
            <span className="bg-slate-100 dark:bg-[#0f1115] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#2a2e37] text-xs px-2.5 py-0.5 rounded-md font-bold">
              {evidenceList.length} Verified Claims
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-sans">
            Global evidence repository connecting transaction payloads, ML feature contributions, pattern detections, and graph links.
          </p>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-slate-900/90 dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center font-mono">
        <div className="relative w-full md:w-96">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search evidence ID, Case ID, or Claim..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-600"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <span className="text-[11px] text-slate-500 uppercase font-bold mr-1">Source:</span>
          {['ALL', 'transaction_data', 'pattern_engine', 'graph_analysis', 'ml_model', 'file_upload'].map((src) => (
            <button
              key={src}
              onClick={() => setSelectedSource(src)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all shrink-0 ${
                selectedSource === src
                  ? 'bg-teal-700 text-white font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-[#0f1115] text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-[#2a2e37]'
              }`}
            >
              {src.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Evidence Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs animate-pulse">
          Loading global evidence repository from database...
        </div>
      ) : evidenceList.length === 0 ? (
        <div className="bg-slate-900/90 dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-12 text-center space-y-3 font-mono">
          <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-slate-800 dark:text-slate-200 font-bold text-sm">No Evidence Claims Found</h3>
          <p className="text-slate-500 text-xs">Try clearing search filters or run an investigation to generate evidence.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {evidenceList.map((ev) => {
            const isHighConfidence = ev.confidence >= 0.85;

            return (
              <div
                key={ev.evidence_id}
                onClick={() => setSelectedEvidence(ev)}
                className="bg-slate-900/90 dark:bg-[#16191e] hover:bg-slate-100 dark:hover:bg-[#1e2229] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-5 space-y-4 shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 bg-teal-950/30 border border-teal-800/30 px-2 py-0.5 rounded">
                      {ev.source_type}
                    </span>
                    <span className="text-[10px] text-slate-500">{ev.evidence_id}</span>
                  </div>

                  <div className="text-xs text-slate-500 font-mono flex items-center space-x-1">
                    <span>Case:</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectCase) onSelectCase(ev.case_id);
                      }}
                      className="text-slate-800 dark:text-slate-200 font-bold underline hover:text-teal-600"
                    >
                      {ev.case_id}
                    </button>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-200 font-medium line-clamp-3 italic">
                    "{ev.claim}"
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-[#2a2e37] flex items-center justify-between text-[10px] font-mono">
                  {isHighConfidence ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified ({(ev.confidence * 100).toFixed(0)}%)</span>
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Needs Review ({(ev.confidence * 100).toFixed(0)}%)</span>
                    </span>
                  )}

                  <span className="text-teal-700 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform flex items-center font-bold">
                    Inspect Details <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Evidence Detail Modal Drawer */}
      {selectedEvidence && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans animate-fade-in">
          <div className="bg-slate-900/95 dark:bg-[#16191e]/95 border border-slate-200 dark:border-[#2a2e37] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden font-mono">
            <div className="p-5 border-b border-slate-200 dark:border-[#2a2e37] flex justify-between items-center bg-slate-100 dark:bg-[#0f1115]">
              <div className="flex items-center space-x-3">
                <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <div>
                  <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100">{selectedEvidence.evidence_id}</h2>
                  <p className="text-[10px] text-slate-500">Source: {selectedEvidence.source_reference}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEvidence(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Evidentiary Claim</span>
                <div className="bg-slate-100 dark:bg-[#0f1115] p-3.5 rounded-xl border border-slate-200 dark:border-[#2a2e37] text-slate-800 dark:text-slate-200 font-sans font-medium italic">
                  "{selectedEvidence.claim}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-100 dark:bg-[#0f1115] p-3 rounded-xl border border-slate-200 dark:border-[#2a2e37] text-[11px]">
                <div>
                  <span className="text-slate-500">Case ID:</span>
                  <div className="text-slate-800 dark:text-slate-200 font-bold">{selectedEvidence.case_id}</div>
                </div>
                <div>
                  <span className="text-slate-500">Confidence Score:</span>
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold">{(selectedEvidence.confidence * 100).toFixed(0)}%</div>
                </div>
              </div>

              {selectedEvidence.value_reference && Object.keys(selectedEvidence.value_reference).length > 0 && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Structured Payload</span>
                  <pre className="bg-slate-100 dark:bg-[#0f1115] p-3 rounded-xl border border-slate-200 dark:border-[#2a2e37] text-[10px] text-teal-700 dark:text-teal-400 overflow-x-auto max-h-36">
                    {JSON.stringify(selectedEvidence.value_reference, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-[#2a2e37] bg-slate-100 dark:bg-[#0f1115] text-right">
              <button
                onClick={() => setSelectedEvidence(null)}
                className="bg-slate-200 dark:bg-[#1e2229] hover:bg-slate-300 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-xl text-xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
