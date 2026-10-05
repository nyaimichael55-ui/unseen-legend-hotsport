import React from 'react';
import { 
  Activity, 
  Terminal, 
  FileText, 
  Network, 
  LayoutDashboard, 
  Radar, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Lock,
  Radio,
  Wifi
} from 'lucide-react';

export type NavTab = 'dashboard' | 'hotspot' | 'wifiscan' | 'diagnostics' | 'commands' | 'reports' | 'subnet' | 'scanner';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isOnline: boolean;
  isPro: boolean;
  onOpenProModal: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  userEmail?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isOnline,
  isPro,
  onOpenProModal,
  isOpenMobile,
  onCloseMobile,
  userEmail = 'nyaimichael55@gmail.com'
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; proOnly?: boolean }[] = [
    { id: 'hotspot', label: 'unseen legend AP', icon: Radio },
    { id: 'wifiscan', label: 'Wi-Fi Networks Drawer', icon: Wifi },
    { id: 'dashboard', label: 'Network Overview', icon: LayoutDashboard },
    { id: 'diagnostics', label: 'Live Diagnostics', icon: Activity },
    { id: 'commands', label: 'CLI Reference', icon: Terminal },
    { id: 'reports', label: 'Report Exporter', icon: FileText },
    { id: 'subnet', label: 'Subnet Utility', icon: Network },
    { id: 'scanner', label: 'Subnet Scanner', icon: Radar, proOnly: true }
  ];

  const handleNavClick = (tab: NavTab) => {
    if (tab === 'scanner' && !isPro) {
      onOpenProModal();
      onCloseMobile();
      return;
    }
    setActiveTab(tab);
    onCloseMobile();
  };

  const userInitials = userEmail.substring(0, 2).toUpperCase();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen bg-[#090D16] border-r border-white/[0.08] transition-all duration-150 ease-in-out flex flex-col justify-between
          ${isCollapsed ? 'w-[72px]' : 'w-60'}
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Top Header & Brand Zone */}
        <div className="flex flex-col">
          <div className="h-14 flex items-center justify-between px-3.5 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-md bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center shrink-0 text-emerald-400">
                <Wifi className="w-3.5 h-3.5" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col truncate">
                  <span className="font-semibold text-xs text-slate-100 tracking-tight font-mono">unseen legend</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Hotspot &amp; Portal
                  </span>
                </div>
              )}
            </div>

            {/* Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-all duration-150"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-2 space-y-0.5">
            {!isCollapsed && (
              <span className="px-2.5 pt-2 pb-1 text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                Workspace
              </span>
            )}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ease-in-out group relative
                    ${isActive 
                      ? 'bg-white/[0.06] text-white border border-white/[0.08]' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent'
                    }
                    ${isCollapsed ? 'justify-center px-0' : ''}
                  `}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  
                  {!isCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}

                  {!isCollapsed && item.proOnly && !isPro && (
                    <span className="flex items-center gap-0.5 text-[9px] font-medium text-slate-400 bg-white/[0.04] border border-white/[0.08] px-1 py-0.2 rounded font-mono">
                      <Lock className="w-2.5 h-2.5 text-slate-400" /> Pro
                    </span>
                  )}

                  {!isCollapsed && item.proOnly && isPro && (
                    <span className="text-[9px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1 py-0.2 rounded font-mono">
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Pro Upgrade Indicator & User Profile Pill */}
        <div className="p-2.5 space-y-2 border-t border-white/[0.08] bg-[#090D16]">
          {/* Pro Tier Card */}
          {!isCollapsed ? (
            <div 
              onClick={onOpenProModal}
              className="cursor-pointer p-2.5 rounded-lg bg-[#111827] border border-white/[0.08] hover:border-white/[0.15] hover:bg-[#131D31] transition-all duration-150 ease-in-out"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-slate-300" />
                  <span className="text-xs font-medium text-slate-200">
                    {isPro ? 'Pro Subscription' : 'Pro Tier'}
                  </span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isPro 
                    ? 'text-emerald-400 bg-emerald-950/50 border border-emerald-800/30' 
                    : 'text-slate-400 bg-white/[0.04] border border-white/[0.08]'
                }`}>
                  {isPro ? 'Active' : '$4.99/mo'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mb-2">
                {isPro ? 'Subnet device sweeps and PDF exports active.' : 'Automated local ARP sweeps and PDF reports.'}
              </p>
              <div className="w-full py-1 px-2 rounded bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] font-medium text-slate-200 flex items-center justify-center transition-all duration-150">
                {isPro ? 'Manage License' : 'Upgrade Plan'}
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenProModal}
              className="w-full p-2 rounded-lg flex items-center justify-center bg-[#111827] border border-white/[0.08] text-slate-300 hover:border-white/[0.15] hover:text-white transition-all duration-150"
              title="Pro Tier"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}

          {/* User Profile Pill at Bottom */}
          <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#111827] border border-white/[0.08] ${isCollapsed ? 'justify-center px-0' : ''}`}>
            <div className="relative shrink-0">
              <div className="w-6 h-6 rounded-md bg-white/[0.08] flex items-center justify-center text-[10px] font-medium text-slate-200 font-mono">
                {userInitials}
              </div>
              <span 
                className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ring-2 ring-[#111827] ${
                  isOnline ? 'bg-emerald-500' : 'bg-slate-500'
                }`} 
                title={isOnline ? 'Interface Active' : 'Link Offline'}
              />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[11px] font-medium text-slate-200 truncate leading-tight">
                  {userEmail}
                </span>
                <span className="text-[10px] font-mono text-slate-400 leading-tight truncate">
                  192.168.1.1 · {isOnline ? 'Connected' : 'Offline'}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
