export type ArtifactType = 'document' | 'slide_deck' | 'report' | 'code' | 'spreadsheet';

export type AgentStatus = 'draft' | 'deployed' | 'paused' | 'archived';

export interface AgentTraits {
  creativity: number;
  autonomy: number;
  verbosity: number;
  caution: number;
  empathy: number;
  analyticity: number;
}

export interface MemoryConfig {
  type: 'none' | 'short' | 'long' | 'persistent';
  vector_store: boolean;
}

export interface ConstitutionRule {
  id: string;
  rule: string;
  enabled: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  artifact_count: number;
  agent_count: number;
  created_at: string;
  updated_at: string;
}

export interface Artifact {
  id: string;
  workspace_id: string;
  name: string;
  type: ArtifactType;
  content: string;
  version: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  personality: string;
  traits: AgentTraits;
  memory_config: MemoryConfig;
  tools: string[];
  constitution: ConstitutionRule[];
  status: AgentStatus;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Deployment {
  id: string;
  agent_id: string;
  agent_name: string;
  target: 'cloud' | 'browser' | 'desktop';
  status: AgentStatus;
  deployed_at: string;
  logs: string[];
}

export interface OrchestrationStep {
  name: string;
  status: 'pending' | 'running' | 'complete' | 'error';
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}
