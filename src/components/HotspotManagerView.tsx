import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Radio, 
  Smartphone, 
  Laptop, 
  Tablet, 
  Cpu, 
  Lock, 
  Download, 
  RefreshCw, 
  RotateCw,
  Search, 
  Sliders, 
  Signal, 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CreditCard, 
  ExternalLink, 
  LogOut, 
  CheckCircle2, 
  ShieldCheck,
  Zap,
  Power,
  ShieldAlert,
  Monitor,
  AlertCircle
} from 'lucide-react';
import { HotspotClient, HotspotConfig, AuthenticatedSession, HotspotPackage } from '../types/network';
import { DEFAULT_HOTSPOT_PACKAGES, formatSecondsToTime } from '../utils/hotspotPackages';
import { executeHotspotPackagePayment } from '../utils/paymentRouter';
import { CaptivePortalModal } from './CaptivePortalModal';
import { BroadcastGuideModal } from './BroadcastGuideModal';

interface HotspotManagerViewProps {
  isPro: boolean;
  onOpenProModal: () => void;
  onLogActivity: (title: string, description: string, category: 'hotspot' | 'pro', status: 'success' | 'warning' | 'info') => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
  onOpenWifiScanDrawer?: () => void;
  onOpenDarajaSetup?: () => void;
  onSwitchToClientView?: () => void;
  onCopyGuestLink?: () => void;
}

const INITIAL_CLIENTS: HotspotClient[] = [
  {
    id: 'cli-1',
    hostname: 'iPhone-15-Pro.lan',
    ip: '192.168.43.14',
    mac: 'F0:18:98:3A:C1:20',
    vendor: 'Apple Inc.',
    connectionType: 'Wi-Fi 6',
    signalDbm: -42,
    signalPercent: 96,
    dataUsageMb: 840,
    isBlocked: false,
    connectedDuration: '1h 14m',
    pingMs: 1.8,
    packageActive: '24-Hour Unlimited Pass (100 KES)',
    sessionRemainingSeconds: 67320, // ~18.7h
    sessionStatus: 'active'
  },
  {
    id: 'cli-2',
    hostname: 'MacBook-Air-M3.lan',
    ip: '192.168.43.25',
    mac: '3C:06:30:19:D4:55',
    vendor: 'Apple Inc.',
    connectionType: 'Wi-Fi 6',
    signalDbm: -49,
    signalPercent: 88,
    dataUsageMb: 2150,
    isBlocked: false,
    connectedDuration: '2h 05m',
    pingMs: 2.1,
    packageActive: 'Weekly Pro Bundle (350 KES)',
    sessionRemainingSeconds: 388800, // ~4.5d
    sessionStatus: 'active'
  },
  {
    id: 'cli-3',
    hostname: 'ThinkPad-X1-Carbon.lan',
    ip: '192.168.43.32',
    mac: '54:E1:AD:8F:22:9C',
    vendor: 'Lenovo Group Ltd',
    connectionType: 'Wi-Fi 6',
    signalDbm: -58,
    signalPercent: 74,
    dataUsageMb: 420,
    isBlocked: false,
    connectedDuration: '45m',
    pingMs: 3.4,
    packageActive: '24-Hour Unlimited Pass (100 KES)',
    sessionRemainingSeconds: 22500, // ~6.25h
    sessionStatus: 'active'
  },
  {
    id: 'cli-4',
    hostname: 'Pixel-9-Pro.lan',
    ip: '192.168.43.51',
    mac: '24:4B:FE:09:A1:7E',
    vendor: 'Google LLC',
    connectionType: 'Wi-Fi 6',
    signalDbm: -63,
    signalPercent: 68,
    dataUsageMb: 195,
    isBlocked: false,
    connectedDuration: '22m',
    pingMs: 2.9,
    packageActive: '1-Hour Express Pass (20 KES)',
    sessionRemainingSeconds: 1450, // ~24m
    sessionStatus: 'active'
  },
  {
    id: 'cli-5',
    hostname: 'iPad-Air-Field.lan',
    ip: '192.168.43.68',
    mac: 'AC:BC:32:77:1F:B3',
    vendor: 'Apple Inc.',
    connectionType: 'Wi-Fi 6',
    signalDbm: -51,
    signalPercent: 85,
    dataUsageMb: 1120,
    isBlocked: false,
    connectedDuration: '1h 48m',
    pingMs: 2.0,
    packageActive: '24-Hour Unlimited Pass (100 KES)',
    sessionRemainingSeconds: 50700, // ~14h
    sessionStatus: 'active'
  },
  {
    id: 'cli-6',
    hostname: 'Field-RaspberryPi-IoT.lan',
    ip: '192.168.43.99',
    mac: 'B8:27:EB:55:C3:0A',
    vendor: 'Raspberry Pi Trading Ltd',
    connectionType: 'USB Tether',
    signalDbm: -35,
    signalPercent: 100,
    dataUsageMb: 78,
    isBlocked: false,
    connectedDuration: '3h 12m',
    pingMs: 0.6,
    packageActive: 'Monthly Roaming Bundle (1,000 KES)',
    sessionRemainingSeconds: 1814400, // ~21d
    sessionStatus: 'active'
  }
];

export const HotspotManagerView: React.FC<HotspotManagerViewProps> = ({
  isPro,
  onOpenProModal,
  onLogActivity,
  onShowToast,
  onOpenWifiScanDrawer,
  onOpenDarajaSetup,
  onSwitchToClientView,
  onCopyGuestLink
}) => {
  // Dual-View Mode: 'host' (Owner Dashboard) | 'client' (Captive Portal Access Page)
  const [viewMode, setViewMode] = useState<'host' | 'client'>('host');
  const [hostTotalDataGb, setHostTotalDataGb] = useState<number>(15.0);
  const [hostPhoneNumber, setHostPhoneNumber] = useState<string>(() => {
    try {
      return localStorage.getItem('unseen_legend_host_phone') || '0142199194';
    } catch {
      return '0142199194';
    }
  });
  const [isEditingHostPhone, setIsEditingHostPhone] = useState<boolean>(false);
  const [tempHostPhone, setTempHostPhone] = useState<string>(hostPhoneNumber);
  const [isSimRoutingLocked, setIsSimRoutingLocked] = useState<boolean>(true);

  const [hotspotConfig, setHotspotConfig] = useState<HotspotConfig>({
    isEnabled: true,
    ssid: 'unseen legend',
    security: 'WPA3-Personal',
    band: '5 GHz',
    channel: 36,
    ipPool: '192.168.43.1/24',
    maxClients: 10,
    dataUsedMb: 4803,
    broadcastMode: 'Wi-Fi 6 (802.11ax)'
  });

  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState<boolean>(false);
  const [isCaptivePortalOpen, setIsCaptivePortalOpen] = useState<boolean>(false);
  const [isBroadcastGuideOpen, setIsBroadcastGuideOpen] = useState<boolean>(false);
  const [activeSession, setActiveSession] = useState<AuthenticatedSession | null>(null);

  const [clients, setClients] = useState<HotspotClient[]>(INITIAL_CLIENTS);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [inspectedClient, setInspectedClient] = useState<HotspotClient | null>(null);

  // Client View State (for the inline Captive Portal)
  const [clientSelectedPkg, setClientSelectedPkg] = useState<HotspotPackage>(DEFAULT_HOTSPOT_PACKAGES[0]); // 20 Shillings
  const [clientPayerPhone, setClientPayerPhone] = useState<string>('');
  const [isClientProcessing, setIsClientProcessing] = useState<boolean>(false);
  const [clientStatusMessage, setClientStatusMessage] = useState<string>('');
  const [isAwaitingClientPhonePrompt, setIsAwaitingClientPhonePrompt] = useState<boolean>(false);

  // Live Simulated Rates
  const [downlinkRate, setDownlinkRate] = useState<number>(84.6);
  const [uplinkRate, setUplinkRate] = useState<number>(14.2);

  // Session ticker timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setClients(prev => prev.map(client => {
        if (client.sessionRemainingSeconds && client.sessionRemainingSeconds > 0) {
          const updatedSeconds = client.sessionRemainingSeconds - 1;
          return {
            ...client,
            sessionRemainingSeconds: updatedSeconds,
            sessionStatus: updatedSeconds <= 0 ? 'disconnected' : client.sessionStatus
          };
        }
        return client;
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Bandwidth simulation effect
  useEffect(() => {
    if (!hotspotConfig.isEnabled) {
      setDownlinkRate(0);
      setUplinkRate(0);
      return;
    }

    const interval = setInterval(() => {
      setDownlinkRate(prev => {
        const delta = (Math.random() - 0.48) * 8;
        return Math.max(12, Math.min(145, Number((prev + delta).toFixed(1))));
      });
      setUplinkRate(prev => {
        const delta = (Math.random() - 0.48) * 3;
        return Math.max(2, Math.min(38, Number((prev + delta).toFixed(1))));
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [hotspotConfig.isEnabled]);

  // Primary Active Hotspot Switch (Host Master Control)
  const handleToggleHotspot = () => {
    const newState = !hotspotConfig.isEnabled;
    setHotspotConfig(prev => ({ ...prev, isEnabled: newState }));
    onLogActivity(
      newState ? 'Hotspot Broadcast Opened' : 'Hotspot Broadcast Closed',
      `SSID: "${hotspotConfig.ssid}" · Subnet: ${hotspotConfig.ipPool}`,
      'hotspot',
      newState ? 'success' : 'info'
    );
    onShowToast(
      newState ? `Broadcasting Wi-Fi as "${hotspotConfig.ssid}"` : `Hotspot gateway "${hotspotConfig.ssid}" closed`,
      newState ? 'success' : 'info'
    );
  };

  // Deep ARP & Subnet Sweep (Pro feature)
  const handleDeepScan = async () => {
    if (!isPro) {
      onOpenProModal();
      return;
    }

    setIsScanning(true);
    onShowToast('Initiating deep ARP sweep across "unseen legend" subnet...', 'info');

    await new Promise(resolve => setTimeout(resolve, 850));

    setClients(prev => prev.map(c => ({
      ...c,
      pingMs: Number((Math.random() * 3 + 0.5).toFixed(1)),
      signalPercent: Math.min(100, Math.max(50, c.signalPercent + Math.floor(Math.random() * 5 - 2)))
    })));

    setIsScanning(false);
    onLogActivity(
      'Deep Subnet Mapping Completed',
      `Identified ${clients.length} active client devices on "${hotspotConfig.ssid}".`,
      'hotspot',
      'success'
    );
    onShowToast(`Subnet scan complete: ${clients.length} active clients mapped`, 'success');
  };

  // Disconnect / Terminate client session
  const handleDisconnectClient = (client: HotspotClient) => {
    setClients(prev => prev.map(c => {
      if (c.id === client.id) {
        return {
          ...c,
          sessionStatus: 'disconnected',
          sessionRemainingSeconds: 0,
          packageActive: 'Session Revoked'
        };
      }
      return c;
    }));

    if (activeSession && activeSession.clientIp === client.ip) {
      setActiveSession(null);
    }

    onLogActivity(
      'Client Session Revoked',
      `Terminated DHCP lease for ${client.hostname} (${client.ip}) on "${hotspotConfig.ssid}".`,
      'hotspot',
      'warning'
    );
    onShowToast(`Disconnected ${client.hostname} (${client.ip})`, 'warning');
  };

  // Toggle client block status
  const handleToggleBlockClient = (client: HotspotClient) => {
    const updatedStatus = !client.isBlocked;
    setClients(prev => prev.map(c => c.id === client.id ? { ...c, isBlocked: updatedStatus } : c));
    
    if (inspectedClient && inspectedClient.id === client.id) {
      setInspectedClient(prev => prev ? { ...prev, isBlocked: updatedStatus } : null);
    }

    onLogActivity(
      updatedStatus ? `Client Traffic Blocked: ${client.hostname}` : `Client Unblocked: ${client.hostname}`,
      `IP: ${client.ip} · MAC: ${client.mac}`,
      'hotspot',
      updatedStatus ? 'warning' : 'success'
    );

    onShowToast(
      updatedStatus ? `Blocked ${client.hostname} (${client.ip})` : `Unblocked ${client.hostname}`,
      updatedStatus ? 'warning' : 'success'
    );
  };

  // Export client inventory (Pro feature)
  const handleExportClients = () => {
    if (!isPro) {
      onOpenProModal();
      return;
    }

    const lines = [
      `# NetPulse "unseen legend" Client Inventory - ${new Date().toISOString()}`,
      `# SSID: ${hotspotConfig.ssid} | Gateway: ${hotspotConfig.ipPool}`,
      `# Hostname,IP,MAC,Vendor,Connection,Package,RemainingSec,Signal,DataUsed`,
      ...clients.map(c => `${c.hostname},${c.ip},${c.mac},"${c.vendor}",${c.connectionType},"${c.packageActive || 'None'}",${c.sessionRemainingSeconds || 0},${c.signalDbm}dBm,${c.dataUsageMb}MB`)
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unseen-legend-Clients-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    onLogActivity('Exported Hotspot Client List', 'Exported CSV inventory.', 'hotspot', 'info');
    onShowToast('Exported client inventory CSV', 'success');
  };

  // Client view "Connect to Wi-Fi" trigger: STK Push prompt to physical phone handset
  const handleClientPayAndConnect = async () => {
    if (!hotspotConfig.isEnabled) {
      onShowToast(`Network "${hotspotConfig.ssid}" is currently closed by the host.`, 'warning');
      return;
    }

    if (!clientPayerPhone.trim() || clientPayerPhone.length < 6) {
      onShowToast('Please enter your mobile number in 07******** format', 'warning');
      return;
    }

    setIsClientProcessing(true);
    setIsAwaitingClientPhonePrompt(true);
    setClientStatusMessage(`STK push dispatched to your phone (${clientPayerPhone}). Check your phone screen now...`);

    const guestMeta = {
      ip: '192.168.43.155',
      mac: 'D4:8A:39:11:9F:80',
      deviceName: 'iPhone-15-Guest.lan'
    };

    try {
      setClientStatusMessage('Dispatching Safaricom Daraja STK push...');

      const result = await executeHotspotPackagePayment(
        clientSelectedPkg,
        clientPayerPhone,
        guestMeta,
        (msg) => setClientStatusMessage(msg)
      );

      if (result.verified && result.session) {
        const newClient: HotspotClient = {
          id: `client-${Date.now()}`,
          hostname: guestMeta.deviceName,
          ip: guestMeta.ip,
          mac: guestMeta.mac,
          vendor: 'Apple Inc. (Client Guest)',
          connectionType: 'Wi-Fi 6',
          signalDbm: -44,
          signalPercent: 94,
          dataUsageMb: 12,
          isBlocked: false,
          connectedDuration: 'Connected just now',
          pingMs: 1.4,
          packageActive: `${clientSelectedPkg.name} (${clientSelectedPkg.price} KES)`,
          sessionRemainingSeconds: clientSelectedPkg.durationMinutes * 60,
          sessionStatus: 'active'
        };

        setActiveSession(result.session);
        setClients(prev => [newClient, ...prev.filter(c => c.ip !== newClient.ip)]);
        setIsClientProcessing(false);
        setIsAwaitingClientPhonePrompt(false);

        // Confirmation toast (exact professional text per user brief)
        onLogActivity(
          'Hotspot Session Authenticated',
          result.message,
          'hotspot',
          'success'
        );
        onShowToast(result.message, 'success');
      }
    } catch {
      setIsClientProcessing(false);
      setIsAwaitingClientPhonePrompt(false);
      onShowToast('Payment verification timed out. Please try again.', 'warning');
    }
  };

  // Captive Portal Authentication Callback
  const handleSessionAuthenticated = (newClient: HotspotClient, session: AuthenticatedSession) => {
    setActiveSession(session);
    setClients(prev => [newClient, ...prev.filter(c => c.ip !== newClient.ip)]);
  };

  const handlePortalDisconnectSession = (_sessionId: string) => {
    if (activeSession) {
      setClients(prev => prev.map(c => {
        if (c.ip === activeSession.clientIp) {
          return {
            ...c,
            sessionStatus: 'disconnected',
            sessionRemainingSeconds: 0,
            packageActive: 'Session Expired'
          };
        }
        return c;
      }));
      setActiveSession(null);
    }
  };

  const filteredClients = clients.filter(c => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      c.hostname.toLowerCase().includes(q) ||
      c.ip.includes(q) ||
      c.mac.toLowerCase().includes(q) ||
      c.vendor.toLowerCase().includes(q) ||
      (c.packageActive && c.packageActive.toLowerCase().includes(q))
    );
  });

  const activeCount = clients.filter(c => !c.isBlocked && c.sessionStatus !== 'disconnected').length;
  const blockedCount = clients.filter(c => c.isBlocked).length;

  return (
    <div className="space-y-5">
      {/* Dual-View Switcher Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-xl bg-[#111827] border border-white/[0.08]">
        <div className="flex items-center gap-1 bg-[#090D16] p-1 rounded-lg border border-white/[0.06] w-full sm:w-auto">
          <button
            onClick={() => setViewMode('host')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
              viewMode === 'host'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Host Dashboard (Master Control)</span>
          </button>

          <button
            onClick={() => setViewMode('client')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
              viewMode === 'client'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Client &ldquo;Connect to Wi-Fi&rdquo; Portal</span>
          </button>
        </div>

        {/* Live Broadcast Indicator */}
        <div className="flex items-center gap-2.5 px-3 py-1 text-xs">
          <span className="text-slate-500 font-medium">Broadcast SSID:</span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#090D16] border border-white/[0.08] font-mono text-emerald-400 font-semibold">
            <span className={`w-2 h-2 rounded-full ${hotspotConfig.isEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>&ldquo;{hotspotConfig.ssid}&rdquo;</span>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* VIEW 1: HOST DASHBOARD (Master Control & Client Tracker)   */}
      {/* ========================================================== */}
      {viewMode === 'host' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Master Control Center & Gate Status */}
          <div className="rounded-xl bg-[#111827] border border-white/[0.08] p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3.5 border-b border-white/[0.08]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-slate-200">
                    <Radio className="w-3.5 h-3.5 text-slate-200" />
                  </div>
                  <h2 className="text-sm sm:text-base font-semibold text-slate-100 tracking-tight flex items-center gap-2">
                    <span>Hotspot Master Control:</span>
                    <span className="font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded text-xs">
                      &ldquo;{hotspotConfig.ssid}&rdquo;
                    </span>
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  Master Control Center. Other devices searching for nearby Wi-Fi discover &ldquo;{hotspotConfig.ssid}&rdquo;, but cannot access internet routes until you open the gateway.
                </p>
              </div>

              {/* Action Buttons: Settings Drawer & Primary Switch */}
              <div className="flex flex-wrap items-center gap-2.5">
                {onOpenDarajaSetup && (
                  <button
                    onClick={onOpenDarajaSetup}
                    className="px-2.5 py-1.5 rounded-md text-xs font-medium text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 flex items-center gap-1.5 transition-all duration-150 cursor-pointer"
                    title="Configure Safaricom Daraja STK Push API Keys & Registration"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Daraja STK Setup</span>
                  </button>
                )}

                {onOpenWifiScanDrawer && (
                  <button
                    onClick={onOpenWifiScanDrawer}
                    className="px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center gap-1.5 transition-all duration-150"
                  >
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Wi-Fi Scan Panel</span>
                  </button>
                )}

                <button
                  onClick={() => setIsBroadcastGuideOpen(true)}
                  className="px-2.5 py-1.5 rounded-md text-xs font-medium text-cyan-300 hover:text-white bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/40 flex items-center gap-1.5 transition-all duration-150 cursor-pointer"
                  title="Make 'unseen legend' appear on your real physical phone's Wi-Fi search"
                >
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Broadcast to Real Phone</span>
                </button>

                <button
                  onClick={() => setIsConfigDrawerOpen(!isConfigDrawerOpen)}
                  className="px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center gap-1.5 transition-all duration-150"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isConfigDrawerOpen ? 'Close Parameters' : 'AP Config'}</span>
                </button>

                {/* Primary Master Hotspot Switch */}
                <button
                  onClick={handleToggleHotspot}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 flex items-center gap-2 shadow-xs ${
                    hotspotConfig.isEnabled
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/50'
                      : 'bg-white text-slate-950 hover:bg-slate-200'
                  }`}
                >
                  {hotspotConfig.isEnabled ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Gateway Open</span>
                    </>
                  ) : (
                    <>
                      <Power className="w-3.5 h-3.5 text-slate-900" />
                      <span>Open Gateway</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Host Control Gate Banner Callout */}
            <div className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
              hotspotConfig.isEnabled
                ? 'bg-emerald-950/15 border-emerald-800/30 text-emerald-300'
                : 'bg-amber-950/15 border-amber-800/30 text-amber-300'
            }`}>
              <div className="flex items-center gap-2.5">
                {hotspotConfig.isEnabled ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <div>
                  <span className="font-semibold text-xs">
                    {hotspotConfig.isEnabled 
                      ? 'Host Control Gate Active · Internet Routing Enabled' 
                      : 'Host Control Gate Closed · Internet Access Paused'}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {hotspotConfig.isEnabled 
                      ? `Client devices can connect to "${hotspotConfig.ssid}" and authenticate via the captive portal.` 
                      : `Devices discover "${hotspotConfig.ssid}", but traffic forwarding is suspended until you activate the gateway switch.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                <span className="text-slate-500 uppercase">Broadcast State:</span>
                <span className={`px-2 py-0.5 rounded font-semibold ${
                  hotspotConfig.isEnabled ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40' : 'bg-slate-900 text-slate-400 border border-white/[0.08]'
                }`}>
                  {hotspotConfig.isEnabled ? 'BROADCASTING' : 'SUSPENDED'}
                </span>
              </div>
            </div>

            {/* Real Hardware Wi-Fi Broadcast Notice Banner */}
            <div className="p-3 rounded-lg bg-[#0d1627] border border-cyan-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Radio className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
                <div>
                  <span className="font-semibold text-slate-200">
                    Want &ldquo;{hotspotConfig.ssid}&rdquo; to appear in your physical phone&rsquo;s Wi-Fi search right now?
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Turn on your phone or PC hotspot named <span className="font-mono text-cyan-300 font-bold">&ldquo;{hotspotConfig.ssid}&rdquo;</span>, or scan the QR code to test the captive portal on your phone screen.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsBroadcastGuideOpen(true)}
                className="px-3 py-1.5 rounded bg-white text-slate-950 font-bold text-xs hover:bg-slate-200 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone Setup &amp; QR</span>
              </button>
            </div>

            {/* Configuration Drawer (Expandable) */}
            {isConfigDrawerOpen && (
              <div className="p-4 rounded-lg bg-[#090D16] border border-white/[0.08] space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <span className="text-xs font-semibold text-slate-200">AP Broadcast Configuration</span>
                  <span className="text-[10px] font-mono text-slate-500">IEEE 802.11ax / Linux hostapd</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-500 block mb-1">SSID Broadcast Name</label>
                    <input
                      type="text"
                      value={hotspotConfig.ssid}
                      onChange={(e) => setHotspotConfig(prev => ({ ...prev, ssid: e.target.value }))}
                      className="w-full bg-[#111827] border border-white/[0.08] rounded px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-white/[0.25]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-500 block mb-1">Radio Frequency Band</label>
                    <select
                      value={hotspotConfig.band}
                      onChange={(e) => setHotspotConfig(prev => ({ ...prev, band: e.target.value as any }))}
                      className="w-full bg-[#111827] border border-white/[0.08] rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-white/[0.25]"
                    >
                      <option value="5 GHz">5 GHz (High Throughput / Low Jitter)</option>
                      <option value="2.4 GHz">2.4 GHz (Extended Range / Penetration)</option>
                      <option value="Dual Band (6 GHz)">Dual Band (6 GHz Wi-Fi 6E)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-500 block mb-1">Security Protocol</label>
                    <select
                      value={hotspotConfig.security}
                      onChange={(e) => setHotspotConfig(prev => ({ ...prev, security: e.target.value as any }))}
                      className="w-full bg-[#111827] border border-white/[0.08] rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-white/[0.25]"
                    >
                      <option value="WPA3-Personal">WPA3-Personal (Captive Portal)</option>
                      <option value="WPA2/WPA3-Mixed">WPA2/WPA3-Mixed Mode</option>
                      <option value="Open">Open Network with Web Landing</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setIsConfigDrawerOpen(false);
                      onShowToast('Applied hotspot gateway parameters', 'success');
                    }}
                    className="px-3 py-1 rounded bg-white text-slate-950 font-medium text-xs hover:bg-slate-200 transition-colors"
                  >
                    Apply Parameters
                  </button>
                </div>
              </div>
            )}

            {/* Configuration Parameters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg bg-[#090D16] border border-white/[0.08]">
                <span className="text-[10px] uppercase font-medium text-slate-500 block">Network SSID</span>
                <span className="font-mono text-xs font-semibold text-emerald-400 truncate block mt-0.5">
                  {hotspotConfig.ssid}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#090D16] border border-white/[0.08]">
                <span className="text-[10px] uppercase font-medium text-slate-500 block">Protocol &amp; Security</span>
                <span className="font-mono text-xs font-medium text-slate-200 truncate block mt-0.5">
                  {hotspotConfig.security} · {hotspotConfig.band}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#090D16] border border-white/[0.08]">
                <span className="text-[10px] uppercase font-medium text-slate-500 block">Gateway IP Pool</span>
                <span className="font-mono text-xs font-medium text-slate-200 truncate block mt-0.5">
                  {hotspotConfig.ipPool}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#090D16] border border-white/[0.08]">
                <span className="text-[10px] uppercase font-medium text-slate-500 block">Authenticated Clients</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-xs font-semibold text-slate-100 tabular-nums">
                    {activeCount} of {hotspotConfig.maxClients}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({blockedCount > 0 ? `${blockedCount} blocked` : 'all active'})
                  </span>
                </div>
              </div>
            </div>

            {/* Live Throughput Telemetry Strip */}
            <div className="p-3 rounded-lg bg-[#090D16] border border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${hotspotConfig.isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                  <span className="text-slate-400 text-[11px]">Downlink:</span>
                  <span className="font-mono font-medium text-slate-200 text-xs tabular-nums flex items-center gap-0.5">
                    <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                    {downlinkRate} Mbps
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">Uplink:</span>
                  <span className="font-mono font-medium text-slate-200 text-xs tabular-nums flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3 text-cyan-400" />
                    {uplinkRate} Mbps
                  </span>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">Total Transferred:</span>
                  <span className="font-mono text-slate-300 text-xs tabular-nums">
                    {(hotspotConfig.dataUsedMb / 1024).toFixed(2)} GB
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
                <span>Channel: {hotspotConfig.channel}</span>
                <span>·</span>
                <span>SSID: &ldquo;{hotspotConfig.ssid}&rdquo;</span>
              </div>
            </div>
          </div>

          {/* Host Cellular Data Sharing Pool (This Device's Data) */}
          <div className="rounded-xl bg-[#0d1627] border border-cyan-800/30 p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-semibold text-white">
                      Host Cellular Data Sharing Pool
                    </h3>
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.2 rounded-full font-medium">
                      This Device is Host
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Connected clients browse using cellular data shared from your side. Access is metered and gated by M-Pesa passes.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {onCopyGuestLink && (
                  <button
                    onClick={onCopyGuestLink}
                    className="px-2.5 py-1.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/[0.08] text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Copy customer link that hides all host controls"
                  >
                    <span>Copy Guest Link</span>
                  </button>
                )}
                {onSwitchToClientView && (
                  <button
                    onClick={onSwitchToClientView}
                    className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Preview Client View</span>
                  </button>
                )}
              </div>
            </div>

            {/* Host Data Pool Meter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Shared Host Cellular Bundle</span>
                <span className="font-mono text-slate-200 text-xs">
                  <strong className="text-emerald-400">{(hotspotConfig.dataUsedMb / 1024).toFixed(2)} GB</strong> used of <strong className="text-white">{hostTotalDataGb} GB</strong> ({Math.max(0, Number((hostTotalDataGb - (hotspotConfig.dataUsedMb / 1024)).toFixed(2)))} GB left)
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-900 border border-white/[0.06] overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.min(100, Math.round(((hotspotConfig.dataUsedMb / 1024) / hostTotalDataGb) * 100))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Carrier Line:</span>
                  <span className="text-emerald-400 font-bold">Safaricom 4G/5G ({hostPhoneNumber})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>Bundle:</span>
                  {[5, 10, 15, 25, 50].map((gb) => (
                    <button
                      key={gb}
                      onClick={() => {
                        setHostTotalDataGb(gb);
                        onShowToast(`Host data allocation set to ${gb} GB`, 'info');
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${
                        hostTotalDataGb === gb 
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold' 
                          : 'bg-white/[0.04] text-slate-400 hover:text-white'
                      }`}
                    >
                      {gb}G
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Host SIM Line Data Routing Bridge Diagram */}
            <div className="p-3 rounded-lg bg-[#090D16] border border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cellular Data Routing Bridge (Host Line: {hostPhoneNumber})</span>
                </span>
                <button
                  onClick={() => setIsEditingHostPhone(!isEditingHostPhone)}
                  className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
                >
                  {isEditingHostPhone ? 'Close' : 'Change Host Line'}
                </button>
              </div>

              {isEditingHostPhone && (
                <div className="flex items-center gap-2 p-2 rounded bg-black/40 border border-white/[0.08] animate-in fade-in duration-150">
                  <span className="text-[11px] text-slate-400 font-mono">Host Line:</span>
                  <input
                    type="tel"
                    value={tempHostPhone}
                    onChange={(e) => setTempHostPhone(e.target.value)}
                    placeholder="e.g. 0142199194"
                    className="bg-[#111827] border border-white/[0.1] rounded px-2 py-1 text-xs text-white font-mono flex-1 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={() => {
                      if (tempHostPhone.trim()) {
                        setHostPhoneNumber(tempHostPhone.trim());
                        try {
                          localStorage.setItem('unseen_legend_host_phone', tempHostPhone.trim());
                        } catch {}
                        setIsEditingHostPhone(false);
                        onShowToast(`Host cellular data line updated to ${tempHostPhone.trim()}`, 'success');
                      }
                    }}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Save Line
                  </button>
                </div>
              )}

              {/* Live Flow Diagram */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-[11px] font-mono">
                <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-slate-400 block text-[10px]">1. Client Devices</span>
                  <span className="text-white font-bold block mt-0.5">Connected Guests</span>
                  <span className="text-[9px] text-slate-500">Wi-Fi &ldquo;{hotspotConfig.ssid}&rdquo;</span>
                </div>

                <div className="p-2 rounded bg-cyan-950/20 border border-cyan-800/30">
                  <span className="text-cyan-400 block text-[10px]">2. Host Hotspot Gateway</span>
                  <span className="text-cyan-200 font-bold block mt-0.5">This Phone Device</span>
                  <span className="text-[9px] text-cyan-400">Captive Gate &amp; Metering</span>
                </div>

                <div className="p-2 rounded bg-emerald-950/20 border border-emerald-800/30">
                  <span className="text-emerald-400 block text-[10px]">3. Internet Data Source</span>
                  <span className="text-emerald-300 font-bold block mt-0.5">SIM Line: {hostPhoneNumber}</span>
                  <span className="text-[9px] text-emerald-400">Safaricom Bundles</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                <strong className="text-slate-200">Data Routing Policy:</strong> 100% of all client web requests (YouTube, TikTok, Browsing, WhatsApp) are routed through your host phone&rsquo;s SIM card line (<span className="text-emerald-400 font-mono font-bold">{hostPhoneNumber}</span>). When an access pass expires, their route is cut off instantly.
              </p>
            </div>
          </div>

          {/* Access Packages Strip in Shillings */}
          <div className="rounded-xl bg-[#111827] border border-white/[0.08] p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-slate-300" />
                <h3 className="text-xs font-semibold text-slate-200">
                  Active Access Packages in Shillings (&ldquo;{hotspotConfig.ssid}&rdquo;)
                </h3>
              </div>
              <button
                onClick={() => setViewMode('client')}
                className="text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Switch to Client Portal</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {DEFAULT_HOTSPOT_PACKAGES.map((pkg) => (
                <div 
                  key={pkg.id}
                  onClick={() => {
                    setClientSelectedPkg(pkg);
                    setViewMode('client');
                  }}
                  className="cursor-pointer p-2.5 rounded-lg bg-[#090D16] border border-white/[0.06] hover:border-white/[0.14] transition-all duration-150"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-300 truncate">{pkg.name}</span>
                    {pkg.price === 20 && (
                      <span className="text-[8px] font-mono text-cyan-300 bg-cyan-950/60 px-1 py-0.2 rounded">
                        20 KES
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-mono text-xs font-bold text-emerald-400">{pkg.price} KES</span>
                    <span className="font-mono text-[9px] text-slate-500">/ {pkg.durationLabel}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5 truncate">
                    {pkg.bandwidthLimitMbps} Mbps · {pkg.dataLimitMb ? `${(pkg.dataLimitMb / 1024).toFixed(0)}GB` : 'Unlimited'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Connected Device Discovery & Scanner Controls */}
          <div className="rounded-xl bg-[#111827] border border-white/[0.08] p-5 shadow-sm space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <Signal className="w-3.5 h-3.5 text-slate-300" />
                    <span>Connected Devices on &ldquo;{hotspotConfig.ssid}&rdquo;</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] border border-white/[0.08] px-1.5 py-0.2 rounded">
                    Live RADIUS &amp; ARP Table
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live client tracker displaying devices currently authenticated through the &ldquo;{hotspotConfig.ssid}&rdquo; captive portal.
                </p>
              </div>

              {/* Action Buttons: Export CSV, and Deep ARP Sweep */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportClients}
                  className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] flex items-center gap-1.5 transition-all duration-150"
                  title={isPro ? 'Export Client Inventory CSV' : 'Pro Feature: Export Locked'}
                >
                  <Download className="w-3 h-3 text-slate-400" />
                  <span>Export CSV</span>
                  {!isPro && <Lock className="w-2.5 h-2.5 text-slate-500" />}
                </button>

                <button
                  onClick={handleDeepScan}
                  disabled={isScanning}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all duration-150 active:scale-95 ${
                    isScanning
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/[0.08]'
                      : isPro
                        ? 'bg-white text-slate-900 hover:bg-slate-200 font-medium'
                        : 'bg-white/[0.05] hover:bg-white/[0.09] text-slate-200 border border-white/[0.08]'
                  }`}
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
                      <span>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3" />
                      <span>{isPro ? 'Deep ARP Sweep' : 'Deep Sweep (Pro)'}</span>
                      {!isPro && <Lock className="w-2.5 h-2.5 text-slate-500" />}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="pt-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search connected client by hostname, IP address, MAC, or active package..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-[#090D16] border border-white/[0.08] rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-white/[0.25] font-mono transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Connected Clients Table Grid */}
          <div className="rounded-xl bg-[#111827] border border-white/[0.08] overflow-hidden shadow-sm">
            <div className="p-3 border-b border-white/[0.08] flex items-center justify-between text-xs text-slate-500">
              <span>Connected Endpoint Nodes ({filteredClients.length})</span>
              <span className="font-mono text-[10px]">DHCP Scope: 192.168.43.0/24</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] font-medium uppercase tracking-wider text-slate-500 bg-[#090D16]">
                    <th className="py-2.5 px-3">Device / Hostname</th>
                    <th className="py-2.5 px-3">IP Address</th>
                    <th className="py-2.5 px-3">Active Package</th>
                    <th className="py-2.5 px-3">Time Remaining</th>
                    <th className="py-2.5 px-3">Signal</th>
                    <th className="py-2.5 px-3">Usage</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredClients.map((client) => {
                    const isInspected = inspectedClient?.id === client.id;
                    const isDisconnected = client.sessionStatus === 'disconnected';

                    return (
                      <tr 
                        key={client.id}
                        className={`hover:bg-white/[0.02] transition-colors ${
                          client.isBlocked ? 'bg-rose-950/10' : ''
                        } ${isDisconnected ? 'opacity-60 bg-slate-900/40' : ''} ${isInspected ? 'bg-white/[0.03]' : ''}`}
                      >
                        {/* Device / Hostname */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-[#090D16] border border-white/[0.08] text-slate-400">
                              {client.hostname.toLowerCase().includes('phone') ? <Smartphone className="w-3.5 h-3.5" /> :
                               client.hostname.toLowerCase().includes('macbook') || client.hostname.toLowerCase().includes('thinkpad') ? <Laptop className="w-3.5 h-3.5" /> :
                               client.hostname.toLowerCase().includes('ipad') ? <Tablet className="w-3.5 h-3.5" /> :
                               <Cpu className="w-3.5 h-3.5" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-slate-200 truncate text-xs">{client.hostname}</span>
                                {client.isBlocked ? (
                                  <span className="text-[9px] font-mono font-medium text-rose-400 bg-rose-950/40 border border-rose-800/40 px-1 py-0.2 rounded">
                                    Blocked
                                  </span>
                                ) : isDisconnected ? (
                                  <span className="text-[9px] font-mono font-medium text-slate-400 bg-slate-800 px-1 py-0.2 rounded">
                                    Disconnected
                                  </span>
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 block truncate">{client.vendor} · <span className="font-mono">{client.mac}</span></span>
                            </div>
                          </div>
                        </td>

                        {/* Assigned IP Address */}
                        <td className="py-3 px-3 font-mono text-slate-200 tabular-nums text-xs">
                          {client.ip}
                        </td>

                        {/* Active Package */}
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-mono text-slate-300 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded truncate block max-w-[150px]" title={client.packageActive || 'Unauthenticated'}>
                            {client.packageActive || 'Guest Lease'}
                          </span>
                        </td>

                        {/* Time Remaining */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span className={`tabular-nums ${
                              isDisconnected 
                                ? 'text-slate-500' 
                                : (client.sessionRemainingSeconds || 0) < 300 
                                  ? 'text-amber-400' 
                                  : 'text-emerald-400'
                            }`}>
                              {client.sessionRemainingSeconds !== undefined 
                            ? formatSecondsToTime(client.sessionRemainingSeconds) 
                            : 'N/A'}
                            </span>
                          </div>
                        </td>

                        {/* Signal */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-slate-300 tabular-nums">
                              {client.signalDbm} dBm
                            </span>
                            <span className={`text-[10px] font-mono ${
                              client.signalPercent > 80 ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              ({client.signalPercent}%)
                            </span>
                          </div>
                        </td>

                        {/* Usage & Latency */}
                        <td className="py-3 px-3 font-mono text-xs text-slate-300 tabular-nums">
                          <div>
                            <span>{client.dataUsageMb > 1024 ? `${(client.dataUsageMb / 1024).toFixed(1)} GB` : `${client.dataUsageMb} MB`}</span>
                            <span className="text-[10px] text-slate-500 block">rtt: {client.pingMs}ms</span>
                          </div>
                        </td>

                        {/* Actions: Disconnect & Inspect */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setInspectedClient(isInspected ? null : client)}
                              className="px-2 py-1 rounded text-[11px] font-medium text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors"
                            >
                              {isInspected ? 'Close' : 'Inspect'}
                            </button>

                            {!isDisconnected && (
                              <button
                                onClick={() => handleDisconnectClient(client)}
                                className="px-2 py-1 rounded text-[11px] font-medium text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 transition-colors"
                                title="Disconnect active session"
                              >
                                Disconnect
                              </button>
                            )}

                            <button
                              onClick={() => handleToggleBlockClient(client)}
                              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors border ${
                                client.isBlocked
                                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/40'
                                  : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.06]'
                              }`}
                            >
                              {client.isBlocked ? 'Unblock' : 'Block'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Detailed Inspection Drawer */}
            {inspectedClient && (
              <div className="p-4 bg-[#090D16] border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-100">{inspectedClient.hostname}</span>
                    <span className="font-mono text-[11px] text-slate-400">{inspectedClient.ip}</span>
                    <span className="text-[10px] text-slate-500 font-mono">· Duration: {inspectedClient.connectedDuration}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Hardware Vendor: <span className="text-slate-200">{inspectedClient.vendor}</span> · MAC: <span className="font-mono text-slate-300">{inspectedClient.mac}</span> · Signal: <span className="font-mono text-slate-300">{inspectedClient.signalDbm} dBm</span> · Package: <span className="font-mono text-emerald-400">{inspectedClient.packageActive || 'None'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (!isPro) {
                        onOpenProModal();
                        return;
                      }
                      onShowToast(`Applied bandwidth throttle to ${inspectedClient.ip}`, 'info');
                    }}
                    className="px-2.5 py-1 text-xs font-medium rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] flex items-center gap-1 transition-colors"
                  >
                    <span>Throttle Speed</span>
                    {!isPro && <Lock className="w-2.5 h-2.5 text-slate-500" />}
                  </button>

                  {inspectedClient.sessionStatus !== 'disconnected' && (
                    <button
                      onClick={() => handleDisconnectClient(inspectedClient)}
                      className="px-2.5 py-1 text-xs font-medium rounded bg-rose-950/60 text-rose-300 border border-rose-800/40 hover:bg-rose-900/50 transition-colors"
                    >
                      Terminate Session
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleBlockClient(inspectedClient)}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      inspectedClient.isBlocked
                        ? 'bg-emerald-500 text-slate-950 font-semibold'
                        : 'bg-white/[0.04] text-slate-300 border border-white/[0.08]'
                    }`}
                  >
                    {inspectedClient.isBlocked ? 'Restore Access' : 'Filter MAC'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* VIEW 2: CLIENT ACCESS PAGE (Captive Portal "Connect to Wi-Fi") */}
      {/* ========================================================== */}
      {viewMode === 'client' && (
        <div className="rounded-xl bg-[#111827] border border-white/[0.08] p-5 sm:p-7 shadow-xl space-y-6 max-w-3xl mx-auto animate-in fade-in duration-150">
          {/* Header of Client Portal */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                    &ldquo;{hotspotConfig.ssid}&rdquo; Wi-Fi Access Portal
                  </h2>
                  <span className="text-[11px] font-mono text-slate-400">
                    Captive Gateway IP: {hotspotConfig.ipPool.split('/')[0]}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium font-mono flex items-center gap-1.5 ${
                hotspotConfig.isEnabled
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                  : 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${hotspotConfig.isEnabled ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span>{hotspotConfig.isEnabled ? 'Network Online' : 'Gateway Suspended'}</span>
              </span>
            </div>
          </div>

          {/* Condition 1: If host has closed the gateway */}
          {!hotspotConfig.isEnabled ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-400 mx-auto flex items-center justify-center">
                <WifiOff className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-semibold text-slate-100">
                  &ldquo;{hotspotConfig.ssid}&rdquo; is Currently Closed
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The host owner has closed the gateway switch. New client devices cannot route traffic or purchase access packages until the host re-opens the network broadcast in the Master Control Center.
                </p>
              </div>
              <button
                onClick={() => setViewMode('host')}
                className="px-4 py-2 rounded-md bg-white text-slate-900 font-medium text-xs hover:bg-slate-200 transition-colors"
              >
                Switch to Host Dashboard to Open Gateway
              </button>
            </div>
          ) : activeSession ? (
            /* Condition 2: Active Authenticated Session */
            <div className="py-4 space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Connected to &ldquo;{hotspotConfig.ssid}&rdquo;</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-100">
                  Internet Session Active &amp; Verified
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Your device is authorized to transmit and receive data through the &ldquo;{hotspotConfig.ssid}&rdquo; wireless gateway.
                </p>
              </div>

              {/* Telemetry Readout */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3.5 rounded-lg bg-[#090D16] border border-white/[0.08]">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Time Remaining</span>
                  <span className="font-mono text-base font-bold text-emerald-400 block mt-1">
                    {formatSecondsToTime(Math.max(0, Math.floor((activeSession.expiresAt - Date.now()) / 1000)))}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-[#090D16] border border-white/[0.08]">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Active Plan</span>
                  <span className="font-mono text-xs font-semibold text-slate-200 truncate block mt-1">
                    {activeSession.packageName}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-[#090D16] border border-white/[0.08]">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Client IP</span>
                  <span className="font-mono text-xs font-medium text-slate-200 truncate block mt-1">
                    {activeSession.clientIp}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-[#090D16] border border-white/[0.08]">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Session Token</span>
                  <span className="font-mono text-[11px] font-medium text-slate-400 truncate block mt-1">
                    {activeSession.token}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    handlePortalDisconnectSession(activeSession.sessionId);
                    onShowToast('Session ended', 'info');
                  }}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect Session</span>
                </button>

                <button
                  onClick={() => setViewMode('host')}
                  className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-white text-slate-900 hover:bg-slate-200 transition-colors"
                >
                  Return to Host Monitor
                </button>
              </div>
            </div>
          ) : (
            /* Condition 3: Unauthenticated Client - Package Selection & "Connect to Wi-Fi" */
            <div className="space-y-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/40 text-amber-300 text-[11px] font-mono">
                  <AlertCircle className="w-3 h-3 text-amber-400" />
                  <span>Wi-Fi Access Locked &middot; Authentication Required</span>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-100">
                  Select a Wi-Fi Access Package (Prices in Shillings)
                </h3>
                <p className="text-xs text-slate-400">
                  Choose your preferred pass starting at <span className="text-emerald-400 font-semibold font-mono">20 Shillings</span> to unlock high-speed internet on &ldquo;{hotspotConfig.ssid}&rdquo;.
                </p>
              </div>

              {/* Package Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DEFAULT_HOTSPOT_PACKAGES.map((pkg) => {
                  const isSelected = clientSelectedPkg.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setClientSelectedPkg(pkg)}
                      className={`cursor-pointer p-4 rounded-xl border transition-all duration-150 flex flex-col justify-between relative ${
                        isSelected
                          ? 'bg-[#131D31] border-emerald-500/70 shadow-sm ring-1 ring-emerald-500/30'
                          : 'bg-[#090D16] border-white/[0.08] hover:border-white/[0.15]'
                      }`}
                    >
                      {pkg.price === 20 && (
                        <span className="absolute top-2.5 right-2.5 text-[9px] font-mono uppercase bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 px-1.5 py-0.2 rounded font-medium">
                          Starter 20 Shillings
                        </span>
                      )}

                      {pkg.popular && (
                        <span className="absolute top-2.5 right-2.5 text-[9px] font-mono uppercase bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 px-1.5 py-0.2 rounded font-medium">
                          Most Popular
                        </span>
                      )}

                      <div className="space-y-1.5">
                        <h4 className="text-xs font-semibold text-slate-200">{pkg.name}</h4>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-mono text-lg font-bold text-slate-100">{pkg.price} KES</span>
                          <span className="text-xs text-emerald-400 font-mono font-medium">({pkg.price} Shillings)</span>
                          <span className="text-[10px] text-slate-500 font-mono">/ {pkg.durationLabel}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          {pkg.description}
                        </p>
                      </div>

                      <div className="pt-2.5 mt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>Speed: {pkg.bandwidthLimitMbps} Mbps</span>
                        <span>{pkg.dataLimitMb ? `${(pkg.dataLimitMb / 1024).toFixed(0)} GB Quota` : 'Unlimited Data'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Input & Prominent "Connect to Wi-Fi" Action */}
              <div className="p-4 rounded-xl bg-[#090D16] border border-white/[0.08] space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/[0.06]">
                  <div>
                    <span className="text-xs font-semibold text-slate-200">Mobile Money Checkout (Shillings)</span>
                    <p className="text-[11px] text-slate-400">
                      Selected: <span className="text-slate-100 font-medium">{clientSelectedPkg.name}</span> &middot; <span className="text-emerald-400 font-mono font-semibold">{clientSelectedPkg.price} Shillings</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                    Direct Handset STK
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] uppercase font-mono text-slate-500 block">
                      Enter Mobile Phone Number for Payment
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      PIN prompt will show on this phone
                    </span>
                  </div>
                  <div className="relative">
                    <Smartphone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={clientPayerPhone}
                      onChange={(e) => setClientPayerPhone(e.target.value)}
                      placeholder="07********"
                      disabled={isClientProcessing}
                      className="w-full bg-[#111827] border border-white/[0.08] rounded-md pl-9 pr-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-white/[0.25]"
                    />
                  </div>
                </div>

                {/* Handset Prompt Notification Banner */}
                {isAwaitingClientPhonePrompt && (
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-left space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <Smartphone className="w-4 h-4 animate-bounce text-emerald-400" />
                      <span>STK Push Sent to Your Phone ({clientPayerPhone})</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Please check your phone screen now and enter your <span className="font-semibold text-emerald-400">M-Pesa PIN</span> on your phone handset to authorize KES {clientSelectedPkg.price}.
                    </p>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 pt-1 border-t border-emerald-900/40">
                      <RotateCw className="w-3 h-3 animate-spin text-emerald-400" />
                      <span>{clientStatusMessage}</span>
                    </div>
                  </div>
                )}

                {/* Prominent "Connect to Wi-Fi" and "Pay & Connect" Button */}
                {!isAwaitingClientPhonePrompt && (
                  <button
                    onClick={handleClientPayAndConnect}
                    disabled={isClientProcessing}
                    className="w-full py-3 rounded-md bg-white text-slate-950 hover:bg-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-150 active:scale-95 disabled:opacity-60 shadow-md cursor-pointer"
                  >
                    <Wifi className="w-4 h-4 text-slate-950" />
                    <span>Send Prompt to Phone &middot; Pay {clientSelectedPkg.price} Shillings</span>
                  </button>
                )}

                <p className="text-[10px] text-center text-slate-500">
                  The M-Pesa PIN prompt appears on your phone handset, never on the web. Once confirmed, &ldquo;{hotspotConfig.ssid}&rdquo; internet access unlocks automatically.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Captive Portal Modal (also available as overlay if needed) */}
      <CaptivePortalModal
        isOpen={isCaptivePortalOpen}
        onClose={() => setIsCaptivePortalOpen(false)}
        ssid={hotspotConfig.ssid}
        gatewayIp={hotspotConfig.ipPool.split('/')[0]}
        isHotspotEnabled={hotspotConfig.isEnabled}
        activeSession={activeSession}
        onSessionAuthenticated={handleSessionAuthenticated}
        onDisconnectSession={handlePortalDisconnectSession}
        onLogActivity={onLogActivity}
        onShowToast={onShowToast}
      />

      {/* Real Hardware Wi-Fi Broadcast Guide & Phone QR Modal */}
      <BroadcastGuideModal
        isOpen={isBroadcastGuideOpen}
        onClose={() => setIsBroadcastGuideOpen(false)}
        ssid={hotspotConfig.ssid}
        appUrl={typeof window !== 'undefined' ? window.location.href : 'https://developer.safaricom.co.ke'}
        onShowToast={onShowToast}
      />
    </div>
  );
};
