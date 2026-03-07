import { FileText, Code, BarChart2, Table, Layout, type LucideIcon } from 'lucide-react';
import { Artifact } from '../../types';

interface ArtifactPreviewProps {
  artifact: Artifact;
}

const typeIcons: Record<string, LucideIcon> = {
  document: FileText,
  code: Code,
  report: BarChart2,
  spreadsheet: Table,
  slide_deck: Layout,
};

export default function ArtifactPreview({ artifact }: ArtifactPreviewProps) {
  const Icon = typeIcons[artifact.type] || FileText;
  const isCode = artifact.type === 'code';

  return (
    <div className="bg-[#0f0f1a] rounded-xl border border-[#2d2d4e] overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-[#2d2d4e]">
        <Icon size={18} className="text-indigo-400" />
        <span className="text-white font-medium">{artifact.name}</span>
        <span className="ml-auto text-[#475569] text-xs">v{artifact.version}</span>
      </div>
      <div className="p-4 max-h-96 overflow-auto">
        {isCode ? (
          <pre className="text-sm text-[#e2e8f0] font-mono whitespace-pre-wrap">
            <code>{artifact.content}</code>
          </pre>
        ) : (
          <div className="text-sm text-[#94a3b8] whitespace-pre-wrap leading-relaxed">
            {artifact.content}
          </div>
        )}
      </div>
    </div>
  );
}
