import { Link } from 'react-router-dom';
import { Plus, Edit3, GitFork, Rocket, Cpu } from 'lucide-react';
import Badge from '../components/shared/Badge';
import { Agent } from '../types';

const mockAgents: Agent[] = [
  { id: 'agent-1', workspace_id: 'ws-1', name: 'ContentBot Alpha', description: 'Specializes in marketing copy and brand voice', personality: 'I am a creative, persuasive content creator who deeply understands brand positioning and audience psychology.', traits: { creativity: 90, autonomy: 60, verbosity: 70, caution: 30, empathy: 75, analyticity: 55 }, memory_config: { type: 'long', vector_store: true }, tools: ['web_search', 'file_write'], constitution: [], status: 'deployed', version: 2, created_at: '2024-01-10T10:00:00Z', updated_at: '2024-02-28T12:00:00Z' },
  { id: 'agent-2', workspace_id: 'ws-2', name: 'ResearchBot v3', description: 'Deep research, synthesis, and analysis', personality: 'I am a meticulous researcher who synthesizes complex information into clear, actionable insights.', traits: { creativity: 50, autonomy: 80, verbosity: 65, caution: 75, empathy: 40, analyticity: 95 }, memory_config: { type: 'persistent', vector_store: true }, tools: ['web_search', 'code_execution', 'file_read'], constitution: [], status: 'deployed', version: 3, created_at: '2024-01-15T09:00:00Z', updated_at: '2024-03-01T11:00:00Z' },
  { id: 'agent-3', workspace_id: 'ws-3', name: 'CodeBot', description: 'Software engineering and code generation', personality: 'I am a precise, efficient software engineer who writes clean, well-documented, production-ready code.', traits: { creativity: 70, autonomy: 85, verbosity: 45, caution: 80, empathy: 35, analyticity: 90 }, memory_config: { type: 'long', vector_store: false }, tools: ['code_execution', 'file_read', 'file_write'], constitution: [], status: 'paused', version: 1, created_at: '2024-02-01T10:00:00Z', updated_at: '2024-02-15T14:00:00Z' },
  { id: 'agent-4', workspace_id: 'ws-4', name: 'SalesBot Beta', description: 'Sales automation and outreach', personality: 'I am an enthusiastic, empathetic sales professional who builds genuine relationships.', traits: { creativity: 65, autonomy: 50, verbosity: 80, caution: 40, empathy: 90, analyticity: 55 }, memory_config: { type: 'short', vector_store: false }, tools: ['web_search', 'api_call'], constitution: [], status: 'draft', version: 1, created_at: '2024-02-20T13:00:00Z', updated_at: '2024-02-25T10:00:00Z' },
];

const traitColors: Record<string, string> = {
  creativity: 'bg-purple-500',
  autonomy: 'bg-blue-500',
  verbosity: 'bg-cyan-500',
  caution: 'bg-yellow-500',
  empathy: 'bg-pink-500',
  analyticity: 'bg-emerald-500',
};

export default function AgentForgePage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Agent Forge</h1>
          <p className="text-[#94a3b8]">Design, train, and deploy autonomous digital workers</p>
        </div>
        <Link
          to="/forge/new"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-lg transition-all"
        >
          <Plus size={16} />
          Create New Agent
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockAgents.map(agent => (
          <div key={agent.id} className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-xl p-5 hover:border-indigo-500/40 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/20 flex items-center justify-center">
                  <Cpu size={18} className="text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold">{agent.name}</h3>
                    <Badge status={agent.status} />
                  </div>
                  <p className="text-[#94a3b8] text-xs">v{agent.version}</p>
                </div>
              </div>
            </div>

            <p className="text-[#94a3b8] text-sm mb-3">{agent.description}</p>
            <p className="text-[#475569] text-xs italic mb-4 line-clamp-2">"{agent.personality}"</p>

            {/* Trait bars */}
            <div className="space-y-1.5 mb-4">
              {(Object.entries(agent.traits) as [string, number][]).map(([trait, value]) => (
                <div key={trait} className="flex items-center gap-2">
                  <span className="text-[#475569] text-xs w-20 capitalize">{trait}</span>
                  <div className="flex-1 h-1.5 bg-[#2d2d4e] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${traitColors[trait] || 'bg-indigo-500'} transition-all`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="text-[#475569] text-xs w-8 text-right">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-3 border-t border-[#2d2d4e]">
              <Link
                to={`/forge/${agent.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d4e] text-[#94a3b8] rounded-lg text-xs hover:border-indigo-500/50 hover:text-indigo-400 transition-colors"
              >
                <Edit3 size={12} /> Edit
              </Link>
              <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d4e] text-[#94a3b8] rounded-lg text-xs hover:border-purple-500/50 hover:text-purple-400 transition-colors">
                <GitFork size={12} /> Fork
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-lg text-xs hover:bg-indigo-600/30 transition-colors ml-auto">
                <Rocket size={12} /> Deploy
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
