import React, { useState } from 'react';
import { InvestigationState } from '../types';
import { submitAnalystDecision } from '../api/client';

interface DetailViewProps {
  caseData: InvestigationState;
  onRefresh: () => void;
}

export const DetailView: React.FC<DetailViewProps> = ({ caseData, onRefresh }) => {
  const [activeSubTab, setActiveSubTab] = useState<'evidence' | 'graph' | 'policies' | 'audit'>('evidence');
  const [analystNotes, setAnalystNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const report = caseData.report;
  const riskScore = caseData.risk_score ?? report?.risk_score ?? 0.50;
  const riskLevel = caseData.risk_level ?? report?.risk_level ?? 'MEDIUM';

  const handleDecision = async (decision: 'CONFIRM_FRAUD' | 'REJECT_FRAUD' | 'REQUEST_MORE_INFO') => {
    setSubmitting(true);
    try {
      await submitAnalystDecision(caseData.case_id, decision, analystNotes);
      onRefresh();
    } catch (err) {
      alert(`Error submitting decision: ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Principle Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-100 font-mono">{caseData.case_id}</h1>
            <span className="text-sm font-mono text-slate-400">({caseData.transaction_id})</span>
            <span className={`px-3 py-1 rounded-md text-xs font-bold font-mono ${
              riskLevel === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
              riskLevel === 'HIGH' ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40' :
              riskLevel === 'MEDIUM' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
              'bg-emerald-950 text-emerald-400 border border-emerald-800'
            }`}>
              {riskLevel} RISK
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">{caseData.objective}</p>
        </div>

        {/* Risk Score Gauge */}
        <div className="flex items-center space-x-4 bg-slate-950/60 border border-slate-800 px-5 py-3 rounded-xl">
          <div className="text-right">
            <div className="text-xs uppercase font-semibold text-slate-400">AI Risk Score</div>
            <div className="text-2xl font-extrabold font-mono text-slate-100">{riskScore.toFixed(2)}</div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-rose-500/30 flex items-center justify-center font-bold text-rose-400 text-xs font-mono">
            {(riskScore * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* AI Recommendation & Human Decision Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Investigation Finding (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-semibold text-slate-100">AI Synthesis & Hypotheses</h2>
            <span className="text-xs font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded">
              Grounded AI Finding
            </span>
          </div>

          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Primary Hypothesis</div>
            <p className="text-slate-200 font-medium text-sm mt-1">
              {report?.primary_hypothesis || "Transaction exhibits risk indicators based on historical thresholds."}
            </p>
          </div>

          {report?.alternative_hypotheses && report.alternative_hypotheses.length > 0 && (
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Alternative Hypotheses</div>
              <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 mt-1">
                {report.alternative_hypotheses.map((alt, i) => (
                  <li key={i}>{alt}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
            <div>
              <div className="text-xs text-slate-400">AI Recommended Action</div>
              <div className="text-sm font-bold font-mono text-indigo-400 mt-0.5">
                {report?.recommended_action || "MANUAL_REVIEW_FLAG"}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Grounded Confidence</div>
              <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                {((report?.confidence ?? 0.92) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* Human Analyst Decision Panel (1 col) */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-900/50 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm uppercase tracking-wider mb-2">
              <span>HUMAN DECIDES</span>
            </div>
            <h3 className="text-base font-semibold text-slate-100">Analyst Decision Drawer</h3>
            <p className="text-xs text-slate-400 mt-1">
              Review evidence below and submit the binding financial resolution.
            </p>

            {caseData.analyst_decision ? (
              <div className="mt-4 p-4 bg-slate-950 border border-emerald-500/40 rounded-xl space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Decided Resolution</span>
                  <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-bold">
                    RESOLVED & COMPLETED
                  </span>
                </div>
                <div className={`text-base font-extrabold font-mono px-3 py-2 rounded-lg text-center ${
                  caseData.analyst_decision.decision === 'CONFIRM_FRAUD' ? 'bg-rose-950/80 text-rose-400 border border-rose-800' :
                  caseData.analyst_decision.decision === 'REJECT_FRAUD' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' :
                  'bg-amber-950/80 text-amber-400 border border-amber-800'
                }`}>
                  {caseData.analyst_decision.decision}
                </div>
                <div className="text-xs text-slate-400 flex justify-between">
                  <span>Analyst: {caseData.analyst_decision.analyst_id}</span>
                  <span>{caseData.analyst_decision.decided_at ? new Date(caseData.analyst_decision.decided_at).toLocaleTimeString() : 'Recorded'}</span>
                </div>

                {caseData.analyst_decision.notes && (
                  <p className="text-xs text-slate-300 italic bg-slate-900/60 p-2 rounded border border-slate-800">
                    "{caseData.analyst_decision.notes}"
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                <textarea
                  placeholder="Add analyst investigation notes..."
                  value={analystNotes}
                  onChange={e => setAnalystNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 h-20"
                />

                <div className="space-y-2">
                  <button
                    disabled={submitting}
                    onClick={() => handleDecision('CONFIRM_FRAUD')}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold py-2 rounded-xl text-xs shadow-lg shadow-rose-600/20 transition-all"
                  >
                    Confirm Fraud
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => handleDecision('REJECT_FRAUD')}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    Reject Fraud (Legitimate)
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => handleDecision('REQUEST_MORE_INFO')}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 rounded-xl text-xs border border-slate-700 transition-all"
                  >
                    Request More Info
                  </button>
                </div>
              </div>
            )}

          </div>

          <div className="text-center text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/80">
            FPI Harness v1.0 • Mandatory Audit Trail
          </div>
        </div>
      </div>

      {/* Sub-Tabs Workspace */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex space-x-2 border-b border-slate-800 pb-3">
          {[
            { id: 'evidence', label: `Evidence (${caseData.evidence.length})` },
            { id: 'graph', label: `Relationships (${caseData.linked_entities.length})` },
            { id: 'policies', label: 'RAG Policy Docs' },
            { id: 'audit', label: `Audit Log (${caseData.tool_history.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium text-xs transition-all ${
                activeSubTab === tab.id
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Evidence Explorer */}
        {activeSubTab === 'evidence' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">Collected Evidence Items</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {caseData.evidence.map((e, idx) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-indigo-400 font-semibold">{e.evidence_id}</span>
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono">
                      {e.source_type}
                    </span>
                  </div>
                  <p className="text-slate-200 text-xs">{e.claim}</p>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800/60 pt-2 font-mono">
                    <span>Ref: {e.source_reference}</span>
                    <span>Confidence: {(e.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Relationship Graph */}
        {activeSubTab === 'graph' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">Discovered Entity Network Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {caseData.linked_entities.map((g, idx) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="text-xs text-violet-400 font-semibold font-mono">{g.entity_type}</div>
                  <div className="text-sm font-bold text-slate-100 font-mono">{g.entity_id}</div>
                  <div className="text-xs text-slate-400">Link: {g.relationship}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Policy RAG */}
        {activeSubTab === 'policies' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">Grounded RAG Policy Documents</h3>
            <div className="space-y-2">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-1">
                <div className="text-xs font-bold text-indigo-400 font-mono">POL-DEVICE-001 • Shared Device Rules</div>
                <p className="text-xs text-slate-300">
                  "If a single device hash is observed operating across more than 4 distinct customer accounts within a rolling 24-hour window, all subsequent high-value transactions (&gt; $500) originating from that device must be flagged for manual review."
                </p>

              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Audit Timeline */}
        {activeSubTab === 'audit' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">Chronological State Machine Audit Log</h3>
            <div className="space-y-2">
              {caseData.tool_history.map((t, idx) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs">
                  <div className="space-x-3">
                    <span className="font-mono text-emerald-400 font-semibold">{t.tool_name}</span>
                    <span className="text-slate-400 font-mono">{t.executed_at}</span>
                  </div>
                  <div className="space-x-3">
                    <span className="text-slate-400 font-mono">{t.duration_ms.toFixed(1)}ms</span>
                    <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-mono text-[10px]">
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
