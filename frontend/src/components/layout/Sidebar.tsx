import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Zap, FolderOpen, Cpu, Rocket } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/create', icon: Zap, label: 'Create' },
  { to: '/workspaces', icon: FolderOpen, label: 'Workspaces' },
  { to: '/forge', icon: Cpu, label: 'Agent Forge' },
  { to: '/deploy', icon: Rocket, label: 'Deployments' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-[#0f0f1a] border-r border-[#2d2d4e] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#2d2d4e]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-none">AetherForge</h1>
            <p className="text-[#94a3b8] text-xs">Autonomous Platform</p>
          </div>
        </div>
      </div>
      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-[#94a3b8] hover:bg-[#1a1a2e] hover:text-[#e2e8f0]'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      {/* Footer */}
      <div className="p-4 border-t border-[#2d2d4e]">
        <p className="text-[#475569] text-xs text-center">v0.1.0 — Alpha</p>
      </div>
    </aside>
  );
}
