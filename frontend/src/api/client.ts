import { SystemHealth, CaseRecord, ReportComparisonResult, UserProfile } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

export async function loginUser(emailOrUserId: string, password: string): Promise<{ access_token: string; user: UserProfile }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailOrUserId, password })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Invalid credentials' }));
    throw new Error(errorData.detail || 'Authentication failed');
  }

  return response.json();
}

export async function fetchHealth(): Promise<SystemHealth> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchCaseLibrary(
  query?: string,
  riskLevel?: string,
  status?: string,
  sortBy: string = 'newest'
): Promise<CaseRecord[]> {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (riskLevel && riskLevel !== 'ALL') params.append('risk_level', riskLevel);
  if (status && status !== 'ALL') params.append('status', status);
  params.append('sort_by', sortBy);

  const response = await fetch(`${API_BASE_URL}/api/v1/investigations/cases?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch case library: ${response.statusText}`);
  }
  return response.json();
}

export async function getCaseDetails(caseId: string): Promise<CaseRecord> {
  const response = await fetch(`${API_BASE_URL}/api/v1/investigations/cases/${caseId}`);
  if (!response.ok) {
    throw new Error(`Failed to get case workspace: ${response.statusText}`);
  }
  return response.json();
}

export async function runInvestigation(transactionId: string, role: string = 'analyst'): Promise<CaseRecord> {
  const response = await fetch(`${API_BASE_URL}/api/v1/investigations/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction_id: transactionId, user_role: role })
  });
  if (!response.ok) {
    throw new Error(`Failed to run investigation: ${response.statusText}`);
  }
  return response.json();
}

export async function reinvestigateCase(
  caseId: string,
  triggerReason: string = 'Analyst Requested Re-Investigation',
  userNotes?: string
): Promise<CaseRecord> {
  const response = await fetch(`${API_BASE_URL}/api/v1/investigations/cases/${caseId}/reinvestigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trigger_reason: triggerReason, user_notes: userNotes })
  });
  if (!response.ok) {
    throw new Error(`Failed to reinvestigate case: ${response.statusText}`);
  }
  return response.json();
}

export async function addAnalystNote(caseId: string, noteText: string, authorId: string = 'ANALYST-001'): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/investigations/cases/${caseId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note_text: noteText, author_id: authorId })
  });
  if (!response.ok) {
    throw new Error(`Failed to add analyst note: ${response.statusText}`);
  }
  return response.json();
}

export async function submitAnalystDecision(
  caseId: string,
  decision: 'CONFIRM_FRAUD' | 'REJECT_FRAUD' | 'REQUEST_MORE_INFO' | 'ESCALATE',
  notes?: string,
  analystId: string = 'ANALYST-001'
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/investigations/cases/${caseId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, notes, analyst_id: analystId })
  });
  if (!response.ok) {
    throw new Error(`Failed to submit decision: ${response.statusText}`);
  }
  return response.json();
}

export async function compareReports(caseId: string, vA: number, vB: number): Promise<ReportComparisonResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/investigations/cases/${caseId}/compare?vA=${vA}&vB=${vB}`);
  if (!response.ok) {
    throw new Error(`Failed to compare reports: ${response.statusText}`);
  }
  return response.json();
}

export async function ingestManualCase(payload: {
  case_title?: string;
  transaction_id?: string;
  account_id?: string;
  amount: number;
  merchant_id?: string;
  device_hash?: string;
  ip_address?: string;
  country?: string;
  user_notes?: string;
}): Promise<CaseRecord> {
  const response = await fetch(`${API_BASE_URL}/api/v1/investigations/ingest/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`Failed to ingest manual case: ${response.statusText}`);
  }
  return response.json();
}

export async function ingestFileCase(file: File): Promise<CaseRecord> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/v1/investigations/ingest/upload`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(`Failed to upload case file: ${response.statusText}`);
  }
  return response.json();
}
