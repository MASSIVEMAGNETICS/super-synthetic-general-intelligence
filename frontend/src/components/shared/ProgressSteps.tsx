import { Check, Loader2, Clock, AlertCircle } from 'lucide-react';
import { OrchestrationStep } from '../../types';

interface ProgressStepsProps {
  steps: OrchestrationStep[];
}

export default function ProgressSteps({ steps }: ProgressStepsProps) {
  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-[#0f0f1a] border border-[#2d2d4e]">
          <div className="flex-shrink-0">
            {step.status === 'complete' && (
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                <Check size={12} className="text-emerald-400" />
              </div>
            )}
            {step.status === 'running' && (
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500 flex items-center justify-center">
                <Loader2 size={12} className="text-indigo-400 animate-spin" />
              </div>
            )}
            {step.status === 'pending' && (
              <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center">
                <Clock size={12} className="text-slate-400" />
              </div>
            )}
            {step.status === 'error' && (
              <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center">
                <AlertCircle size={12} className="text-red-400" />
              </div>
            )}
          </div>
          <span className={`text-sm ${
            step.status === 'complete' ? 'text-emerald-400' :
            step.status === 'running' ? 'text-indigo-300' :
            step.status === 'error' ? 'text-red-400' :
            'text-[#475569]'
          }`}>
            {step.name}
          </span>
        </div>
      ))}
    </div>
  );
}
