export interface Workspace {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  artifacts: string[]; // artifact IDs
  agents: string[]; // agent IDs
}

export interface Artifact {
  id: string;
  workspaceId: string;
  name: string;
  type: 'document' | 'slides' | 'report' | 'code' | 'spreadsheet' | 'image';
  content: string;
  metadata: Record<string, unknown>;
  version: number;
  versions: ArtifactVersion[];
  createdAt: string;
  updatedAt: string;
  downloadUrl?: string;
}

export interface ArtifactVersion {
  version: number;
  content: string;
  createdAt: string;
}

export interface Agent {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  personality: string;
  constitution: ConstitutionRule[];
  memory: MemoryConfig;
  tools: string[];
  traits: Record<string, number>; // trait name -> 0-100 slider value
  version: number;
  versions: AgentVersion[];
  status: 'draft' | 'deployed' | 'paused' | 'archived';
  deploymentTarget?: string;
  createdAt: string;
  updatedAt: string;
  parentId?: string; // for forks
  alignmentScore: number;
}

export interface AgentVersion {
  version: number;
  snapshot: Omit<Agent, 'versions'>;
  createdAt: string;
  changelog: string;
}

export interface ConstitutionRule {
  id: string;
  rule: string;
  severity: 'block' | 'warn' | 'log';
  enabled: boolean;
}

export interface MemoryConfig {
  type: 'none' | 'short' | 'long' | 'persistent';
  vectorStore: boolean;
  maxTokens: number;
}

export interface OrchestrationRequest {
  intent: string;
  workspaceId?: string;
  outputType?: 'document' | 'slides' | 'report' | 'code' | 'spreadsheet';
  context?: Record<string, unknown>;
}

export interface OrchestrationResult {
  taskId: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  steps: OrchestrationStep[];
  artifactId?: string;
  error?: string;
}

export interface OrchestrationStep {
  name: string;
  status: 'pending' | 'running' | 'complete' | 'skipped';
  output?: string;
}
