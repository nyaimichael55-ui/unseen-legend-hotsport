import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  Key, 
  ShieldCheck, 
  Smartphone, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Zap, 
  Server,
  Layers,
  HelpCircle,
  Radio
} from 'lucide-react';

interface DarajaSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

export const DarajaSetupModal: React.FC<DarajaSetupModalProps> = ({
  isOpen,
  onClose,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'keys' | 'test'>('guide');
  
  // Daraja credentials state initialized with user's keys
  const [consumerKey, setConsumerKey] = useState<string>('Xg3rgs7KNzAEAdjHzs5A08n4SqwI9on3GKjsvs0YMTzkXXrM');
  const [consumerSecret, setConsumerSecret] = useState<string>('QYb2BXKeAtIUxrcRU2Zz7ArG3XcINoo8xHzBNoPKLckvH1KKp2UjGV7BHCmoR1k5');
  const [passkey, setPasskey] = useState<string>('bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919');
  const [shortcode, setShortcode] = useState<string>('174379');
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  
  // Status states
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Test push phone input
  const [testPhone, setTestPhone] = useState<string>('');
  const [isSendingTestPush, setIsSendingTestPush] = useState<boolean>(false);
  const [testPushStatus, setTestPushStatus] = useState<string>('');

  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Fetch current config status from server
  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/mpesa/config')
      .then(res => res.json())
      .then(data => {
        setIsConfigured(data.isConfigured);
        if (data.consumerKey) setConsumerKey(data.consumerKey);
        if (data.consumerSecret) setConsumerSecret(data.consumerSecret);
        if (data.passkey) setPasskey(data.passkey);
        if (data.shortcode) setShortcode(data.shortcode);
        if (data.environment) setEnvironment(data.environment);
      })
      .catch(() => {});
  }, [isOpen]);

  const handleSwapKeys = () => {
    const temp = consumerKey;
    setConsumerKey(consumerSecret);
    setConsumerSecret(temp);
    onShowToast('Swapped Consumer Key and Consumer Secret', 'info');
  };

  if (!isOpen) return null;

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
    onShowToast('Copied portal URL to clipboard', 'info');
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/mpesa/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consumerKey,
          consumerSecret,
          passkey,
          shortcode,
          environment
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsConfigured(data.isConfigured);
        onShowToast('Daraja API credentials saved successfully', 'success');
      } else {
        onShowToast('Failed to save Daraja credentials', 'warning');
      }
    } catch {
      onShowToast('Error connecting to backend API', 'warning');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Save first to ensure server has current credentials
    await handleSaveConfig();

    try {
      const res = await fetch('/api/mpesa/test-connection', {
        method: 'POST'
      });
      const data = await res.json();

      if (data.success) {
        setTestResult({
          success: true,
          message: data.message || 'OAuth Access Token generated successfully!'
        });
        onShowToast('Daraja API connected successfully!', 'success');
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Authentication rejected by Safaricom Daraja'
        });
        onShowToast('Daraja test failed. Check your keys.', 'warning');
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: 'Could not connect to Safaricom servers: ' + (e.message || 'Network error')
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTriggerTestPush = async () => {
    if (!testPhone.trim() || testPhone.length < 6) {
      onShowToast('Please enter a valid phone number in 07******** format', 'warning');
      return;
    }

    setIsSendingTestPush(true);
    setTestPushStatus(`Initiating STK push to ${testPhone}...`);

    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone,
          amount: 1, // KES 1 test
          packageName: 'Daraja STK Push Test',
          packageId: 'test-push'
        })
      });

      const data = await res.json();
      if (data.success) {
        setTestPushStatus(
          data.liveDaraja
            ? `Real STK push dispatched via Safaricom Daraja! Check phone screen for M-Pesa PIN prompt.`
            : `STK push dispatched! Enter your M-Pesa PIN on your phone handset to authenticate.`
        );
        onShowToast('STK push sent to ' + testPhone, 'success');
      } else {
        setTestPushStatus('Push failed: ' + (data.message || 'Unknown error'));
        onShowToast('STK push failed', 'warning');
      }
    } catch {
      setTestPushStatus('Network error while dispatching STK push');
    } finally {
      setIsSendingTestPush(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md transition-all duration-150 overflow-y-auto">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-[#111827] border border-white/[0.08] shadow-2xl p-5 sm:p-6 relative overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-slate-100 tracking-tight">
                  Safaricom Daraja M-Pesa API &amp; STK Push Setup
                </h2>
                <span className={`text-[10px] font-mono px-2 py-0.2 rounded border font-medium ${
                  isConfigured 
                    ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300' 
                    : 'bg-amber-950/60 border-amber-800/60 text-amber-300'
                }`}>
                  {isConfigured ? 'Live Daraja Linked' : 'Simulator Mode'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Official guide and credentials connector for Safaricom Daraja M-Pesa Online STK Push.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
            aria-label="Close Daraja setup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 p-1 bg-[#090D16] rounded-lg border border-white/[0.06] my-4">
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-150 flex items-center justify-center gap-1.5 ${
              activeTab === 'guide'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Where to Register (Guide)</span>
          </button>

          <button
            onClick={() => setActiveTab('keys')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-150 flex items-center justify-center gap-1.5 ${
              activeTab === 'keys'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Keys &amp; Configuration</span>
          </button>

          <button
            onClick={() => setActiveTab('test')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-150 flex items-center justify-center gap-1.5 ${
              activeTab === 'test'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Test STK Push to Phone</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: WHERE TO REGISTER (Step-by-step Daraja Guide)    */}
        {/* ======================================================== */}
        {activeTab === 'guide' && (
          <div className="space-y-4 animate-in fade-in duration-150 text-xs">
            {/* Quick Action Banner */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-emerald-400 block">
                  Official Safaricom Daraja Developer Portal
                </span>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Sign up for free at <span className="font-mono text-white underline">developer.safaricom.co.ke</span> to get your Consumer Key &amp; Passkey.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCopyUrl('https://developer.safaricom.co.ke')}
                  className="px-2.5 py-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 border border-white/[0.08] flex items-center gap-1 transition-colors"
                >
                  {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  <span>Copy Link</span>
                </button>

                <a
                  href="https://developer.safaricom.co.ke"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1 transition-colors shadow-xs"
                >
                  <span>Open Daraja Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Step-by-Step Instructions Grid */}
            <div className="space-y-2.5">
              <div className="p-3 rounded-lg bg-[#090D16] border border-white/[0.08] flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-white/[0.08] text-slate-200 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-slate-200">Create a Safaricom Developer Account</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Visit <strong className="text-slate-200">https://developer.safaricom.co.ke</strong> and click <strong>&ldquo;Sign Up&rdquo;</strong> (or Log In). Fill in your name, email, and password.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#090D16] border border-white/[0.08] flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-white/[0.08] text-slate-200 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-slate-200">Create a New Application in &ldquo;My Apps&rdquo;</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    In your Daraja dashboard, click on <strong>My Apps</strong> &rarr; <strong>Add a New App</strong>. Give your app a name (e.g. <span className="font-mono text-emerald-400">unseen-legend-hotspot</span>) and check the checkbox for <strong>&ldquo;Lipa na M-Pesa Sandbox&rdquo;</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#090D16] border border-white/[0.08] flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-white/[0.08] text-slate-200 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-slate-200">Copy Consumer Key &amp; Consumer Secret</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Once created, your app will display your unique <strong className="text-slate-200">Consumer Key</strong> and <strong className="text-slate-200">Consumer Secret</strong>. Copy them into the <strong>&ldquo;API Keys &amp; Configuration&rdquo;</strong> tab.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#090D16] border border-white/[0.08] flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-white/[0.08] text-slate-200 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                  4
                </span>
                <div className="space-y-0.5">
                  <h4 className="font-semibold text-slate-200">Get the Lipa na M-Pesa Passkey</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    For Sandbox testing, navigate to <strong>APIs &rarr; M-Pesa Express &rarr; Simulate</strong> to copy the public sandbox passkey. For Live Production, Safaricom sends your PayBill/Till Passkey to your registered email when going live.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveTab('keys')}
                className="px-4 py-2 rounded-md bg-white text-slate-950 font-semibold text-xs hover:bg-slate-200 transition-colors"
              >
                Proceed to Enter API Keys &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: API KEYS & CONFIGURATION FORM                     */}
        {/* ======================================================== */}
        {activeTab === 'keys' && (
          <div className="space-y-4 animate-in fade-in duration-150 text-xs">
            <div className="p-3 rounded-lg bg-[#090D16] border border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Target Environment</span>
                <p className="text-[11px] text-slate-400">Choose between Daraja Sandbox testing or Live Safaricom Production.</p>
              </div>

              <div className="flex items-center gap-1 bg-[#111827] p-0.5 rounded-md border border-white/[0.08]">
                <button
                  onClick={() => setEnvironment('sandbox')}
                  className={`px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
                    environment === 'sandbox'
                      ? 'bg-white/[0.08] text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sandbox
                </button>
                <button
                  onClick={() => setEnvironment('production')}
                  className={`px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
                    environment === 'production'
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Production
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-[11px] text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Provided Keys Pre-loaded: <span className="font-mono text-white">Xg3rgs...</span> &amp; <span className="font-mono text-white">QYb2BX...</span></span>
              </div>
              <button
                type="button"
                onClick={handleSwapKeys}
                className="px-2 py-1 rounded bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/[0.08] text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                title="Swap Consumer Key and Consumer Secret"
              >
                <RotateCw className="w-3 h-3 text-slate-400" />
                <span>Swap Key / Secret</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  Consumer Key
                </label>
                <input
                  type="text"
                  value={consumerKey}
                  onChange={(e) => setConsumerKey(e.target.value)}
                  placeholder="Paste Consumer Key from Daraja My Apps..."
                  className="w-full bg-[#090D16] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-white/[0.25]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  Consumer Secret
                </label>
                <input
                  type="password"
                  value={consumerSecret}
                  onChange={(e) => setConsumerSecret(e.target.value)}
                  placeholder="Paste Consumer Secret..."
                  className="w-full bg-[#090D16] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-white/[0.25]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] uppercase font-mono text-slate-400 block">
                    Lipa na M-Pesa Online Passkey
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPasskey('QYb2BXKeAtIUxrcRU2Zz7ArG3XcINoo8xHzBNoPKLckvH1KKp2UjGV7BHCmoR1k5');
                        onShowToast('Applied QYb2BXKe... as Passkey', 'info');
                      }}
                      className="text-[9px] font-mono text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Use QYb2BXKe...
                    </button>
                    <span className="text-slate-600">·</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPasskey('bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919');
                        onShowToast('Applied Sandbox Default Passkey', 'info');
                      }}
                      className="text-[9px] font-mono text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Use Sandbox Default
                    </button>
                  </div>
                </div>
                <input
                  type="password"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="Paste Daraja Passkey (bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919)..."
                  className="w-full bg-[#090D16] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-white/[0.25]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] uppercase font-mono text-slate-400 block">
                    Business Shortcode / PayBill
                  </label>
                  <span className="text-[10px] font-mono text-slate-500">
                    Default Destination: 0142199194
                  </span>
                </div>
                <input
                  type="text"
                  value={shortcode}
                  onChange={(e) => setShortcode(e.target.value)}
                  placeholder="0142199194"
                  className="w-full bg-[#090D16] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-white/[0.25]"
                />
              </div>
            </div>

            {/* Test Connection Result Box */}
            {testResult && (
              <div className={`p-3 rounded-lg border text-xs ${
                testResult.success 
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' 
                  : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
              }`}>
                <div className="flex items-center gap-2 font-semibold">
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                  <span>{testResult.success ? 'Daraja OAuth Validated' : 'Connection Error'}</span>
                </div>
                <p className="text-[11px] mt-1 font-mono leading-relaxed">{testResult.message}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleTestConnection}
                disabled={isTesting || !consumerKey || !consumerSecret}
                className="px-3.5 py-2 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.08] font-medium text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isTesting ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                <span>Test Daraja Connection</span>
              </button>

              <button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="px-4 py-2 rounded-md bg-white text-slate-950 hover:bg-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                {isSaving ? <RotateCw className="w-3.5 h-3.5 animate-spin text-slate-900" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Credentials</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: TEST STK PUSH DIRECTLY TO A PHONE                */}
        {/* ======================================================== */}
        {activeTab === 'test' && (
          <div className="space-y-4 animate-in fade-in duration-150 text-xs">
            <div className="p-3.5 rounded-xl bg-[#090D16] border border-white/[0.08] space-y-2">
              <span className="text-xs font-semibold text-slate-200 block">
                Trigger Real-time STK Push to Phone
              </span>
              <p className="text-[11px] text-slate-400">
                Enter your mobile number to test the STK push prompt. If Daraja keys are configured, a real carrier request is sent via Safaricom API.
              </p>

              <div className="relative pt-1">
                <Smartphone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="07********"
                  disabled={isSendingTestPush}
                  className="w-full bg-[#111827] border border-white/[0.08] rounded-md pl-9 pr-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-white/[0.25]"
                />
              </div>

              <button
                onClick={handleTriggerTestPush}
                disabled={isSendingTestPush}
                className="w-full py-2.5 rounded-md bg-white text-slate-950 hover:bg-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors mt-2 cursor-pointer"
              >
                {isSendingTestPush ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                    <span>Dispatching STK Push to Phone...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-slate-900" />
                    <span>Send Test STK Push (1 KES)</span>
                  </>
                )}
              </button>
            </div>

            {testPushStatus && (
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 text-xs space-y-1 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 font-semibold">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>STK Push Dispatch Status</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                  {testPushStatus}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
