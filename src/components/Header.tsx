import React from 'react';
import { Menu, Play, Sparkles, ShieldCheck, Zap, Smartphone, Share2 } from 'lucide-react';
import { NavTab } from './Sidebar';

interface HeaderProps {
  activeTab: NavTab;
  onOpenMobileNav: () => void;
  onQuickPing: () => void;
  onOpenProModal: () => void;
  onOpenDarajaSetup?: () => void;
  onSwitchToClientMode?: () => void;
  onCopyGuestLink?: () => void;
  isPro: boolean;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenMobileNav,
  onQuickPing,
  onOpenProModal,
  onOpenDarajaSetup,
  onSwitchToClientMode,
  onCopyGuestLink,
  isPro,
  isOnline
}) => {
  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard': return 'Overview';
      case 'hotspot': return 'unseen legend · Hotspot Control';
      case 'wifiscan': return 'Wi-Fi Networks Scan (System Panel)';
      case 'diagnostics': return 'Diagnostics';
      case 'commands': return 'CLI Reference';
      case 'reports': return 'Report Exporter';
      case 'subnet': return 'Subnet Utility';
      case 'scanner': return 'Device Scanner';
      default: return 'Suite';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-[#090D16]/80 border-b border-white/[0.08] backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      {/* Zone 1: Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-all duration-150"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-mono">unseen legend</span>
          <span className="text-slate-600">/</span>
          <span className="font-medium text-slate-200 truncate">
            {getTabTitle(activeTab)}
          </span>
        </div>
      </div>

      {/* Zone 2: Real-time Hotspot Broadcast State Badge */}
      <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#111827] border border-white/[0.08] text-xs">
        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
        <span className="text-slate-300 font-medium text-[11px]">
          Hotspot: unseen legend
        </span>
        <span className="text-slate-600">·</span>
        <span className="font-mono text-emerald-400 text-[11px]">192.168.43.1</span>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2">
        {onCopyGuestLink && (
          <button
            onClick={onCopyGuestLink}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] transition-all duration-150 whitespace-nowrap cursor-pointer"
            title="Copy clean customer portal link (hides all host controls)"
          >
            <Share2 className="w-3 h-3 text-cyan-400" />
            <span className="hidden md:inline">Share Guest Link</span>
          </button>
        )}

        {onSwitchToClientMode && (
          <button
            onClick={onSwitchToClientMode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-800/40 transition-all duration-150 whitespace-nowrap cursor-pointer"
            title="Preview what customers/clients see when they connect"
          >
            <Smartphone className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">Preview Client View</span>
            <span className="sm:hidden">Client</span>
          </button>
        )}

        {onOpenDarajaSetup && (
          <button
            onClick={onOpenDarajaSetup}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/40 transition-all duration-150 whitespace-nowrap cursor-pointer"
            title="Configure Safaricom Daraja M-Pesa STK Push API"
          >
            <Zap className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Daraja M-Pesa</span>
            <span className="sm:hidden">Daraja</span>
          </button>
        )}

        <button
          onClick={onQuickPing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] transition-all duration-150 ease-in-out whitespace-nowrap"
        >
          <Play className="w-3 h-3 text-slate-300 fill-slate-300" />
          <span>Quick Ping</span>
        </button>

        <button
          onClick={onOpenProModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ease-in-out whitespace-nowrap ${
            isPro
              ? 'bg-white/[0.04] text-emerald-400 border border-white/[0.08] hover:bg-white/[0.08]'
              : 'bg-white text-slate-900 hover:bg-slate-200 shadow-xs'
          }`}
        >
          {isPro ? (
            <>
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Pro Active</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3" />
              <span>Upgrade</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
