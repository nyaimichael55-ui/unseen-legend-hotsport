import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Printer, 
  Lock
} from 'lucide-react';
import { PingSessionMetrics } from '../types/network';
import { downloadTextFile, generateDiagnosticReportText } from '../utils/reportGenerator';

interface ReportExporterViewProps {
  diagnosticsHistory: PingSessionMetrics[];
  isPro: boolean;
  onOpenProModal: () => void;
  onLogActivity: (title: string, description: string, category: 'report', status: 'success' | 'warning' | 'info') => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

export const ReportExporterView: React.FC<ReportExporterViewProps> = ({
  diagnosticsHistory,
  isPro,
  onOpenProModal,
  onLogActivity,
  onShowToast
}) => {
  const [ticketId, setTicketId] = useState<string>('NOC-84192');
  const [technicianName, setTechnicianName] = useState<string>('Alex Chen (Lead Network Admin)');
  const [ispName, setIspName] = useState<string>('Tier-1 Transit / Fiber NOC');
  const [reportedIssue, setReportedIssue] = useState<string>('Intermittent WAN Packet Delay & Latency Spikes');
  const [copied, setCopied] = useState<boolean>(false);

  const localIp = '192.168.1.108';
  const gatewayIp = '192.168.1.1';
  const dnsServer = '1.1.1.1, 8.8.8.8';
  const interfaceType = '1000BASE-T Ethernet (eth0 / Realtek PCIe GbE)';

  const formattedReport = useMemo(() => {
    return generateDiagnosticReportText({
      ticketId,
      technicianName,
      ispName,
      reportedIssue,
      localIp,
      gatewayIp,
      dnsServer,
      interfaceType,
      diagnostics: diagnosticsHistory
    });
  }, [ticketId, technicianName, ispName, reportedIssue, diagnosticsHistory]);

  const handleCopyReport = () => {
    navigator.clipboard.writeText(formattedReport);
    setCopied(true);
    onLogActivity(
      'Exported Diagnostic Summary to Clipboard',
      `Structured RFC triage text compiled (${diagnosticsHistory.length} test records).`,
      'report',
      'success'
    );
    onShowToast('Diagnostic report copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadTxt = () => {
    const filename = `NetPulse-Report-${ticketId.replace(/[^a-zA-Z0-9_-]/g, '_')}-${Date.now()}.txt`;
    downloadTextFile(filename, formattedReport);
    onLogActivity(
      'Downloaded Diagnostic Report (.txt)',
      `Saved file "${filename}" locally for ISP escalation.`,
      'report',
      'success'
    );
    onShowToast(`Downloaded ${filename}`, 'success');
  };

  const handlePrintOrPdf = () => {
    if (!isPro) {
      onOpenProModal();
      return;
    }
    window.print();
    onLogActivity(
      'Triggered Clean PDF Print Dispatch',
      'Rendered vector print stylesheet for professional ticket archival.',
      'report',
      'info'
    );
    onShowToast('Opening print dialog for PDF export', 'info');
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & Configuration Controls */}
      <div className="rounded-xl bg-[#111827] border border-white/[0.08] p-5 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-slate-300" />
              <span>Diagnostic Report Exporter</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Generates an ISP and NOC compliant ticket summary including empirical latency, jitter, and link topology.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-300 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded">
              {diagnosticsHistory.length} Batches Logged
            </span>
          </div>
        </div>

        {/* Input Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          <div>
            <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
              Ticket Reference
            </label>
            <input
              type="text"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              className="w-full bg-[#090D16] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-white/[0.25] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
              Technician
            </label>
            <input
              type="text"
              value={technicianName}
              onChange={(e) => setTechnicianName(e.target.value)}
              className="w-full bg-[#090D16] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-white/[0.25] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
              ISP / NOC
            </label>
            <input
              type="text"
              value={ispName}
              onChange={(e) => setIspName(e.target.value)}
              className="w-full bg-[#090D16] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-white/[0.25] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
              Reported Issue
            </label>
            <input
              type="text"
              value={reportedIssue}
              onChange={(e) => setReportedIssue(e.target.value)}
              className="w-full bg-[#090D16] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-white/[0.25] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 2. Export Actions Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3.5 rounded-xl bg-[#111827] border border-white/[0.08] shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyReport}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ease-in-out shadow-xs active:scale-95 ${
              copied
                ? 'bg-emerald-500 text-slate-950 font-semibold'
                : 'bg-white text-slate-900 hover:bg-slate-200'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Summary' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={handleDownloadTxt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] transition-all duration-150 ease-in-out active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Download Report (.txt)</span>
          </button>
        </div>

        {/* Pro PDF Button */}
        <button
          onClick={handlePrintOrPdf}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 border ${
            isPro
              ? 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border-white/[0.08]'
              : 'bg-[#090D16] text-slate-400 border-white/[0.08] hover:border-white/[0.14]'
          }`}
          title={isPro ? 'Print / Export to PDF' : 'Pro Feature: PDF Export Locked'}
        >
          <Printer className="w-3.5 h-3.5 text-slate-400" />
          <span>{isPro ? 'Print / Export to PDF' : 'Export to PDF'}</span>
          {!isPro && <Lock className="w-3 h-3 text-slate-500 ml-0.5" />}
        </button>
      </div>

      {/* 3. Live Syntax-Styled Preview Box */}
      <div className="rounded-xl bg-[#090D16] border border-white/[0.08] p-5 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08] mb-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <span className="text-slate-200 font-medium">report.out</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500">Plaintext Monospace</span>
          </div>

          <span className="text-[10px] text-slate-500 font-mono">
            ISP Escalation Format
          </span>
        </div>

        <pre className="font-mono text-[11px] sm:text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre p-1 max-h-[460px] overflow-y-auto">
          {formattedReport}
        </pre>
      </div>
    </div>
  );
};
