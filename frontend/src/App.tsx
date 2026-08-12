import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { DetailView } from './components/DetailView';
import { SearchView } from './components/SearchView';
import { IngestionModal } from './components/IngestionModal';
import { fetchHealth, runInvestigation, getCaseDetails, getDashboardStats } from './api/client';
import { SystemHealth, UserProfile, InvestigationState } from './types';

export const App: React.FC = () => {
  const [user] = useState<UserProfile>({
    id: 'USR-001',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@fraud-investigator.io',
    role: 'analyst'
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isIngestionOpen, setIsIngestionOpen] = useState(false);
  const [stats, setStats] = useState({
    total_investigations: 4,
    flagged_high_risk: 3,
    pending_human_decisions: 2,
    avg_confidence: 0.92,
    active_analysts: 3
  });

  const [selectedCase, setSelectedCase] = useState<InvestigationState | null>(null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch(err => console.warn('Health check failed', err));

    getDashboardStats()
      .then(setStats)
      .catch(err => console.warn('Dashboard stats failed', err));
  }, []);

  const handleRunInvestigation = async (txnId: string) => {
    setLoading(true);
    try {
      const state = await runInvestigation(txnId, user.role);
      setSelectedCase(state);
      setActiveTab('detail');
    } catch (err) {
      alert(`Investigation failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCase = async (caseId: string) => {
    setLoading(true);
    try {
      const state = await getCaseDetails(caseId);
      setSelectedCase(state);
      setActiveTab('detail');
    } catch (err) {
      alert(`Could not fetch case ${caseId}: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshCase = async () => {
    if (selectedCase) {
      handleSelectCase(selectedCase.case_id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        onOpenIngestion={() => setIsIngestionOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex items-center justify-center py-16 space-x-3 text-indigo-400">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-mono text-sm">Executing Autonomous AI Investigation Harness...</span>
          </div>
        )}

        {!loading && activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            onRunNewInvestigation={handleRunInvestigation}
            onSelectCase={handleSelectCase}
          />
        )}

        {!loading && activeTab === 'search' && (
          <SearchView onSelectCase={handleSelectCase} />
        )}

        {!loading && activeTab === 'detail' && selectedCase && (
          <DetailView caseData={selectedCase} onRefresh={handleRefreshCase} />
        )}

        {!loading && activeTab === 'detail' && !selectedCase && (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800">
            <h3 className="text-lg font-semibold text-slate-300">No Case Selected</h3>
            <p className="text-sm text-slate-400 mt-1 mb-4">Please select a case from the dashboard, search, or upload a new case.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => setIsIngestionOpen(true)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded-lg transition-colors"
              >
                Ingest New Case
              </button>
            </div>
          </div>
        )}
      </main>

      <IngestionModal
        isOpen={isIngestionOpen}
        onClose={() => setIsIngestionOpen(false)}
        onCaseIngested={(state) => {
          setSelectedCase(state);
          setActiveTab('detail');
        }}
      />
    </div>
  );
};

export default App;
