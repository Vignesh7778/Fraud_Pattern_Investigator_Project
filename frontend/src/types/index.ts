export interface SystemHealth {
  status: string;
  environment: string;
  version: string;
  timestamp: string;
  database_status: string;
  services: Record<string, string>;
}

export type UserRole = 'analyst' | 'auditor' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface EvidenceItem {
  evidence_id: string;
  case_id: string;
  source_type: string;
  source_reference: string;
  claim: string;
  value_reference: Record<string, any>;
  confidence: number;
  timestamp: string;
  tool_execution_id?: string;
}

export interface LinkedEntity {
  entity_type: string;
  entity_id: string;
  relationship: string;
  confidence: number;
}

export interface ToolExecutionRecord {
  execution_id: string;
  tool_name: string;
  input_params: Record<string, any>;
  output_data?: Record<string, any>;
  status: string;
  duration_ms: number;
  executed_at: string;
}

export interface InvestigationReport {
  case_id: string;
  transaction_id: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  primary_hypothesis: string;
  alternative_hypotheses: string[];
  supporting_evidence: EvidenceItem[];
  contradicting_evidence: EvidenceItem[];
  linked_entities: LinkedEntity[];
  relevant_policies: Record<string, any>[];
  confidence: number;
  recommended_action: string;
  limitations: string[];
  model_versions: Record<string, string>;
  generated_at: string;
}

export interface AnalystDecisionRecord {
  decision_id: string;
  case_id: string;
  analyst_id: string;
  decision: 'CONFIRM_FRAUD' | 'REJECT_FRAUD' | 'REQUEST_MORE_INFO';
  notes?: string;
  decided_at: string;
}

export interface InvestigationState {
  case_id: string;
  transaction_id: string;
  status: string;
  objective: string;
  step_count: number;
  max_steps: number;

  risk_score?: number;
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence: EvidenceItem[];
  linked_entities: LinkedEntity[];
  contradictions: EvidenceItem[];
  tool_history: ToolExecutionRecord[];
  report?: InvestigationReport;
  analyst_decision?: AnalystDecisionRecord;
  errors: string[];
}
