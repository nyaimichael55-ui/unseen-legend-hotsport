import React, { useState, useMemo } from 'react';
import { 
  Network, 
  Copy, 
  Check, 
  Sliders, 
  ShieldCheck, 
  Layers,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { calculateSubnet, isIpInSubnet } from '../utils/subnetCalculator';

interface SubnetToolViewProps {
  onLogActivity: (title: string, description: string, category: 'subnet', status: 'success' | 'warning' | 'info') => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

export const SubnetToolView: React.FC<SubnetToolViewProps> = ({ onLogActivity, onShowToast }) => {
  const [cidrInput, setCidrInput] = useState<string>('192.168.1.0/24');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Host IP tester
  const [testIpInput, setTestIpInput] = useState<string>('192.168.1.45');

  const subnetResult = useMemo(() => {
    return calculateSubnet(cidrInput);
  }, [cidrInput]);

  const isTestIpMember = useMemo(() => {
    if (!subnetResult.isValid || !testIpInput.trim()) return null;
    return isIpInSubnet(testIpInput.trim(), subnetResult.networkAddress, subnetResult.cidr);
  }, [testIpInput, subnetResult]);

  const copyValue = (val: string, keyName: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(keyName);
    onLogActivity(
      `Copied Subnet Parameter (${keyName})`,
      `${val} copied to clipboard.`,
      'subnet',
      'info'
    );
    onShowToast(`Copied ${keyName} (${val}) to clipboard`, 'success');
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleApplyPreset = (preset: string) => {
    setCidrInput(preset);
    onShowToast(`Applied preset ${preset}`, 'info');
  };

  const handleSliderChange = (newCidr: number) => {
    const currentIp = subnetResult.isValid ? subnetResult.ip : '192.168.1.0';
    setCidrInput(`${currentIp}/${newCidr}`);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & Interactive Input Bar */}
      <div className="rounded-xl bg-[#111827] border border-white/[0.08] p-5 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Network className="w-3.5 h-3.5 text-slate-300" />
              <span>CIDR Subnet Calculator</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Type an IP/CIDR block (e.g. 192.168.1.0/24) to calculate boundary allocations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-200 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded">
              /{subnetResult.cidr} ({subnetResult.subnetMask})
            </span>
          </div>
        </div>

        {/* Preset Shortcuts */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] text-slate-500 font-medium mr-1">Presets:</span>
          <button
            onClick={() => handleApplyPreset('192.168.1.0/24')}
            className="px-2 py-0.5 text-xs rounded bg-[#090D16] border border-white/[0.08] hover:border-white/[0.15] text-slate-300 transition-colors"
          >
            192.168.1.0/24 (Home / 254)
          </button>
          <button
            onClick={() => handleApplyPreset('10.0.0.0/16')}
            className="px-2 py-0.5 text-xs rounded bg-[#090D16] border border-white/[0.08] hover:border-white/[0.15] text-slate-300 transition-colors"
          >
            10.0.0.0/16 (Corp / 65k)
          </button>
          <button
            onClick={() => handleApplyPreset('172.16.50.0/28')}
            className="px-2 py-0.5 text-xs rounded bg-[#090D16] border border-white/[0.08] hover:border-white/[0.15] text-slate-300 transition-colors"
          >
            172.16.50.0/28 (VLAN / 14)
          </button>
          <button
            onClick={() => handleApplyPreset('10.254.0.0/30')}
            className="px-2 py-0.5 text-xs rounded bg-[#090D16] border border-white/[0.08] hover:border-white/[0.15] text-slate-300 transition-colors"
          >
            10.254.0.0/30 (P2P / 2)
          </button>
        </div>

        {/* Direct IP/CIDR Input & Prefix Slider */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 pt-1">
          {/* Main Input */}
          <div className="lg:col-span-1">
            <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
              IP / CIDR Block
            </label>
            <input
              type="text"
              value={cidrInput}
              onChange={(e) => setCidrInput(e.target.value)}
              placeholder="e.g. 192.168.1.0/24"
              className="w-full bg-[#090D16] border border-white/[0.08] rounded-md px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-white/[0.25] transition-colors"
            />
          </div>

          {/* CIDR Range Slider */}
          <div className="lg:col-span-2 flex flex-col justify-center">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 text-[11px]">
                <Sliders className="w-3 h-3 text-slate-400" />
                <span>Prefix Length</span>
              </span>
              <span className="font-mono text-slate-200 text-xs">
                /{subnetResult.cidr} ({subnetResult.cidr} Net / {32 - subnetResult.cidr} Host bits)
              </span>
            </div>
            
            <input
              type="range"
              min="8"
              max="32"
              value={subnetResult.cidr}
              onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
              className="w-full accent-slate-300 h-1.5 bg-[#090D16] rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
              <span>/8</span>
              <span>/16</span>
              <span>/24</span>
              <span>/30</span>
              <span>/32</span>
            </div>
          </div>
        </div>

        {!subnetResult.isValid && subnetResult.error && (
          <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
            <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            <span>{subnetResult.error}</span>
          </div>
        )}
      </div>

      {/* 2. Structured Output Grid (Clean Monospace Figures) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Network Address */}
        <div className="p-4 rounded-xl bg-[#111827] border border-white/[0.08] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-medium tracking-wider">Network Address</span>
            <button
              onClick={() => copyValue(subnetResult.networkAddress, 'Network Address')}
              className="p-1 hover:text-slate-200 transition-colors"
              title="Copy"
            >
              {copiedKey === 'Network Address' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <p className="text-lg sm:text-xl font-medium font-mono text-slate-100 mt-1.5 truncate tabular-nums">
            {subnetResult.networkAddress}
          </p>
          <span className="text-[10px] text-slate-500 block mt-1 font-mono">
            First address (Subnet ID)
          </span>
        </div>

        {/* Broadcast Address */}
        <div className="p-4 rounded-xl bg-[#111827] border border-white/[0.08] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-medium tracking-wider">Broadcast Address</span>
            <button
              onClick={() => copyValue(subnetResult.broadcastAddress, 'Broadcast Address')}
              className="p-1 hover:text-slate-200 transition-colors"
              title="Copy"
            >
              {copiedKey === 'Broadcast Address' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <p className="text-lg sm:text-xl font-medium font-mono text-slate-100 mt-1.5 truncate tabular-nums">
            {subnetResult.broadcastAddress}
          </p>
          <span className="text-[10px] text-slate-500 block mt-1 font-mono">
            Last address in block
          </span>
        </div>

        {/* Subnet Netmask */}
        <div className="p-4 rounded-xl bg-[#111827] border border-white/[0.08] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-medium tracking-wider">Netmask</span>
            <button
              onClick={() => copyValue(subnetResult.subnetMask, 'Netmask')}
              className="p-1 hover:text-slate-200 transition-colors"
              title="Copy"
            >
              {copiedKey === 'Netmask' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <p className="text-lg sm:text-xl font-medium font-mono text-slate-100 mt-1.5 truncate tabular-nums">
            {subnetResult.subnetMask}
          </p>
          <span className="text-[10px] text-slate-500 block mt-1 font-mono">
            Hex: {subnetResult.hexMask}
          </span>
        </div>

        {/* Total Usable Hosts */}
        <div className="p-4 rounded-xl bg-[#111827] border border-white/[0.08] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] uppercase font-medium tracking-wider">Usable Hosts</span>
            <button
              onClick={() => copyValue(subnetResult.usableHosts.toString(), 'Usable Hosts')}
              className="p-1 hover:text-slate-200 transition-colors"
              title="Copy"
            >
              {copiedKey === 'Usable Hosts' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <p className="text-xl sm:text-2xl font-medium font-mono text-slate-100 mt-1.5 tabular-nums">
            {subnetResult.usableHosts.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 block mt-1">
            Total capacity: {subnetResult.totalHosts.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 3. Detailed Topology Breakdown Table */}
      <div className="rounded-xl bg-[#111827] border border-white/[0.08] p-5 shadow-sm space-y-2.5">
        <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 pb-2 border-b border-white/[0.08]">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>Address Allocation</span>
        </h3>

        <div className="divide-y divide-white/[0.04] text-xs">
          {/* Usable Host Range */}
          <div className="py-2 flex items-center justify-between">
            <span className="text-slate-400">Usable Range</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-200">{subnetResult.usableHostRange}</span>
              <button
                onClick={() => copyValue(subnetResult.usableHostRange, 'Usable Range')}
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {copiedKey === 'Usable Range' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Wildcard Mask */}
          <div className="py-2 flex items-center justify-between">
            <span className="text-slate-400">Wildcard (ACL) Mask</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-300">{subnetResult.wildcardMask}</span>
              <button
                onClick={() => copyValue(subnetResult.wildcardMask, 'Wildcard Mask')}
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {copiedKey === 'Wildcard Mask' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Scope & Class */}
          <div className="py-2 flex items-center justify-between">
            <span className="text-slate-400">Scope</span>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-200 font-medium">{subnetResult.ipType}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400 font-mono text-[11px]">{subnetResult.ipClass}</span>
            </div>
          </div>

          {/* Binary IP */}
          <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-slate-400">Binary IP</span>
            <span className="font-mono text-[11px] text-slate-500 tracking-wider">
              {subnetResult.binaryIp || 'N/A'}
            </span>
          </div>

          {/* Binary Mask */}
          <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-slate-400">Binary Mask</span>
            <span className="font-mono text-[11px] text-slate-400 tracking-wider">
              {subnetResult.binaryMask || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Host Membership Verification Widget */}
      <div className="rounded-xl bg-[#111827] border border-white/[0.08] p-5 shadow-sm space-y-2.5">
        <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Host IP Membership Verifier</span>
        </h3>
        <p className="text-xs text-slate-400">
          Verify whether an endpoint IP falls into this subnet's calculated host range.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          <input
            type="text"
            value={testIpInput}
            onChange={(e) => setTestIpInput(e.target.value)}
            placeholder="e.g. 192.168.1.50"
            className="flex-1 bg-[#090D16] border border-white/[0.08] rounded-md px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-white/[0.25] transition-colors"
          />

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#090D16] border border-white/[0.08]">
            {isTestIpMember === true ? (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Belongs to {subnetResult.networkAddress}/{subnetResult.cidr}</span>
              </div>
            ) : isTestIpMember === false ? (
              <div className="flex items-center gap-1.5 text-rose-400 text-xs font-medium">
                <XCircle className="w-3.5 h-3.5" />
                <span>Outside Subnet Boundary</span>
              </div>
            ) : (
              <span className="text-slate-500 text-xs">Enter valid test IP</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
