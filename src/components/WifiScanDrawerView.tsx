import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Lock, 
  LockOpen, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  Smartphone, 
  Check, 
  ChevronRight, 
  ExternalLink, 
  AlertCircle, 
  Signal, 
  Radio, 
  Info,
  Sliders,
  CheckCircle2,
  X
} from 'lucide-react';
import { AuthenticatedSession, HotspotClient, HotspotPackage } from '../types/network';
import { DEFAULT_HOTSPOT_PACKAGES, formatSecondsToTime } from '../utils/hotspotPackages';
import { BroadcastGuideModal } from './BroadcastGuideModal';

interface WifiScanDrawerViewProps {
  isHotspotEnabled: boolean;
  onToggleHotspot: () => void;
  activeSession: AuthenticatedSession | null;
  onOpenCaptivePortal: () => void;
  onDisconnectSession: (sessionId: string) => void;
  onNavigateToHostDashboard: () => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

interface ScannedNetwork {
  ssid: string;
  bssid: string;
  security: 'WPA3' | 'WPA2' | 'Open' | 'Captive';
  signalPercent: number;
  signalDbm: number;
  frequency: '5 GHz' | '2.4 GHz' | '6 GHz';
  channel: number;
  isHostHotspot?: boolean;
}

const NEIGHBOR_NETWORKS: ScannedNetwork[] = [
  {
    ssid: 'Safaricom_5G_Home_Ultra',
    bssid: '70:F1:1C:44:90:A1',
    security: 'WPA3',
    signalPercent: 78,
    signalDbm: -58,
    frequency: '5 GHz',
    channel: 44
  },
  {
    ssid: 'Starlink_Terminal_Corp',
    bssid: 'E4:95:6E:88:22:1F',
    security: 'WPA2',
    signalPercent: 65,
    signalDbm: -68,
    frequency: '5 GHz',
    channel: 149
  },
  {
    ssid: 'Nairobi_City_Guest_WiFi',
    bssid: '9C:35:EB:12:F4:50',
    security: 'Open',
    signalPercent: 52,
    signalDbm: -76,
    frequency: '2.4 GHz',
    channel: 6
  },
  {
    ssid: 'Direct-8A-HP-SmartTank',
    bssid: 'B0:C5:54:33:11:8C',
    security: 'WPA2',
    signalPercent: 44,
    signalDbm: -82,
    frequency: '2.4 GHz',
    channel: 1
  }
];

export const WifiScanDrawerView: React.FC<WifiScanDrawerViewProps> = ({
  isHotspotEnabled,
  onToggleHotspot,
  activeSession,
  onOpenCaptivePortal,
  onDisconnectSession,
  onNavigateToHostDashboard,
  onShowToast
}) => {
  const [isWifiRadioOn, setIsWifiRadioOn] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isBroadcastGuideOpen, setIsBroadcastGuideOpen] = useState<boolean>(false);
  const [selectedNetwork, setSelectedNetwork] = useState<ScannedNetwork | null>(null);
  const [wpaPasswordPrompt, setWpaPasswordPrompt] = useState<string | null>(null);
  const [wpaInputPassword, setWpaInputPassword] = useState<string>('');
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);

  // Client device metadata
  const clientDevice = {
    name: 'iPhone-15-Guest.lan',
    mac: 'D4:8A:39:11:9F:80',
    ip: '192.168.43.155'
  };

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      onShowToast('Scanned 5 channels: "unseen legend" active at -42 dBm', 'info');
    }, 750);
  };

  const handleConnectToUnseenLegend = () => {
    if (!isHotspotEnabled) {
      setConnectionNotice(
        'Connection Restricted: The host master has closed the "unseen legend" gateway broadcast. Cannot establish route until the host opens the gateway switch.'
      );
      onShowToast('Cannot connect: "unseen legend" gateway closed by host', 'warning');
      return;
    }

    // Host gateway is open -> open Captive Portal view
    setConnectionNotice(null);
    onOpenCaptivePortal();
  };

  const handleConnectOther = (net: ScannedNetwork) => {
    if (net.security === 'Open') {
      onShowToast(`Connected to ${net.ssid} (Open Network)`, 'info');
      return;
    }
    setWpaPasswordPrompt(net.ssid);
    setWpaInputPassword('');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Breadcrumb & Dual Navigation Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#111827] border border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-slate-200">
            <Wifi className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-semibold text-slate-100 tracking-tight">
                System Wi-Fi Settings &amp; Network Scan
              </h2>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.2 rounded font-medium">
                IEEE 802.11ax
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Native mobile Wi-Fi settings drawer showing all available wireless access points.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsBroadcastGuideOpen(true)}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-cyan-300 hover:text-white bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/40 flex items-center gap-1.5 transition-all duration-150 cursor-pointer"
            title="How to broadcast 'unseen legend' so it appears on your physical phone"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Broadcast to Real Phone</span>
          </button>

          <button
            onClick={onNavigateToHostDashboard}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center gap-1.5 transition-all duration-150"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Host Monitoring Dashboard</span>
          </button>
        </div>
      </div>

      {/* Main Drawer Container Replicating Mobile/OS Wi-Fi Panel */}
      <div className="max-w-2xl mx-auto rounded-2xl bg-[#111827] border border-white/[0.08] shadow-2xl overflow-hidden">
        {/* Host Master Broadcast Controller Strip */}
        <div className="px-5 py-3 bg-[#0d1526] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">
              Host Master Broadcast: <span className="font-mono text-emerald-400">&ldquo;unseen legend&rdquo;</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className={`text-[11px] font-mono ${isHotspotEnabled ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isHotspotEnabled ? 'Broadcast OPEN' : 'Broadcast CLOSED'}
            </span>
            <button
              onClick={onToggleHotspot}
              className={`px-3 py-1 rounded text-xs font-medium transition-all duration-150 cursor-pointer ${
                isHotspotEnabled
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/50'
                  : 'bg-white text-slate-950 hover:bg-slate-200 font-bold'
              }`}
            >
              {isHotspotEnabled ? 'Close Broadcast' : 'Open Broadcast'}
            </button>
          </div>
        </div>

        {/* System Drawer Titlebar */}
        <div className="px-5 py-3.5 bg-[#090D16] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400">
              Wi-Fi Adapter Settings
            </span>
          </div>

          {/* Wi-Fi Radio Toggle Switch */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">
              {isWifiRadioOn ? 'Enabled' : 'Disabled'}
            </span>
            <button
              onClick={() => setIsWifiRadioOn(!isWifiRadioOn)}
              className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                isWifiRadioOn ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
              title="Toggle Wi-Fi Interface"
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${
                  isWifiRadioOn ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Client Device Node Status */}
        <div className="p-4 bg-[#0d1322] border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#090D16] border border-white/[0.08] text-slate-300">
              <Smartphone className="w-4 h-4 text-slate-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">{clientDevice.name}</span>
                <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-1.5 py-0.2 rounded border border-white/[0.06]">
                  Simulated Guest Handset
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 block">
                IP: {clientDevice.ip} · MAC: {clientDevice.mac}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeSession ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-emerald-400 text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active on unseen legend</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-white/[0.08] text-slate-400 text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                <span>Not Connected</span>
              </span>
            )}
          </div>
        </div>

        {/* Scanning & Refresh Strip */}
        <div className="px-5 py-3 bg-[#090D16]/60 border-b border-white/[0.06] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
              Available Networks
            </span>
            {isScanning && (
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Scanning...
              </span>
            )}
          </div>

          <button
            onClick={handleScan}
            disabled={!isWifiRadioOn || isScanning}
            className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
            <span>Scan Channels</span>
          </button>
        </div>

        {/* Network List View */}
        {!isWifiRadioOn ? (
          <div className="py-12 text-center space-y-3">
            <WifiOff className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-300">Wi-Fi is Turned Off</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Turn on Wi-Fi above to search for available nearby access points including &ldquo;unseen legend&rdquo;.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {/* ======================================================== */}
            {/* FEATURED NETWORK: "unseen legend" Hotspot                */}
            {/* ======================================================== */}
            <div className={`p-4 transition-all duration-150 relative ${
              activeSession 
                ? 'bg-emerald-950/15 border-l-4 border-l-emerald-400' 
                : 'bg-[#111827] hover:bg-white/[0.02]'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    activeSession
                      ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-400'
                      : isHotspotEnabled
                        ? 'bg-white/[0.05] border-white/[0.1] text-emerald-400'
                        : 'bg-amber-950/30 border-amber-800/40 text-amber-400'
                  }`}>
                    <Wifi className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-100 tracking-tight font-mono">
                        unseen legend
                      </h3>
                      
                      {/* Status Badges */}
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300">
                        Wi-Fi 6 · 5 GHz
                      </span>

                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Captive Portal</span>
                      </span>

                      {activeSession && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 font-semibold">
                          Connected &amp; Active
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                      <span>Signal: 98% (-42 dBm)</span>
                      <span>·</span>
                      <span>Channel: 36</span>
                      <span>·</span>
                      <span className={isHotspotEnabled ? 'text-emerald-400' : 'text-amber-400'}>
                        {isHotspotEnabled ? 'Broadcast Open' : 'Gateway Suspended by Host'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 pt-0.5">
                      {activeSession
                        ? `Authenticated pass: ${activeSession.packageName}. Internet access active.`
                        : isHotspotEnabled
                          ? 'Select package starting at 20 Shillings to connect to internet.'
                          : 'Host has closed this gateway. New connections are blocked until opened.'}
                    </p>
                  </div>
                </div>

                {/* Connection Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {activeSession ? (
                    <>
                      <button
                        onClick={onOpenCaptivePortal}
                        className="px-3 py-1.5 rounded-md text-xs font-medium bg-white text-slate-900 hover:bg-slate-200 transition-colors flex items-center gap-1"
                      >
                        <span>Portal Session</span>
                        <ExternalLink className="w-3 h-3 text-slate-800" />
                      </button>
                      <button
                        onClick={() => onDisconnectSession(activeSession.sessionId)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 transition-colors"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleConnectToUnseenLegend}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
                        isHotspotEnabled
                          ? 'bg-white text-slate-950 hover:bg-slate-200'
                          : 'bg-white/[0.08] hover:bg-white/[0.12] text-slate-300 border border-white/[0.1]'
                      }`}
                    >
                      <Wifi className="w-3.5 h-3.5" />
                      <span>Connect</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Notice Banner if Host Closed Broadcast */}
              {connectionNotice && (
                <div className="mt-3 p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs space-y-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold">
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Connection Restricted</span>
                    </div>
                    <button 
                      onClick={() => setConnectionNotice(null)}
                      className="text-amber-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {connectionNotice}
                  </p>
                  <div className="pt-1">
                    <button
                      onClick={onNavigateToHostDashboard}
                      className="text-[11px] font-mono text-emerald-400 underline hover:text-emerald-300"
                    >
                      Open Host Monitoring Dashboard to enable gateway &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* OTHER NEIGHBORING DETECTED NETWORKS (For realism)         */}
            {/* ======================================================== */}
            {NEIGHBOR_NETWORKS.map((net) => (
              <div 
                key={net.bssid}
                className="p-4 bg-[#111827] hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0 text-slate-500">
                      <Wifi className="w-3.5 h-3.5" />
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-300 font-mono">
                          {net.ssid}
                        </span>
                        {net.security !== 'Open' ? (
                          <Lock className="w-3 h-3 text-slate-500" />
                        ) : (
                          <span className="text-[9px] font-mono text-slate-400 bg-white/[0.04] px-1 py-0.2 rounded">
                            Open
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                        <span>{net.security}</span>
                        <span>·</span>
                        <span>{net.frequency}</span>
                        <span>·</span>
                        <span>Signal: {net.signalPercent}% ({net.signalDbm} dBm)</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleConnectOther(net)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors"
                  >
                    Connect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Info Box */}
        <div className="p-4 bg-[#090D16] border-t border-white/[0.08] text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Master Broadcast: <strong className="font-mono text-emerald-400">&ldquo;unseen legend&rdquo;</strong></span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Gateway Scope: 192.168.43.1/24 · WPA3/Captive
          </span>
        </div>
      </div>

      {/* Standard Simulated WPA Password Prompt for other networks */}
      {wpaPasswordPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl bg-[#111827] border border-white/[0.08] p-5 space-y-4 shadow-2xl"
          >
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-100">
                Enter Password for &ldquo;{wpaPasswordPrompt}&rdquo;
              </h3>
              <p className="text-xs text-slate-400">
                This network requires WPA2/WPA3 pre-shared key credentials.
              </p>
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono text-slate-500 block mb-1">Passphrase</label>
              <input
                type="password"
                value={wpaInputPassword}
                onChange={(e) => setWpaInputPassword(e.target.value)}
                placeholder="Enter network password..."
                className="w-full bg-[#090D16] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-white/[0.25]"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setWpaPasswordPrompt(null)}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setWpaPasswordPrompt(null);
                  onShowToast(`Simulated connection to ${wpaPasswordPrompt} authenticated`, 'success');
                }}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-white text-slate-900 hover:bg-slate-200"
              >
                Join Network
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real Hardware Wi-Fi Broadcast Guide & Phone QR Modal */}
      <BroadcastGuideModal
        isOpen={isBroadcastGuideOpen}
        onClose={() => setIsBroadcastGuideOpen(false)}
        ssid="unseen legend"
        appUrl={typeof window !== 'undefined' ? window.location.href : 'https://developer.safaricom.co.ke'}
        onShowToast={onShowToast}
      />
    </div>
  );
};
