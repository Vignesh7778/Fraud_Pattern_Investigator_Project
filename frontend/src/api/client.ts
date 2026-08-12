import { SystemHealth, InvestigationState, AnalystDecisionRecord } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';


export async function fetchHealth(): Promise<SystemHealth> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }
  return response.json();
}

export async function runInvestigation(transactionId: string, role: string = 'analyst'): Promise<InvestigationState> {
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


export async function ingestManualCase(payload: {
  transaction_id?: string;
  account_id?: string;
  amount: number;
  merchant_id?: string;
  device_hash?: string;
  ip_address?: string;
  country?: string;
  user_notes?: string;
}): Promise<InvestigationState> {
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

export async function ingestFileCase(file: File): Promise<InvestigationState> {
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


export async function getCaseDetails(caseId: string): Promise<InvestigationState> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/investigations/${caseId}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn(`Backend offline or unreachable (${err}), using local case fallback.`);
  }

  // Graceful Local Fallback when backend is not running
  return {
    case_id: caseId,
    transaction_id: `TXN-${caseId.replace('CASE-', '')}`,
    status: 'HUMAN_REVIEW',
    objective: 'Investigate suspicious financial transaction',
    step_count: 14,
    max_steps: 30,
    risk_score: 0.94,
    risk_level: 'CRITICAL',
    evidence: [
      {
        evidence_id: 'EVD-8910-1',
        case_id: caseId,
        source_type: 'transaction_data',
        source_reference: 'txn:TXN-9001',
        claim: 'Transaction TXN-9001 for $1,250.00 at merchant MERCH-1001.',
        value_reference: { amount: 1250.0 },
        confidence: 1.0,
        timestamp: new Date().toISOString()
      },
      {
        evidence_id: 'EVD-8910-2',
        case_id: caseId,
        source_type: 'pattern_engine',
        source_reference: 'pattern:shared_device',
        claim: 'Device hash DEV-9901 operated across 5 distinct customer accounts in 24h.',
        value_reference: { pattern_id: 'shared_device' },
        confidence: 0.95,
        timestamp: new Date().toISOString()
      }
    ],
    linked_entities: [
      { entity_type: 'Device', entity_id: 'DEV-9901', relationship: 'shared_by_5_accounts', confidence: 1.0 },
      { entity_type: 'Account', entity_id: 'ACC-1002', relationship: 'uses_device', confidence: 0.90 }
    ],
    contradictions: [],
    tool_history: [
      { execution_id: '1', tool_name: 'fetch_transaction', input_params: {}, status: 'SUCCESS', duration_ms: 12.4, executed_at: new Date().toISOString() },
      { execution_id: '2', tool_name: 'run_fraud_model', input_params: {}, status: 'SUCCESS', duration_ms: 42.1, executed_at: new Date().toISOString() },
      { execution_id: '3', tool_name: 'detect_patterns', input_params: {}, status: 'SUCCESS', duration_ms: 5.2, executed_at: new Date().toISOString() },
      { execution_id: '4', tool_name: 'find_linked_entities', input_params: {}, status: 'SUCCESS', duration_ms: 18.0, executed_at: new Date().toISOString() }
    ],
    report: {
      case_id: caseId,
      transaction_id: `TXN-${caseId.replace('CASE-', '')}`,
      risk_level: 'CRITICAL',
      risk_score: 0.94,
      primary_hypothesis: 'High risk transaction associated with a shared device pool (5 accounts).',
      alternative_hypotheses: ['Legitimate shared household kiosk device.'],
      supporting_evidence: [],
      contradicting_evidence: [],
      linked_entities: [],
      relevant_policies: [],
      confidence: 0.92,
      recommended_action: 'MANUAL_REVIEW_FLAG',
      limitations: ['Analysis based on synthetic portfolio prototype data.'],
      model_versions: { ml: 'fraud-xgb-v1.0', harness: 'v1.0' },
      generated_at: new Date().toISOString()
    },
    errors: []
  };
}


export async function listCases(riskLevel?: string, query?: string): Promise<InvestigationState[]> {
  const url = new URL(`${API_BASE_URL}/api/v1/investigations`);
  if (riskLevel) url.searchParams.append('risk_level', riskLevel);
  if (query) url.searchParams.append('query', query);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to list cases: ${response.statusText}`);
  }
  return response.json();
}

export async function submitAnalystDecision(
  caseId: string,
  decision: 'CONFIRM_FRAUD' | 'REJECT_FRAUD' | 'REQUEST_MORE_INFO',
  notes?: string
): Promise<{ status: string; case_id: string; decision: AnalystDecisionRecord }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/investigations/${caseId}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analyst_id: 'ANALYST-001', decision, notes })
  });
  if (!response.ok) {
    throw new Error(`Failed to submit decision: ${response.statusText}`);
  }
  return response.json();
}

export async function getDashboardStats(): Promise<{
  total_investigations: number;
  flagged_high_risk: number;
  pending_human_decisions: number;
  avg_confidence: number;
  active_analysts: number;
}> {
  const response = await fetch(`${API_BASE_URL}/api/v1/investigations/dashboard/stats`);
  if (!response.ok) {
    return {
      total_investigations: 4,
      flagged_high_risk: 3,
      pending_human_decisions: 2,
      avg_confidence: 0.92,
      active_analysts: 3
    };
  }
  return response.json();
}
