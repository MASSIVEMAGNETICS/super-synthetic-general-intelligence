import { Link } from 'react-router-dom';
import { Zap, Cpu, FolderOpen, Rocket, FileText, Box, Bot, Activity } from 'lucide-react';

const stats = [
  { label: 'Workspaces', value: '12', icon: Box, color: 'text-indigo-400' },
  { label: 'Artifacts', value: '47', icon: FileText, color: 'text-purple-400' },
  { label: 'Active Agents', value: '8', icon: Bot, color: 'text-emerald-400' },
  { label: 'Deployments', value: '3', icon: Activity, color: 'text-yellow-400' },
];

const quickActions = [
  { to: '/create', icon: Zap, label: 'Create Document', description: 'Generate docs, reports, slide decks', color: 'from-indigo-600 to-purple-600' },
  { to: '/forge', icon: Cpu, label: 'Build Agent', description: 'Design an autonomous digital worker', color: 'from-purple-600 to-pink-600' },
  { to: '/workspaces', icon: FolderOpen, label: 'New Workspace', description: 'Organize projects and artifacts', color: 'from-blue-600 to-cyan-600' },
  { to: '/deploy', icon: Rocket, label: 'Deploy Agent', description: 'Launch to cloud, browser, or desktop', color: 'from-emerald-600 to-teal-600' },
];

const recentActivity = [
  { name: 'Q3 Strategy Document', type: 'document', workspace: 'Marketing Q3', time: '2 minutes ago' },
  { name: 'ResearchBot v2', type: 'agent', workspace: 'Research Lab', time: '1 hour ago' },
  { name: 'Product Roadmap 2025', type: 'slide_deck', workspace: 'Product', time: '3 hours ago' },
  { name: 'Sales Analysis Report', type: 'report', workspace: 'Sales', time: '1 day ago' },
];

export default function Dashboard() {
  return (
    <div className="p-8 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero */}
      <div className="relative mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Alpha Release — v0.1.0
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-3">
          Welcome to{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            AetherForge
          </span>
        </h1>
        <p className="text-[#94a3b8] text-lg max-w-2xl">
          From raw intent to finished outputs and evolving digital workers.
          Build, deploy, and orchestrate autonomous AI agents at scale.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#94a3b8] text-sm">{label}</span>
              <Icon size={18} className={color} />
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {quickActions.map(({ to, icon: Icon, label, description, color }) => (
          <Link
            key={to}
            to={to}
            className="group bg-[#1a1a2e] border border-[#2d2d4e] rounded-xl p-5 hover:border-indigo-500/50 transition-all hover:bg-[#1e1e38]"
          >
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
              <Icon size={20} className="text-white" />
            </div>
            <h3 className="text-white font-semibold mb-1 group-hover:text-indigo-300 transition-colors">{label}</h3>
            <p className="text-[#94a3b8] text-sm">{description}</p>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
      <div className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-xl divide-y divide-[#2d2d4e]">
        {recentActivity.map((item, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
              <FileText size={14} className="text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{item.name}</p>
              <p className="text-[#475569] text-xs">{item.workspace} · {item.type}</p>
            </div>
            <span className="text-[#475569] text-xs">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
