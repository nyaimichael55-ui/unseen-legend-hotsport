import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Laptop, 
  Router, 
  Radio, 
  QrCode, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  Wifi
} from 'lucide-react';

interface BroadcastGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  ssid: string;
  appUrl: string;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

export const BroadcastGuideModal: React.FC<BroadcastGuideModalProps> = ({
  isOpen,
  onClose,
  ssid,
  appUrl,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'phone' | 'pc' | 'router' | 'qr'>('phone');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
    onShowToast(`Copied ${label} to clipboard`, 'info');
  };

  const currentPortalUrl = typeof window !== 'undefined' ? window.location.href : appUrl;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(currentPortalUrl)}&bgcolor=111827&color=34d399&margin=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#111827] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#090D16] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-950/50 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-semibold text-slate-100">
                  How to Make &ldquo;{ssid}&rdquo; Appear on Your Real Phone
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.2 rounded font-medium">
                  Physical Hardware
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Step-by-step setup to broadcast real Wi-Fi radio signals in your area.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud vs Physical Radio Reality Banner */}
        <div className="p-3.5 bg-amber-950/20 border-b border-amber-800/30 flex items-start gap-3 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-amber-200">
              Why doesn&rsquo;t &ldquo;{ssid}&rdquo; show up automatically right now?
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              This application is hosted on high-performance cloud servers. Cloud servers do not have a physical Wi-Fi radio antenna inside your house or room to transmit 2.4/5GHz radio waves. To make it appear in your phone&rsquo;s Wi-Fi search, you simply broadcast the SSID <strong className="text-emerald-400 font-mono">&ldquo;{ssid}&rdquo;</strong> from any nearby device (your phone hotspot, laptop, or router) below:
            </p>
          </div>
        </div>

        {/* Hardware Selection Tabs */}
        <div className="flex items-center border-b border-white/[0.08] bg-[#090D16] px-4 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('phone')}
            className={`py-3 px-3 font-medium border-b-2 flex items-center gap-1.5 shrink-0 transition-colors ${
              activeTab === 'phone'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>1. Phone Hotspot (Easiest - 10s)</span>
          </button>

          <button
            onClick={() => setActiveTab('pc')}
            className={`py-3 px-3 font-medium border-b-2 flex items-center gap-1.5 shrink-0 transition-colors ${
              activeTab === 'pc'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>2. Laptop / PC Hotspot</span>
          </button>

          <button
            onClick={() => setActiveTab('router')}
            className={`py-3 px-3 font-medium border-b-2 flex items-center gap-1.5 shrink-0 transition-colors ${
              activeTab === 'router'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Router className="w-3.5 h-3.5" />
            <span>3. MikroTik / Router (Commercial)</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`py-3 px-3 font-medium border-b-2 flex items-center gap-1.5 shrink-0 transition-colors ${
              activeTab === 'qr'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan QR on Phone</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: PHONE HOTSPOT */}
          {activeTab === 'phone' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="p-3 rounded-lg bg-[#090D16] border border-white/[0.08]">
                <h4 className="font-semibold text-slate-200 text-xs flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Turn your phone or second phone into the &ldquo;{ssid}&rdquo; Access Point:
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 text-[11px] leading-relaxed">
                  <li>
                    Open <strong>Settings</strong> on your phone &rarr; <strong>Personal Hotspot</strong> (iPhone) or <strong>Portable Hotspot / Tethering</strong> (Android).
                  </li>
                  <li>
                    Change the <strong>Hotspot Name (SSID)</strong> to exactly:
                    <div className="mt-1 flex items-center gap-2">
                      <code className="bg-[#111827] px-2 py-1 rounded font-mono text-emerald-400 font-bold border border-white/[0.08]">
                        {ssid}
                      </code>
                      <button
                        onClick={() => handleCopy(ssid, 'SSID')}
                        className="px-2 py-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 font-mono text-[10px] flex items-center gap-1"
                      >
                        {copiedText === 'SSID' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copy SSID</span>
                      </button>
                    </div>
                  </li>
                  <li>
                    Set <strong>Security</strong> to <strong>None / Open</strong> (or set a test password).
                  </li>
                  <li>
                    <strong>Turn ON the Hotspot switch!</strong>
                  </li>
                  <li>
                    Now take any other phone or laptop nearby, search for Wi-Fi, and <strong>&ldquo;{ssid}&rdquo; will physically appear in the list with full signal!</strong>
                  </li>
                </ol>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/30 flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Once connected, open this portal link to test packages and M-Pesa payments.</span>
                </div>
                <button
                  onClick={() => setActiveTab('qr')}
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[10px] transition-colors"
                >
                  Show Phone QR
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: LAPTOP / PC HOTSPOT */}
          {activeTab === 'pc' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="p-3 rounded-lg bg-[#090D16] border border-white/[0.08] space-y-2">
                <h4 className="font-semibold text-slate-200 text-xs flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-cyan-400" />
                  Broadcast &ldquo;{ssid}&rdquo; from Windows or Linux:
                </h4>
                <p className="text-slate-400 text-[11px]">
                  If you have a laptop or desktop with a Wi-Fi card, you can broadcast &ldquo;{ssid}&rdquo; right now using one command:
                </p>

                <div className="space-y-2 pt-1">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Windows PowerShell / CMD (Run as Admin):</span>
                  <div className="flex items-center justify-between bg-[#111827] p-2 rounded border border-white/[0.08] font-mono text-[11px] text-slate-200">
                    <span className="truncate">netsh wlan set hostednetwork mode=allow ssid=&quot;{ssid}&quot; key=&quot;pass1234&quot;</span>
                    <button
                      onClick={() => handleCopy(`netsh wlan set hostednetwork mode=allow ssid="${ssid}" key="pass1234"\nnetsh wlan start hostednetwork`, 'Windows Command')}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Linux (nmcli hotspot):</span>
                  <div className="flex items-center justify-between bg-[#111827] p-2 rounded border border-white/[0.08] font-mono text-[11px] text-slate-200">
                    <span className="truncate">nmcli dev wifi hotspot ifname wlan0 ssid &quot;{ssid}&quot;</span>
                    <button
                      onClick={() => handleCopy(`nmcli dev wifi hotspot ifname wlan0 ssid "${ssid}"`, 'Linux Command')}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MIKROTIK / ROUTER */}
          {activeTab === 'router' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="p-3 rounded-lg bg-[#090D16] border border-white/[0.08] space-y-2">
                <h4 className="font-semibold text-slate-200 text-xs flex items-center gap-2">
                  <Router className="w-4 h-4 text-emerald-400" />
                  Commercial Hotspot Deployment (MikroTik RouterOS / OpenWrt):
                </h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  For commercial ISP deployment where guests are automatically redirected to this portal upon connecting:
                </p>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">MikroTik RouterOS Terminal Script:</span>
                  <div className="bg-[#111827] p-2.5 rounded border border-white/[0.08] font-mono text-[10px] text-slate-300 space-y-1">
                    <p>/interface wireless set [ find default-name=wlan1 ] ssid=&quot;{ssid}&quot; mode=ap-bridge disabled=no</p>
                    <p>/ip hotspot setup</p>
                    <p>/ip hotspot profile set [ find default=yes ] login-by=http-chap,http-pap</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: QR CODE TO TEST ON PHONE */}
          {activeTab === 'qr' && (
            <div className="space-y-4 animate-in fade-in duration-150 flex flex-col items-center text-center">
              <div className="p-3 rounded-xl bg-[#090D16] border border-white/[0.08] shadow-lg flex flex-col items-center gap-2">
                <img 
                  src={qrCodeUrl} 
                  alt="Scan with phone" 
                  className="w-48 h-48 rounded-lg border border-emerald-500/20 shadow-md"
                />
                <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                  Point your phone camera at this QR code
                </span>
              </div>

              <div className="max-w-md space-y-2">
                <p className="text-slate-300 text-xs">
                  Scan this code on your phone to open the live <strong>&ldquo;{ssid}&rdquo;</strong> portal directly on your phone screen to test the packages, M-Pesa STK push, and session authentication!
                </p>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <a
                    href={currentPortalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-md bg-white text-slate-950 font-bold text-xs hover:bg-slate-200 flex items-center gap-1.5 transition-colors"
                  >
                    <span>Open Portal in New Tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleCopy(currentPortalUrl, 'Portal URL')}
                    className="px-3 py-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/[0.08] text-xs font-mono flex items-center gap-1.5 transition-colors"
                  >
                    {copiedText === 'Portal URL' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy URL</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#090D16] border-t border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>Target SSID: <span className="font-mono text-white font-bold">&ldquo;{ssid}&rdquo;</span></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-white text-slate-950 font-semibold text-xs hover:bg-slate-200 transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
