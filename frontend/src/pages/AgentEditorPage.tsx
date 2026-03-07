import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, GitFork, Rocket, Plus, Trash2, Shield, CheckCircle, ArrowLeft } from 'lucide-react';
import { AgentTraits, MemoryConfig, ConstitutionRule } from '../types';

const ALL_TOOLS = ['web_search', 'code_execution', 'file_read', 'file_write', 'api_call'];

const defaultTraits: AgentTraits = {
  creativity: 70,
  autonomy: 60,
  verbosity: 50,
  caution: 70,
  empathy: 60,
  analyticity: 75,
};

const traitColors: Record<string, string> = {
  creativity: 'accent-purple-500',
  autonomy: 'accent-blue-500',
  verbosity: 'accent-cyan-500',
  caution: 'accent-yellow-500',
  empathy: 'accent-pink-500',
  analyticity: 'accent-emerald-500',
};

const mockVersions = [
  { version: 3, note: 'Improved caution parameters', date: '2024-03-01' },
  { version: 2, note: 'Added web_search tool', date: '2024-02-15' },
  { version: 1, note: 'Initial creation', date: '2024-01-10' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1a1a2e] border border-[#2d2d4e] rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

export default function AgentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [name, setName] = useState(isNew ? '' : 'ContentBot Alpha');
  const [description, setDescription] = useState(isNew ? '' : 'Specializes in marketing copy and brand voice');
  const [personality, setPersonality] = useState(isNew ? '' : 'I am a creative, persuasive content creator who deeply understands brand positioning and audience psychology. I craft compelling narratives that resonate with target audiences.');
  const [traits, setTraits] = useState<AgentTraits>(isNew ? defaultTraits : { creativity: 90, autonomy: 60, verbosity: 70, caution: 30, empathy: 75, analyticity: 55 });
  const [memory, setMemory] = useState<MemoryConfig>(isNew ? { type: 'short', vector_store: false } : { type: 'long', vector_store: true });
  const [tools, setTools] = useState<string[]>(isNew ? [] : ['web_search', 'file_write']);
  const [rules, setRules] = useState<ConstitutionRule[]>(isNew ? [] : [
    { id: 'r1', rule: 'Never generate harmful or misleading content', enabled: true },
    { id: 'r2', rule: 'Always cite sources when making factual claims', enabled: true },
    { id: 'r3', rule: 'Respect user privacy and data security', enabled: true },
    { id: 'r4', rule: 'Ask for clarification when intent is ambiguous', enabled: false },
  ]);
  const [newRule, setNewRule] = useState('');
  const [saved, setSaved] = useState(false);

  const alignmentScore = Math.round(
    (rules.filter(r => r.enabled).length / Math.max(rules.length, 1)) * 100 * 0.4 +
    traits.caution * 0.3 +
    (1 - traits.autonomy / 100) * 100 * 0.3
  );

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleTool = (tool: string) => {
    setTools(prev => prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]);
  };

  const addRule = () => {
    if (!newRule.trim()) return;
    setRules(prev => [...prev, { id: 'r' + Date.now(), rule: newRule, enabled: true }]);
    setNewRule('');
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/forge')} className="text-[#94a3b8] hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-white">{isNew ? 'New Agent' : name}</h1>
        <div className="ml-auto flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
            alignmentScore >= 70 ? 'bg-emerald-900/30 border-emerald-700 text-emerald-400' :
            alignmentScore >= 40 ? 'bg-yellow-900/30 border-yellow-700 text-yellow-400' :
            'bg-red-900/30 border-red-700 text-red-400'
          }`}>
            <Shield size={12} />
            Alignment: {alignmentScore}%
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Identity */}
        <Section title="Identity">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#94a3b8] mb-1">Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Agent name..."
                className="w-full bg-[#0f0f1a] border border-[#2d2d4e] rounded-lg px-3 py-2 text-[#e2e8f0] text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-[#94a3b8] mb-1">Description</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description..."
                className="w-full bg-[#0f0f1a] border border-[#2d2d4e] rounded-lg px-3 py-2 text-[#e2e8f0] text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </Section>

        {/* Personality */}
        <Section title="Personality">
          <textarea
            value={personality}
            onChange={e => setPersonality(e.target.value)}
            placeholder="Describe how this agent thinks, communicates, and behaves..."
            className="w-full bg-[#0f0f1a] border border-[#2d2d4e] rounded-lg px-3 py-2 text-[#e2e8f0] text-sm focus:outline-none focus:border-indigo-500 resize-none transition-colors"
            rows={4}
          />
        </Section>

        {/* Traits */}
        <Section title="Traits">
          <div className="grid grid-cols-2 gap-4">
            {(Object.entries(traits) as [keyof AgentTraits, number][]).map(([trait, value]) => (
              <div key={trait}>
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-[#94a3b8] capitalize">{trait}</label>
                  <span className="text-xs text-white font-medium">{value}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={value}
                  onChange={e => setTraits(prev => ({ ...prev, [trait]: Number(e.target.value) }))}
                  className={`w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#2d2d4e] ${traitColors[trait]}`}
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Memory */}
        <Section title="Memory">
          <div className="space-y-3">
            <div className="flex gap-3 flex-wrap">
              {(['none', 'short', 'long', 'persistent'] as const).map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="memory"
                    value={type}
                    checked={memory.type === type}
                    onChange={() => setMemory(prev => ({ ...prev, type }))}
                    className="accent-indigo-500"
                  />
                  <span className="text-sm text-[#94a3b8] capitalize">{type}</span>
                </label>
              ))}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={memory.vector_store}
                onChange={e => setMemory(prev => ({ ...prev, vector_store: e.target.checked }))}
                className="accent-indigo-500"
              />
              <span className="text-sm text-[#94a3b8]">Enable Vector Store</span>
            </label>
          </div>
        </Section>

        {/* Tools */}
        <Section title="Tools">
          <div className="flex flex-wrap gap-2">
            {ALL_TOOLS.map(tool => (
              <label
                key={tool}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all hover:border-indigo-500/50"
                style={{
                  borderColor: tools.includes(tool) ? '#4f46e5' : '#2d2d4e',
                  background: tools.includes(tool) ? 'rgba(79,70,229,0.1)' : 'transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={tools.includes(tool)}
                  onChange={() => toggleTool(tool)}
                  className="accent-indigo-500"
                />
                <span className="text-sm text-[#94a3b8]">{tool.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Constitution */}
        <Section title="Constitution">
          <div className="space-y-2 mb-3">
            {rules.map(rule => (
              <div key={rule.id} className="flex items-center gap-3 p-3 bg-[#0f0f1a] rounded-lg border border-[#2d2d4e]">
                <button
                  onClick={() => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))}
                  className={`w-8 h-4 rounded-full border transition-all flex-shrink-0 relative ${rule.enabled ? 'bg-indigo-600 border-indigo-500' : 'bg-[#2d2d4e] border-[#3d3d5e]'}`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${rule.enabled ? 'left-4' : 'left-0.5'}`} />
                </button>
                <span className={`text-sm flex-1 ${rule.enabled ? 'text-[#e2e8f0]' : 'text-[#475569]'}`}>{rule.rule}</span>
                <button
                  onClick={() => setRules(prev => prev.filter(r => r.id !== rule.id))}
                  className="text-[#475569] hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newRule}
              onChange={e => setNewRule(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRule()}
              placeholder="Add a new constitution rule..."
              className="flex-1 bg-[#0f0f1a] border border-[#2d2d4e] rounded-lg px-3 py-2 text-[#e2e8f0] text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              onClick={addRule}
              className="p-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-lg hover:bg-indigo-600/30 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </Section>

        {/* Version History */}
        {!isNew && (
          <Section title="Version History">
            <div className="space-y-2">
              {mockVersions.map(v => (
                <div key={v.version} className="flex items-center gap-4 p-3 bg-[#0f0f1a] rounded-lg border border-[#2d2d4e]">
                  <span className="text-indigo-400 font-mono text-sm">v{v.version}</span>
                  <span className="text-[#94a3b8] text-sm flex-1">{v.note}</span>
                  <span className="text-[#475569] text-xs">{v.date}</span>
                  {v.version < mockVersions[0].version && (
                    <button className="text-xs text-indigo-400 border border-indigo-500/30 px-2 py-1 rounded hover:bg-indigo-600/10 transition-colors">
                      Restore
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Action bar */}
      <div className="flex gap-3 mt-6 pt-6 border-t border-[#2d2d4e]">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-lg transition-all"
        >
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saved ? 'Saved!' : 'Save'}
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 border border-[#2d2d4e] text-[#94a3b8] rounded-lg hover:border-purple-500/50 hover:text-purple-400 transition-colors">
          <GitFork size={16} /> Fork
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-600/30 transition-all ml-auto">
          <Rocket size={16} /> Deploy
        </button>
      </div>
    </div>
  );
}
