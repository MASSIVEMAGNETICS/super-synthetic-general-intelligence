import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Bot, Download, Trash2, Edit3, Rocket, ChevronRight } from 'lucide-react';
import Badge from '../components/shared/Badge';
import ArtifactPreview from '../components/shared/ArtifactPreview';
import { Artifact, Agent } from '../types';

const mockArtifacts: Artifact[] = [
  { id: 'art-1', workspace_id: 'ws-1', name: 'Q3 Marketing Strategy', type: 'document', content: '# Q3 Marketing Strategy\n\n## Executive Summary\nThis document outlines the comprehensive marketing strategy for Q3...', version: 3, metadata: {}, created_at: '2024-02-15T10:00:00Z', updated_at: '2024-03-01T14:30:00Z' },
  { id: 'art-2', workspace_id: 'ws-1', name: 'Campaign Analysis', type: 'report', content: '# Campaign Performance Report\n\n## Overview\nDetailed analysis of Q2 campaigns and projections...', version: 1, metadata: {}, created_at: '2024-02-20T09:00:00Z', updated_at: '2024-02-20T09:00:00Z' },
  { id: 'art-3', workspace_id: 'ws-1', name: 'Brand Deck 2024', type: 'slide_deck', content: '# AetherForge Brand Identity\n\nSlide 1: Mission & Vision\nSlide 2: Brand Values\nSlide 3: Visual Identity...', version: 2, metadata: {}, created_at: '2024-01-25T11:00:00Z', updated_at: '2024-02-10T15:00:00Z' },
];

const mockAgents: Agent[] = [
  { id: 'agent-1', workspace_id: 'ws-1', name: 'ContentBot Alpha', description: 'Specializes in marketing copy and brand voice', personality: 'Creative, persuasive, brand-focused content creator', traits: { creativity: 90, autonomy: 60, verbosity: 70, caution: 30, empathy: 75, analyticity: 55 }, memory_config: { type: 'long', vector_store: true }, tools: ['web_search', 'file_write'], constitution: [], status: 'deployed', version: 2, created_at: '2024-01-10T10:00:00Z', updated_at: '2024-02-28T12:00:00Z' },
  { id: 'agent-2', workspace_id: 'ws-1', name: 'AnalyticsBot', description: 'Data analysis and reporting specialist', personality: 'Precise, data-driven, thorough analytical expert', traits: { creativity: 40, autonomy: 70, verbosity: 60, caution: 85, empathy: 30, analyticity: 95 }, memory_config: { type: 'persistent', vector_store: true }, tools: ['code_execution', 'file_read', 'api_call'], constitution: [], status: 'paused', version: 1, created_at: '2024-02-05T09:00:00Z', updated_at: '2024-03-02T10:00:00Z' },
];

const workspaceNames: Record<string, string> = {
  'ws-1': 'Marketing Q3',
  'ws-2': 'Product Research',
  'ws-3': 'Engineering Docs',
  'ws-4': 'Sales Enablement',
};

export default function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<'artifacts' | 'agents'>('artifacts');
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const wsName = workspaceNames[id ?? ''] || 'Workspace';

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/workspaces" className="text-[#94a3b8] hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <ChevronRight size={16} className="text-[#475569]" />
        <h1 className="text-2xl font-bold text-white">{wsName}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#1a1a2e] border border-[#2d2d4e] rounded-lg p-1 w-fit">
        {(['artifacts', 'agents'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t ? 'bg-indigo-600 text-white' : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            {t === 'artifacts'
              ? <span className="inline-flex items-center gap-1.5"><FileText size={14} /> Artifacts</span>
              : <span className="inline-flex items-center gap-1.5"><Bot size={14} /> Agents</span>
            }
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={selectedArtifact ? 'lg:col-span-2' : 'lg:col-span-3'}>
          {tab === 'artifacts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mockArtifacts.map(art => (
                <div
                  key={art.id}
                  onClick={() => setSelectedArtifact(art)}
                  className={`bg-[#1a1a2e] border rounded-xl p-4 cursor-pointer transition-all hover:bg-[#1e1e38] ${
                    selectedArtifact?.id === art.id ? 'border-indigo-500' : 'border-[#2d2d4e] hover:border-indigo-500/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                      <FileText size={16} className="text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{art.name}</p>
                      <p className="text-[#94a3b8] text-xs mt-0.5 capitalize">{art.type.replace('_', ' ')} · v{art.version}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={e => e.stopPropagation()}
                      className="p-1.5 text-[#94a3b8] hover:text-indigo-400 hover:bg-indigo-600/10 rounded-md transition-colors"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={e => e.stopPropagation()}
                      className="p-1.5 text-[#94a3b8] hover:text-red-400 hover:bg-red-600/10 rounded-md transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'agents' && (
            <div className="space-y-3">
              {mockAgents.map(agent => (
                <div key={agent.id} className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold">{agent.name}</h3>
                        <Badge status={agent.status} />
                      </div>
                      <p className="text-[#94a3b8] text-sm">{agent.description}</p>
                    </div>
                  </div>
                  <p className="text-[#475569] text-xs mb-3 italic">"{agent.personality}"</p>
                  <div className="flex gap-2">
                    <Link
                      to={`/forge/${agent.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d4e] text-[#94a3b8] rounded-lg text-xs hover:border-indigo-500/50 hover:text-indigo-400 transition-colors"
                    >
                      <Edit3 size={12} /> Edit
                    </Link>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-lg text-xs hover:bg-indigo-600/30 transition-colors">
                      <Rocket size={12} /> Deploy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedArtifact && (
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium text-sm">Preview</h3>
                <button
                  onClick={() => setSelectedArtifact(null)}
                  className="text-[#475569] hover:text-white text-xs transition-colors"
                >
                  ✕ Close
                </button>
              </div>
              <ArtifactPreview artifact={selectedArtifact} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
