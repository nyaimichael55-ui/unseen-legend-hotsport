import React, { useState, useEffect } from 'react';
import { 
  X, 
  Wifi, 
  WifiOff,
  ShieldCheck, 
  Clock, 
  Zap, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  Smartphone, 
  Lock, 
  ExternalLink,
  ChevronRight,
  LogOut,
  Signal
} from 'lucide-react';
import { HotspotPackage, AuthenticatedSession, HotspotClient } from '../types/network';
import { DEFAULT_HOTSPOT_PACKAGES, formatSecondsToTime } from '../utils/hotspotPackages';
import { executeHotspotPackagePayment } from '../utils/paymentRouter';

interface CaptivePortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  ssid: string;
  gatewayIp: string;
  isHotspotEnabled: boolean;
  activeSession: AuthenticatedSession | null;
  onSessionAuthenticated: (client: HotspotClient, session: AuthenticatedSession) => void;
  onDisconnectSession: (sessionId: string) => void;
  onLogActivity: (title: string, description: string, category: 'hotspot', status: 'success' | 'warning' | 'info') => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
  onOpenDarajaSetup?: () => void;
}

export const CaptivePortalModal: React.FC<CaptivePortalModalProps> = ({
  isOpen,
  onClose,
  ssid,
  gatewayIp,
  isHotspotEnabled,
  activeSession,
  onSessionAuthenticated,
  onDisconnectSession,
  onLogActivity,
  onShowToast,
  onOpenDarajaSetup
}) => {
  const [selectedPackage, setSelectedPackage] = useState<HotspotPackage>(DEFAULT_HOTSPOT_PACKAGES[0]); // Default 20 Shillings
  const [payerPhone, setPayerPhone] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Real STK prompt status on phone handset
  const [isAwaitingPhonePrompt, setIsAwaitingPhonePrompt] = useState<boolean>(false);
  
  // Simulated guest hardware metadata
  const guestDevice = {
    ip: '192.168.43.155',
    mac: 'D4:8A:39:11:9F:80',
    deviceName: 'iPhone-15-Guest.lan'
  };

  const [timeRemaining, setTimeRemaining] = useState<number>(() => {
    if (activeSession) {
      return Math.max(0, Math.floor((activeSession.expiresAt - Date.now()) / 1000));
    }
    return 0;
  });

  // Countdown timer for active session
  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((activeSession.expiresAt - Date.now()) / 1000));
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  if (!isOpen) return null;

  const handleInitiatePrompt = async () => {
    if (!isHotspotEnabled) {
      onShowToast('Gateway is currently offline. Host must enable hotspot first.', 'warning');
      return;
    }

    if (!payerPhone.trim() || payerPhone.length < 6) {
      onShowToast('Please enter your mobile number in 07******** format', 'warning');
      return;
    }

    setIsProcessing(true);
    setIsAwaitingPhonePrompt(true);
    setStatusMessage(`STK push sent to your phone (${payerPhone}). Check your phone screen now...`);

    try {
      setStatusMessage('Dispatching Safaricom Daraja STK push...');

      const result = await executeHotspotPackagePayment(
        selectedPackage,
        payerPhone,
        guestDevice,
        (msg) => setStatusMessage(msg)
      );

      if (result.verified && result.session) {
        const newClient: HotspotClient = {
          id: `client-${Date.now()}`,
          hostname: guestDevice.deviceName,
          ip: guestDevice.ip,
          mac: guestDevice.mac,
          vendor: 'Apple Inc. (Guest Device)',
          connectionType: 'Wi-Fi 6',
          signalDbm: -44,
          signalPercent: 94,
          dataUsageMb: 14,
          isBlocked: false,
          connectedDuration: 'Just connected',
          pingMs: 1.6,
          packageActive: `${selectedPackage.name} (${selectedPackage.price} KES)`,
          sessionRemainingSeconds: selectedPackage.durationMinutes * 60,
          sessionStatus: 'active'
        };

        onSessionAuthenticated(newClient, result.session);
        onLogActivity(
          'Hotspot Session Authenticated',
          result.message,
          'hotspot',
          'success'
        );
        onShowToast(result.message, 'success');
        setIsProcessing(false);
        setIsAwaitingPhonePrompt(false);
      }
    } catch {
      setIsProcessing(false);
      setIsAwaitingPhonePrompt(false);
      onShowToast('Payment verification timed out. Please try again.', 'warning');
    }
  };

  const handleDisconnectCurrent = () => {
    if (activeSession) {
      onDisconnectSession(activeSession.sessionId);
      onLogActivity(
        'Hotspot Session Terminated',
        `Access lease revoked for ${guestDevice.ip} on ${ssid}.`,
        'hotspot',
        'info'
      );
      onShowToast('Session disconnected successfully', 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md transition-all duration-150 overflow-y-auto">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-xl bg-[#111827] border border-white/[0.08] shadow-2xl p-5 sm:p-6 relative overflow-hidden my-auto"
      >
        {/* Top Window Accent */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-slate-200">
              <Radio className="w-4 h-4 text-slate-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-slate-100 tracking-tight">
                  Wi-Fi Captive Portal
                </h2>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-1.5 py-0.2 rounded font-medium">
                  {ssid}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Network: <span className="font-mono text-emerald-400 font-semibold">{ssid}</span> · Gateway: <span className="font-mono text-slate-300">{gatewayIp}</span> · Device: <span className="font-mono text-slate-300">{guestDevice.ip}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
            aria-label="Close portal modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Condition 1: Host has turned OFF the hotspot broadcast */}
        {!isHotspotEnabled ? (
          <div className="py-8 text-center space-y-3.5 animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-400 mx-auto flex items-center justify-center">
              <WifiOff className="w-6 h-6" />
            </div>
            
            <div className="space-y-1 max-w-md mx-auto">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/40 text-amber-300 text-[10px] font-mono uppercase tracking-wider">
                Hotspot Gateway Inactive
              </span>
              <h3 className="text-base font-semibold text-slate-100 pt-1">
                Network &ldquo;{ssid}&rdquo; is Closed
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The host master has not enabled the &ldquo;{ssid}&rdquo; hotspot gateway. Client devices searching for Wi-Fi can locate this SSID, but cannot access internet routes or complete session authentication until the host opens the broadcast in the Master Control Center.
              </p>
            </div>

            <div className="pt-2">
              <button
                disabled
                className="px-4 py-2 rounded-md bg-white/[0.05] border border-white/[0.08] text-slate-500 font-mono text-xs cursor-not-allowed"
              >
                Awaiting Host Activation on &ldquo;{ssid}&rdquo;
              </button>
            </div>
          </div>
        ) : activeSession ? (
          /* Condition 2: Active Authenticated Session Screen */
          <div className="py-5 space-y-4 animate-in fade-in duration-150">
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Internet Access Active on &ldquo;{ssid}&rdquo;</span>
              </div>
              <h3 className="text-base font-semibold text-slate-100">
                Device Authenticated &amp; Online
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Your device has been granted full internet access through the &ldquo;{ssid}&rdquo; tethering gateway.
              </p>
            </div>

            {/* Session Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg bg-[#090D16] border border-white/[0.08]">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Time Remaining</span>
                <span className="font-mono text-sm sm:text-base font-bold text-emerald-400 block mt-1">
                  {formatSecondsToTime(timeRemaining)}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#090D16] border border-white/[0.08]">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Active Plan</span>
                <span className="font-mono text-xs font-semibold text-slate-200 truncate block mt-1">
                  {activeSession.packageName}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#090D16] border border-white/[0.08]">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Assigned IP</span>
                <span className="font-mono text-xs font-medium text-slate-200 truncate block mt-1">
                  {guestDevice.ip}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#090D16] border border-white/[0.08]">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">MAC Address</span>
                <span className="font-mono text-[11px] font-medium text-slate-400 truncate block mt-1">
                  {guestDevice.mac}
                </span>
              </div>
            </div>

            {/* RADIUS Token Strip */}
            <div className="p-3 rounded-lg bg-[#090D16] border border-white/[0.08] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400 text-[11px]">Session Token:</span>
                <span className="font-mono text-slate-300 text-[11px]">{activeSession.token}</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                ACTIVE · {ssid}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={handleDisconnectCurrent}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect Device</span>
              </button>
              
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-white text-slate-900 hover:bg-slate-200 transition-colors"
              >
                Close Portal
              </button>
            </div>
          </div>
        ) : (
          /* Condition 3: Unauthenticated Captive Portal (Package Selection & Payment in Shillings) */
          <div className="py-4 space-y-4 animate-in fade-in duration-150">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/40 text-amber-300 text-[11px] font-mono">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span>Authentication Required for &ldquo;{ssid}&rdquo; Access</span>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-100 flex items-center gap-2">
                <span>Select an Access Package to Connect to &ldquo;{ssid}&rdquo;</span>
              </h3>
              <p className="text-xs text-slate-400">
                Choose an internet pass starting at <span className="text-emerald-400 font-semibold font-mono">20 Shillings</span>. Instant access granted once money is received.
              </p>
            </div>

            {/* Tiered Packages Grid (in Shillings) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEFAULT_HOTSPOT_PACKAGES.map((pkg) => {
                const isSelected = selectedPackage.id === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`cursor-pointer p-3.5 rounded-lg border transition-all duration-150 flex flex-col justify-between relative ${
                      isSelected
                        ? 'bg-[#131D31] border-emerald-500/60 shadow-xs ring-1 ring-emerald-500/30'
                        : 'bg-[#090D16] border-white/[0.08] hover:border-white/[0.15]'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute top-2.5 right-2.5 text-[9px] font-mono uppercase bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 px-1.5 py-0.2 rounded font-medium">
                        Most Popular
                      </span>
                    )}

                    {pkg.price === 20 && (
                      <span className="absolute top-2.5 right-2.5 text-[9px] font-mono uppercase bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 px-1.5 py-0.2 rounded font-medium">
                        Starter 20 Shillings
                      </span>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between pr-20">
                        <h4 className="text-xs font-semibold text-slate-200">{pkg.name}</h4>
                      </div>
                      <div className="flex items-baseline gap-1.5 pt-0.5">
                        <span className="font-mono text-base font-bold text-slate-100">{pkg.price} KES</span>
                        <span className="text-[11px] text-emerald-400 font-mono font-medium">({pkg.price} Shillings)</span>
                        <span className="text-[10px] text-slate-500 font-mono">/ {pkg.durationLabel}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        {pkg.description}
                      </p>
                    </div>

                    <div className="pt-2 mt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Speed: {pkg.bandwidthLimitMbps} Mbps</span>
                      <span>{pkg.dataLimitMb ? `${(pkg.dataLimitMb / 1024).toFixed(0)} GB Quota` : 'Unlimited Data'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment Phone Number & Verification Box */}
            <div className="p-4 rounded-lg bg-[#090D16] border border-white/[0.08] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
                <div>
                  <span className="text-xs font-semibold text-slate-200">M-Pesa / Mobile Payment Checkout</span>
                  <p className="text-[11px] text-slate-400">
                    Selected Package: <span className="text-slate-200 font-medium">{selectedPackage.name}</span> (<span className="text-emerald-400 font-mono font-semibold">{selectedPackage.price} Shillings / {selectedPackage.price} KES</span>)
                  </p>
                </div>
                <div className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                  Prompt Sent to Phone
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] uppercase font-mono text-slate-500 block">
                    Payment Mobile Number (M-Pesa)
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    PIN prompt appears on this phone
                  </span>
                </div>
                <div className="relative">
                  <Smartphone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={payerPhone}
                    onChange={(e) => setPayerPhone(e.target.value)}
                    placeholder="07********"
                    disabled={isProcessing}
                    className="w-full bg-[#111827] border border-white/[0.08] rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-white/[0.25]"
                  />
                </div>
              </div>

              {/* Handset Prompt Notification Banner */}
              {isAwaitingPhonePrompt && (
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-left space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                    <Smartphone className="w-4 h-4 animate-bounce text-emerald-400" />
                    <span>STK Push Sent to Your Phone ({payerPhone})</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Check your phone screen now and enter your <span className="font-semibold text-emerald-400">M-Pesa PIN</span> on your phone handset to authorize KES {selectedPackage.price}.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 pt-1 border-t border-emerald-900/40">
                    <RotateCw className="w-3 h-3 animate-spin text-emerald-400" />
                    <span>{statusMessage}</span>
                  </div>
                </div>
              )}

              {/* Prominent "Connect to Wi-Fi" and "Pay & Connect" Actions */}
              {!isAwaitingPhonePrompt && (
                <div className="space-y-2">
                  <button
                    onClick={handleInitiatePrompt}
                    disabled={isProcessing}
                    className="w-full py-2.5 rounded-md bg-white text-slate-900 hover:bg-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-150 active:scale-95 disabled:opacity-60 shadow-xs cursor-pointer"
                  >
                    <Wifi className="w-3.5 h-3.5" />
                    <span>Send Prompt to Phone &middot; Pay {selectedPackage.price} Shillings</span>
                  </button>
                </div>
              )}

              <p className="text-[10px] text-center text-slate-500">
                The M-Pesa PIN prompt appears on your phone handset, never on the web. Once confirmed, &ldquo;{ssid}&rdquo; internet access unlocks automatically.
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[10px] text-slate-500 font-mono">
                <span>Direct M-Pesa STK Gateway</span>
                {onOpenDarajaSetup ? (
                  <button
                    onClick={onOpenDarajaSetup}
                    className="text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                  >
                    Daraja API &amp; Registration Guide &rarr;
                  </button>
                ) : (
                  <a
                    href="https://developer.safaricom.co.ke"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 underline"
                  >
                    Register on Daraja &rarr;
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
