import { HotspotPackage } from '../types/network';

export const DEFAULT_HOTSPOT_PACKAGES: HotspotPackage[] = [
  {
    id: 'pkg-1h',
    name: '1-Hour Express Pass',
    price: 20,
    durationMinutes: 60,
    durationLabel: '1 Hour',
    dataLimitMb: 2048,
    bandwidthLimitMbps: 25,
    description: 'High-speed internet access for quick browsing, WhatsApp, and email triage.',
    popular: false
  },
  {
    id: 'pkg-3h',
    name: '3-Hour Standard Pass',
    price: 50,
    durationMinutes: 180,
    durationLabel: '3 Hours',
    dataLimitMb: 5120,
    bandwidthLimitMbps: 35,
    description: 'Extended browsing, streaming, and social media connectivity.',
    popular: false
  },
  {
    id: 'pkg-24h',
    name: '24-Hour Unlimited Pass',
    price: 100,
    durationMinutes: 1440,
    durationLabel: '24 Hours',
    dataLimitMb: null,
    bandwidthLimitMbps: 50,
    description: 'Full 24-hour unmetered access with high-speed streaming and downloads.',
    popular: true
  },
  {
    id: 'pkg-7d',
    name: 'Weekly Pro Bundle',
    price: 350,
    durationMinutes: 10080,
    durationLabel: '7 Days',
    dataLimitMb: null,
    bandwidthLimitMbps: 100,
    description: '7-day unthrottled access with priority QoS routing and low latency.',
    popular: false
  },
  {
    id: 'pkg-30d',
    name: 'Monthly Roaming Bundle',
    price: 1000,
    durationMinutes: 43200,
    durationLabel: '30 Days',
    dataLimitMb: null,
    bandwidthLimitMbps: 100,
    description: 'Complete 30-day enterprise field tethering pass for remote workstations.',
    popular: false
  }
];

export function formatSecondsToTime(seconds: number): string {
  if (seconds <= 0) return 'Expired';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 24) {
    const days = Math.floor(hrs / 24);
    const remHrs = hrs % 24;
    return `${days}d ${remHrs}h`;
  }
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
}
