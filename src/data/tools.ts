import { ToolDefinition } from '../types';

export const TOOLS: ToolDefinition[] = [
  {
    id: 'calculator',
    category: 'utilities',
    featured: true,
    iconBg: 'bg-blue-600',
    iconText: 'text-white',
  },
  {
    id: 'age-calculator',
    category: 'utilities',
    featured: false,
    iconBg: 'bg-emerald-600',
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
    id: 'todo-list',
    category: 'productivity',
    featured: true,
    iconBg: 'bg-indigo-600',
    iconText: 'text-white',
  },
  {
    id: 'expense-tracker',
    category: 'finance',
    featured: true,
    iconBg: 'bg-orange-500',
    iconText: 'text-white',
  },
  {
    id: 'unit-converter',
    category: 'utilities',
    featured: false,
    iconBg: 'bg-teal-600',
    iconText: 'text-white',
  },
];
