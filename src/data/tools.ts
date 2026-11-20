import { ToolDefinition } from '../types';

export const TOOLS: ToolDefinition[] = [
  {
    id: 'udhaar-manager',
    category: 'finance',
    featured: true,
    iconBg: 'bg-cyan-500',
    iconText: 'text-[#040D21]',
  },
  {
    id: 'bills-reminder',
    category: 'finance',
    featured: true,
    iconBg: 'bg-yellow-400',
    iconText: 'text-[#040D21]',
  },
  {
    id: 'expense-tracker',
    category: 'finance',
    featured: true,
    iconBg: 'bg-orange-500',
    iconText: 'text-white',
  },
  {
    id: 'notes',
    category: 'productivity',
    featured: false,
    iconBg: 'bg-amber-400',
    iconText: 'text-slate-900',
  },
  {
    id: 'age-calculator',
    category: 'utilities',
    featured: false,
    iconBg: 'bg-emerald-600',
    iconText: 'text-white',
  },
];
