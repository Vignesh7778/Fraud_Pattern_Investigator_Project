import React, { useState, useEffect } from 'react';
import { ReportComparisonResult } from '../types';
import { compareReports } from '../api/client';
import { X, ArrowRight, CheckCircle2, Scale } from 'lucide-react';


interface ReportComparisonModalProps {
  caseId: string;
  versionA: number;
  versionB: number;
  onClose: () => void;
}

export const ReportComparisonModal: React.FC<ReportComparisonModalProps> = ({
  caseId,
  versionA,
  versionB,
  onClose
}) => {
  const [comparison, setComparison] = useState<ReportComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDiff() {
      setLoading(true);
      try {
        const res = await compareReports(caseId, versionA, versionB);
        setComparison(res);
      } catch (err: any) {
        setError(err.message || 'Failed to compare reports');
      } finally {
        setLoading(false);
      }
    }
    loadDiff();
  }, [caseId, versionA, versionB]);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-mono">REPORT VERSION COMPARISON</h2>
              <p className="text-xs text-slate-400 font-mono">
                {caseId} — Comparing Version {versionA} vs Version {versionB}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-400 font-mono text-xs animate-pulse">
              Computing report version diff analysis...
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs font-mono">
              Error: {error}
            </div>
          ) : comparison ? (
            <>
              {/* Risk Delta Gauge Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                <div className="text-center p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Version {versionA} Risk</div>
                  <div className="text-lg font-bold font-mono text-slate-200 mt-1">{comparison.risk_level_a}</div>
                </div>

                <div className="flex flex-col items-center justify-center p-3 bg-indigo-950/40 rounded-lg border border-indigo-800/40">
                  <div className="text-[10px] text-indigo-300 uppercase font-mono">Score Delta</div>
                  <div className={`text-xl font-extrabold font-mono mt-1 ${
                    comparison.risk_score_diff > 0 ? 'text-rose-400' : comparison.risk_score_diff < 0 ? 'text-emerald-400' : 'text-slate-300'
                  }`}>
                    {comparison.risk_score_diff > 0 ? `+${comparison.risk_score_diff.toFixed(2)}` : comparison.risk_score_diff.toFixed(2)}
                  </div>
                </div>

                <div className="text-center p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Version {versionB} Risk</div>
                  <div className="text-lg font-bold font-mono text-indigo-400 mt-1">{comparison.risk_level_b}</div>
                </div>
              </div>

              {/* Primary Hypothesis Comparison */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase font-mono">Primary Hypothesis Diff</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400">Version {versionA}:</span>
                    <p className="text-xs text-slate-300 italic">"{comparison.primary_hypothesis_a}"</p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-indigo-900/60 space-y-1">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold">Version {versionB} (Newer):</span>
                    <p className="text-xs text-slate-100 font-medium">"{comparison.primary_hypothesis_b}"</p>
                  </div>
                </div>
              </div>

              {/* Recommendation Diff */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase font-mono">AI Recommendation Delta</h3>
                <div className="flex items-center justify-around bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs">
                  <span className="text-slate-400 font-semibold">{comparison.recommendation_a}</span>
                  <ArrowRight className="w-4 h-4 text-indigo-400" />
                  <span className="text-indigo-300 font-bold">{comparison.recommendation_b}</span>
                </div>
              </div>

              {/* Evidence Additions */}
              {comparison.new_evidence && comparison.new_evidence.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase font-mono flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>New Evidence Discovered in Version {versionB} ({comparison.new_evidence.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {comparison.new_evidence.map((ev, i) => (
                      <div key={i} className="bg-emerald-950/30 border border-emerald-800/40 p-3 rounded-xl text-xs text-slate-200 space-y-1 font-mono">
                        <div className="flex justify-between text-[10px] text-emerald-400">
                          <span>{ev.source_type}</span>
                          <span>{ev.evidence_id}</span>
                        </div>
                        <p className="text-slate-300">{ev.claim}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 text-right">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-5 rounded-xl text-xs border border-slate-700 transition-all font-mono"
          >
            Close Diff Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
