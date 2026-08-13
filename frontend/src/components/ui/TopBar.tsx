import React from 'react';
import { Search, Command, Sun, Moon, Menu } from 'lucide-react';
import { UserProfile } from '../../types';
import { Theme } from '../../utils/theme';

interface TopBarProps {
  user: UserProfile;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
  onOpenMobileSidebar?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  theme,
  onToggleTheme,
  onOpenCommandPalette,
  onOpenMobileSidebar
}) => {
  return (
    <header className="h-14 bg-slate-900/95 dark:bg-[#16191e]/95 border-b border-slate-200 dark:border-[#2a2e37] px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 font-sans transition-colors">
      <div className="flex items-center space-x-3 w-full max-w-md">
        {/* Mobile Menu Trigger */}
        {onOpenMobileSidebar && (
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Command Palette Launcher */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center space-x-2 md:space-x-3 bg-slate-100 dark:bg-[#0f1115] hover:bg-slate-200 dark:hover:bg-[#1e2229] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-3 md:px-4 py-2 rounded-xl border border-slate-200 dark:border-[#2a2e37] transition-all font-mono text-xs flex-1"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 text-left truncate">Search cases...</span>
          <span className="hidden sm:flex text-[10px] bg-slate-200 dark:bg-[#16191e] px-2 py-0.5 rounded border border-slate-300 dark:border-[#2a2e37] text-slate-500 font-bold items-center space-x-1">
            <Command className="w-3 h-3" />
            <span>K</span>
          </span>
        </button>
      </div>

      {/* Controls & User Profile */}
      <div className="flex items-center space-x-2 md:space-x-3">
        {/* System Status Indicator */}
        <div className="hidden md:flex items-center space-x-2 bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] px-3 py-1.5 rounded-xl font-mono text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-700 dark:text-slate-300 text-[11px]">Systems Operational</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-2 rounded-xl bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Profile */}
        <div className="flex items-center space-x-2.5 bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] px-2.5 md:px-3 py-1.5 rounded-xl">
          <div className="w-6 h-6 rounded-lg bg-teal-700 dark:bg-teal-600 flex items-center justify-center font-bold text-white text-[11px] font-mono shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="hidden lg:block text-left font-mono">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</div>
            <div className="text-[9px] text-slate-500 uppercase">{user.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
