import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Briefcase, FileText, Network, FileSpreadsheet, Activity, Shield, PlusCircle, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenIngestModal: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenIngestModal
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commandItems = [
    { type: 'Navigation', label: 'Go to Cases', path: '/cases', icon: Briefcase },
    { type: 'Navigation', label: 'Go to Evidence', path: '/evidence', icon: FileText },
    { type: 'Navigation', label: 'Go to Relationships', path: '/graph', icon: Network },
    { type: 'Navigation', label: 'Go to Reports', path: '/reports', icon: FileSpreadsheet },
    { type: 'Navigation', label: 'Go to Audit', path: '/audit', icon: Activity },
    { type: 'Action', label: '+ Ingest New Investigation Case', action: 'ingest', icon: PlusCircle },
    { type: 'Case', label: 'CASE-ATO-1001 — Account Takeover Attack', path: '/cases/CASE-ATO-1001', icon: Shield },
    { type: 'Case', label: 'CASE-VEL-2002 — Bot Velocity Micro-Transactions', path: '/cases/CASE-VEL-2002', icon: Shield },
    { type: 'Case', label: 'CASE-GEO-3003 — Geographic Impossible Travel Anomaly', path: '/cases/CASE-GEO-3003', icon: Shield },
    { type: 'Case', label: 'CASE-AMT-4004 — High Amount Deviation', path: '/cases/CASE-AMT-4004', icon: Shield },
    { type: 'Case', label: 'CASE-LEG-5005 — Household Shared Device Activity', path: '/cases/CASE-LEG-5005', icon: Shield }
  ];

  const filteredItems = commandItems.filter(item =>
    query === '' || item.label.toLowerCase().includes(query.toLowerCase()) || item.type.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          setQuery('');
          setSelectedIndex(0);
        }
      }
      if (isOpen) {
        if (e.key === 'Escape') {
          onClose();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            executeItem(filteredItems[selectedIndex]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  const executeItem = (item: typeof commandItems[0]) => {
    onClose();
    if (item.action === 'ingest') {
      onOpenIngestModal();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4 font-sans animate-fade-in">
      <div className="bg-slate-900/95 dark:bg-[#16191e]/95 border border-slate-200 dark:border-[#2a2e37] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col font-mono transition-colors">
        {/* Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-[#2a2e37] flex items-center space-x-3 bg-slate-100 dark:bg-[#0f1115]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search cases, evidence (⌘K)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-slate-800 dark:text-slate-100 text-xs focus:outline-none placeholder-slate-500"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-2 max-h-80 overflow-y-auto divide-y divide-slate-200/40 dark:divide-[#2a2e37]/40">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              No matching commands found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={idx}
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-800/40 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0f1115]'
                  }`}
                >
                  <div className="flex items-center space-x-3 text-xs">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[9px] uppercase font-mono text-slate-500 bg-slate-100 dark:bg-[#0f1115] px-2 py-0.5 rounded border border-slate-200 dark:border-[#2a2e37]">
                    {item.type}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Guidance */}
        <div className="p-3 border-t border-slate-200 dark:border-[#2a2e37] bg-slate-100 dark:bg-[#0f1115] text-[10px] text-slate-500 flex justify-between font-mono">
          <span>Use ↑ ↓ to navigate</span>
          <span>Press Enter to select • Esc to exit</span>
        </div>
      </div>
    </div>
  );
};
