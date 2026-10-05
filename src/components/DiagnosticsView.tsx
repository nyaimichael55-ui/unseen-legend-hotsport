import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Copy, 
  Check, 
  FileText, 
  Layers, 
  Zap, 
  Clock
} from 'lucide-react';
import { PingPacketResult, PingSessionMetrics, PingTarget } from '../types/network';
import { DEFAULT_TARGETS, DiagnosticStep, runDiagnosticsSession } from '../utils/pingSimulator';

interface DiagnosticsViewProps {
  onSaveMetric: (metrics: PingSessionMetrics) => void;
  latestDiagnostic: PingSessionMetrics | null;
  onNavigateToReport: () => void;
  onLogActivity: (title: string, description: string, category: 'diagnostic', status: 'success' | 'warning' | 'info') => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

export const DiagnosticsView: React.FC<DiagnosticsViewProps> = ({
  onSaveMetric,
  latestDiagnostic,
  onNavigateToReport,
  onLogActivity,
  onShowToast
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string>('1.1.1.1');
  const [targetName, setTargetName] = useState<string>('Cloudflare DNS');
  const [customHost, setCustomHost] = useState<string>('');
  const [packetCount, setPacketCount] = useState<number>(10);
  
  const [step, setStep] = useState<DiagnosticStep>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Ready to initiate diagnostic sequence');
  const [livePackets, setLivePackets] = useState<PingPacketResult[]>(latestDiagnostic?.packets || []);
  const [activeSession, setActiveSession] = useState<PingSessionMetrics | null>(latestDiagnostic);
  const [hoveredPacket, setHoveredPacket] = useState<PingPacketResult | null>(null);
  const [copiedLog, setCopiedLog] = useState<boolean>(false);
  const [savedToReport, setSavedToReport] = useState<boolean>(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (latestDiagnostic && !activeSession) {
      setActiveSession(latestDiagnostic);
      setLivePackets(latestDiagnostic.packets);
    }
  }, [latestDiagnostic]);

  useEffect(() => {
    if (step === 'pinging' || step === 'resolving') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [livePackets, step]);

  const handleSelectPreset = (target: PingTarget) => {
    setSelectedTarget(target.host);
    setTargetName(target.name);
    setCustomHost('');
  };

  const handleCustomHostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomHost(val);
    setSelectedTarget(val);
    setTargetName(val ? `Custom (${val})` : 'Custom Target');
  };

  const handleRunDiagnostics = async () => {
    if (!selectedTarget.trim()) return;
    setStep('resolving');
    setLivePackets([]);
    setSavedToReport(false);

    try {
      const result = await runDiagnosticsSession({
        target: selectedTarget.trim(),
        targetName,
        packetCount,
        onStepChange: (newStep, msg) => {
          setStep(newStep);
          setStatusMessage(msg);
        },
        onPacketReceived: (_packet, currentList) => {
          setLivePackets([...currentList]);
        }
      });

      setActiveSession(result);
      onSaveMetric(result);
      setStep('done');
      setStatusMessage(`Completed ${result.totalPackets} packets. Avg RTT: ${result.avgRtt}ms.`);

      onLogActivity(
        `Diagnostics Run on ${result.targetName}`,
        `${result.totalPackets} packets sent. Avg: ${result.avgRtt}ms, Jitter: ${result.jitterMs}ms, Loss: ${result.lossPercent}%`,
        'diagnostic',
        result.lossPercent > 0 ? 'warning' : 'success'
      );

      onShowToast(`Completed diagnostics for ${result.targetName} (${result.avgRtt}ms)`, 'success');
    } catch {
      setStep('idle');
      setStatusMessage('Diagnostics run encountered an unexpected failure.');
      onShowToast('Diagnostics sequence failed', 'warning');
    }
  };

  const copyTerminalOutput = () => {
    if (livePackets.length === 0) return;
    const lines = [
      `--- PING ${selectedTarget} (${targetName}) 56(84) bytes of data. ---`,
      ...livePackets.map(p => 
        p.status === 'timeout' 
          ? `Request timeout for icmp_seq ${p.seq}`
          : `64 bytes from ${selectedTarget}: icmp_seq=${p.seq} ttl=${p.ttl} time=${p.timeMs} ms`
      ),
      `--- ${selectedTarget} ping statistics ---`,
      `${activeSession?.totalPackets || packetCount} packets transmitted, ${activeSession?.receivedPackets || 0} received, ${activeSession?.lossPercent || 0}% packet loss`,
      `rtt min/avg/max/mdev = ${activeSession?.minRtt || 0}/${activeSession?.avgRtt || 0}/${activeSession?.maxRtt || 0}/${activeSession?.jitterMs || 0} ms`
    ].join('\n');

    navigator.clipboard.writeText(lines);
    setCopiedLog(true);
    onShowToast('Copied raw ICMP output to clipboard', 'success');
    setTimeout(() => setCopiedLog(false), 2000);
  };

  const handleAddToReport = () => {
    if (!activeSession) return;
    setSavedToReport(true);
    onLogActivity(
      `Snapshot Logged to Report`,
      `Metrics for ${activeSession.targetName} added to current export dispatch queue.`,
      'diagnostic',
      'info'
    );
    onShowToast(`Telemetry for ${activeSession.targetName} added to report`, 'info');
    setTimeout(() => setSavedToReport(false), 3000);
  };

  const maxChartLatency = livePackets.length > 0 
    ? Math.max(30, ...livePackets.map(p => p.timeMs * 1.25))
    : 50;

  return (
    <div className="space-y-5">
      {/* 1. Target Selector & Configuration Bar */}
      <div className="rounded-xl bg-[#111827] border border-white/[0.08] p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div>
            <h2 className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-slate-300" />
              <span>Target Host & ICMP Probe Selector</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select Anycast DNS resolvers or provide a custom IP address for latency evaluation.
            </p>
          </div>

          {/* Sample Count Segmented Control */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <span className="text-[11px] text-slate-500 font-medium">Samples:</span>
            <div className="flex items-center gap-0.5 bg-[#090D16] p-0.5 rounded-md border border-white/[0.08]">
              {[5, 10, 20].map(cnt => (
                <button
                  key={cnt}
                  disabled={step !== 'idle' && step !== 'done'}
                  onClick={() => setPacketCount(cnt)}
                  className={`px-2 py-0.5 text-xs font-mono font-medium rounded transition-all duration-150 ${
                    packetCount === cnt
                      ? 'bg-white/[0.08] text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preset Target Cards */}
        <div className="mt-3.5 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {DEFAULT_TARGETS.map(t => {
              const isSelected = selectedTarget === t.host && !customHost;
              return (
                <button
                  key={t.id}
                  disabled={step !== 'idle' && step !== 'done'}
                  onClick={() => handleSelectPreset(t)}
                  className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-all duration-150 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white/[0.06] border-white/[0.18] text-white'
                      : 'bg-[#090D16] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-white/[0.14]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium truncate">{t.name}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-600'}`} />
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">{t.host}</span>
                </button>
              );
            })}
          </div>

          {/* Custom Host Input + Run Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Or enter custom IP / Hostname (e.g. 192.168.1.1, github.com, 10.0.0.1)"
                value={customHost}
                onChange={handleCustomHostChange}
                disabled={step !== 'idle' && step !== 'done'}
                className="w-full bg-[#090D16] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/[0.25] font-mono transition-colors"
              />
              {customHost && (
                <button
                  onClick={() => { setCustomHost(''); setSelectedTarget('1.1.1.1'); setTargetName('Cloudflare DNS'); }}
                  className="absolute right-2.5 top-2 text-xs text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={handleRunDiagnostics}
              disabled={step !== 'idle' && step !== 'done'}
              className={`px-4 py-2 rounded-md font-medium text-xs flex items-center justify-center gap-1.5 transition-all duration-150 ease-in-out shadow-xs active:scale-95 ${
                step === 'resolving' || step === 'pinging' || step === 'analyzing'
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/[0.08]'
                  : 'bg-white text-slate-900 hover:bg-slate-200'
              }`}
            >
              {step === 'resolving' || step === 'pinging' || step === 'analyzing' ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  <span>Probing Target...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                  <span>Run Diagnostics</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stepper Status Sequence with Status Badges */}
        {step !== 'idle' && (
          <div className="mt-3.5 pt-3 border-t border-white/[0.08]">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {statusMessage}
              </span>
              <div className="flex items-center gap-1">
                {(['resolving', 'pinging', 'analyzing', 'done'] as DiagnosticStep[]).map((phase) => {
                  const isCurrent = step === phase;
                  const isPassed = 
                    (step === 'pinging' && phase === 'resolving') ||
                    (step === 'analyzing' && (phase === 'resolving' || phase === 'pinging')) ||
                    (step === 'done');
                  
                  return (
                    <span 
                      key={phase}
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded capitalize ${
                        isCurrent 
                          ? 'bg-white/[0.08] text-white border border-white/[0.12] font-medium' 
                          : isPassed 
                            ? 'text-emerald-400 bg-emerald-950/30' 
                            : 'text-slate-600 bg-[#090D16]'
                      }`}
                    >
                      {phase}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="w-full bg-[#090D16] h-1 rounded-full overflow-hidden border border-white/[0.08]">
              <div 
                className="h-full bg-slate-300 transition-all duration-200"
                style={{
                  width: step === 'resolving' ? '25%' : step === 'pinging' ? `${Math.min(90, (livePackets.length / packetCount) * 75 + 25)}%` : step === 'analyzing' ? '95%' : '100%'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Metrics Readout Cards (Professional Monospace Numbers) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Average RTT */}
        <div className="p-4 rounded-xl bg-[#111827] border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-medium uppercase tracking-wider">Average RTT</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl sm:text-2xl font-semibold font-mono text-slate-100 tabular-nums">
              {activeSession ? activeSession.avgRtt : '--'}
            </span>
            <span className="text-[11px] text-slate-500">ms</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            Target SLA baseline: {activeSession && activeSession.avgRtt < 30 ? 'Nominal (<30ms)' : 'Fair'}
          </p>
        </div>

        {/* Min / Max Latency */}
        <div className="p-4 rounded-xl bg-[#111827] border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-medium uppercase tracking-wider">Min / Max</span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg sm:text-xl font-semibold font-mono text-slate-100 tabular-nums">
              {activeSession ? `${activeSession.minRtt} / ${activeSession.maxRtt}` : '-- / --'}
            </span>
            <span className="text-[11px] text-slate-500">ms</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            Round-trip delay range
          </p>
        </div>

        {/* RFC Jitter */}
        <div className="p-4 rounded-xl bg-[#111827] border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-medium uppercase tracking-wider">RFC 3550 Jitter</span>
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl sm:text-2xl font-semibold font-mono text-emerald-400 tabular-nums">
              {activeSession ? activeSession.jitterMs : '--'}
            </span>
            <span className="text-[11px] text-slate-500">ms</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            {activeSession && activeSession.jitterMs < 5 ? 'Stable (<5ms nominal)' : 'Variance within limits'}
          </p>
        </div>

        {/* Packet Loss */}
        <div className="p-4 rounded-xl bg-[#111827] border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-medium uppercase tracking-wider">Packet Loss</span>
            {activeSession && activeSession.lossPercent > 0 ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-xl sm:text-2xl font-semibold font-mono tabular-nums ${
              activeSession && activeSession.lossPercent > 0 ? 'text-amber-400' : 'text-slate-100'
            }`}>
              {activeSession ? `${activeSession.lossPercent}%` : '--%'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            {activeSession ? `${activeSession.lostPackets} dropped / ${activeSession.totalPackets} sent` : 'Zero drops expected'}
          </p>
        </div>
      </div>

      {/* 3. Stability Visualizer (Clean Bar / Vector Graph) */}
      <div className="rounded-xl bg-[#111827] border border-white/[0.08] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/[0.08]">
          <div>
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span>Latency Stability Waveform</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Sequence distribution of round-trip probe times across sample packets.
            </p>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>&lt;30ms</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>&gt;50ms</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Drop</span>
            </span>
          </div>
        </div>

        {/* Visualizer Canvas Area */}
        <div className="mt-3.5 h-40 sm:h-48 relative flex flex-col justify-end">
          {livePackets.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Run diagnostics to render real-time response waveform.
            </div>
          ) : (
            <div className="h-full w-full flex items-end justify-between gap-1 sm:gap-2 pt-6 pb-2 px-1 relative">
              {/* Background Reference Lines */}
              <div className="absolute inset-x-0 top-6 border-b border-white/[0.04] text-[9px] font-mono text-slate-600 pl-1">
                {Math.round(maxChartLatency)}ms peak
              </div>
              <div className="absolute inset-x-0 top-1/2 border-b border-white/[0.04] text-[9px] font-mono text-slate-600 pl-1">
                {Math.round(maxChartLatency / 2)}ms
              </div>
              <div className="absolute inset-x-0 bottom-6 border-b border-white/[0.04] text-[9px] font-mono text-slate-600 pl-1">
                0ms
              </div>

              {/* Packet Bars */}
              {livePackets.map((pkt) => {
                const heightPercent = pkt.status === 'timeout' 
                  ? 10 
                  : Math.max(8, Math.min(100, (pkt.timeMs / maxChartLatency) * 100));

                let barColor = 'bg-slate-300';
                if (pkt.status === 'timeout') barColor = 'bg-rose-500';
                else if (pkt.timeMs > 50) barColor = 'bg-amber-400';
                else if (pkt.timeMs <= 25) barColor = 'bg-emerald-500/80';

                return (
                  <div
                    key={pkt.seq}
                    onMouseEnter={() => setHoveredPacket(pkt)}
                    onMouseLeave={() => setHoveredPacket(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative z-10 cursor-pointer"
                  >
                    {hoveredPacket?.seq === pkt.seq && (
                      <div className="absolute -top-10 z-30 bg-[#090D16] border border-white/[0.15] px-2 py-0.5 rounded text-[10px] font-mono text-slate-200 whitespace-nowrap pointer-events-none shadow-lg">
                        #{pkt.seq}: {pkt.status === 'timeout' ? 'TIMEOUT' : `${pkt.timeMs}ms`}
                      </div>
                    )}

                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[20px] rounded-t transition-all duration-150 ${barColor} group-hover:brightness-125`}
                    />
                    <span className="text-[9px] font-mono text-slate-500 mt-1 tabular-nums">
                      #{pkt.seq}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. Terminal Output View & Report Actions */}
      <div className="rounded-xl bg-[#090D16] border border-white/[0.08] p-4 shadow-sm">
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-600" />
            <span className="text-[11px] font-mono text-slate-400">
              icmp://{selectedTarget}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={copyTerminalOutput}
              disabled={livePackets.length === 0}
              className="px-2.5 py-1 text-xs font-medium rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] flex items-center gap-1 transition-all duration-150 disabled:opacity-30"
            >
              {copiedLog ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLog ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleAddToReport}
              disabled={!activeSession}
              className={`px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1 transition-all duration-150 ${
                savedToReport 
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] disabled:opacity-30'
              }`}
            >
              <FileText className="w-3 h-3 text-slate-400" />
              <span>{savedToReport ? 'Added' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Terminal Stream */}
        <div className="mt-2.5 font-mono text-[11px] text-slate-300 space-y-1 max-h-52 overflow-y-auto pr-2">
          <p className="text-slate-500">
            PING {selectedTarget} ({targetName}) 56(84) bytes of data:
          </p>
          {livePackets.map((pkt) => (
            <div key={pkt.seq} className="leading-relaxed flex items-center justify-between">
              {pkt.status === 'timeout' ? (
                <span className="text-rose-400">
                  Request timeout for icmp_seq {pkt.seq}
                </span>
              ) : (
                <span>
                  <span className="text-slate-500">64 bytes</span> from {selectedTarget}: icmp_seq={pkt.seq} ttl={pkt.ttl} time=
                  <span className={pkt.timeMs > 50 ? 'text-amber-300 font-medium' : 'text-slate-200'}>
                    {pkt.timeMs} ms
                  </span>
                </span>
              )}
              <span className="text-[10px] text-slate-600">{pkt.timestamp}</span>
            </div>
          ))}

          {step === 'pinging' && (
            <p className="text-slate-400 animate-pulse text-[11px]">
              Transmitting probe {livePackets.length + 1}...
            </p>
          )}

          {activeSession && step === 'done' && (
            <div className="pt-2 mt-2 border-t border-white/[0.06] text-slate-500 text-[11px]">
              <p>--- {selectedTarget} ping statistics ---</p>
              <p>
                {activeSession.totalPackets} packets transmitted, {activeSession.receivedPackets} received,{' '}
                <span className={activeSession.lossPercent > 0 ? 'text-amber-400 font-medium' : 'text-slate-300'}>
                  {activeSession.lossPercent}% packet loss
                </span>
              </p>
              <p>
                rtt min/avg/max/jitter = {activeSession.minRtt}/{activeSession.avgRtt}/{activeSession.maxRtt}/{activeSession.jitterMs} ms
              </p>
            </div>
          )}

          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
};
