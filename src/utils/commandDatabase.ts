import { CliCommand } from '../types/network';

export const COMMAND_DATABASE: CliCommand[] = [
  // DNS OPERATIONS
  {
    id: 'dns-dig-short',
    title: 'DNS Resolution & Record Query (Short)',
    category: 'dns',
    os: ['linux', 'macos'],
    command: 'dig +short A cloudflare.com @1.1.1.1',
    description: 'Queries an upstream DNS server for IPv4 addresses of a domain, returning only clean IP records without verbose headers.',
    flags: [
      { flag: '+short', meaning: 'Suppress header, question, and authority sections, displaying answers only' },
      { flag: 'A', meaning: 'Specifies IPv4 address record type query' },
      { flag: '@1.1.1.1', meaning: 'Directs the query explicitly to Cloudflare public DNS resolver' }
    ],
    sampleOutput: `104.16.132.229\n104.16.133.229`
  },
  {
    id: 'dns-dig-trace',
    title: 'Iterative Root-to-Leaf DNS Trace',
    category: 'dns',
    os: ['linux', 'macos'],
    command: 'dig +trace google.com',
    description: 'Follows recursive DNS delegation from the Internet root name servers (.root-servers.net) through TLD down to authoritative name servers.',
    flags: [
      { flag: '+trace', meaning: 'Enables hierarchical recursive delegation tracing from root servers' }
    ],
    sampleOutput: `.                       518400  IN      NS      a.root-servers.net.\ncom.                    172800  IN      NS      a.gtld-servers.net.\ngoogle.com.             172800  IN      NS      ns1.google.com.\ngoogle.com.             300     IN      A       142.250.180.206`
  },
  {
    id: 'dns-resolvectl-linux',
    title: 'Systemd DNS Resolver Status & Cache',
    category: 'dns',
    os: ['linux'],
    command: 'resolvectl status',
    description: 'Displays systemd-resolved active per-link DNS servers, search domains, DNSSEC enforcement, and current upstream resolver on modern Linux systems.',
    flags: [
      { flag: 'status', meaning: 'Outputs global and per-interface DNS configurations and upstream IP addresses' }
    ],
    sampleOutput: `Global\n       Protocols: -LLMNR -mDNS -DNSOverTLS DNSSEC=no/unsupported\nLink 2 (eth0)\n    Current Scopes: DNS\n         Protocols: +DefaultRoute +LLMNR -mDNS -DNSOverTLS\nCurrent DNS Server: 1.1.1.1\n       DNS Servers: 1.1.1.1 8.8.8.8`
  },
  {
    id: 'dns-nslookup-windows',
    title: 'Query Authoritative Name Server',
    category: 'dns',
    os: ['windows'],
    command: 'nslookup -type=MX github.com 8.8.8.8',
    description: 'Performs DNS query via Windows nslookup to resolve Mail Exchange (MX) records for a target domain using Google Public DNS.',
    flags: [
      { flag: '-type=MX', meaning: 'Filters query for Mail Exchanger records' },
      { flag: '8.8.8.8', meaning: 'Forces lookup through Google Public DNS instead of default adapter DNS' }
    ],
    sampleOutput: `Server:  dns.google\nAddress:  8.8.8.8\n\nNon-authoritative answer:\ngithub.com   MX preference = 1, mail exchanger = aspmx.l.google.com\ngithub.com   MX preference = 5, mail exchanger = alt1.aspmx.l.google.com`
  },
  {
    id: 'dns-flush-windows',
    title: 'Flush & Display Client Resolver Cache',
    category: 'dns',
    os: ['windows'],
    command: 'ipconfig /flushdns',
    description: 'Purges the local Windows DNS Client resolver cache to invalidate stale A/AAAA records after records update or during DNS triage.',
    flags: [
      { flag: '/flushdns', meaning: 'Clears and resets the contents of the DNS client resolver cache' }
    ],
    sampleOutput: `Windows IP Configuration\n\nSuccessfully flushed the DNS Resolver Cache.`
  },
  {
    id: 'dns-flush-macos',
    title: 'Flush macOS mDNSResponder Cache',
    category: 'dns',
    os: ['macos'],
    command: 'sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder',
    description: 'Clears the DirectoryService cache and sends SIGHUP to mDNSResponder on macOS Monterey, Ventura, and Sonoma to flush DNS.',
    flags: [
      { flag: '-flushcache', meaning: 'Initiates immediate cache eviction on DirectoryService daemon' },
      { flag: '-HUP', meaning: 'Instructs mDNSResponder to reload configuration and empty active sockets' }
    ],
    sampleOutput: `[Cache invalidated: mDNSResponder restarted with PID 43108]`
  },

  // PORT SCANNING & ACTIVE SOCKETS
  {
    id: 'port-ss-linux',
    title: 'Inspect Listening Sockets & Processes (ss)',
    category: 'ports',
    os: ['linux'],
    command: 'ss -tulpn',
    description: 'Modern high-speed socket statistics utility that lists all TCP and UDP listening ports with their corresponding process names and PIDs.',
    flags: [
      { flag: '-t', meaning: 'Display TCP sockets' },
      { flag: '-u', meaning: 'Display UDP sockets' },
      { flag: '-l', meaning: 'Display only listening sockets' },
      { flag: '-p', meaning: 'Show process using socket (requires root or sudo)' },
      { flag: '-n', meaning: 'Do not resolve service names; show numeric ports' }
    ],
    sampleOutput: `Netid State  Recv-Q Send-Q  Local Address:Port   Peer Address:Port  Process\ntcp   LISTEN 0      128           0.0.0.0:22          0.0.0.0:*      users:(("sshd",pid=842,fd=3))\ntcp   LISTEN 0      511         127.0.0.1:8080        0.0.0.0:*      users:(("node",pid=14502,fd=19))\ntcp   LISTEN 0      128           0.0.0.0:443         0.0.0.0:*      users:(("nginx",pid=1120,fd=7))`
  },
  {
    id: 'port-netstat-windows',
    title: 'Active TCP/UDP Connections & Owning PID',
    category: 'ports',
    os: ['windows'],
    command: 'netstat -ano -p tcp',
    description: 'Queries active TCP sockets, connection states (LISTENING, ESTABLISHED, TIME_WAIT), and prints the owning Process Identifier (PID).',
    flags: [
      { flag: '-a', meaning: 'Displays all active connections and listening ports' },
      { flag: '-n', meaning: 'Displays addresses and port numbers in numerical form' },
      { flag: '-o', meaning: 'Displays the owning process ID associated with each connection' },
      { flag: '-p tcp', meaning: 'Filters protocol to TCP only' }
    ],
    sampleOutput: `Active Connections\n  Proto  Local Address          Foreign Address        State           PID\n  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       1044\n  TCP    0.0.0.0:445            0.0.0.0:0              LISTENING       4\n  TCP    192.168.1.108:52410    52.183.21.44:443       ESTABLISHED     8292`
  },
  {
    id: 'port-getnet-powershell',
    title: 'Query Established TCP Connections (PowerShell)',
    category: 'ports',
    os: ['windows'],
    command: 'Get-NetTCPConnection -State Established | Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, OwningProcess',
    description: 'Modern PowerShell cmdlet to query TCP connections with structured object output, ideal for scripting and filtering rogue remote endpoints.',
    flags: [
      { flag: '-State Established', meaning: 'Filters socket state for established TCP handshakes only' },
      { flag: 'Select-Object', meaning: 'Projects specific network telemetry columns' }
    ],
    sampleOutput: `LocalAddress  LocalPort RemoteAddress RemotePort OwningProcess\n------------  --------- ------------- ---------- -------------\n192.168.1.108     51480 142.250.180.3        443          6120\n192.168.1.108     51512 104.16.132.229       443          9488`
  },
  {
    id: 'port-lsof-macos',
    title: 'Audit Listening Ports & Open Files (lsof)',
    category: 'ports',
    os: ['macos', 'linux'],
    command: 'lsof -iTCP -sTCP:LISTEN -P -n',
    description: 'Lists all open TCP sockets in LISTEN state on macOS with process names, avoiding reverse DNS and service name lookups for maximum speed.',
    flags: [
      { flag: '-iTCP', meaning: 'Filters file descriptors for TCP network files' },
      { flag: '-sTCP:LISTEN', meaning: 'Restricts output to listening server sockets' },
      { flag: '-P', meaning: 'Inhibits conversion of port numbers to service names' },
      { flag: '-n', meaning: 'Inhibits conversion of network numbers to hostnames' }
    ],
    sampleOutput: `COMMAND   PID USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME\nnode     2481 dev    23u  IPv6 0xa8c2...      0t0  TCP *:3000 (LISTEN)\nssh-agent 391 root    4u  IPv4 0xa8c3...      0t0  TCP 127.0.0.1:22 (LISTEN)`
  },
  {
    id: 'port-nmap-syn',
    title: 'Stealth SYN Scan for Top Common Ports',
    category: 'ports',
    os: ['linux', 'macos'],
    command: 'nmap -sS -T4 --top-ports 100 -v 192.168.1.1',
    description: 'Performs a half-open TCP SYN scan against the default gateway or remote host across the top 100 most critical ports with timing template 4.',
    flags: [
      { flag: '-sS', meaning: 'TCP SYN half-open stealth scan without completing 3-way handshake' },
      { flag: '-T4', meaning: 'Aggressive timing template for faster local network scanning' },
      { flag: '--top-ports 100', meaning: 'Scans the top 100 most common service ports' },
      { flag: '-v', meaning: 'Increases scan verbosity level' }
    ],
    sampleOutput: `PORT     STATE SERVICE\n53/tcp   open  domain\n80/tcp   open  http\n443/tcp  open  https\n8080/tcp open  http-proxy\nNmap done: 1 IP address (1 host up) scanned in 0.42 seconds`
  },

  // INTERFACE CONFIGURATIONS
  {
    id: 'iface-ip-addr-brief',
    title: 'Concise Interface IP & Link Status',
    category: 'interfaces',
    os: ['linux'],
    command: 'ip -br addr show',
    description: 'Prints a clean one-line tabular summary of every physical and virtual network interface, link state (UP/DOWN), and assigned CIDR IPv4/IPv6 addresses.',
    flags: [
      { flag: '-br', meaning: 'Brief format output' },
      { flag: 'addr show', meaning: 'Shows addresses assigned to all network links' }
    ],
    sampleOutput: `lo               UNKNOWN        127.0.0.1/8 ::1/128 \neth0             UP             192.168.1.108/24 2601:647:.../64 \nwlan0            DOWN           `
  },
  {
    id: 'iface-ip-link-stats',
    title: 'Interface Errors, Drops & Frame Collisions',
    category: 'interfaces',
    os: ['linux'],
    command: 'ip -s link show eth0',
    description: 'Extracts detailed kernel-level RX/TX packet counts, transmission errors, dropped packets, overruns, and frame collision metrics on a network adapter.',
    flags: [
      { flag: '-s', meaning: 'Displays cumulative interface statistics' },
      { flag: 'link show', meaning: 'Specifies physical/link layer device attributes' }
    ],
    sampleOutput: `2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP mode DEFAULT\n    RX:  bytes packets errors dropped missed mcast\n    841920194 624108      0       0      0  1412\n    TX:  bytes packets errors dropped carrier collsns\n    149182310 398112      0       0      0       0`
  },
  {
    id: 'iface-ipconfig-all',
    title: 'Full Network Adapter Configuration',
    category: 'interfaces',
    os: ['windows'],
    command: 'ipconfig /all',
    description: 'Displays complete TCP/IP configuration for all adapters including physical MAC address, DHCP server lease expiration, DNS suffix list, and NetBIOS state.',
    flags: [
      { flag: '/all', meaning: 'Displays comprehensive addressing, DHCP lease and DNS server parameters' }
    ],
    sampleOutput: `Ethernet adapter vEthernet (Default Switch):\n   Connection-specific DNS Suffix  . :\n   Description . . . . . . . . . . . : Hyper-V Virtual Ethernet Adapter\n   Physical Address. . . . . . . . . : 00-15-5D-82-41-09\n   DHCP Enabled. . . . . . . . . . . : No\n   IPv4 Address. . . . . . . . . . . : 172.24.16.1(Preferred)\n   Subnet Mask . . . . . . . . . . . : 255.255.240.0\n   Default Gateway . . . . . . . . . : 172.24.16.254`
  },
  {
    id: 'iface-networksetup-macos',
    title: 'Inspect Wi-Fi Hardware & IP Config',
    category: 'interfaces',
    os: ['macos'],
    command: 'networksetup -getinfo "Wi-Fi"',
    description: 'Queries macOS CoreWLAN and SystemConfiguration framework for IP address, subnet mask, router gateway, and hardware MAC address on Wi-Fi interface.',
    flags: [
      { flag: '-getinfo', meaning: 'Prints IP, subnet, router, and client identification details' }
    ],
    sampleOutput: `IP address: 192.168.1.108\nSubnet mask: 255.255.255.0\nRouter: 192.168.1.1\nClient ID: \nIPv6: Automatic`
  },

  // ROUTE TRACING & PATH ANALYSIS
  {
    id: 'route-mtr-linux',
    title: 'My Traceroute (MTR) Real-Time Path Diagnostic',
    category: 'routing',
    os: ['linux', 'macos'],
    command: 'mtr --report --report-cycles=10 -n 1.1.1.1',
    description: 'Combines the functionality of traceroute and ping into a single network diagnostic tool, calculating packet loss and latency at each intermediate router hop.',
    flags: [
      { flag: '--report', meaning: 'Runs MTR in non-interactive batch mode and outputs a summary report' },
      { flag: '--report-cycles=10', meaning: 'Sends 10 probe packets to each hop before outputting statistics' },
      { flag: '-n', meaning: 'Displays raw numerical IP addresses without reverse DNS lookups' }
    ],
    sampleOutput: `HOST: netpulse-box            Loss%   Snt   Last   Avg  Best  Wrst StDev\n  1.|-- 192.168.1.1             0.0%    10    0.8   0.9   0.7   1.4   0.2\n  2.|-- 10.24.0.1               0.0%    10    6.4   7.1   5.9  11.2   1.5\n  3.|-- 96.120.14.89            0.0%    10   12.1  13.4  11.8  18.0   1.8\n  4.|-- 1.1.1.1                 0.0%    10   14.2  14.5  13.9  16.1   0.6`
  },
  {
    id: 'route-traceroute-icmp',
    title: 'Trace Route Using ICMP Echo (Bypass UDP Filters)',
    category: 'routing',
    os: ['linux'],
    command: 'traceroute -I -m 20 8.8.8.8',
    description: 'Performs packet path tracing using ICMP ECHO datagrams instead of default UDP probes, bypassing strict enterprise firewalls that drop high UDP ports.',
    flags: [
      { flag: '-I', meaning: 'Use ICMP ECHO for probe packets instead of high UDP ports' },
      { flag: '-m 20', meaning: 'Sets maximum Time-To-Live (hops) to 20' }
    ],
    sampleOutput: `traceroute to 8.8.8.8 (8.8.8.8), 20 hops max, 60 byte packets\n 1  192.168.1.1 (192.168.1.1)  0.781 ms  0.720 ms  0.688 ms\n 2  10.24.0.1 (10.24.0.1)  6.812 ms  7.104 ms  6.942 ms\n 3  dns.google (8.8.8.8)  15.201 ms  15.118 ms  15.089 ms`
  },
  {
    id: 'route-tracert-windows',
    title: 'Trace Route via Windows tracert',
    category: 'routing',
    os: ['windows'],
    command: 'tracert -d -h 15 1.1.1.1',
    description: 'Determines the path taken to a destination by sending ICMP Echo Request messages to the destination with incrementing TTL values.',
    flags: [
      { flag: '-d', meaning: 'Prevents tracert from attempting to resolve IP addresses to hostnames' },
      { flag: '-h 15', meaning: 'Maximum number of hops to search for the target' }
    ],
    sampleOutput: `Tracing route to 1.1.1.1 over a maximum of 15 hops\n\n  1    <1 ms    <1 ms    <1 ms  192.168.1.1\n  2     7 ms     6 ms     7 ms  10.24.0.1\n  3    14 ms    13 ms    14 ms  1.1.1.1\n\nTrace complete.`
  },
  {
    id: 'route-table-linux',
    title: 'Display Kernel IP Routing Table',
    category: 'routing',
    os: ['linux'],
    command: 'ip route show',
    description: 'Prints current kernel routing table including default gateway metric, subnet interfaces, and source routing policies.',
    flags: [
      { flag: 'route show', meaning: 'Outputs all active routes installed in the main routing table' }
    ],
    sampleOutput: `default via 192.168.1.1 dev eth0 proto dhcp src 192.168.1.108 metric 100 \n192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.108 metric 100`
  },

  // PACKET ANALYSIS & TRIAGE
  {
    id: 'packet-tcpdump-dns',
    title: 'Capture Live DNS Requests & Responses (tcpdump)',
    category: 'packet_analysis',
    os: ['linux', 'macos'],
    command: 'sudo tcpdump -nn -i any -c 20 "udp port 53 or tcp port 53"',
    description: 'Captures and decodes the next 20 DNS protocol packets across all interfaces, displaying queried domains and resolved answers in real time.',
    flags: [
      { flag: '-nn', meaning: 'Do not resolve host addresses or port numbers to human names' },
      { flag: '-i any', meaning: 'Listen on all active network interfaces simultaneously' },
      { flag: '-c 20', meaning: 'Exit after capturing 20 matching packets' },
      { flag: '"udp port 53"', meaning: 'Berkeley Packet Filter (BPF) matching DNS traffic' }
    ],
    sampleOutput: `14:02:18.109201 IP 192.168.1.108.53204 > 1.1.1.1.53: 12048+ A? api.github.com. (32)\n14:02:18.123490 IP 1.1.1.1.53 > 192.168.1.108.53204: 12048 1/0/0 A 140.82.121.6 (48)`
  },
  {
    id: 'packet-tcpdump-syn',
    title: 'Detect TCP SYN Floods & Connection Probes',
    category: 'packet_analysis',
    os: ['linux', 'macos'],
    command: 'sudo tcpdump -i eth0 -n "tcp[tcpflags] & (tcp-syn) != 0 and tcp[tcpflags] & (tcp-ack) == 0"',
    description: 'Filters incoming network traffic for raw TCP SYN packets without ACK flag set, isolating initial connection handshakes and port probes.',
    flags: [
      { flag: '-i eth0', meaning: 'Captures on eth0 interface' },
      { flag: '-n', meaning: 'No DNS lookups on source/destination addresses' }
    ],
    sampleOutput: `14:04:01.401209 IP 198.51.100.4.49201 > 192.168.1.108.22: Flags [S], seq 3910241, win 64240, options [mss 1460]`
  },
  {
    id: 'packet-pktmon-windows',
    title: 'Windows Native Packet Monitor (pktmon)',
    category: 'packet_analysis',
    os: ['windows'],
    command: 'pktmon start --etw -p 0 --comp nics',
    description: 'Starts low-overhead Windows kernel-level packet monitoring to inspect dropped packets, adapter bindings, and protocol stacks without Wireshark.',
    flags: [
      { flag: 'start --etw', meaning: 'Begins packet capture session logged to ETW circular buffer' },
      { flag: '--comp nics', meaning: 'Limits monitoring to physical Network Interface Cards' }
    ],
    sampleOutput: `Processing counters... \nPackets captured: 1482 \nPackets dropped: 0 \nLogging to PktMon.etl`
  },

  // FIREWALL & CONNECTIVITY RULES
  {
    id: 'fw-ufw-status',
    title: 'Inspect UFW Firewall Rules (Numbered)',
    category: 'firewall',
    os: ['linux'],
    command: 'sudo ufw status numbered',
    description: 'Displays the active rules on Ubuntu/Debian Uncomplicated Firewall with corresponding index numbers for precise deletion or insertion.',
    flags: [
      { flag: 'status numbered', meaning: 'Prints rules prefixed by [ 1], [ 2] index identifiers' }
    ],
    sampleOutput: `Status: active\n\n     To                         Action      From\n     --                         ------      ----\n[ 1] 22/tcp                     ALLOW IN    Anywhere\n[ 2] 80,443/tcp                 ALLOW IN    Anywhere\n[ 3] 53                         ALLOW IN    192.168.1.0/24`
  },
  {
    id: 'fw-windows-netsh',
    title: 'Audit Windows Defender Firewall State',
    category: 'firewall',
    os: ['windows'],
    command: 'netsh advfirewall show allprofiles state',
    description: 'Queries whether Domain, Private, and Public network firewall profiles are actively filtering inbound and outbound connections.',
    flags: [
      { flag: 'show allprofiles', meaning: 'Enumerates DomainProfile, PrivateProfile, and PublicProfile' }
    ],
    sampleOutput: `Domain Profile Settings:\n----------------------------------------------------------------------\nState                                 ON\n\nPrivate Profile Settings:\n----------------------------------------------------------------------\nState                                 ON\n\nPublic Profile Settings:\n----------------------------------------------------------------------\nState                                 ON`
  }
];
