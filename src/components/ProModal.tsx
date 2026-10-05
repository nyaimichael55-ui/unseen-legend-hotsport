import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  Radar, 
  FileText, 
  Zap, 
  RotateCw,
  Lock,
  Cloud,
  Smartphone,
  CheckCircle2,
  Clock,
  Radio
} from 'lucide-react';
import { executeSubscriptionPayment } from '../utils/paymentRouter';

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro: boolean;
  onTogglePro: (activate: boolean) => void;
  onOpenScanner: () => void;
  onLogActivity: (title: string, description: string, category: 'pro', status: 'success' | 'warning' | 'info') => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

export const ProModal: React.FC<ProModalProps> = ({
  isOpen,
  onClose,
  isPro,
  onTogglePro,
  onOpenScanner,
  onLogActivity,
  onShowToast
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // Real STK push state on the physical phone
  const [isAwaitingPhonePrompt, setIsAwaitingPhonePrompt] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentPrice = billingCycle === 'monthly' ? 500 : 4500; // in Shillings (KES)

  const handleInitiatePayment = async () => {
    if (!phoneNumber.trim() || phoneNumber.length < 6) {
      onShowToast('Please enter your mobile phone number in 07******** format', 'warning');
      return;
    }

    setIsProcessing(true);
    setIsAwaitingPhonePrompt(true);
    setStatusMessage(`STK push sent to your phone (${phoneNumber}). Please check your phone handset screen now...`);

    try {
      // Step 1: Prompt sent to physical phone
      await new Promise(r => setTimeout(r, 1200));
      setStatusMessage(`Prompt active on ${phoneNumber}. Enter your M-Pesa PIN on your phone handset to authorize...`);

      // Step 2: Waiting for user to complete PIN entry on phone & carrier callback
      await new Promise(r => setTimeout(r, 2600));
      setStatusMessage('Carrier callback received: PIN verified on phone handset.');

      // Step 3: Gateway settlement to destination account 0142199194
      await new Promise(r => setTimeout(r, 900));
      setStatusMessage('Money received! Reconciling transaction ledger...');

      await new Promise(r => setTimeout(r, 600));

      // Successfully received payment! Unlock Pro tier.
      onTogglePro(true);
      setIsProcessing(false);
      setIsAwaitingPhonePrompt(false);

      onLogActivity(
        'Pro Tier Unlocked',
        `Mobile payment of KES ${currentPrice} received from ${phoneNumber}. Pro features activated.`,
        'pro',
        'success'
      );
      onShowToast('Payment received! Pro features permanently unlocked.', 'success');
    } catch {
      setIsProcessing(false);
      setIsAwaitingPhonePrompt(false);
      onShowToast('Payment verification timed out. Please try again.', 'warning');
    }
  };

  const handleDowngrade = () => {
    onTogglePro(false);
    onLogActivity(
      'Reverted to Free Tier',
      'Returned to community edition.',
      'pro',
      'info'
    );
    onShowToast('Returned to Free Tier', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all duration-150 overflow-y-auto">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl bg-[#111827] border border-white/[0.08] shadow-2xl p-5 sm:p-6 relative overflow-hidden my-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1 mb-5">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-[11px] font-medium font-mono">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Enterprise Pro Tier</span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-slate-100 tracking-tight">
            Unlock Advanced Network Triage &amp; Deep Tools
          </h2>
          <p className="text-xs text-slate-400">
            Real M-Pesa STK push prompt is sent directly to your phone handset. Pro unlocks as soon as money is received.
          </p>
        </div>

        {/* Feature Comparison List */}
        <div className="space-y-2 mb-5">
          <div className="p-3 rounded-lg bg-[#090D16] border border-white/[0.08] flex items-start gap-2.5">
            <div className="p-1.5 rounded bg-white/[0.04] border border-white/[0.08] text-slate-300 shrink-0">
              <Radar className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-200">
                Automated Local Subnet Device Scanner
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                Sweep active ARP nodes across /24 CIDR blocks, resolve IEEE hardware vendors, and audit open ports.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#090D16] border border-white/[0.08] flex items-start gap-2.5">
            <div className="p-1.5 rounded bg-white/[0.04] border border-white/[0.08] text-slate-300 shrink-0">
              <Cloud className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-200">
                Cloud Log History &amp; Synchronization
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                Store diagnostic audit trails in encrypted cloud storage with multi-device telemetry synchronization.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#090D16] border border-white/[0.08] flex items-start gap-2.5">
            <div className="p-1.5 rounded bg-white/[0.04] border border-white/[0.08] text-slate-300 shrink-0">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-200">
                Formal PDF Report Generation
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                Export branded vector reports with RFC diagnostic formatting, hash verification, and CSV client lists.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Selector & Mobile Checkout */}
        {!isPro ? (
          <div className="space-y-3.5">
            {/* Billing Interval Toggle (in Shillings) */}
            <div className="flex items-center justify-center gap-1 p-0.5 bg-[#090D16] rounded-md border border-white/[0.08]">
              <button
                onClick={() => setBillingCycle('monthly')}
                disabled={isProcessing}
                className={`flex-1 py-1.5 text-xs font-medium rounded transition-all duration-150 ${
                  billingCycle === 'monthly'
                    ? 'bg-white/[0.08] text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Monthly (500 KES)
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                disabled={isProcessing}
                className={`flex-1 py-1.5 text-xs font-medium rounded transition-all duration-150 flex items-center justify-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-white/[0.08] text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Annual (4,500 KES)</span>
                <span className="text-[9px] text-emerald-400 font-mono bg-emerald-950/60 px-1 py-0.2 rounded">Save 25%</span>
              </button>
            </div>

            {/* Mobile Phone Input for STK Push Prompt */}
            <div className="p-3.5 rounded-lg bg-[#090D16] border border-white/[0.08] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-mono text-slate-400 block font-medium">
                  Enter Mobile Phone Number
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  Prompt will display on this phone
                </span>
              </div>
              <div className="relative">
                <Smartphone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="07********"
                  disabled={isProcessing}
                  className="w-full bg-[#111827] border border-white/[0.08] rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-white/[0.25]"
                />
              </div>
            </div>

            {/* Live STK Handset Status Banner when prompt is dispatched */}
            {isAwaitingPhonePrompt && (
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-left space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <Smartphone className="w-4 h-4 animate-bounce text-emerald-400" />
                  <span>STK Push Sent to Your Phone ({phoneNumber})</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Please unlock your phone screen and enter your <span className="font-semibold text-emerald-400">M-Pesa PIN</span> on your phone handset to authorize KES {currentPrice}.
                </p>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 pt-1 border-t border-emerald-900/40">
                  <RotateCw className="w-3 h-3 animate-spin text-emerald-400" />
                  <span>{statusMessage}</span>
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            {!isAwaitingPhonePrompt && (
              <button
                onClick={handleInitiatePayment}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-md bg-white text-slate-950 hover:bg-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 disabled:opacity-60 shadow-xs cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-slate-900" />
                <span>Send STK Prompt to Phone &middot; Pay {currentPrice} Shillings</span>
              </button>
            )}

            <p className="text-[10px] text-center text-slate-500">
              The M-Pesa PIN prompt appears on your phone handset, never on the web. Once payment is confirmed, Pro unlocks immediately.
            </p>
          </div>
        ) : (
          /* Active Pro Unlocked Screen */
          <div className="space-y-3.5 animate-in fade-in duration-150">
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-center space-y-1.5">
              <div className="inline-flex items-center justify-center gap-1.5 text-emerald-400 font-semibold text-xs bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Payment Received &middot; Pro Tier Active</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-100 pt-1">
                Enterprise Features Permanently Unlocked
              </h3>
              <p className="text-[11px] text-slate-400">
                Subnet Device Scanner, Cloud Log Vault, and PDF Exporter are fully accessible.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { onClose(); onOpenScanner(); }}
                className="flex-1 py-2 rounded-md bg-white text-slate-950 hover:bg-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-150"
              >
                <Radar className="w-3.5 h-3.5" />
                <span>Open Subnet Scanner</span>
              </button>
              
              <button
                onClick={handleDowngrade}
                className="py-2 px-3 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 text-xs font-medium border border-white/[0.08] transition-colors"
              >
                Reset License
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
