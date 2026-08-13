import React from 'react';
import { Search, Command, Sun, Moon, Menu, LogOut } from 'lucide-react';
import { UserProfile } from '../../types';
import { Theme } from '../../utils/theme';

interface TopBarProps {
  user: UserProfile;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenCommandPalette: () => void;
  onOpenMobileSidebar?: () => void;
  onLogout?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  theme,
  onToggleTheme,
  onOpenCommandPalette,
  onOpenMobileSidebar,
  onLogout
}) => {
  return (
    <header className="h-14 bg-white dark:bg-[#16191e] border-b border-slate-200 dark:border-[#2a2e37] px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 font-sans transition-colors">
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
          className="p-2 rounded-xl bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex items-center space-x-1 font-mono text-xs"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline text-[11px] font-bold">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-700" />
              <span className="hidden sm:inline text-[11px] font-bold">Dark</span>
            </>
          )}
        </button>

        {/* User Profile & Logout */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2.5 bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] px-2.5 md:px-3 py-1.5 rounded-xl">
            <div className="w-6 h-6 rounded-lg bg-teal-700 dark:bg-teal-600 flex items-center justify-center font-bold text-white text-[11px] font-mono shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="hidden lg:block text-left font-mono">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</div>
              <div className="text-[9px] text-slate-500 uppercase">{user.role} ({user.id})</div>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Log Out Analyst Session"
              className="p-2 rounded-xl bg-slate-100 dark:bg-[#0f1115] border border-slate-200 dark:border-[#2a2e37] text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
