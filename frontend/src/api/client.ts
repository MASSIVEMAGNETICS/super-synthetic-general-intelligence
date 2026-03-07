import axios from 'axios';
import { Workspace, Artifact, Agent, Deployment } from '../types';

const api = axios.create({ baseURL: '/api' });

export const workspaceApi = {
  list: () => api.get<Workspace[]>('/workspaces'),
  create: (data: Partial<Workspace>) => api.post<Workspace>('/workspaces', data),
  get: (id: string) => api.get<Workspace>(`/workspaces/${id}`),
  update: (id: string, data: Partial<Workspace>) => api.put<Workspace>(`/workspaces/${id}`, data),
  delete: (id: string) => api.delete(`/workspaces/${id}`),
  getArtifacts: (id: string) => api.get<Artifact[]>(`/workspaces/${id}/artifacts`),
  getAgents: (id: string) => api.get<Agent[]>(`/workspaces/${id}/agents`),
};

export const artifactApi = {
  generate: (data: { prompt: string; type: string; workspace_id: string }) =>
    api.post<Artifact>('/artifacts/generate', data),
  get: (id: string) => api.get<Artifact>(`/artifacts/${id}`),
  update: (id: string, data: Partial<Artifact>) => api.put<Artifact>(`/artifacts/${id}`, data),
  delete: (id: string) => api.delete(`/artifacts/${id}`),
  download: (id: string) => api.get(`/artifacts/${id}/download`, { responseType: 'blob' }),
  getVersions: (id: string) => api.get(`/artifacts/${id}/versions`),
};

export const agentApi = {
  list: () => api.get<Agent[]>('/agents'),
  create: (data: Partial<Agent>) => api.post<Agent>('/agents', data),
  get: (id: string) => api.get<Agent>(`/agents/${id}`),
  update: (id: string, data: Partial<Agent>) => api.put<Agent>(`/agents/${id}`, data),
  delete: (id: string) => api.delete(`/agents/${id}`),
  fork: (id: string) => api.post<Agent>(`/agents/${id}/fork`),
  deploy: (id: string) => api.post<Deployment>(`/agents/${id}/deploy`),
  getVersions: (id: string) => api.get(`/agents/${id}/versions`),
  checkConstitution: (id: string) => api.get(`/agents/${id}/constitution/check`),
};

export const deploymentApi = {
  list: () => api.get<Deployment[]>('/deployments'),
  get: (id: string) => api.get<Deployment>(`/deployments/${id}`),
  pause: (id: string) => api.post(`/deployments/${id}/pause`),
  resume: (id: string) => api.post(`/deployments/${id}/resume`),
  terminate: (id: string) => api.delete(`/deployments/${id}`),
};
