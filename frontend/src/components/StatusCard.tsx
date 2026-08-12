import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatusCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  statusColor?: 'emerald' | 'indigo' | 'amber' | 'slate';
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  statusColor = 'indigo'
}) => {
  const colorStyles = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    slate: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  };

  return (
    <div className="glass-card rounded-xl p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
        <h3 className="text-xl font-bold text-white mt-1 font-mono">{value}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>}
      </div>
      <div className={`p-2.5 rounded-lg border ${colorStyles[statusColor]}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
};
