import React, { useState } from 'react';
import { 
  Radar, 
  Play, 
  RotateCw, 
  Lock, 
  Sparkles, 
  Server, 
  Laptop, 
  Tv, 
  Cpu, 
  Search
} from 'lucide-react';
import { ScannedDevice } from '../types/network';

interface DeviceScannerViewProps {
  isPro: boolean;
  onOpenProModal: () => void;
  onLogActivity: (title: string, description: string, category: 'pro', status: 'success' | 'warning' | 'info') => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const MOCK_DEVICES: ScannedDevice[] = [
  {
    ip: '192.168.1.1',
    mac: '70:A7:41:2B:9F:01',
    hostname: 'udm-pro.lan',
    vendor: 'Ubiquiti Networks (UniFi Gateway)',
    status: 'online',
    openPorts: [22, 53, 80, 443],
    latencyMs: 0.7
  },
  {
    ip: '192.168.1.10',
    mac: '00:11:32:8A:4F:19',
    hostname: 'synology-nas.local',
    vendor: 'Synology Inc. (DS920+ Storage)',
    status: 'online',
    openPorts: [445, 5000, 5001],
    latencyMs: 1.2
  },
  {
    ip: '192.168.1.45',
    mac: 'B4:2E:99:A1:CC:04',
    hostname: 'dev-box-linux.local',
    vendor: 'Dell Technologies (Precision Workstation)',
    status: 'online',
    openPorts: [22, 3000, 8080],
    latencyMs: 0.5
  },
  {
    ip: '192.168.1.82',
    mac: 'A8:23:FE:19:D4:62',
    hostname: 'lg-oled-c3.lan',
    vendor: 'LG Electronics (webOS Smart TV)',
    status: 'online',
    openPorts: [8001, 8002],
    latencyMs: 3.8
  },
  {
    ip: '192.168.1.108',
    mac: 'E4:5F:01:77:2D:3E',
    hostname: 'netpulse-client.local (Self)',
    vendor: 'Intel Wireless-AC GbE',
    status: 'online',
    openPorts: [3000],
    latencyMs: 0.1
  },
  {
    ip: '192.168.1.140',
    mac: 'D8:3A:DD:49:10:E2',
    hostname: 'homeassistant.local',
    vendor: 'Raspberry Pi Trading Ltd',
    status: 'online',
    openPorts: [1883, 8123],
    latencyMs: 2.4
  },
  {
    ip: '192.168.1.200',
    mac: '00:26:0B:44:81:AA',
    hostname: 'sw-core-poe.lan',
    vendor: 'Cisco Systems (Managed Switch)',
    status: 'online',
    openPorts: [22, 161],
    latencyMs: 0.9
  }
];

export const DeviceScannerView: React.FC<DeviceScannerViewProps> = ({
  isPro,
  onOpenProModal,
  onLogActivity,
  onShowToast
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [devices, setDevices] = useState<ScannedDevice[]>(MOCK_DEVICES);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const subnetTarget = '192.168.1.0/24';

  const handleStartScan = async () => {
    if (!isPro) {
      onOpenProModal();
      return;
    }

    setIsScanning(true);
    setDevices([]);
    
    for (let i = 0; i < MOCK_DEVICES.length; i++) {
      await new Promise(r => setTimeout(r, 200));
      setDevices(prev => [...prev, MOCK_DEVICES[i]]);
    }

    setIsScanning(false);
    onLogActivity(
      'Completed LAN Subnet ARP Sweep',
      `Identified ${MOCK_DEVICES.length} active IP nodes across ${subnetTarget}.`,
      'pro',
      'success'
    );
    onShowToast(`Discovered ${MOCK_DEVICES.length} online nodes on ${subnetTarget}`, 'success');
  };

  const filteredDevices = devices.filter(d => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return d.ip.includes(q) || d.hostname.toLowerCase().includes(q) || d.vendor.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      {/* 1. Header & Controls */}
      <div className="rounded-xl bg-[#111827] border border-white/[0.08] p-5 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Radar className="w-3.5 h-3.5 text-slate-300" />
                <span>Subnet Device Scanner</span>
              </h2>
              {!isPro && (
                <span className="flex items-center gap-1 text-[9px] font-medium uppercase font-mono text-slate-400 bg-white/[0.04] border border-white/[0.08] px-1.5 py-0.2 rounded">
                  <Lock className="w-2.5 h-2.5" /> Pro Only
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Probes active ARP/ICMP nodes on the local broadcast domain and resolves hardware MAC vendors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartScan}
              disabled={isScanning}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all duration-150 active:scale-95 ${
                isScanning
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/[0.08]'
                  : isPro
                    ? 'bg-white text-slate-900 hover:bg-slate-200'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08]'
              }`}
            >
              {isScanning ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  <span>Sweeping Subnet...</span>
                </>
              ) : isPro ? (
                <>
                  <Play className="w-3 h-3 fill-slate-950 text-slate-950" />
                  <span>Scan Subnet (ARP Sweep)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-slate-400" />
                  <span>Unlock Scanner (Pro)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Input Target Subnet */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter discovered hosts by IP, hostname, or hardware vendor..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-[#090D16] border border-white/[0.08] rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-white/[0.25] font-mono transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#090D16] border border-white/[0.08] text-[11px] font-mono text-slate-400">
            <span>Target:</span>
            <span className="text-slate-200 font-medium">{subnetTarget}</span>
          </div>
        </div>
      </div>

      {/* 2. Device List & Pro Gate */}
      <div className="relative">
        {!isPro && (
          <div className="absolute inset-0 z-20 bg-[#090D16]/85 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300 shadow-md">
              <Lock className="w-5 h-5" />
            </div>
            <div className="max-w-sm space-y-1">
              <h3 className="text-sm font-semibold text-slate-100">
                Pro Feature: Subnet Device Discovery
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scan your local /24 subnet to discover connected hardware, identify rogue DHCP clients, and view active listening ports.
              </p>
            </div>
            <button
              onClick={onOpenProModal}
              className="px-4 py-2 rounded-md bg-white text-slate-900 hover:bg-slate-200 font-medium text-xs flex items-center gap-1.5 transition-all duration-150 active:scale-95 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upgrade to Pro ($4.99/mo)</span>
            </button>
          </div>
        )}

        {/* Devices Table */}
        <div className="rounded-xl bg-[#111827] border border-white/[0.08] overflow-hidden shadow-sm">
          <div className="p-3 border-b border-white/[0.08] flex items-center justify-between text-xs text-slate-500">
            <span>Discovered Hosts ({filteredDevices.length})</span>
            <span className="font-mono text-[10px]">ARP Cache & Port Probing</span>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {filteredDevices.map(dev => (
              <div 
                key={dev.ip}
                className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-md bg-[#090D16] border border-white/[0.08] text-slate-400 mt-0.5">
                    {dev.ip === '192.168.1.1' ? <Server className="w-3.5 h-3.5 text-slate-300" /> :
                     dev.ip.endsWith('82') ? <Tv className="w-3.5 h-3.5 text-slate-400" /> :
                     dev.ip.endsWith('108') ? <Laptop className="w-3.5 h-3.5 text-slate-300" /> :
                     <Cpu className="w-3.5 h-3.5 text-slate-400" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-slate-100">{dev.ip}</span>
                      <span className="text-[11px] text-slate-500 font-mono">({dev.hostname})</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-emerald-400 font-medium">Online</span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Hardware: <span className="text-slate-300">{dev.vendor}</span> · MAC: <span className="font-mono text-slate-500">{dev.mac}</span>
                    </p>
                  </div>
                </div>

                {/* Ports & Latency */}
                <div className="flex items-center gap-3 self-start md:self-auto">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] uppercase font-medium text-slate-500">Ports:</span>
                    {dev.openPorts.map(p => (
                      <span 
                        key={p} 
                        className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#090D16] text-slate-300 border border-white/[0.08]"
                      >
                        {p}
                      </span>
                    ))}
                  </div>

                  <span className="font-mono text-[11px] text-slate-300 bg-[#090D16] px-1.5 py-0.5 rounded border border-white/[0.08] tabular-nums">
                    {dev.latencyMs} ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
