import React, { useState } from 'react';
import { CaseRecord } from '../types';
import { submitAnalystDecision, reinvestigateCase } from '../api/client';
import { ReportComparisonModal } from './ReportComparisonModal';
import {
  ShieldAlert, Play, Scale, CheckCircle2, FileText, Network, Activity, Sparkles, Star
} from 'lucide-react';


interface DetailViewProps {
  caseData: CaseRecord;
  onRefresh: () => void;
}

export const DetailView: React.FC<DetailViewProps> = ({ caseData, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'evidence' | 'graph' | 'reports' | 'notes'>('overview');
  const [analystNotes, setAnalystNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reinvestigating, setReinvestigating] = useState(false);
  const [selectedVersionForDiff, setSelectedVersionForDiff] = useState<number | null>(null);

  const currentReport = caseData.current_report;
  const riskScore = caseData.risk_score ?? currentReport?.risk_score ?? 0.50;
  const riskLevel = caseData.risk_level ?? currentReport?.risk_level ?? 'MEDIUM';
  const reportsHistory = caseData.reports_history || [];

  const rawRecAction = currentReport?.recommended_action || (riskScore >= 0.70 ? 'CONFIRM_FRAUD' : riskScore <= 0.30 ? 'REJECT_FRAUD' : 'MANUAL_REVIEW');
  const isSuggestFraud = rawRecAction.includes('FRAUD') || rawRecAction.includes('BLOCK') || rawRecAction.includes('REJECT') === false && riskScore >= 0.70;
  const isSuggestLegit = rawRecAction.includes('APPROVE') || rawRecAction.includes('LEGITIMATE') || rawRecAction === 'REJECT_FRAUD' || riskScore <= 0.30;

  const handleDecision = async (decision: 'CONFIRM_FRAUD' | 'REJECT_FRAUD' | 'REQUEST_MORE_INFO' | 'ESCALATE') => {
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
      <div className="bg-slate-900/90 dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-6 shadow-sm space-y-4 font-mono transition-colors">
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
                riskLevel === 'CRITICAL' ? 'bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-800/40' :
                riskLevel === 'HIGH' ? 'bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-800/40' :
                riskLevel === 'MEDIUM' ? 'bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-800/40' :
                'bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-800/40'
              }`}>
                {riskLevel} RISK
              </span>
            </div>
          </div>

          {/* Actions & Risk Score Gauge */}
          <div className="flex items-center space-x-4">
            <button
              disabled={reinvestigating}
              onClick={handleReinvestigate}
              className="bg-teal-700 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center space-x-2 shadow-sm transition-all border border-teal-600/30"
            >
              <Play className={`w-3.5 h-3.5 ${reinvestigating ? 'animate-spin' : ''}`} />
              <span>{reinvestigating ? 'Investigating...' : 'Investigate Again'}</span>
            </button>

            <div className="flex items-center space-x-3 bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] px-4 py-2 rounded-xl">
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

        {/* Current Report Banner */}
        {currentReport && (
          <div className="bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-xl p-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex items-center space-x-3 text-xs">
              <span className="bg-teal-700 text-white font-bold text-[10px] px-2 py-0.5 rounded">
                CURRENT REPORT • v{currentReport.version}
              </span>
              <span className="text-slate-500 text-[11px]">Generated: {new Date(currentReport.generated_at).toLocaleString()}</span>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="text-slate-500">Total Versions: {reportsHistory.length}</span>
              {reportsHistory.length > 1 && (
                <button
                  onClick={() => setSelectedVersionForDiff(currentReport.version - 1)}
                  className="text-teal-700 dark:text-teal-400 hover:underline font-bold text-[11px] inline-flex items-center space-x-1"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Compare v{currentReport.version - 1} vs v{currentReport.version}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-[#2a2e37] pt-2 font-mono text-xs overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: FileText },
            { id: 'timeline', label: `Investigation Runs (${caseData.investigation_runs?.length || 1})`, icon: Activity },
            { id: 'evidence', label: `Evidence (${caseData.evidence?.length || 0})`, icon: CheckCircle2 },
            { id: 'graph', label: 'Graph Relationships', icon: Network },
            { id: 'reports', label: `Report History (v${currentReport?.version || 1})`, icon: Scale },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-4 font-semibold flex items-center space-x-2 border-b-2 transition-all shrink-0 ${
                  isActive
                    ? 'border-teal-600 text-teal-700 dark:text-teal-400 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Area */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
          {/* Main Case Findings Panel (2 cols) */}
          <div className="lg:col-span-2 bg-slate-900/90 dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-6 space-y-6 shadow-sm font-mono">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2a2e37] pb-3">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">AI Grounded Findings</h2>
              <span className="text-xs text-teal-700 dark:text-teal-400 font-bold">Report v{currentReport?.version || 1} CURRENT</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">PRIMARY HYPOTHESIS</span>
              <div className="bg-slate-100 dark:bg-[#0f1115] p-4 rounded-xl border border-slate-200 dark:border-[#2a2e37] text-slate-800 dark:text-slate-100 font-sans italic text-sm font-medium">
                "{currentReport?.primary_hypothesis || 'AI Risk Engine completed evaluation.'}"
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-100 dark:bg-[#0f1115] p-4 rounded-xl border border-slate-200 dark:border-[#2a2e37] text-xs">
              <div>
                <span className="text-slate-500 text-[10px]">AI RECOMMENDED ACTION</span>
                <div className="text-teal-700 dark:text-teal-400 font-bold text-sm mt-0.5">
                  {isSuggestFraud ? 'APPROVE - FRAUD' : isSuggestLegit ? 'APPROVE - NOT FRAUD' : 'MANUAL REVIEW'}
                </div>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">GROUNDED CONFIDENCE</span>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm mt-0.5">{((currentReport?.confidence || 0.92) * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>

          {/* Binding Human Decision Drawer (1 col) */}
          <div className="bg-slate-900/90 dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl p-6 space-y-4 shadow-sm font-mono flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-[#2a2e37] pb-3">
                <ShieldAlert className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase">HUMAN DECIDES</span>
              </div>

              {/* AI Recommendation Callout Banner */}
              <div className={`p-3 rounded-xl border font-mono text-xs flex items-center space-x-2.5 ${
                isSuggestFraud
                  ? 'bg-rose-950/50 border-rose-800/80 text-rose-300'
                  : isSuggestLegit
                  ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-300'
                  : 'bg-amber-950/50 border-amber-800/80 text-amber-300'
              }`}>
                <Sparkles className="w-4 h-4 shrink-0 text-teal-400 animate-pulse" />
                <div>
                  <div className="text-[10px] uppercase font-bold opacity-80">AI Suggestion</div>
                  <div className="font-bold text-xs mt-0.5">
                    {isSuggestFraud ? 'Approve — Fraud (Block Account)' : isSuggestLegit ? 'Approve — Not Fraud (Legitimate)' : 'Approve — Request More Info'}
                  </div>
                </div>
              </div>

              <textarea
                placeholder="Add analyst investigation notes for decision audit..."
                value={analystNotes}
                onChange={(e) => setAnalystNotes(e.target.value)}
                className="w-full bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] rounded-xl p-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-600 font-mono h-20"
              />

              <div className="space-y-2 pt-1">
                {/* Confirm Fraud Button */}
                <button
                  disabled={submitting}
                  onClick={() => handleDecision('CONFIRM_FRAUD')}
                  className={`w-full font-bold py-2.5 px-3 rounded-xl text-xs shadow-sm transition-all flex items-center justify-between ${
                    isSuggestFraud
                      ? 'bg-rose-600 hover:bg-rose-500 text-white ring-2 ring-rose-400/50'
                      : 'bg-rose-900/60 hover:bg-rose-800/80 text-rose-200 border border-rose-800/40'
                  }`}
                >
                  <span>Approve — Fraud (Block Account)</span>
                  {isSuggestFraud && (
                    <span className="text-[9px] bg-rose-950 text-rose-200 border border-rose-400/40 px-1.5 py-0.5 rounded font-mono font-bold flex items-center space-x-1">
                      <Star className="w-2.5 h-2.5 fill-rose-300 text-rose-300 inline mr-0.5" />
                      <span>AI Recommended</span>
                    </span>
                  )}
                </button>

                {/* Reject Fraud Button */}
                <button
                  disabled={submitting}
                  onClick={() => handleDecision('REJECT_FRAUD')}
                  className={`w-full font-bold py-2.5 px-3 rounded-xl text-xs shadow-sm transition-all flex items-center justify-between ${
                    isSuggestLegit
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/50'
                      : 'bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-800/40'
                  }`}
                >
                  <span>Approve — Not Fraud (Legitimate)</span>
                  {isSuggestLegit && (
                    <span className="text-[9px] bg-emerald-950 text-emerald-200 border border-emerald-400/40 px-1.5 py-0.5 rounded font-mono font-bold flex items-center space-x-1">
                      <Star className="w-2.5 h-2.5 fill-emerald-300 text-emerald-300 inline mr-0.5" />
                      <span>AI Recommended</span>
                    </span>
                  )}
                </button>

                {/* Request Info Button */}
                <button
                  disabled={submitting}
                  onClick={() => handleDecision('REQUEST_MORE_INFO')}
                  className={`w-full font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-between ${
                    !isSuggestFraud && !isSuggestLegit
                      ? 'bg-amber-600 text-white ring-2 ring-amber-400/50'
                      : 'bg-slate-200 dark:bg-[#1e2229] hover:bg-slate-300 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span>Request More Info</span>
                  {!isSuggestFraud && !isSuggestLegit && (
                    <span className="text-[9px] bg-amber-950 text-amber-200 px-1.5 py-0.5 rounded font-mono font-bold">
                      ⭐ AI Recommended
                    </span>
                  )}
                </button>
              </div>
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
