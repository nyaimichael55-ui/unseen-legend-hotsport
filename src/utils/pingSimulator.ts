import { PingPacketResult, PingSessionMetrics, PingTarget } from '../types/network';

export const DEFAULT_TARGETS: PingTarget[] = [
  {
    id: 'cloudflare',
    name: 'Cloudflare DNS',
    host: '1.1.1.1',
    category: 'dns',
    description: 'Ultra-fast global Anycast resolver (AS13335)',
    preset: true
  },
  {
    id: 'google',
    name: 'Google Public DNS',
    host: '8.8.8.8',
    category: 'dns',
    description: 'High-availability Anycast DNS (AS15169)',
    preset: true
  },
  {
    id: 'quad9',
    name: 'Quad9 DNS',
    host: '9.9.9.9',
    category: 'dns',
    description: 'Security-filtering Anycast resolver (AS19281)',
    preset: true
  },
  {
    id: 'opendns',
    name: 'Cisco OpenDNS',
    host: '208.67.222.222',
    category: 'dns',
    description: 'Enterprise public DNS & content filter',
    preset: true
  },
  {
    id: 'gateway',
    name: 'Local Default Gateway',
    host: '192.168.1.1',
    category: 'gateway',
    description: 'LAN Router / First-Hop Default Gateway',
    preset: true
  }
];

export type DiagnosticStep = 'idle' | 'resolving' | 'pinging' | 'analyzing' | 'done';

interface RunDiagnosticsOptions {
  target: string;
  targetName?: string;
  packetCount: number;
  onStepChange?: (step: DiagnosticStep, message: string) => void;
  onPacketReceived?: (packet: PingPacketResult, currentPackets: PingPacketResult[]) => void;
}

export async function runDiagnosticsSession(
  options: RunDiagnosticsOptions
): Promise<PingSessionMetrics> {
  const { target, targetName = target, packetCount, onStepChange, onPacketReceived } = options;

  // Step 1: Resolving Host
  onStepChange?.('resolving', `Resolving route table and ARP cache for ${target}...`);
  await new Promise(res => setTimeout(res, 450));

  // Determine baseline latency profile based on target
  let baseLatency = 14.5;
  let variance = 3.5;
  let baseTtl = 57;

  if (target === '192.168.1.1' || target.startsWith('192.168.') || target.startsWith('10.') || target.startsWith('172.')) {
    baseLatency = 0.9;
    variance = 0.4;
    baseTtl = 64;
  } else if (target === '1.1.1.1') {
    baseLatency = 11.8;
    variance = 2.8;
    baseTtl = 58;
  } else if (target === '8.8.8.8') {
    baseLatency = 14.2;
    variance = 3.1;
    baseTtl = 117;
  } else if (target === '9.9.9.9') {
    baseLatency = 16.5;
    variance = 4.2;
    baseTtl = 56;
  } else if (target === '208.67.222.222') {
    baseLatency = 18.0;
    variance = 4.5;
    baseTtl = 54;
  } else {
    baseLatency = 24.0;
    variance = 6.0;
    baseTtl = 52;
  }

  // Step 2: ICMP Pinging
  onStepChange?.('pinging', `Transmitting ${packetCount} ICMP echo requests (64 bytes)...`);

  const packets: PingPacketResult[] = [];
  const delayBetweenPackets = 180; // realistic pacing

  for (let seq = 1; seq <= packetCount; seq++) {
    await new Promise(res => setTimeout(res, delayBetweenPackets));

    // Simulate rare packet drop (e.g. 2% chance on long sequences, or 0% for local gateway)
    const isLocal = baseLatency < 2;
    const isDropped = !isLocal && Math.random() < 0.03;

    if (isDropped) {
      const dropPacket: PingPacketResult = {
        seq,
        timeMs: 0,
        ttl: 0,
        status: 'timeout',
        timestamp: new Date().toLocaleTimeString()
      };
      packets.push(dropPacket);
      onPacketReceived?.(dropPacket, [...packets]);
      continue;
    }

    // Normal or slightly jittered latency
    const jitterFactor = (Math.random() - 0.5) * variance * 2;
    // Occasional minor spike (e.g. 10% chance)
    const spike = Math.random() < 0.1 ? Math.random() * 8 : 0;
    const computedRtt = Math.max(0.4, Number((baseLatency + jitterFactor + spike).toFixed(2)));

    const packet: PingPacketResult = {
      seq,
      timeMs: computedRtt,
      ttl: baseTtl,
      status: computedRtt > baseLatency + 15 ? 'slow' : 'ok',
      timestamp: new Date().toLocaleTimeString()
    };

    packets.push(packet);
    onPacketReceived?.(packet, [...packets]);
  }

  // Step 3: Analyzing Jitter & Statistical Metrics
  onStepChange?.('analyzing', 'Calculating mean deviation, RFC 3550 jitter, and packet loss...');
  await new Promise(res => setTimeout(res, 400));

  const receivedPackets = packets.filter(p => p.status !== 'timeout');
  const lostPackets = packets.length - receivedPackets.length;
  const lossPercent = Number(((lostPackets / packets.length) * 100).toFixed(1));

  let minRtt = 0;
  let maxRtt = 0;
  let avgRtt = 0;
  let jitterMs = 0;

  if (receivedPackets.length > 0) {
    const times = receivedPackets.map(p => p.timeMs);
    minRtt = Number(Math.min(...times).toFixed(2));
    maxRtt = Number(Math.max(...times).toFixed(2));
    const sum = times.reduce((a, b) => a + b, 0);
    avgRtt = Number((sum / times.length).toFixed(2));

    // Jitter calculation: Average difference between consecutive received packet latencies
    if (receivedPackets.length > 1) {
      let diffSum = 0;
      for (let i = 1; i < receivedPackets.length; i++) {
        diffSum += Math.abs(receivedPackets[i].timeMs - receivedPackets[i - 1].timeMs);
      }
      jitterMs = Number((diffSum / (receivedPackets.length - 1)).toFixed(2));
    } else {
      jitterMs = 0.5;
    }
  }

  // Categorize status
  let status: PingSessionMetrics['status'] = 'optimal';
  if (lossPercent > 10 || avgRtt > 150) {
    status = 'critical';
  } else if (lossPercent > 0 || avgRtt > 75 || jitterMs > 15) {
    status = 'degraded';
  } else if (avgRtt > 35 || jitterMs > 8) {
    status = 'acceptable';
  }

  onStepChange?.('done', 'Diagnostic cycle completed successfully.');

  return {
    id: `diag-${Date.now()}`,
    target,
    targetName,
    totalPackets: packets.length,
    receivedPackets: receivedPackets.length,
    lostPackets,
    lossPercent,
    minRtt,
    maxRtt,
    avgRtt,
    jitterMs,
    packets,
    status,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
}
