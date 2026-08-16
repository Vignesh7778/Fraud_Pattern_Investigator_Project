import React, { useState, useEffect } from 'react';
import { ReportComparisonResult } from '../types';
import { compareReports } from '../api/client';
import { X, CheckCircle2, Scale } from 'lucide-react';

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
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans animate-fade-in">
      <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans transition-colors">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-[#2a2e37] flex items-center justify-between bg-slate-50 dark:bg-[#0f1115]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">REPORT VERSION COMPARISON</h2>
              <p className="text-xs text-slate-500 font-mono">
                {caseId} — Comparing Version v{versionA} vs Version v{versionB}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          {loading ? (
            <div className="py-20 text-center font-mono text-xs text-teal-600 dark:text-teal-400 animate-pulse space-y-2">
              <Scale className="w-8 h-8 mx-auto animate-bounce" />
              <div>Computing diff between Report v{versionA} and v{versionB}...</div>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-mono">
              {error}
            </div>
          ) : comparison ? (
            <div className="space-y-6">
              {/* Top Delta Summary Banner */}
              <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                <div className="p-4 bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-xl space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Version {comparison.version_a} (Prior)</div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                      {comparison.risk_level_a}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-[#0d9488]/10 border border-[#0d9488]/30 rounded-xl space-y-1">
                  <div className="text-[10px] text-teal-700 dark:text-teal-400 uppercase font-bold">Version {comparison.version_b} (Latest)</div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800/40">
                      {comparison.risk_level_b}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hypothesis Diff */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-teal-700 dark:text-teal-400 font-mono uppercase">Primary Hypothesis Progression</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="p-3.5 bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-xl italic">
                    "{comparison.primary_hypothesis_a}"
                  </div>
                  <div className="p-3.5 bg-slate-50 dark:bg-[#0f1115] border border-teal-500/30 rounded-xl italic font-semibold text-teal-700 dark:text-teal-300">
                    "{comparison.primary_hypothesis_b}"
                  </div>
                </div>
              </div>

              {/* Added Evidence Section */}
              {comparison.new_evidence && comparison.new_evidence.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono uppercase flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>New Evidence Added in Version {comparison.version_b} ({comparison.new_evidence.length})</span>
                  </div>
                  <div className="space-y-2 font-mono">
                    {comparison.new_evidence.map((ev: any, idx: number) => (
                      <div key={idx} className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between font-bold text-emerald-800 dark:text-emerald-300">
                          <span>{ev.evidence_id}</span>
                          <span>Confidence: {(ev.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-sans italic">"{ev.claim}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-[#2a2e37] bg-slate-50 dark:bg-[#0f1115] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs font-sans transition-all"
          >
            Close Diff Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
