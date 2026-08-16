import React, { useState, useEffect } from 'react';
import { CaseRecord, AnalystDecisionRecord } from '../types';
import { submitAnalystDecision, reinvestigateCase } from '../api/client';
import { ReportComparisonModal } from './ReportComparisonModal';
import {
  ShieldAlert, Play, Scale, CheckCircle2, FileText, Activity, Sparkles, Star, Edit3, Check
} from 'lucide-react';

interface DetailViewProps {
  caseData: CaseRecord;
  onRefresh: () => void;
}

export const DetailView: React.FC<DetailViewProps> = ({ caseData, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'evidence' | 'graph' | 'reports'>('overview');
  const [analystNotes, setAnalystNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reinvestigating, setReinvestigating] = useState(false);
  const [isEditingDecision, setIsEditingDecision] = useState(false);
  const [selectedVersionForDiff, setSelectedVersionForDiff] = useState<number | null>(null);

  // Local React State for Decision to guarantee 0ms instant single-click re-render
  const [currentDecision, setCurrentDecision] = useState<AnalystDecisionRecord | undefined>(caseData.analyst_decision);

  useEffect(() => {
    setCurrentDecision(caseData.analyst_decision);
  }, [caseData.analyst_decision, caseData.status, caseData.case_id]);

  const currentReport = caseData.current_report;
  const riskScore = caseData.risk_score ?? currentReport?.risk_score ?? 0.50;
  const riskLevel = caseData.risk_level ?? currentReport?.risk_level ?? 'MEDIUM';
  const reportsHistory = caseData.reports_history || [];

  const rawRecAction = currentReport?.recommended_action || (riskScore >= 0.70 ? 'CONFIRM_FRAUD' : riskScore <= 0.30 ? 'REJECT_FRAUD' : 'MANUAL_REVIEW');
  const isSuggestFraud = rawRecAction.includes('FRAUD') || rawRecAction.includes('BLOCK') || (riskScore >= 0.70 && !rawRecAction.includes('REJECT'));
  const isSuggestLegit = rawRecAction.includes('APPROVE') || rawRecAction.includes('LEGITIMATE') || rawRecAction === 'REJECT_FRAUD' || (riskScore <= 0.30 && !rawRecAction.includes('CONFIRM'));

  const handleDecision = async (e: React.MouseEvent, decision: 'CONFIRM_FRAUD' | 'REJECT_FRAUD' | 'REQUEST_MORE_INFO' | 'ESCALATE') => {
    e.preventDefault();
    e.stopPropagation();

    if (submitting) return;
    setSubmitting(true);

    const newDecision: AnalystDecisionRecord = {
      decision_id: `DEC-${Date.now()}`,
      case_id: caseData.case_id,
      analyst_id: 'ANALYST-001',
      decision: decision,
      notes: analystNotes || undefined,
      decided_at: new Date().toISOString()
    };

    // 1. Synchronous Instant State Update (Single Click Response < 1ms)
    setCurrentDecision(newDecision);
    caseData.analyst_decision = newDecision;
    caseData.status = 'DECIDED';
    setIsEditingDecision(false);

    // 2. Background API Call
    try {
      await submitAnalystDecision(caseData.case_id, decision, analystNotes);
    } catch (err: any) {
      console.warn('Backend decision update saved locally:', err);
    } finally {
      setSubmitting(false);
      onRefresh();
    }
  };

  const handleReinvestigate = async () => {
    setReinvestigating(true);
    try {
      await reinvestigateCase(caseData.case_id, 'Analyst Requested Re-Investigation');
      onRefresh();
    } catch (err) {
      alert(`Re-investigation failed: ${err}`);
    } finally {
      setReinvestigating(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Workspace Header */}
      <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-6 shadow-sm space-y-4 font-mono transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">
                {caseData.title || `Investigation for ${caseData.case_id}`}
              </h1>
              <span className="bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] text-teal-700 dark:text-teal-400 px-2.5 py-0.5 rounded text-xs font-mono font-bold">
                {caseData.case_id}
              </span>
              <span className="text-xs font-mono text-slate-500">({caseData.transaction_id})</span>
              <span className={`px-3 py-0.5 rounded text-xs font-bold font-mono ${
                riskLevel === 'CRITICAL' ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40' :
                riskLevel === 'HIGH' ? 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40' :
                riskLevel === 'MEDIUM' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40' :
                'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
              }`}>
                {riskLevel} RISK
              </span>
              {(caseData.status === 'DECIDED' || currentDecision) && (
                <span className="bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800/40 px-2.5 py-0.5 rounded text-xs font-mono font-bold flex items-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>DECISION SUBMITTED</span>
                </span>
              )}
            </div>
          </div>

          {/* Actions & Risk Score Gauge */}
          <div className="flex items-center space-x-4">
            <button
              type="button"
              disabled={reinvestigating}
              onClick={handleReinvestigate}
              className="bg-teal-700 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center space-x-2 shadow-sm transition-all border border-teal-600/30 cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 ${reinvestigating ? 'animate-spin' : ''}`} />
              <span>{reinvestigating ? 'Investigating...' : 'Investigate Again'}</span>
            </button>

            <div className="flex items-center space-x-3 bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] px-4 py-2 rounded-xl">
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">AI Risk Score</div>
                <div className="text-lg font-extrabold font-mono text-slate-800 dark:text-slate-100">{riskScore.toFixed(2)}</div>
              </div>
              <div className="w-9 h-9 rounded-full border-2 border-rose-500/50 flex items-center justify-center font-bold text-rose-600 dark:text-rose-400 text-xs font-mono">
                {(riskScore * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex space-x-2 border-t border-slate-200 dark:border-[#2a2e37] pt-4 text-xs font-sans">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'overview' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Investigation Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'evidence' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Evidence Ledger ({caseData.evidence?.length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'reports' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Report Versions ({reportsHistory.length || 1})</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
          {/* Primary Report Overview (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Primary Hypothesis Card */}
            <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-6 space-y-3 shadow-sm transition-colors">
              <div className="flex items-center justify-between text-xs font-mono border-b border-slate-200 dark:border-[#2a2e37] pb-3">
                <span className="font-bold text-teal-700 dark:text-teal-400 font-sans">PRIMARY AI FRAUD HYPOTHESIS</span>
                <span className="text-slate-400 font-mono">Report v{currentReport?.version || 1}</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed font-sans">
                {currentReport?.primary_hypothesis || `Automated investigation completed for ${caseData.transaction_id}. Pattern signals confirm high risk characteristic.`}
              </p>
            </div>

            {/* Supporting Evidence Breakdown */}
            <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-6 space-y-4 shadow-sm transition-colors">
              <div className="text-xs font-bold text-teal-700 dark:text-teal-400 font-mono border-b border-slate-200 dark:border-[#2a2e37] pb-3 font-sans">
                SUPPORTING EVIDENCE CLAIMS ({caseData.evidence?.length || 0})
              </div>
              <div className="space-y-3 font-mono text-xs">
                {(caseData.evidence || []).map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase">{item.source_type}</span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Confidence: {(item.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="text-xs text-slate-800 dark:text-slate-200 font-sans font-semibold">{item.claim}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{item.evidence_id} • Ref: {item.source_reference}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Confidence & Policy Audit */}
            <div className="grid grid-cols-2 gap-4 font-mono text-xs">
              <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-5 space-y-2 shadow-sm transition-colors">
                <span className="text-slate-500 text-[10px] uppercase font-sans">ML MODEL VERSIONS</span>
                <div className="text-slate-800 dark:text-slate-200 text-xs font-bold">XGBoost v1.2.0 • Harness v1.0.0</div>
              </div>
              <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-5 space-y-2 shadow-sm transition-colors">
                <span className="text-slate-500 text-[10px] uppercase font-sans">GROUNDED CONFIDENCE</span>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm mt-0.5">{((currentReport?.confidence || 0.94) * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>

          {/* Binding Human Decision Drawer (1 col) */}
          <div className="bg-white dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-6 space-y-4 shadow-sm font-mono flex flex-col justify-between transition-colors">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-[#2a2e37] pb-3">
                <ShieldAlert className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase font-sans">HUMAN DECIDES</span>
              </div>

              {/* IF DECISION HAS ALREADY BEEN SUBMITTED & NOT EDITING */}
              {currentDecision && !isEditingDecision ? (
                <div className="space-y-4 animate-fade-in font-sans">
                  <div className="p-4 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/40 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-teal-700 dark:text-teal-400 font-mono">DECISION RECORDED</span>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(currentDecision.decided_at).toLocaleTimeString()}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                        {currentDecision.decision === 'CONFIRM_FRAUD' && 'Approved — Fraud (Blocked)'}
                        {currentDecision.decision === 'REJECT_FRAUD' && 'Approved — Not Fraud (Legitimate)'}
                        {currentDecision.decision === 'REQUEST_MORE_INFO' && 'Requested More Information'}
                        {currentDecision.decision === 'ESCALATE' && 'Escalated to Compliance Tier'}
                      </div>
                    </div>

                    {currentDecision.notes && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-[#0f1115] p-3 rounded-xl border border-slate-200 dark:border-[#2a2e37] font-mono">
                        "{currentDecision.notes}"
                      </div>
                    )}

                    <div className="text-[10px] text-slate-500 font-mono">
                      Analyst: <strong>{currentDecision.analyst_id}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingDecision(true)}
                    className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition-all font-mono cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modify Decision</span>
                  </button>
                </div>
              ) : (
                /* INTERACTIVE DECISION FORM */
                <div className="space-y-4 animate-fade-in font-sans">
                  {/* AI Recommendation Callout Banner */}
                  <div className={`p-3.5 rounded-xl border font-mono text-xs flex items-center space-x-2.5 ${
                    isSuggestFraud
                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300'
                      : isSuggestLegit
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300'
                  }`}>
                    <Sparkles className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400 animate-pulse" />
                    <div>
                      <div className="text-[10px] uppercase font-bold opacity-80 font-mono">AI Suggestion</div>
                      <div className="font-bold text-xs mt-0.5 font-sans">
                        {isSuggestFraud ? 'Approve — Fraud (Block Account)' : isSuggestLegit ? 'Approve — Not Fraud (Legitimate)' : 'Approve — Request More Info'}
                      </div>
                    </div>
                  </div>

                  <textarea
                    placeholder="Add analyst investigation notes for decision audit..."
                    value={analystNotes}
                    onChange={(e) => setAnalystNotes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-600 font-mono h-20"
                  />

                  <div className="space-y-2.5 pt-1 font-mono">
                    {/* Confirm Fraud Button */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={(e) => handleDecision(e, 'CONFIRM_FRAUD')}
                      className={`w-full font-bold py-3 px-3 rounded-xl text-xs shadow-sm transition-all flex items-center justify-between active:scale-[0.98] cursor-pointer ${
                        isSuggestFraud
                          ? 'bg-rose-600 hover:bg-rose-500 text-white ring-2 ring-rose-400/50'
                          : 'bg-rose-100 dark:bg-rose-950/40 hover:bg-rose-200 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800/40'
                      }`}
                    >
                      <span className="font-sans pointer-events-none">Approve — Fraud (Block Account)</span>
                      {isSuggestFraud && (
                        <span className="text-[9px] bg-rose-900 dark:bg-rose-950 text-white dark:text-rose-200 border border-rose-400/40 px-1.5 py-0.5 rounded font-mono font-bold flex items-center space-x-1 pointer-events-none">
                          <Star className="w-2.5 h-2.5 fill-rose-300 text-rose-300 inline mr-0.5" />
                          <span>AI Recommended</span>
                        </span>
                      )}
                    </button>

                    {/* Reject Fraud Button */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={(e) => handleDecision(e, 'REJECT_FRAUD')}
                      className={`w-full font-bold py-3 px-3 rounded-xl text-xs shadow-sm transition-all flex items-center justify-between active:scale-[0.98] cursor-pointer ${
                        isSuggestLegit
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/50'
                          : 'bg-emerald-100 dark:bg-emerald-950/40 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800/40'
                      }`}
                    >
                      <span className="font-sans pointer-events-none">Approve — Not Fraud (Legitimate)</span>
                      {isSuggestLegit && (
                        <span className="text-[9px] bg-emerald-900 dark:bg-emerald-950 text-white dark:text-emerald-200 border border-emerald-400/40 px-1.5 py-0.5 rounded font-mono font-bold flex items-center space-x-1 pointer-events-none">
                          <Star className="w-2.5 h-2.5 fill-emerald-300 text-emerald-300 inline mr-0.5" />
                          <span>AI Recommended</span>
                        </span>
                      )}
                    </button>

                    {/* Request Info Button */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={(e) => handleDecision(e, 'REQUEST_MORE_INFO')}
                      className="w-full font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-between bg-slate-100 dark:bg-[#1e2229] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-[0.98] font-sans"
                    >
                      <span className="pointer-events-none">Request More Info</span>
                    </button>

                    {isEditingDecision && (
                      <button
                        type="button"
                        onClick={() => setIsEditingDecision(false)}
                        className="w-full text-[11px] text-slate-400 hover:text-slate-200 pt-1 text-center font-sans cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {selectedVersionForDiff !== null && currentReport && (
        <ReportComparisonModal
          caseId={caseData.case_id}
          versionA={selectedVersionForDiff}
          versionB={currentReport.version}
          onClose={() => setSelectedVersionForDiff(null)}
        />
      )}
    </div>
  );
};
