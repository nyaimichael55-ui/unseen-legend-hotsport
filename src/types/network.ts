export type OsType = 'linux' | 'windows' | 'macos';

export type CommandCategory = 
  | 'dns'
  | 'ports'
  | 'interfaces'
  | 'routing'
  | 'packet_analysis'
  | 'firewall';

export interface CommandFlag {
  flag: string;
  meaning: string;
}

export interface CliCommand {
  id: string;
  title: string;
  category: CommandCategory;
  os: OsType[];
  command: string;
  description: string;
  flags: CommandFlag[];
  sampleOutput: string;
}

export interface PingTarget {
  id: string;
  name: string;
  host: string;
  category: 'dns' | 'gateway' | 'custom' | 'cloud';
  description: string;
  preset?: boolean;
}

export interface PingPacketResult {
  seq: number;
  timeMs: number;
  ttl: number;
  status: 'ok' | 'timeout' | 'slow';
  timestamp: string;
}

export interface PingSessionMetrics {
  id: string;
  target: string;
  targetName: string;
  totalPackets: number;
  receivedPackets: number;
  lostPackets: number;
  lossPercent: number;
  minRtt: number;
  maxRtt: number;
  avgRtt: number;
  jitterMs: number;
  packets: PingPacketResult[];
  status: 'optimal' | 'acceptable' | 'degraded' | 'critical';
  timestamp: string;
}

export interface SubnetCalcResult {
  ip: string;
  cidr: number;
  subnetMask: string;
  wildcardMask: string;
  networkAddress: string;
  broadcastAddress: string;
  usableHostRange: string;
  totalHosts: number;
  usableHosts: number;
  ipClass: string;
  ipType: 'Private (RFC 1918)' | 'Public Internet' | 'Loopback' | 'Link-Local' | 'Multicast';
  binaryIp: string;
  binaryMask: string;
  hexMask: string;
  isValid: boolean;
  error?: string;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  category: 'diagnostic' | 'command' | 'report' | 'subnet' | 'pro' | 'hotspot';
  status: 'success' | 'warning' | 'info';
}

export interface ScannedDevice {
  ip: string;
  mac: string;
  hostname: string;
  vendor: string;
  status: 'online' | 'idle';
  openPorts: number[];
  latencyMs: number;
}

export interface HotspotConfig {
  isEnabled: boolean;
  ssid: string;
  security: 'WPA3-Personal' | 'WPA2/WPA3-Mixed' | 'Open';
  band: '2.4 GHz' | '5 GHz' | 'Dual Band (6 GHz)';
  channel: number;
  ipPool: string;
  maxClients: number;
  dataUsedMb: number;
  broadcastMode: 'Wi-Fi 6 (802.11ax)' | 'USB Tethering' | 'Ethernet Bridge';
}

export interface HotspotPackage {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  durationLabel: string;
  dataLimitMb: number | null; // null = unlimited
  bandwidthLimitMbps: number;
  description: string;
  popular?: boolean;
}

export interface AuthenticatedSession {
  sessionId: string;
  clientIp: string;
  clientMac: string;
  deviceName: string;
  packageId: string;
  packageName: string;
  startedAt: number;
  expiresAt: number;
  status: 'active' | 'expired' | 'disconnected';
  dataUsedMb: number;
  token: string;
}

export interface HotspotClient {
  id: string;
  hostname: string;
  ip: string;
  mac: string;
  vendor: string;
  connectionType: 'Wi-Fi 6' | 'USB Tether' | 'Ethernet';
  signalDbm: number;
  signalPercent: number;
  dataUsageMb: number;
  isBlocked: boolean;
  connectedDuration: string;
  pingMs: number;
  packageActive?: string;
  sessionRemainingSeconds?: number;
  sessionStatus?: 'active' | 'guest_pending' | 'disconnected';
}
