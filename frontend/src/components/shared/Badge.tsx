import React from 'react';

interface BadgeProps {
  status: 'draft' | 'deployed' | 'paused' | 'archived' | string;
  children?: React.ReactNode;
}

const statusColors: Record<string, string> = {
  draft: 'bg-slate-700 text-slate-300 border-slate-600',
  deployed: 'bg-emerald-900/50 text-emerald-400 border-emerald-700',
  paused: 'bg-yellow-900/50 text-yellow-400 border-yellow-700',
  archived: 'bg-red-900/50 text-red-400 border-red-700',
};

export default function Badge({ status, children }: BadgeProps) {
  const colorClass = statusColors[status] || statusColors.draft;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${colorClass}`}>
      {children || status}
    </span>
  );
}
