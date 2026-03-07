import { v4 as uuidv4 } from 'uuid';
import { Workspace } from '../models/types';
import { storageService } from './storageService';

export class WorkspaceManager {
  createWorkspace(name: string, description: string): Workspace {
    const now = new Date().toISOString();
    const workspace: Workspace = {
      id: uuidv4(),
      name,
      description,
      createdAt: now,
      updatedAt: now,
      artifacts: [],
      agents: [],
    };
    storageService.saveWorkspace(workspace);
    return workspace;
  }

  updateWorkspace(id: string, updates: Partial<Pick<Workspace, 'name' | 'description'>>): Workspace | null {
    const workspace = storageService.getWorkspace(id);
    if (!workspace) return null;

    const updated: Workspace = {
      ...workspace,
      ...updates,
      id: workspace.id,
      updatedAt: new Date().toISOString(),
    };

    storageService.saveWorkspace(updated);
    return updated;
  }

  deleteWorkspace(id: string): boolean {
    return storageService.deleteWorkspace(id);
  }

  getWorkspace(id: string): Workspace | null {
    return storageService.getWorkspace(id) ?? null;
  }

  getAllWorkspaces(): Workspace[] {
    return storageService.getAllWorkspaces();
  }
}

export const workspaceManager = new WorkspaceManager();
