'use client';

import { Priority } from '@/lib/api/types';
import { useLanguage } from '../LanguageProvider';
import { Flag } from 'lucide-react';

interface PrioritySelectorProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  className?: string;
}

const priorities: { value: Priority; label: string; color: string; bgColor: string; borderColor: string }[] = [
  {
    value: 'low',
    label: 'Low',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100',
    borderColor: 'border-emerald-200'
  },
  {
    value: 'medium',
    label: 'Medium',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100',
    borderColor: 'border-amber-200'
  },
  {
    value: 'high',
    label: 'High',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 hover:bg-rose-100',
    borderColor: 'border-rose-200'
  },
];

export function PrioritySelector({ value, onChange, className = '' }: PrioritySelectorProps) {
  const { t } = useLanguage();
  return (
    <div className={`flex gap-2 ${className}`}>
      {priorities.map((priority) => (
        <button
          key={priority.value}
          type="button"
          onClick={() => onChange(priority.value)}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200
            ${value === priority.value
              ? `${priority.bgColor} ${priority.borderColor} ${priority.color} ring-2 ring-offset-1 ring-${priority.value === 'low' ? 'emerald' : priority.value === 'medium' ? 'amber' : 'rose'}-200`
              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
            }
          `}
        >
          <Flag className={`w-4 h-4 ${value === priority.value ? priority.color : ''}`} />
          <span className="font-medium text-sm">{t(`taskItem.${priority.value}`)}</span>
        </button>
      ))}
    </div>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { t } = useLanguage();
  const config = priorities.find(p => p.value === priority) || priorities[1];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color} ${config.borderColor} border`}>
      <Flag className="w-3 h-3" />
      {t(`taskItem.${priority}`)}
    </span>
  );
}
