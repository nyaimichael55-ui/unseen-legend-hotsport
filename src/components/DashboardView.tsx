import React, { useState } from 'react';
import { 
  Activity, 
  Terminal, 
  FileText, 
  Network, 
  Copy, 
  Check, 
  ArrowRight, 
  Globe, 
  Server, 
  Clock, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Cloud,
  Lock,
  Radio,
  Wifi
} from 'lucide-react';
import { ActivityLogItem, PingSessionMetrics } from '../types/network';
import { NavTab } from './Sidebar';

interface DashboardViewProps {
  isOnline: boolean;
  isPro: boolean;
  latestDiagnostic: PingSessionMetrics | null;
  activityLogs: ActivityLogItem[];
  onClearLogs: () => void;
  onNavigate: (tab: NavTab) => void;
  onRunQuickPing: () => void;
  onOpenProModal: () => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  isOnline,
  isPro,
  latestDiagnostic,
  activityLogs,
  onClearLogs,
  onNavigate,
  onRunQuickPing,
  onOpenProModal,
  onShowToast
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [logFilter, setLogFilter] = useState<string>('all');

  const localIp = '192.168.1.108';
  const gatewayIp = '192.168.1.1';
  const dnsServers = '1.1.1.1, 8.8.8.8';

  const copyToClipboard = (text: string, fieldName: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    onShowToast(`Copied ${label} (${text}) to clipboard`, 'success');
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleCloudSync = () => {
    if (!isPro) {
      onOpenProModal();
      return;
    }
    onShowToast('Cloud telemetry logs synchronized to encrypted archive', 'success');
  };

  const filteredLogs = activityLogs.filter(log => {
    if (logFilter === 'all') return true;
    return log.category === logFilter;
  });

  return (
    <div className="space-y-5">
      {/* 1. Live Connection Status Banner */}
      <div className="rounded-xl bg-[#111827] border border-white/[0.08] p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`} />
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-slate-100 tracking-tight">
                  {isOnline ? 'System Network Interface Active' : 'Interface Offline'}
                </h2>
                <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] border border-white/[0.08] px-1.5 py-0.2 rounded">
                  {isOnline ? '1000BASE-T Full-Duplex' : 'Disconnected'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Real-time adapter state verified. Default gateway responsive with low latency. Public DNS resolvers active.
            </p>

            {/* IP, Gateway, DNS, & Hotspot Parameter Blocks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1.5">
              {/* Local IP */}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#090D16] border border-white/[0.08]">
                <div className="flex items-center gap-2 min-w-0">
                  <Server className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Local IPv4</span>
                    <span className="font-mono text-xs text-slate-200 font-medium tabular-nums truncate">{localIp}</span>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(localIp, 'local', 'Local IP')}
                  className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-white/[0.04] transition-all duration-150 shrink-0 ml-1.5"
                  title="Copy Local IP"
                  aria-label="Copy Local IP"
                >
                  {copiedField === 'local' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Gateway IP */}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#090D16] border border-white/[0.08]">
                <div className="flex items-center gap-2 min-w-0">
                  <Network className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Gateway</span>
                    <span className="font-mono text-xs text-slate-200 font-medium tabular-nums truncate">{gatewayIp} (0.8ms)</span>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(gatewayIp, 'gateway', 'Gateway IP')}
                  className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-white/[0.04] transition-all duration-150 shrink-0 ml-1.5"
                  title="Copy Gateway IP"
                  aria-label="Copy Gateway IP"
                >
                  {copiedField === 'gateway' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Public DNS */}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#090D16] border border-white/[0.08]">
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Resolvers</span>
                    <span className="font-mono text-xs text-slate-200 font-medium truncate">{dnsServers}</span>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(dnsServers, 'dns', 'DNS Resolvers')}
                  className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-white/[0.04] transition-all duration-150 shrink-0 ml-1.5"
                  title="Copy DNS IPs"
                  aria-label="Copy DNS IPs"
                >
                  {copiedField === 'dns' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Hotspot Broadcast Status Block */}
              <div 
                onClick={() => onNavigate('hotspot')}
                className="cursor-pointer flex items-center justify-between px-3 py-2 rounded-lg bg-[#090D16] border border-white/[0.08] hover:border-emerald-500/40 transition-colors"
                title="Manage unseen legend Hotspot"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Hotspot SSID</span>
                    <span className="font-mono text-xs text-emerald-400 font-semibold truncate">&ldquo;unseen legend&rdquo;</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-1.5 py-0.5 rounded shrink-0">
                  20 KES
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 justify-center">
            <button
              onClick={onRunQuickPing}
              className="px-3.5 py-2 rounded-md bg-white text-slate-900 hover:bg-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-all duration-150 ease-in-out shadow-xs"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Run Diagnostics</span>
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="px-3.5 py-2 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] text-xs font-medium flex items-center justify-center gap-1.5 transition-all duration-150 ease-in-out"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Quick Action Grid */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Diagnostic Tools
          </span>
          <span className="text-[10px] text-slate-500 font-mono">v2.4 Core</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Card 0: Wi-Fi Networks Scan (System Panel) */}
          <div
            onClick={() => onNavigate('wifiscan')}
            className="cursor-pointer p-4 rounded-xl bg-[#111827] hover:bg-[#131D31] border border-emerald-500/30 hover:border-emerald-500/50 transition-all duration-150 ease-in-out flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 flex items-center justify-center mb-3">
                <Wifi className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-semibold text-slate-200 tracking-tight">
                Wi-Fi Networks Scan
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                Mobile system panel showing &ldquo;unseen legend&rdquo; with captive portal login.
              </p>
            </div>
            <div className="mt-3.5 flex items-center text-[11px] font-medium text-emerald-400 gap-1 font-mono">
              <span>Open Settings</span>
              <ArrowRight className="w-3 h-3 text-emerald-400" />
            </div>
          </div>

          {/* Card 1: unseen legend Hotspot */}
          <div
            onClick={() => onNavigate('hotspot')}
            className="cursor-pointer p-4 rounded-xl bg-[#111827] hover:bg-[#131D31] border border-white/[0.08] hover:border-white/[0.14] transition-all duration-150 ease-in-out flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-200 flex items-center justify-center mb-3">
                <Radio className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-semibold text-slate-200 tracking-tight">
                &ldquo;unseen legend&rdquo; AP
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                Control master tethering gateway, captive portal packages, and live client IPs.
              </p>
            </div>
            <div className="mt-3.5 flex items-center text-[11px] font-medium text-slate-300 gap-1">
              <span>Master AP Gate</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          {/* Card 2: Ping */}
          <div
            onClick={() => onNavigate('diagnostics')}
            className="cursor-pointer p-4 rounded-xl bg-[#111827] hover:bg-[#131D31] border border-white/[0.08] hover:border-white/[0.14] transition-all duration-150 ease-in-out flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-200 flex items-center justify-center mb-3">
                <Activity className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-semibold text-slate-200 tracking-tight">
                Latency & Jitter
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                Run ICMP ping streams, measure RFC 3550 jitter, and chart stability over time.
              </p>
            </div>
            <div className="mt-3.5 flex items-center text-[11px] font-medium text-slate-300 gap-1">
              <span>Execute test</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          {/* Card 3: CLI Cheat Sheet */}
          <div
            onClick={() => onNavigate('commands')}
            className="cursor-pointer p-4 rounded-xl bg-[#111827] hover:bg-[#131D31] border border-white/[0.08] hover:border-white/[0.14] transition-all duration-150 ease-in-out flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-200 flex items-center justify-center mb-3">
                <Terminal className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-semibold text-slate-200 tracking-tight">
                CLI Reference
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                Copy syntax with flag breakdowns for Linux, PowerShell, and macOS.
              </p>
            </div>
            <div className="mt-3.5 flex items-center text-[11px] font-medium text-slate-300 gap-1">
              <span>Browse commands</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          {/* Card 4: Subnet Utility */}
          <div
            onClick={() => onNavigate('subnet')}
            className="cursor-pointer p-4 rounded-xl bg-[#111827] hover:bg-[#131D31] border border-white/[0.08] hover:border-white/[0.14] transition-all duration-150 ease-in-out flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-200 flex items-center justify-center mb-3">
                <Network className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-semibold text-slate-200 tracking-tight">
                Subnet & CIDR
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                Calculate netmask boundaries, broadcast vectors, and host ranges.
              </p>
            </div>
            <div className="mt-3.5 flex items-center text-[11px] font-medium text-slate-300 gap-1">
              <span>Calculate block</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </div>
          </div>

          {/* Card 5: Report Exporter */}
          <div
            onClick={() => onNavigate('reports')}
            className="cursor-pointer p-4 rounded-xl bg-[#111827] hover:bg-[#131D31] border border-white/[0.08] hover:border-white/[0.14] transition-all duration-150 ease-in-out flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-md bg-white/[0.04] border border-white/[0.08] text-slate-200 flex items-center justify-center mb-3">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-semibold text-slate-200 tracking-tight">
                Diagnostic Report
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                Generate structured ticket summaries formatted for ISP escalation.
              </p>
            </div>
            <div className="mt-3.5 flex items-center text-[11px] font-medium text-slate-300 gap-1">
              <span>Compile report</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Split Section: Latest Telemetry Card & Structured Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Latest Diagnostics Telemetry Card */}
        <div className="lg:col-span-1 rounded-xl bg-[#111827] border border-white/[0.08] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                Latest Latency Test
              </span>
              {latestDiagnostic && (
                <span className="text-[10px] font-mono text-slate-500">
                  {latestDiagnostic.timestamp}
                </span>
              )}
            </div>

            {latestDiagnostic ? (
              <div className="mt-3 space-y-3">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Target Host</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-medium text-slate-200 text-xs">{latestDiagnostic.targetName}</span>
                    <span className="font-mono text-xs text-slate-300">{latestDiagnostic.target}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-[#090D16] border border-white/[0.08]">
                    <span className="text-[10px] uppercase text-slate-500 font-medium">Avg RTT</span>
                    <p className="text-base font-semibold font-mono text-slate-100 tabular-nums mt-0.5">
                      {latestDiagnostic.avgRtt} <span className="text-[11px] font-normal text-slate-500">ms</span>
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#090D16] border border-white/[0.08]">
                    <span className="text-[10px] uppercase text-slate-500 font-medium">Jitter</span>
                    <p className="text-base font-semibold font-mono text-emerald-400 tabular-nums mt-0.5">
                      {latestDiagnostic.jitterMs} <span className="text-[11px] font-normal text-slate-500">ms</span>
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#090D16] border border-white/[0.08]">
                    <span className="text-[10px] uppercase text-slate-500 font-medium">Packet Loss</span>
                    <p className={`text-base font-semibold font-mono tabular-nums mt-0.5 ${latestDiagnostic.lossPercent > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                      {latestDiagnostic.lossPercent}%
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#090D16] border border-white/[0.08]">
                    <span className="text-[10px] uppercase text-slate-500 font-medium">Status</span>
                    <p className="text-xs font-medium text-slate-200 mt-1 uppercase">
                      {latestDiagnostic.status}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('diagnostics')}
                  className="w-full mt-1.5 py-1.5 px-2.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-slate-300 hover:text-white border border-white/[0.08] flex items-center justify-center gap-1.5 transition-all duration-150"
                >
                  <span>Inspect Waveform</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            ) : (
              <div className="py-8 text-center space-y-2.5">
                <div className="w-8 h-8 rounded-md bg-white/[0.04] border border-white/[0.08] mx-auto flex items-center justify-center text-slate-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-slate-300">No Tests Logged</p>
                  <p className="text-[11px] text-slate-500 max-w-[200px] mx-auto">
                    Execute a ping test to establish a baseline RTT measurement.
                  </p>
                </div>
                <button
                  onClick={onRunQuickPing}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] text-xs font-medium transition-all duration-150"
                >
                  <Activity className="w-3 h-3 text-slate-300" />
                  <span>Run Baseline Test</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Structured Recent Activity Feed Table with Cloud Log Lock */}
        <div className="lg:col-span-2 rounded-xl bg-[#111827] border border-white/[0.08] p-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <h3 className="text-xs font-semibold text-slate-200">
                  Recent Activity Feed
                </h3>
                <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                  ({filteredLogs.length})
                </span>
              </div>

              {/* Filter Tabs, Cloud Sync Lock, & Clear */}
              <div className="flex items-center gap-1.5">
                {/* Cloud Log History Pro Lock Button */}
                <button
                  onClick={handleCloudSync}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all duration-150 border ${
                    isPro 
                      ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400 hover:bg-emerald-950/60'
                      : 'bg-[#090D16] border-white/[0.08] text-slate-400 hover:border-white/[0.15]'
                  }`}
                  title={isPro ? 'Sync to Cloud Vault' : 'Unlock Cloud History (Pro)'}
                >
                  <Cloud className="w-3 h-3" />
                  <span>{isPro ? 'Cloud Vault' : 'Cloud Logs'}</span>
                  {!isPro && <Lock className="w-2.5 h-2.5 text-slate-500" />}
                </button>

                <div className="flex items-center gap-0.5 bg-[#090D16] p-0.5 rounded-md border border-white/[0.08] text-xs">
                  {(['all', 'diagnostic', 'command', 'subnet'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setLogFilter(cat)}
                      className={`px-2 py-0.5 rounded capitalize font-medium text-[10px] transition-all duration-150 ${
                        logFilter === cat 
                          ? 'bg-white/[0.08] text-white' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {activityLogs.length > 0 && (
                  <button
                    onClick={onClearLogs}
                    className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-colors"
                    title="Clear Feed"
                    aria-label="Clear Feed"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Structured Event List */}
            <div className="mt-2 divide-y divide-white/[0.04] max-h-[260px] overflow-y-auto pr-1">
              {filteredLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No activity matching current filter.
                </div>
              ) : (
                filteredLogs.map(log => (
                  <div key={log.id} className="py-2 flex items-start justify-between gap-3 hover:bg-white/[0.02] px-1 rounded transition-colors">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {log.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {log.status === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                        {log.status === 'info' && <Info className="w-3.5 h-3.5 text-slate-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate">
                          {log.title}
                        </p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {log.description}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0 whitespace-nowrap">
                      {log.timestamp}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2.5 border-t border-white/[0.08] text-[10px] text-slate-500 flex items-center justify-between">
            <span>{isPro ? 'Encrypted cloud synchronization online' : 'Local session storage (Upgrade for Cloud Archive)'}</span>
            <span className="font-mono text-slate-500">Audit Stream: #7F2B</span>
          </div>
        </div>
      </div>
    </div>
  );
};
