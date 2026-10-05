import { SubnetCalcResult } from '../types/network';

function intToIpv4(int: number): string {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255
  ].join('.');
}

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function toBinary8(num: number): string {
  return (num >>> 0).toString(2).padStart(8, '0');
}

function ipToBinary(ip: string): string {
  return ip.split('.').map(o => toBinary8(parseInt(o, 10))).join('.');
}

export function calculateSubnet(input: string): SubnetCalcResult {
  const trimmed = input.trim();
  let ipPart = trimmed;
  let cidrPart = 24;

  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    ipPart = parts[0].trim();
    const parsedCidr = parseInt(parts[1], 10);
    if (!isNaN(parsedCidr) && parsedCidr >= 0 && parsedCidr <= 32) {
      cidrPart = parsedCidr;
    } else {
      return makeErrorResult(ipPart, cidrPart, 'Invalid CIDR prefix length (must be 0-32).');
    }
  }

  // Validate IP
  const octets = ipPart.split('.');
  if (octets.length !== 4) {
    return makeErrorResult(ipPart, cidrPart, 'Invalid IPv4 address format (e.g. 192.168.1.0).');
  }

  for (const octet of octets) {
    if (!/^\d+$/.test(octet)) {
      return makeErrorResult(ipPart, cidrPart, 'Octets must contain digits only.');
    }
    const val = parseInt(octet, 10);
    if (val < 0 || val > 255) {
      return makeErrorResult(ipPart, cidrPart, 'Octet value out of range (0-255).');
    }
  }

  const ipInt = ipv4ToInt(ipPart);
  const maskInt = cidrPart === 0 ? 0 : ((0xFFFFFFFF << (32 - cidrPart)) >>> 0);
  const wildcardInt = (~maskInt) >>> 0;

  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;

  const networkAddress = intToIpv4(networkInt);
  const broadcastAddress = intToIpv4(broadcastInt);
  const subnetMask = intToIpv4(maskInt);
  const wildcardMask = intToIpv4(wildcardInt);

  const totalHosts = Math.pow(2, 32 - cidrPart);
  let usableHosts = 0;
  let usableHostRange = 'N/A';

  if (cidrPart === 32) {
    usableHosts = 1;
    usableHostRange = networkAddress;
  } else if (cidrPart === 31) {
    usableHosts = 2;
    usableHostRange = `${networkAddress} - ${broadcastAddress} (RFC 3021 P2P)`;
  } else if (cidrPart <= 30) {
    usableHosts = totalHosts - 2;
    const firstHost = intToIpv4(networkInt + 1);
    const lastHost = intToIpv4(broadcastInt - 1);
    usableHostRange = `${firstHost} - ${lastHost}`;
  }

  // Classify
  const firstOctet = parseInt(octets[0], 10);
  let ipClass = 'Class A';
  if (firstOctet >= 128 && firstOctet <= 191) ipClass = 'Class B';
  else if (firstOctet >= 192 && firstOctet <= 223) ipClass = 'Class C';
  else if (firstOctet >= 224 && firstOctet <= 239) ipClass = 'Class D (Multicast)';
  else if (firstOctet >= 240 && firstOctet <= 255) ipClass = 'Class E (Experimental)';

  // RFC Scope
  let ipType: SubnetCalcResult['ipType'] = 'Public Internet';
  if (firstOctet === 10) ipType = 'Private (RFC 1918)';
  else if (firstOctet === 172 && parseInt(octets[1], 10) >= 16 && parseInt(octets[1], 10) <= 31) ipType = 'Private (RFC 1918)';
  else if (firstOctet === 192 && parseInt(octets[1], 10) === 168) ipType = 'Private (RFC 1918)';
  else if (firstOctet === 127) ipType = 'Loopback';
  else if (firstOctet === 169 && parseInt(octets[1], 10) === 254) ipType = 'Link-Local';
  else if (firstOctet >= 224 && firstOctet <= 239) ipType = 'Multicast';

  const hexMask = '0x' + maskInt.toString(16).toUpperCase().padStart(8, '0');

  return {
    ip: ipPart,
    cidr: cidrPart,
    subnetMask,
    wildcardMask,
    networkAddress,
    broadcastAddress,
    usableHostRange,
    totalHosts,
    usableHosts,
    ipClass,
    ipType,
    binaryIp: ipToBinary(ipPart),
    binaryMask: ipToBinary(subnetMask),
    hexMask,
    isValid: true
  };
}

function makeErrorResult(ip: string, cidr: number, error: string): SubnetCalcResult {
  return {
    ip: ip || '192.168.1.0',
    cidr: cidr || 24,
    subnetMask: '255.255.255.0',
    wildcardMask: '0.0.0.255',
    networkAddress: '0.0.0.0',
    broadcastAddress: '0.0.0.0',
    usableHostRange: 'Invalid Input',
    totalHosts: 0,
    usableHosts: 0,
    ipClass: 'N/A',
    ipType: 'Private (RFC 1918)',
    binaryIp: '',
    binaryMask: '',
    hexMask: '0x00000000',
    isValid: false,
    error
  };
}

export function isIpInSubnet(testIp: string, networkAddress: string, cidr: number): boolean {
  try {
    const testInt = ipv4ToInt(testIp);
    const netInt = ipv4ToInt(networkAddress);
    const mask = cidr === 0 ? 0 : ((0xFFFFFFFF << (32 - cidr)) >>> 0);
    return (testInt & mask) === (netInt & mask);
  } catch {
    return false;
  }
}
