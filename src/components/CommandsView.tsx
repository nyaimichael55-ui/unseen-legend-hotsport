import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  Search, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  Monitor, 
  Code2,
  Command
} from 'lucide-react';
import { CliCommand, CommandCategory, OsType } from '../types/network';
import { COMMAND_DATABASE } from '../utils/commandDatabase';

interface CommandsViewProps {
  onLogActivity: (title: string, description: string, category: 'command', status: 'success' | 'warning' | 'info') => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

export const CommandsView: React.FC<CommandsViewProps> = ({ onLogActivity, onShowToast }) => {
  const [selectedOs, setSelectedOs] = useState<OsType | 'all'>('linux');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<CommandCategory | 'all'>('all');
  const [expandedOutputId, setExpandedOutputId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const categories: { id: CommandCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'dns', label: 'DNS' },
    { id: 'ports', label: 'Ports' },
    { id: 'interfaces', label: 'Interfaces' },
    { id: 'routing', label: 'Routing' },
    { id: 'packet_analysis', label: 'Packets' },
    { id: 'firewall', label: 'Firewall' }
  ];

  const filteredCommands = COMMAND_DATABASE.filter(cmd => {
    if (selectedOs !== 'all' && !cmd.os.includes(selectedOs)) {
      return false;
    }
    if (selectedCategory !== 'all' && cmd.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = cmd.title.toLowerCase().includes(q);
      const matchCmd = cmd.command.toLowerCase().includes(q);
      const matchDesc = cmd.description.toLowerCase().includes(q);
      const matchFlags = cmd.flags.some(f => f.flag.toLowerCase().includes(q) || f.meaning.toLowerCase().includes(q));
      if (!matchTitle && !matchCmd && !matchDesc && !matchFlags) {
        return false;
      }
    }
    return true;
  });

  const handleCopyCommand = (cmd: CliCommand) => {
    navigator.clipboard.writeText(cmd.command);
    setCopiedId(cmd.id);
    onLogActivity(
      `Copied CLI Command: ${cmd.title}`,
      `Syntax "${cmd.command}" copied to clipboard.`,
      'command',
      'success'
    );
    onShowToast(`Copied "${cmd.command}" to clipboard`, 'success');
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleOutput = (id: string) => {
    setExpandedOutputId(expandedOutputId === id ? null : id);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & Controls Hub */}
      <div className="rounded-xl bg-[#111827] border border-white/[0.08] p-5 shadow-sm space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-slate-300" />
              <span>Network Engineering CLI Reference</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Production-tested commands with syntax tokens and simulated stdout output.
            </p>
          </div>

          {/* Segmented OS Selector Tabs */}
          <div className="flex items-center gap-0.5 p-0.5 bg-[#090D16] rounded-md border border-white/[0.08] self-start md:self-auto">
            <button
              onClick={() => setSelectedOs('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-all duration-150 ${
                selectedOs === 'all'
                  ? 'bg-white/[0.08] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedOs('linux')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-all duration-150 flex items-center gap-1 ${
                selectedOs === 'linux'
                  ? 'bg-white/[0.08] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3 h-3" />
              <span>Linux</span>
            </button>
            <button
              onClick={() => setSelectedOs('windows')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-all duration-150 flex items-center gap-1 ${
                selectedOs === 'windows'
                  ? 'bg-white/[0.08] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span>PowerShell</span>
            </button>
            <button
              onClick={() => setSelectedOs('macos')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-all duration-150 flex items-center gap-1 ${
                selectedOs === 'macos'
                  ? 'bg-white/[0.08] text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>macOS</span>
            </button>
          </div>
        </div>

        {/* Search Bar with Shortcut Hint Badge + Category Segmented Control */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 pt-1">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search commands, flags, or tasks (e.g. dig, ss, netstat, trace)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#090D16] border border-white/[0.08] rounded-lg pl-9 pr-16 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white/[0.25] transition-colors font-mono"
            />
            {/* Keyboard shortcut hint badge */}
            <div className="absolute right-2.5 top-2 flex items-center gap-1">
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono text-slate-500 bg-white/[0.03] border border-white/[0.08] rounded">
                  <Command className="w-2.5 h-2.5" /> K
                </kbd>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all duration-150 border ${
                  selectedCategory === cat.id
                    ? 'bg-white/[0.08] border-white/[0.14] text-white'
                    : 'bg-[#090D16] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-white/[0.12]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Commands Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
          <span>{filteredCommands.length} commands matched</span>
          <span className="font-mono text-[11px]">Instant Filter</span>
        </div>

        {filteredCommands.length === 0 ? (
          <div className="rounded-xl bg-[#111827] border border-white/[0.08] p-10 text-center space-y-2.5">
            <Terminal className="w-6 h-6 text-slate-600 mx-auto" />
            <h4 className="text-xs font-medium text-slate-300">No matching commands</h4>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Try adjusting your query or toggle to "All" platforms.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedOs('all'); }}
              className="px-3 py-1 rounded bg-white/[0.05] text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredCommands.map(cmd => {
            const isCopied = copiedId === cmd.id;
            const isOutputOpen = expandedOutputId === cmd.id;

            return (
              <div 
                key={cmd.id}
                className="rounded-xl bg-[#111827] border border-white/[0.08] p-4 hover:border-white/[0.14] transition-all duration-150 ease-in-out shadow-sm"
              >
                {/* Title & Metadata Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-200">
                      {cmd.title}
                    </h3>

                    {/* Platform Tags */}
                    <div className="flex items-center gap-1">
                      {cmd.os.map(osName => (
                        <span 
                          key={osName}
                          className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-[#090D16] text-slate-500 border border-white/[0.08]"
                        >
                          {osName}
                        </span>
                      ))}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 bg-white/[0.03] px-1.5 py-0.2 rounded border border-white/[0.08] capitalize self-start sm:self-auto">
                    {cmd.category.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-2.5 leading-relaxed">
                  {cmd.description}
                </p>

                {/* Code Snippet Box with distinct dark background */}
                <div className="rounded-lg bg-[#090D16] border border-white/[0.08] p-2.5 sm:p-3 flex items-center justify-between gap-2.5 overflow-hidden">
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-none font-mono text-xs text-slate-200 min-w-0">
                    <span className="text-slate-600 select-none">$</span>
                    <code className="whitespace-nowrap">
                      {cmd.command}
                    </code>
                  </div>

                  {/* Copy Button with smooth transition to green Copied state */}
                  <button
                    onClick={() => handleCopyCommand(cmd)}
                    className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all duration-150 ease-in-out active:scale-95 ${
                      isCopied
                        ? 'bg-emerald-500 text-slate-950 font-semibold'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08]'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Flags Breakdown */}
                {cmd.flags.length > 0 && (
                  <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-white/[0.04]">
                    {cmd.flags.map((f, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs">
                        <span className="font-mono text-slate-300 font-medium shrink-0 bg-[#090D16] px-1 py-0.2 rounded border border-white/[0.08] text-[10px]">
                          {f.flag}
                        </span>
                        <span className="text-slate-400 text-[11px] leading-snug">
                          {f.meaning}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Output Simulation Drawer Toggle */}
                <div className="mt-2.5 pt-1.5 flex items-center justify-between">
                  <button
                    onClick={() => toggleOutput(cmd.id)}
                    className="text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                  >
                    <Code2 className="w-3 h-3" />
                    <span>{isOutputOpen ? 'Hide Terminal Simulation' : 'Simulate Output'}</span>
                    {isOutputOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  <span className="text-[10px] text-slate-500 font-mono">
                    POSIX exit 0
                  </span>
                </div>

                {/* Output Simulation Body */}
                {isOutputOpen && (
                  <div className="mt-2 rounded-lg bg-[#090D16] border border-white/[0.08] p-3 font-mono text-[11px] text-slate-300 overflow-x-auto">
                    <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-white/[0.06] text-slate-500 text-[10px]">
                      <span>stdout buffer</span>
                      <span>UTF-8</span>
                    </div>
                    <pre className="whitespace-pre leading-relaxed text-slate-300">
                      {cmd.sampleOutput}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
