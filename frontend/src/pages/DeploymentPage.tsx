import { useState } from 'react';
import { Rocket, Pause, Square, Terminal, Cloud, Monitor, Globe, Activity, type LucideIcon } from 'lucide-react';
import Badge from '../components/shared/Badge';
import { Deployment } from '../types';

const mockDeployments: Deployment[] = [
  {
    id: 'dep-1',
    agent_id: 'agent-1',
    agent_name: 'ContentBot Alpha',
    target: 'cloud',
    status: 'deployed',
    deployed_at: '2024-02-28T12:00:00Z',
    logs: [
      '[2024-03-02 09:15:23] Agent started',
      '[2024-03-02 09:15:24] Memory initialized',
      '[2024-03-02 09:16:00] Task received: Generate blog post',
      '[2024-03-02 09:16:45] Draft complete, 847 words',
      '[2024-03-02 09:16:46] Quality check passed',
    ],
  },
  {
    id: 'dep-2',
    agent_id: 'agent-2',
    agent_name: 'ResearchBot v3',
    target: 'cloud',
    status: 'deployed',
    deployed_at: '2024-03-01T10:00:00Z',
    logs: [
      '[2024-03-02 10:02:11] Research task started',
      '[2024-03-02 10:02:15] Web search: AI industry trends',
      '[2024-03-02 10:03:22] Analyzed 24 sources',
      '[2024-03-02 10:04:01] Report generated',
    ],
  },
  {
    id: 'dep-3',
    agent_id: 'agent-3',
    agent_name: 'CodeBot',
    target: 'browser',
    status: 'paused',
    deployed_at: '2024-02-15T14:00:00Z',
    logs: [
      '[2024-02-15 14:00:01] Agent deployed',
      '[2024-02-15 14:05:00] Code generation task started',
      '[2024-02-15 14:05:30] Execution paused by user',
    ],
  },
];

const targetIcons: Record<string, LucideIcon> = {
  cloud: Cloud,
  browser: Globe,
  desktop: Monitor,
};

export default function DeploymentPage() {
  const [deployments, setDeployments] = useState<Deployment[]>(mockDeployments);
  const [selectedDep, setSelectedDep] = useState<Deployment | null>(mockDeployments[0]);

  const togglePause = (id: string) => {
    setDeployments(prev => prev.map(d =>
      d.id === id ? { ...d, status: d.status === 'deployed' ? 'paused' : 'deployed' } : d
    ));
    if (selectedDep?.id === id) {
      setSelectedDep(prev => prev ? { ...prev, status: prev.status === 'deployed' ? 'paused' : 'deployed' } : null);
    }
  };

  const terminate = (id: string) => {
    setDeployments(prev => prev.filter(d => d.id !== id));
    if (selectedDep?.id === id) setSelectedDep(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Deployments</h1>
          <p className="text-[#94a3b8]">Monitor and control your deployed agents</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-[#1a1a2e] border border-[#2d2d4e] rounded-lg">
          <Activity size={14} className="text-emerald-400 animate-pulse" />
          <span className="text-sm text-[#94a3b8]">{deployments.filter(d => d.status === 'deployed').length} active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Deployment list */}
        <div className="lg:col-span-2 space-y-3">
          {deployments.map(dep => {
            const TargetIcon = targetIcons[dep.target] || Cloud;
            return (
              <div
                key={dep.id}
                onClick={() => setSelectedDep(dep)}
                className={`bg-[#1a1a2e] border rounded-xl p-4 cursor-pointer transition-all ${
                  selectedDep?.id === dep.id ? 'border-indigo-500' : 'border-[#2d2d4e] hover:border-indigo-500/40'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-white font-semibold text-sm">{dep.agent_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge status={dep.status} />
                      <span className="flex items-center gap-1 text-xs text-[#475569]">
                        <TargetIcon size={10} /> {dep.target}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={e => { e.stopPropagation(); togglePause(dep.id); }}
                      className="p-1.5 text-[#94a3b8] hover:text-yellow-400 hover:bg-yellow-400/10 rounded-md transition-colors"
                      title={dep.status === 'deployed' ? 'Pause' : 'Resume'}
                    >
                      <Pause size={14} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); terminate(dep.id); }}
                      className="p-1.5 text-[#94a3b8] hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                      title="Terminate"
                    >
                      <Square size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-[#475569] text-xs">Deployed {new Date(dep.deployed_at).toLocaleDateString()}</p>
              </div>
            );
          })}

          {deployments.length === 0 && (
            <div className="text-center py-12 text-[#475569]">
              <Rocket size={32} className="mx-auto mb-3 opacity-50" />
              <p>No active deployments</p>
            </div>
          )}
        </div>

        {/* Log panel */}
        <div className="lg:col-span-3">
          {selectedDep ? (
            <div className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-[#2d2d4e]">
                <Terminal size={16} className="text-indigo-400" />
                <span className="text-white font-medium text-sm">{selectedDep.agent_name} — Runtime Logs</span>
                <span className="ml-auto">
                  <Badge status={selectedDep.status} />
                </span>
              </div>
              <div className="p-4 bg-[#0a0a12] font-mono text-xs space-y-1 min-h-48">
                {selectedDep.logs.map((log, i) => (
                  <div key={i} className="text-[#94a3b8] leading-relaxed">
                    <span className="text-[#475569]">{log.slice(0, 22)}</span>
                    <span>{log.slice(22)}</span>
                  </div>
                ))}
                {selectedDep.status === 'deployed' && (
                  <div className="text-indigo-400 flex items-center gap-1 mt-2">
                    <span className="animate-pulse">▊</span>
                    <span>Waiting for next task...</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-xl p-12 text-center text-[#475569]">
              <Terminal size={32} className="mx-auto mb-3 opacity-50" />
              <p>Select a deployment to view logs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
