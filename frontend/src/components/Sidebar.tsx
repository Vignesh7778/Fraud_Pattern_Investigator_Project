import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Shield, LayoutDashboard, Briefcase, FileText, Network, FileSpreadsheet,
  Activity, PlusCircle, CheckCircle2, BarChart3, ChevronLeft, ChevronRight, X
} from 'lucide-react';

interface SidebarProps {
  onOpenIngestModal: () => void;
  selectedCaseId?: string;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenIngestModal,
  selectedCaseId = 'CASE-ATO-1001',
  isMobileOpen = false,
  onCloseMobile
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navigationSections = [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'cases', path: '/cases', label: 'Cases', icon: Briefcase },
        { id: 'investigation', path: `/cases/${selectedCaseId}`, label: 'Investigations', icon: Shield, badge: selectedCaseId },
      ]
    },
    {
      title: 'ANALYSIS',
      items: [
        { id: 'evidence', path: '/evidence', label: 'Evidence', icon: FileText },
        { id: 'relationships', path: '/graph', label: 'Relationships', icon: Network },
        { id: 'reports', path: '/reports', label: 'Reports', icon: FileSpreadsheet },
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'analytics', path: '/analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'audit', path: '/audit', label: 'Audit', icon: Activity },
      ]
    }
  ];

  const sidebarContent = (
    <aside className={`bg-slate-900/95 dark:bg-[#16191e]/95 border-r border-slate-200 dark:border-[#2a2e37] flex flex-col justify-between shrink-0 h-screen sticky top-0 font-sans z-30 transition-all duration-200 ${
      collapsed ? 'lg:w-16' : 'lg:w-64'
    } w-64`}>
      <div>
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-200 dark:border-[#2a2e37] flex items-center justify-between">
          <div
            onClick={() => {
              navigate('/cases');
              if (onCloseMobile) onCloseMobile();
            }}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-700 dark:bg-teal-600 flex items-center justify-center shadow-md text-white font-bold shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            {(!collapsed || isMobileOpen) && (
              <div>
                <div className="font-extrabold text-slate-800 dark:text-slate-100 text-xs tracking-wider font-mono">FPI CONSOLE</div>
                <div className="text-[9px] text-slate-500 font-mono">Enterprise AI Investigator</div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1">
            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:block text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Mobile Close Button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onOpenIngestModal();
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full bg-teal-700 hover:bg-teal-600 text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-sm transition-all border border-teal-600/30 font-mono ${
              collapsed ? 'lg:px-0' : ''
            }`}
            title="Start New Investigation Case"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            {(!collapsed || isMobileOpen) && <span>+ New Investigation</span>}
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="px-2 space-y-4 mt-2 overflow-y-auto max-h-[calc(100vh-220px)]">
          {navigationSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {(!collapsed || isMobileOpen) && (
                <div className="px-3 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path) || (item.id === 'investigation' && location.pathname.startsWith('/cases/'));

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(item.path);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-teal-950/60 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 border border-teal-800/40 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1e2229]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-700 dark:text-teal-400' : 'text-slate-400'}`} />
                      {(!collapsed || isMobileOpen) && <span>{item.label}</span>}
                    </div>
                    {(!collapsed || isMobileOpen) && item.badge && (
                      <span className="text-[9px] font-mono bg-slate-100 dark:bg-[#0f1115] text-slate-500 border border-slate-200 dark:border-[#2a2e37] px-1.5 py-0.5 rounded truncate max-w-[70px]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* System Footer */}
      {(!collapsed || isMobileOpen) && (
        <div className="p-3 border-t border-slate-200 dark:border-[#2a2e37] bg-slate-50 dark:bg-[#0f1115] text-xs space-y-2 font-mono">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Supabase Cloud DB</span>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">Connected</span>
          </div>
          <div className="bg-slate-200/60 dark:bg-[#16191e] p-2 rounded-xl border border-slate-300/60 dark:border-[#2a2e37] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Sarah Jenkins</div>
              <div className="text-[9px] text-slate-500">Lead Fraud Analyst</div>
            </div>
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block">
        {sidebarContent}
      </div>

      {/* Mobile Off-Canvas Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 animate-slide-right">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
