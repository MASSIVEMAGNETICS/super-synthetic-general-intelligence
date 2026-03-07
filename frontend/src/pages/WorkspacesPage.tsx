import { useState } from 'react';
import { Plus, Search, FolderOpen, FileText, Bot, Clock } from 'lucide-react';
import Modal from '../components/shared/Modal';
import { Link } from 'react-router-dom';
import { Workspace } from '../types';

const mockWorkspaces: Workspace[] = [
  { id: 'ws-1', name: 'Marketing Q3', description: 'Q3 campaigns, strategy docs, and analysis', artifact_count: 12, agent_count: 2, created_at: '2024-01-15T10:00:00Z', updated_at: '2024-03-01T14:30:00Z' },
  { id: 'ws-2', name: 'Product Research', description: 'User research, competitive analysis, roadmaps', artifact_count: 8, agent_count: 3, created_at: '2024-02-01T09:00:00Z', updated_at: '2024-03-02T11:00:00Z' },
  { id: 'ws-3', name: 'Engineering Docs', description: 'API docs, architecture specs, runbooks', artifact_count: 15, agent_count: 1, created_at: '2024-01-20T08:00:00Z', updated_at: '2024-02-28T16:45:00Z' },
  { id: 'ws-4', name: 'Sales Enablement', description: 'Pitch decks, case studies, battle cards', artifact_count: 7, agent_count: 1, created_at: '2024-02-10T13:00:00Z', updated_at: '2024-03-01T09:15:00Z' },
];

export default function WorkspacesPage() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(mockWorkspaces);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const filtered = workspaces.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (!newName.trim()) return;
    const ws: Workspace = {
      id: 'ws-' + Date.now(),
      name: newName,
      description: newDesc,
      artifact_count: 0,
      agent_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setWorkspaces(prev => [ws, ...prev]);
    setNewName('');
    setNewDesc('');
    setModalOpen(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Workspaces</h1>
          <p className="text-[#94a3b8]">Organize your artifacts and agents into projects</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-lg transition-all"
        >
          <Plus size={16} />
          New Workspace
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search workspaces..."
          className="w-full max-w-md bg-[#1a1a2e] border border-[#2d2d4e] rounded-lg pl-9 pr-4 py-2 text-[#e2e8f0] placeholder-[#475569] focus:outline-none focus:border-indigo-500 text-sm transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(ws => (
          <Link
            key={ws.id}
            to={`/workspaces/${ws.id}`}
            className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-xl p-5 hover:border-indigo-500/50 transition-all hover:bg-[#1e1e38] group"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <FolderOpen size={18} className="text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold group-hover:text-indigo-300 transition-colors">{ws.name}</h3>
                <p className="text-[#94a3b8] text-sm mt-0.5 line-clamp-2">{ws.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#475569] mt-3 pt-3 border-t border-[#2d2d4e]">
              <span className="flex items-center gap-1"><FileText size={12} /> {ws.artifact_count} artifacts</span>
              <span className="flex items-center gap-1"><Bot size={12} /> {ws.agent_count} agents</span>
              <span className="flex items-center gap-1 ml-auto"><Clock size={12} /> {new Date(ws.updated_at).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Workspace">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#94a3b8] mb-1">Name</label>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Marketing Q4"
              className="w-full bg-[#0f0f1a] border border-[#2d2d4e] rounded-lg px-3 py-2 text-[#e2e8f0] placeholder-[#475569] focus:outline-none focus:border-indigo-500 text-sm transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-[#94a3b8] mb-1">Description</label>
            <textarea
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Briefly describe this workspace..."
              className="w-full bg-[#0f0f1a] border border-[#2d2d4e] rounded-lg px-3 py-2 text-[#e2e8f0] placeholder-[#475569] focus:outline-none focus:border-indigo-500 text-sm resize-none transition-colors"
              rows={3}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 border border-[#2d2d4e] text-[#94a3b8] rounded-lg hover:bg-[#1a1a2e] text-sm transition-colors">
              Cancel
            </button>
            <button onClick={handleCreate} className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-500 hover:to-purple-500 text-sm font-medium transition-all">
              Create
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
