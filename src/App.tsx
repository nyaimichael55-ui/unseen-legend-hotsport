import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { DiagnosticsView } from './components/DiagnosticsView';
import { CommandsView } from './components/CommandsView';
import { ReportExporterView } from './components/ReportExporterView';
import { SubnetToolView } from './components/SubnetToolView';
import { DeviceScannerView } from './components/DeviceScannerView';
import { HotspotManagerView } from './components/HotspotManagerView';
import { WifiScanDrawerView } from './components/WifiScanDrawerView';
import { CaptivePortalModal } from './components/CaptivePortalModal';
import { ClientPortalView } from './components/ClientPortalView';
import { DarajaSetupModal } from './components/DarajaSetupModal';
import { ProModal } from './components/ProModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { ActivityLogItem, PingSessionMetrics, AuthenticatedSession, HotspotClient } from './types/network';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('hotspot');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isOpenMobileNav, setIsOpenMobileNav] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Global "unseen legend" Hotspot & Captive Session Shared State
  const [isHotspotEnabled, setIsHotspotEnabled] = useState<boolean>(true);
  const [activeSession, setActiveSession] = useState<AuthenticatedSession | null>(null);
  const [isCaptivePortalOpen, setIsCaptivePortalOpen] = useState<boolean>(false);
  const [isDarajaModalOpen, setIsDarajaModalOpen] = useState<boolean>(false);

  // Device Role: Host Device (Full Dashboard) vs Client Device (Captive Portal Only)
  const [isHostMode, setIsHostMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('mode') === 'client' || urlParams.get('guest') === '1' || urlParams.get('portal') === '1') {
        return false;
      }
      const savedHost = localStorage.getItem('unseen_legend_is_host');
      if (savedHost === 'false') return false;
      if (savedHost === 'true') return true;
    }
    return true; // Default to host for initial admin session
  });
  
  // Pro Monetization State with persistence
  const [isPro, setIsPro] = useState<boolean>(() => {
    try {
      return localStorage.getItem('unseen_legend_is_pro') === 'true';
    } catch {
      return false;
    }
  });
  const [isProModalOpen, setIsProModalOpen] = useState<boolean>(false);

  const handleTogglePro = (activate: boolean) => {
    setIsPro(activate);
    try {
      localStorage.setItem('unseen_legend_is_pro', activate ? 'true' : 'false');
    } catch {}
  };

  const handleToggleHotspot = () => {
    setIsHotspotEnabled(prev => {
      const next = !prev;
      logActivity(
        next ? 'Hotspot Broadcast Opened' : 'Hotspot Broadcast Closed',
        next ? 'SSID "unseen legend" opened for wireless client authentication.' : 'SSID "unseen legend" closed. Gateway suspended.',
        'hotspot',
        next ? 'success' : 'info'
      );
      showToast(
        next ? 'Broadcasting Wi-Fi as "unseen legend"' : 'Hotspot gateway "unseen legend" closed',
        next ? 'success' : 'info'
      );
      return next;
    });
  };

  const handleSessionAuthenticated = (client: HotspotClient, session: AuthenticatedSession) => {
    setActiveSession(session);
    logActivity(
      'Device Authenticated on unseen legend',
      `Client IP: ${client.ip} · Package: ${session.packageName}`,
      'hotspot',
      'success'
    );
  };

  const handleDisconnectSession = (sessionId: string) => {
    setActiveSession(null);
    logActivity('Hotspot Session Terminated', `Lease revoked on unseen legend.`, 'hotspot', 'warning');
    showToast('Session disconnected successfully', 'info');
  };

  // Toast Notifications State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Telemetry & Session History
  const [latestDiagnostic, setLatestDiagnostic] = useState<PingSessionMetrics | null>(null);
  const [diagnosticsHistory, setDiagnosticsHistory] = useState<PingSessionMetrics[]>([]);
  
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([
    {
      id: 'boot-1',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: 'NetPulse Diagnostic Suite Initialized',
      description: 'Physical network interface eth0 verified. Gateway loop active at 192.168.1.1.',
      category: 'diagnostic',
      status: 'info'
    },
    {
      id: 'boot-2',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: 'DNS Cache Ready',
      description: 'Upstream Anycast benchmarks configured (Cloudflare 1.1.1.1, Google 8.8.8.8).',
      category: 'diagnostic',
      status: 'success'
    }
  ]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logActivity('Network Link Restored', 'Interface reconnected to upstream gateway.', 'diagnostic', 'success');
      showToast('Network connection active', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      logActivity('Network Link Dropped', 'Ethernet/Wi-Fi adapter report: connection lost.', 'diagnostic', 'warning');
      showToast('Network interface disconnected', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2800);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const logActivity = (
    title: string,
    description: string,
    category: ActivityLogItem['category'],
    status: ActivityLogItem['status']
  ) => {
    const newLog: ActivityLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      title,
      description,
      category,
      status
    };
    setActivityLogs(prev => [newLog, ...prev.slice(0, 49)]);
  };

  const handleSaveMetric = (metrics: PingSessionMetrics) => {
    setLatestDiagnostic(metrics);
    setDiagnosticsHistory(prev => [metrics, ...prev.slice(0, 19)]);
  };

  const handleQuickPing = () => {
    setActiveTab('diagnostics');
    logActivity('Quick Diagnostic Initiated', 'Navigated to Live Diagnostics analyzer.', 'diagnostic', 'info');
    showToast('Switched to Live Diagnostics', 'info');
  };

  const handleClearLogs = () => {
    setActivityLogs([]);
    showToast('Activity feed cleared', 'info');
  };

  const handleCopyGuestLink = () => {
    if (typeof window !== 'undefined') {
      const guestUrl = `${window.location.origin}${window.location.pathname}?mode=client`;
      navigator.clipboard.writeText(guestUrl);
      showToast('Copied Guest Portal Link (Hides Host Controls)', 'info');
    }
  };

  // If Client Mode (Customer / Guest Device), render ONLY the Client Portal
  if (!isHostMode) {
    const currentHostPhone = typeof window !== 'undefined' 
      ? localStorage.getItem('unseen_legend_host_phone') || '0142199194' 
      : '0142199194';

    return (
      <div className="min-h-screen bg-[#090D16]">
        <ClientPortalView
          ssid="unseen legend"
          isHotspotEnabled={isHotspotEnabled}
          activeSession={activeSession}
          hostPhoneNumber={currentHostPhone}
          onSessionAuthenticated={handleSessionAuthenticated}
          onDisconnectSession={handleDisconnectSession}
          onSwitchToHostMode={() => {
            setIsHostMode(true);
            try {
              localStorage.setItem('unseen_legend_is_host', 'true');
            } catch {}
          }}
          onShowToast={showToast}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex antialiased selection:bg-slate-700/40 selection:text-white">
      {/* Fixed Collapsible Sidebar Navigation with User Profile Pill */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isOnline={isOnline}
        isPro={isPro}
        onOpenProModal={() => setIsProModalOpen(true)}
        isOpenMobile={isOpenMobileNav}
        onCloseMobile={() => setIsOpenMobileNav(false)}
        userEmail="nyaimichael55@gmail.com"
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-150 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-60'
        }`}
      >
        {/* Header Bar */}
        <Header
          activeTab={activeTab}
          onOpenMobileNav={() => setIsOpenMobileNav(true)}
          onQuickPing={handleQuickPing}
          onOpenProModal={() => setIsProModalOpen(true)}
          onOpenDarajaSetup={() => setIsDarajaModalOpen(true)}
          onSwitchToClientMode={() => setIsHostMode(false)}
          onCopyGuestLink={handleCopyGuestLink}
          isPro={isPro}
          isOnline={isOnline}
        />

        {/* Dynamic Viewport (Refined Linear / Vercel padding & density) */}
        <main className="flex-1 p-4 sm:p-5 lg:p-6 max-w-6xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              isOnline={isOnline}
              isPro={isPro}
              latestDiagnostic={latestDiagnostic}
              activityLogs={activityLogs}
              onClearLogs={handleClearLogs}
              onNavigate={(tab) => setActiveTab(tab)}
              onRunQuickPing={handleQuickPing}
              onOpenProModal={() => setIsProModalOpen(true)}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'hotspot' && (
            <HotspotManagerView
              isPro={isPro}
              onOpenProModal={() => setIsProModalOpen(true)}
              onLogActivity={logActivity}
              onShowToast={showToast}
              onOpenWifiScanDrawer={() => setActiveTab('wifiscan')}
              onOpenDarajaSetup={() => setIsDarajaModalOpen(true)}
              onSwitchToClientView={() => setIsHostMode(false)}
              onCopyGuestLink={handleCopyGuestLink}
            />
          )}

          {activeTab === 'wifiscan' && (
            <WifiScanDrawerView
              isHotspotEnabled={isHotspotEnabled}
              onToggleHotspot={handleToggleHotspot}
              activeSession={activeSession}
              onOpenCaptivePortal={() => setIsCaptivePortalOpen(true)}
              onDisconnectSession={handleDisconnectSession}
              onNavigateToHostDashboard={() => setActiveTab('hotspot')}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'diagnostics' && (
            <DiagnosticsView
              latestDiagnostic={latestDiagnostic}
              onSaveMetric={handleSaveMetric}
              onNavigateToReport={() => setActiveTab('reports')}
              onLogActivity={logActivity}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'commands' && (
            <CommandsView
              onLogActivity={logActivity}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'reports' && (
            <ReportExporterView
              diagnosticsHistory={diagnosticsHistory}
              isPro={isPro}
              onOpenProModal={() => setIsProModalOpen(true)}
              onLogActivity={logActivity}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'subnet' && (
            <SubnetToolView
              onLogActivity={logActivity}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'scanner' && (
            <DeviceScannerView
              isPro={isPro}
              onOpenProModal={() => setIsProModalOpen(true)}
              onLogActivity={logActivity}
              onShowToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Freemium Upgrade & Monetization Modal */}
      <ProModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        isPro={isPro}
        onTogglePro={handleTogglePro}
        onOpenScanner={() => setActiveTab('scanner')}
        onLogActivity={logActivity}
        onShowToast={showToast}
      />

      {/* Captive Portal Access Modal for "unseen legend" */}
      <CaptivePortalModal
        isOpen={isCaptivePortalOpen}
        onClose={() => setIsCaptivePortalOpen(false)}
        ssid="unseen legend"
        gatewayIp="192.168.43.1"
        isHotspotEnabled={isHotspotEnabled}
        activeSession={activeSession}
        onSessionAuthenticated={handleSessionAuthenticated}
        onDisconnectSession={handleDisconnectSession}
        onLogActivity={logActivity}
        onShowToast={showToast}
        onOpenDarajaSetup={() => setIsDarajaModalOpen(true)}
      />

      {/* Safaricom Daraja M-Pesa Setup & Registration Modal */}
      <DarajaSetupModal
        isOpen={isDarajaModalOpen}
        onClose={() => setIsDarajaModalOpen(false)}
        onShowToast={showToast}
      />

      {/* Toast Notification Container */}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
      />
    </div>
  );
}
