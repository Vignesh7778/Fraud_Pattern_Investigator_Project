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
  report_id?: string;
  case_id: string;
  transaction_id: string;
  investigation_run_id?: string;
  version: number;
  is_current: boolean;
  status?: string;

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

export interface InvestigationRunRecord {
  run_id: string;
  case_id: string;
  run_number: number;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  trigger_reason: string;
  step_count: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface AnalystDecisionRecord {
  decision_id: string;
  case_id: string;
  analyst_id: string;
  decision: 'CONFIRM_FRAUD' | 'REJECT_FRAUD' | 'REQUEST_MORE_INFO' | 'ESCALATE';
  notes?: string;
  decided_at: string;
}

export interface AnalystNoteRecord {
  note_id: string;
  case_id: string;
  author_id: string;
  note_text: string;
  created_at: string;
}

export interface CaseUpdateRecord {
  update_id: string;
  case_id: string;
  author_id: string;
  update_type: string;
  description: string;
  created_at: string;
}

export interface InvestigationState {
  case_id: string;
  transaction_id: string;
  run_id?: string;
  run_number?: number;
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
  reports_history?: InvestigationReport[];
  analyst_decision?: AnalystDecisionRecord;
  errors: string[];
}

export interface CaseRecord {
  case_id: string;
  transaction_id: string;
  title: string;
  status: 'DRAFT' | 'READY' | 'INVESTIGATING' | 'REPORT_READY' | 'HUMAN_REVIEW' | 'DECIDED' | 'REOPENED' | 'ARCHIVED';
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  current_report?: InvestigationReport;
  reports_history: InvestigationReport[];
  investigation_runs: InvestigationRunRecord[];
  evidence: EvidenceItem[];
  analyst_notes: AnalystNoteRecord[];
  case_updates: CaseUpdateRecord[];
  analyst_decision?: AnalystDecisionRecord;
  created_at: string;
  updated_at: string;
}

export interface ReportComparisonResult {
  case_id: string;
  version_a: number;
  version_b: number;
  risk_score_diff: number;
  risk_level_changed: boolean;
  risk_level_a: string;
  risk_level_b: string;
  primary_hypothesis_a: string;
  primary_hypothesis_b: string;
  new_evidence: EvidenceItem[];
  removed_evidence: EvidenceItem[];
  new_patterns: string[];
  removed_patterns: string[];
  recommendation_a: string;
  recommendation_b: string;
}
