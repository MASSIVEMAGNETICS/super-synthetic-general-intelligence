import { Workspace, Artifact, Agent } from '../models/types';

class StorageService {
  private workspaces: Map<string, Workspace> = new Map();
  private artifacts: Map<string, Artifact> = new Map();
  private agents: Map<string, Agent> = new Map();

  // Workspace CRUD
  getWorkspace(id: string): Workspace | undefined {
    return this.workspaces.get(id);
  }

  getAllWorkspaces(): Workspace[] {
    return Array.from(this.workspaces.values());
  }

  saveWorkspace(workspace: Workspace): void {
    this.workspaces.set(workspace.id, workspace);
  }

  deleteWorkspace(id: string): boolean {
    return this.workspaces.delete(id);
  }

  // Artifact CRUD
  getArtifact(id: string): Artifact | undefined {
    return this.artifacts.get(id);
  }

  getArtifactsByWorkspace(workspaceId: string): Artifact[] {
    return Array.from(this.artifacts.values()).filter(a => a.workspaceId === workspaceId);
  }

  saveArtifact(artifact: Artifact): void {
    this.artifacts.set(artifact.id, artifact);
  }

  deleteArtifact(id: string): boolean {
    return this.artifacts.delete(id);
  }

  // Agent CRUD
  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  getAgentsByWorkspace(workspaceId: string): Agent[] {
    return Array.from(this.agents.values()).filter(a => a.workspaceId === workspaceId);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  saveAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
  }

  deleteAgent(id: string): boolean {
    return this.agents.delete(id);
  }
}

export const storageService = new StorageService();
