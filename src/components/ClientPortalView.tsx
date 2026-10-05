import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  Clock, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  Lock, 
  ChevronRight, 
  LogOut,
  Signal,
  ArrowRight,
  Radio,
  ExternalLink,
  Shield,
  KeyRound
} from 'lucide-react';
import { HotspotPackage, AuthenticatedSession, HotspotClient } from '../types/network';
import { DEFAULT_HOTSPOT_PACKAGES, formatSecondsToTime } from '../utils/hotspotPackages';
import { executeHotspotPackagePayment } from '../utils/paymentRouter';

interface ClientPortalViewProps {
  ssid: string;
  isHotspotEnabled: boolean;
  activeSession: AuthenticatedSession | null;
  hostPhoneNumber?: string;
  onSessionAuthenticated: (client: HotspotClient, session: AuthenticatedSession) => void;
  onDisconnectSession: (sessionId: string) => void;
  onSwitchToHostMode: () => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  ssid,
  isHotspotEnabled,
  activeSession,
  hostPhoneNumber = '0142199194',
  onSessionAuthenticated,
  onDisconnectSession,
  onSwitchToHostMode,
  onShowToast
}) => {
  const [selectedPackage, setSelectedPackage] = useState<HotspotPackage>(DEFAULT_HOTSPOT_PACKAGES[0]); // 20 Shillings
  const [payerPhone, setPayerPhone] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isAwaitingPhonePrompt, setIsAwaitingPhonePrompt] = useState<boolean>(false);

  // Host PIN Unlock modal for owner
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Simulated guest hardware metadata
  const guestDevice = {
    ip: '192.168.43.155',
    mac: 'D4:8A:39:11:9F:80',
    deviceName: 'Guest-Client.lan'
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

  const handleInitiatePrompt = async () => {
    if (!isHotspotEnabled) {
      onShowToast('Gateway is currently offline. Host must enable hotspot first.', 'warning');
      return;
    }

    if (!payerPhone.trim() || payerPhone.length < 9) {
      onShowToast('Please enter a valid phone number (e.g. 0712345678)', 'warning');
      return;
    }

    setIsProcessing(true);
    setIsAwaitingPhonePrompt(true);
    setStatusMessage('Connecting to Safaricom Daraja STK Push Gateway...');

    try {
      const result = await executeHotspotPackagePayment(
        selectedPackage,
        payerPhone.trim(),
        guestDevice,
        (msg) => setStatusMessage(msg)
      );

      if (result.verified && result.session) {
        const newClient: HotspotClient = {
          id: `client-${Date.now()}`,
          hostname: guestDevice.deviceName,
          ip: guestDevice.ip,
          mac: guestDevice.mac,
          vendor: 'Client Device',
          connectionType: 'Wi-Fi 6',
          signalDbm: -44,
          signalPercent: 94,
          dataUsageMb: 8,
          isBlocked: false,
          connectedDuration: 'Just connected',
          pingMs: 1.8,
          packageActive: `${selectedPackage.name} (${selectedPackage.price} KES)`,
          sessionRemainingSeconds: selectedPackage.durationMinutes * 60,
          sessionStatus: 'active'
        };

        setIsProcessing(false);
        setIsAwaitingPhonePrompt(false);
        setStatusMessage('');
        setTimeRemaining(selectedPackage.durationMinutes * 60);

        onSessionAuthenticated(newClient, result.session);
        onShowToast(result.message || `Payment verified! Internet access granted for ${selectedPackage.name}.`, 'success');
      } else {
        setIsProcessing(false);
        setIsAwaitingPhonePrompt(false);
        setStatusMessage(result.message || 'Payment could not be completed.');
        onShowToast(result.message || 'Payment not verified. Please try again.', 'warning');
      }
    } catch {
      setIsProcessing(false);
      setIsAwaitingPhonePrompt(false);
      setStatusMessage('Network communication error with gateway.');
      onShowToast('Network error contacting hotspot server', 'warning');
    }
  };

  const handleVerifyHostPin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default Owner PINs: 1991, 0142, or 1234
    if (['1991', '0142', '1234', 'admin'].includes(pinInput.trim().toLowerCase())) {
      setPinError('');
      setIsPinModalOpen(false);
      onSwitchToHostMode();
      onShowToast('Host Device authenticated successfully', 'success');
    } else {
      setPinError('Invalid Host Access PIN. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col justify-between antialiased selection:bg-emerald-700/40 selection:text-white">
      {/* Client Header (Zero Admin/Host Controls) */}
      <header className="border-b border-white/[0.08] bg-[#0c1220] px-4 py-3 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xs">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {ssid}
                </h1>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full font-medium">
                  Wi-Fi Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                High-Speed Host Internet Access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-slate-300">
              <Signal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full Signal</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Client Content */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {activeSession && timeRemaining > 0 ? (
          /* Active Session Screen */
          <div className="rounded-2xl bg-[#111827] border border-emerald-800/40 p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 mx-auto flex items-center justify-center text-emerald-400 shadow-lg">
              <CheckCircle2 className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">You Are Connected!</h2>
              <p className="text-xs text-slate-400">
                Internet routing through &ldquo;{ssid}&rdquo; is active.
              </p>
            </div>

            {/* Countdown Clock */}
            <div className="p-5 rounded-xl bg-[#090D16] border border-white/[0.08] space-y-2">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">
                Time Remaining on Pass
              </span>
              <div className="text-3xl sm:text-4xl font-mono font-bold text-emerald-400 tracking-wider">
                {formatSecondsToTime(timeRemaining)}
              </div>
              <span className="text-[11px] text-slate-400 block font-mono">
                Plan: {activeSession.packageName}
              </span>
            </div>

            {/* Device Info */}
            <div className="grid grid-cols-2 gap-2 text-left text-xs bg-white/[0.02] p-3 rounded-lg border border-white/[0.06]">
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">Assigned IP</span>
                <span className="font-mono text-slate-200">{activeSession.clientIp}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono block">Speed Allocation</span>
                <span className="font-mono text-emerald-400">High-Speed Unlimited</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onDisconnectSession(activeSession.sessionId)}
                className="w-full py-2.5 px-4 rounded-xl bg-white/[0.05] hover:bg-red-950/40 text-slate-300 hover:text-red-300 border border-white/[0.08] hover:border-red-800/40 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect This Device</span>
              </button>
            </div>
          </div>
        ) : (
          /* Package Purchase & Payment Screen */
          <div className="rounded-2xl bg-[#111827] border border-white/[0.08] p-5 sm:p-7 shadow-2xl space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Select an Internet Pass
              </h2>
              <p className="text-xs text-slate-400">
                Choose an access package below to browse using the host&rsquo;s high-speed connection:
              </p>
            </div>

            {/* Host Cellular Line Provider Badge */}
            <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300">Data Line:</span>
                <span className="text-emerald-300 font-bold font-mono">Safaricom 4G/5G ({hostPhoneNumber})</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">High-Speed Shared</span>
            </div>

            {/* Packages Grid */}
            <div className="space-y-2.5">
              {DEFAULT_HOTSPOT_PACKAGES.map((pkg) => {
                const isSelected = selectedPackage.id === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPackage(pkg)}
                    className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500 text-white shadow-md'
                        : 'bg-[#090D16] border-white/[0.06] hover:border-white/[0.15] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected 
                          ? 'bg-emerald-500 text-slate-950 font-bold' 
                          : 'bg-white/[0.05] text-slate-400'
                      }`}>
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white">{pkg.name}</span>
                          {pkg.popular && (
                            <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded">
                              POPULAR
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {pkg.description} &middot; {pkg.bandwidthLimitMbps} Mbps
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-mono font-bold text-emerald-400">
                        {pkg.price}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        KES
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Phone Number Input */}
            <div className="space-y-2 pt-1 border-t border-white/[0.06]">
              <label className="text-xs font-semibold text-slate-200 block">
                Safaricom M-Pesa Phone Number:
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  placeholder="e.g. 0712345678 or 254712345678"
                  className="w-full bg-[#090D16] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <span className="text-[10px] text-slate-400 block">
                The Lipa na M-Pesa PIN prompt will appear automatically on your handset.
              </span>
            </div>

            {/* Status Message / Spinner */}
            {isProcessing && (
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex items-center gap-3 text-xs text-emerald-300 animate-in fade-in duration-150">
                <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0" />
                <p className="leading-snug">{statusMessage}</p>
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={handleInitiatePrompt}
              disabled={isProcessing}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                isProcessing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              <span>Pay {selectedPackage.price} KES &amp; Connect to Internet</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[10px] text-center text-slate-500 leading-tight">
              Safe &amp; Encrypted via Safaricom Lipa na M-Pesa. Once approved on your handset, your Wi-Fi session starts immediately.
            </p>
          </div>
        )}
      </main>

      {/* Client Footer with Discreet Owner Access */}
      <footer className="border-t border-white/[0.06] bg-[#0c1220] px-4 py-3 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2 text-[11px]">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>&ldquo;{ssid}&rdquo; Powered by Host Data</span>
          </div>

          {/* Discreet Host Login button for the Owner */}
          <button
            onClick={() => setIsPinModalOpen(true)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-[11px] font-mono transition-colors p-1"
            title="Owner / Host Admin Login"
          >
            <Lock className="w-3 h-3" />
            <span>Host Login</span>
          </button>
        </div>
      </footer>

      {/* Host PIN Authentication Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#111827] border border-white/[0.08] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/50 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-sm text-white">Owner Host Access</h3>
              </div>
              <button 
                onClick={() => { setIsPinModalOpen(false); setPinError(''); }}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Enter your Host Access PIN to open the Host Control Dashboard on this device.
            </p>

            <form onSubmit={handleVerifyHostPin} className="space-y-3">
              <div>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter Host PIN (e.g. 1991)..."
                  autoFocus
                  className="w-full bg-[#090D16] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-center font-mono tracking-widest text-white focus:outline-none focus:border-emerald-500"
                />
                {pinError && (
                  <span className="text-[11px] text-red-400 mt-1 block">
                    {pinError}
                  </span>
                )}
                <span className="text-[10px] text-slate-500 mt-1 block text-center">
                  Default PIN: <strong className="text-slate-300 font-mono">1991</strong> or <strong className="text-slate-300 font-mono">0142</strong>
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
              >
                Unlock Host Dashboard
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
