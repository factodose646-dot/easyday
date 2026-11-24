import React from 'react';
import {
  BellRing,
  CalendarDays,
  HandCoins,
  NotebookPen,
  Users,
  Wallet,
} from 'lucide-react';
import { ToolId } from '../types';

interface ToolIconProps {
  toolId: ToolId;
  size?: 'sm' | 'md' | 'lg';
}

const ICON_MAP: Record<
  ToolId,
  {
    Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    bgClass: string;
    textClass: string;
  }
> = {
  'udhaar-manager': {
    Icon: HandCoins,
    bgClass: 'bg-cyan-500',
    textClass: 'text-[#040D21]',
  },
  'bills-reminder': {
    Icon: BellRing,
    bgClass: 'bg-yellow-400',
    textClass: 'text-[#040D21]',
  },
  'expense-tracker': {
    Icon: Wallet,
    bgClass: 'bg-orange-500',
    textClass: 'text-white',
  },
  'kameti-manager': {
    Icon: Users,
    bgClass: 'bg-teal-400',
    textClass: 'text-[#040D21]',
  },
  notes: {
    Icon: NotebookPen,
    bgClass: 'bg-amber-400',
    textClass: 'text-slate-900',
  },
  'age-calculator': {
    Icon: CalendarDays,
    bgClass: 'bg-emerald-600',
    textClass: 'text-white',
  },
};

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', { box: string; icon: string }> = {
  sm: { box: 'w-10 h-10 rounded-xl', icon: 'w-5 h-5' },
  md: { box: 'w-12 h-12 rounded-2xl', icon: 'w-6 h-6' },
  lg: { box: 'w-16 h-16 rounded-2xl', icon: 'w-8 h-8' },
};

export const ToolIcon: React.FC<ToolIconProps> = ({ toolId, size = 'md' }) => {
  const config = ICON_MAP[toolId];
  const dims = SIZE_CLASSES[size];
  const Icon = config.Icon;

  return (
    <div
      className={`${dims.box} ${config.bgClass} ${config.textClass} flex items-center justify-center shrink-0 shadow-sm`}
      aria-hidden="true"
    >
      <Icon className={dims.icon} strokeWidth={2.2} />
    </div>
  );
};
