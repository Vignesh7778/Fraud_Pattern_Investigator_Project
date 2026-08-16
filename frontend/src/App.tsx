import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/ui/TopBar';
import { CommandPalette } from './components/ui/CommandPalette';
import { DashboardView } from './components/DashboardView';
import { CaseLibraryView } from './components/CaseLibraryView';
import { DetailView } from './components/DetailView';
import { EvidenceExplorerView } from './components/EvidenceExplorerView';
import { GraphRelationshipsView } from './components/GraphRelationshipsView';
import { ReportsHistoryView } from './components/ReportsHistoryView';
import { AuditLogView } from './components/AuditLogView';
import { IngestionModal } from './components/IngestionModal';
import { LoginView } from './components/LoginView';
import { fetchHealth, runInvestigation, getCaseDetails } from './api/client';
import { UserProfile, CaseRecord } from './types';
import { Theme, getStoredTheme, applyTheme } from './utils/theme';

// Case Workspace Wrapper Route Component
const CaseWorkspaceWrapper: React.FC<{
  onRefresh: () => void;
  onSetCurrentCase: (caseRecord: CaseRecord) => void;
}> = ({ onRefresh, onSetCurrentCase }) => {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWorkspace() {
      if (!caseId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await getCaseDetails(caseId);
        setCaseRecord(res);
        onSetCurrentCase(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load case');
      } finally {
        setLoading(false);
      }
    }
    loadWorkspace();
  }, [caseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 space-x-3 text-teal-600 dark:text-teal-400 font-mono">
        <div className="w-6 h-6 border-2 border-teal-600 dark:border-teal-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm">Loading Case Workspace ({caseId})...</span>
      </div>
    );
  }

  if (error || !caseRecord) {
    return (
      <div className="p-12 text-center text-slate-500 font-mono text-xs bg-slate-100 dark:bg-[#16191e] border border-slate-200 dark:border-[#2a2e37] rounded-2xl">
        Case workspace for '{caseId}' could not be loaded. Please return to Case Library.
      </div>
    );
  }

  return (
    <DetailView
      caseData={caseRecord}
      onRefresh={() => {
        getCaseDetails(caseRecord.case_id).then((updated) => {
          setCaseRecord(updated);
          onSetCurrentCase(updated);
        });
        onRefresh();
      }}
    />
  );
};

export const App: React.FC = () => {
  const navigate = useNavigate();

  // Authentication State - Uses sessionStorage so closing app tab/window forces fresh login
  const [user, setUser] = useState<UserProfile | null>(() => {
    // Clear legacy persistent storage to enforce fresh login on app close
    localStorage.removeItem('fpi_user');
    localStorage.removeItem('fpi_user_token');

    const saved = sessionStorage.getItem('fpi_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });


  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());
  const [isIngestionOpen, setIsIngestionOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [selectedCaseId, setSelectedCaseId] = useState<string>('CASE-ATO-1001');
  const [_, setCurrentCaseRecord] = useState<CaseRecord | null>(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    fetchHealth().catch(err => console.warn('Health check failed', err));
  }, []);

  const handleLoginSuccess = (userProfile: UserProfile, token: string) => {
    setUser(userProfile);
    sessionStorage.setItem('fpi_user', JSON.stringify(userProfile));
    sessionStorage.setItem('fpi_user_token', token);
    navigate('/');
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('fpi_user');
    sessionStorage.removeItem('fpi_user_token');
    localStorage.removeItem('fpi_user');
    localStorage.removeItem('fpi_user_token');
  };

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleRunInvestigation = async (txnId: string) => {
    try {
      const caseRecord = await runInvestigation(txnId, user?.role || 'analyst');
      setSelectedCaseId(caseRecord.case_id);
      setCurrentCaseRecord(caseRecord);
      navigate(`/cases/${caseRecord.case_id}`);
    } catch (err) {
      alert(`Investigation failed: ${err}`);
    }
  };

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    navigate(`/cases/${caseId}`);
  };

  const handleIngestSuccess = (newCase: CaseRecord) => {
    setSelectedCaseId(newCase.case_id);
    setCurrentCaseRecord(newCase);
    setIsIngestionOpen(false);
    navigate(`/cases/${newCase.case_id}`);
  };

  // If user is not authenticated, render Login Page
  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1115] text-slate-900 dark:text-[#f0f2f5] font-sans selection:bg-teal-600 selection:text-white flex transition-colors duration-150">
      {/* Route-Aware Sidebar with Mobile Support */}
      <Sidebar
        onOpenIngestModal={() => setIsIngestionOpen(true)}
        selectedCaseId={selectedCaseId}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <TopBar
          user={user}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onLogout={handleLogout}
        />

        {/* Content Body Routes */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Routes>
            <Route
              path="/"
              element={
                <DashboardView
                  stats={{
                    total_investigations: 12,
                    flagged_high_risk: 8,
                    pending_human_decisions: 3,
                    avg_confidence: 0.94,
                    active_analysts: 4
                  }}
                  onRunNewInvestigation={handleRunInvestigation}
                  onSelectCase={handleSelectCase}
                />
              }
            />

            <Route
              path="/cases"
              element={
                <CaseLibraryView
                  onSelectCase={handleSelectCase}
                  onOpenIngestModal={() => setIsIngestionOpen(true)}
                />
              }
            />

            <Route
              path="/cases/:caseId"
              element={
                <CaseWorkspaceWrapper
                  onRefresh={() => {}}
                  onSetCurrentCase={setCurrentCaseRecord}
                />
              }
            />

            <Route
              path="/evidence"
              element={<EvidenceExplorerView onSelectCase={handleSelectCase} />}
            />

            <Route
              path="/graph"
              element={<GraphRelationshipsView />}
            />

            <Route
              path="/reports"
              element={<ReportsHistoryView onSelectCase={handleSelectCase} />}
            />

            <Route
              path="/audit"
              element={<AuditLogView />}
            />

            <Route path="*" element={<Navigate to="/cases" replace />} />
          </Routes>
        </main>
      </div>

      {/* Command Palette Modal (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenIngestModal={() => setIsIngestionOpen(true)}
      />

      {/* Dual Entry Case Ingestion Modal */}
      {isIngestionOpen && (
        <IngestionModal
          onClose={() => setIsIngestionOpen(false)}
          onSuccess={handleIngestSuccess}
        />
      )}
    </div>
  );
};

export default App;
