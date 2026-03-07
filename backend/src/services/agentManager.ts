import { v4 as uuidv4 } from 'uuid';
import { Agent, AgentVersion, ConstitutionRule, MemoryConfig } from '../models/types';
import { storageService } from './storageService';
import { safetyService } from './safetyService';

export class AgentManager {
  createAgent(workspaceId: string, data: Partial<Agent>): Agent {
    const now = new Date().toISOString();
    const id = uuidv4();

    const defaultTraits: Record<string, number> = {
      creativity: 50,
      precision: 50,
      verbosity: 50,
      empathy: 50,
      assertiveness: 50,
      caution: 50,
    };

    const defaultMemory: MemoryConfig = {
      type: 'short',
      vectorStore: false,
      maxTokens: 4096,
    };

    const agent: Agent = {
      id,
      workspaceId,
      name: data.name ?? 'Unnamed Agent',
      description: data.description ?? '',
      personality: data.personality ?? 'A helpful, precise, and professional AI assistant.',
      constitution: data.constitution ?? safetyService.getDefaultConstitutionRules(),
      memory: data.memory ?? defaultMemory,
      tools: data.tools ?? ['web_search', 'code_interpreter', 'file_writer'],
      traits: data.traits ?? defaultTraits,
      version: 1,
      versions: [],
      status: 'draft',
      deploymentTarget: undefined,
      createdAt: now,
      updatedAt: now,
      parentId: data.parentId,
      alignmentScore: this.calculateAlignmentScore(
        data.traits ?? defaultTraits,
        data.constitution ?? safetyService.getDefaultConstitutionRules()
      ),
    };

    // Save initial version snapshot
    const versionSnapshot = this.createVersionSnapshot(agent, 'Initial version');
    agent.versions.push(versionSnapshot);

    storageService.saveAgent(agent);

    // Update workspace
    const workspace = storageService.getWorkspace(workspaceId);
    if (workspace) {
      workspace.agents.push(id);
      workspace.updatedAt = now;
      storageService.saveWorkspace(workspace);
    }

    return agent;
  }

  updateAgent(id: string, updates: Partial<Agent>, changelog?: string): Agent | null {
    const agent = storageService.getAgent(id);
    if (!agent) return null;

    const now = new Date().toISOString();

    // Save version snapshot before update
    const versionSnapshot = this.createVersionSnapshot(agent, changelog ?? 'Updated agent');

    const updatedAgent: Agent = {
      ...agent,
      ...updates,
      id: agent.id, // Prevent ID change
      workspaceId: agent.workspaceId, // Prevent workspace change
      createdAt: agent.createdAt, // Preserve creation date
      version: agent.version + 1,
      versions: [...agent.versions, versionSnapshot],
      updatedAt: now,
      alignmentScore: this.calculateAlignmentScore(
        updates.traits ?? agent.traits,
        updates.constitution ?? agent.constitution
      ),
    };

    storageService.saveAgent(updatedAgent);
    return updatedAgent;
  }

  forkAgent(id: string, changelog: string): Agent | null {
    const original = storageService.getAgent(id);
    if (!original) return null;

    const now = new Date().toISOString();
    const forkedId = uuidv4();

    const forkedAgent: Agent = {
      ...original,
      id: forkedId,
      name: `${original.name} (Fork)`,
      parentId: id,
      version: 1,
      versions: [],
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };

    const versionSnapshot = this.createVersionSnapshot(forkedAgent, changelog || `Forked from agent ${id}`);
    forkedAgent.versions.push(versionSnapshot);

    storageService.saveAgent(forkedAgent);

    // Update workspace
    const workspace = storageService.getWorkspace(forkedAgent.workspaceId);
    if (workspace) {
      workspace.agents.push(forkedId);
      workspace.updatedAt = now;
      storageService.saveWorkspace(workspace);
    }

    return forkedAgent;
  }

  deployAgent(id: string, target: string): Agent | null {
    const agent = storageService.getAgent(id);
    if (!agent) return null;

    // Run safety check before deployment
    const safetyResult = safetyService.checkConstitution(agent);
    if (!safetyResult.passed) {
      throw new Error(`Safety check failed: ${safetyResult.violations.map(v => v.message).join('; ')}`);
    }

    const now = new Date().toISOString();
    const versionSnapshot = this.createVersionSnapshot(agent, `Deployed to ${target}`);

    const deployedAgent: Agent = {
      ...agent,
      status: 'deployed',
      deploymentTarget: target,
      version: agent.version + 1,
      versions: [...agent.versions, versionSnapshot],
      updatedAt: now,
    };

    storageService.saveAgent(deployedAgent);
    return deployedAgent;
  }

  getVersionHistory(id: string): AgentVersion[] | null {
    const agent = storageService.getAgent(id);
    if (!agent) return null;
    return agent.versions;
  }

  private createVersionSnapshot(agent: Agent, changelog: string): AgentVersion {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { versions: _versions, ...snapshot } = agent;
    return {
      version: agent.version,
      snapshot,
      createdAt: new Date().toISOString(),
      changelog,
    };
  }

  private calculateAlignmentScore(traits: Record<string, number>, constitution: ConstitutionRule[]): number {
    const enabledRules = constitution.filter(r => r.enabled).length;
    const totalRules = constitution.length || 1;
    const constitutionScore = (enabledRules / totalRules) * 50;

    const traitValues = Object.values(traits);
    const avgTrait = traitValues.length > 0
      ? traitValues.reduce((a, b) => a + b, 0) / traitValues.length
      : 50;
    const traitScore = (avgTrait / 100) * 30;

    const cautionTrait = traits['caution'] ?? 50;
    const safetyScore = (cautionTrait / 100) * 20;

    return Math.round(constitutionScore + traitScore + safetyScore);
  }
}

export const agentManager = new AgentManager();
