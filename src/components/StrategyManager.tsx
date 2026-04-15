import React, { useState, useMemo } from 'react';
import { Zap, Play, Pause, Settings2, BarChart3, Brain, Target, Shield, TrendingUp, Search, Bot, Info, Clock, Activity, ChevronUp, ChevronDown } from 'lucide-react';
import { Strategy, Currency, Stats, TargetWallet } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const Tooltip = ({ content, children }: TooltipProps) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 border border-white/10 rounded-lg shadow-2xl text-[10px] text-gray-300 leading-relaxed font-sans animate-in fade-in slide-in-from-bottom-1">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
};

interface StrategyManagerProps {
  strategies: Strategy[];
  onToggle: (id: string, status: 'active' | 'paused') => void;
  currency: Currency;
  ethPrice: number;
  stats: (Stats & { ethPrice: number }) | null;
  targetWallets: TargetWallet[];
  onUpdateConfig: (id: string, config: Partial<Strategy['config']>) => void;
}

type SortKey = keyof TargetWallet;

export default function StrategyManager({ strategies, onToggle, currency, ethPrice, stats, targetWallets, onUpdateConfig }: StrategyManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editConfig, setEditConfig] = useState<Partial<Strategy['config']>>({});

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'profitPerTrade',
    direction: 'desc'
  });

  const sortedWallets = useMemo(() => {
    const sortable = [...targetWallets];
    sortable.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortable;
  }, [targetWallets, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleEdit = (strategy: Strategy) => {
    setEditingId(strategy.id);
    setEditConfig({ ...strategy.config });
  };

  const handleSave = (id: string) => {
    onUpdateConfig(id, editConfig);
    setEditingId(null);
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column) return <BarChart3 className="w-2 h-2 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-2 h-2 text-blue-400" /> : <ChevronDown className="w-2 h-2 text-blue-400" />;
  };

  const formatVal = (val: number) => {
    if (currency === 'USD') return `$${(val * ethPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `${val.toFixed(4)} ETH`;
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Target className="w-6 h-6 text-pink-500" />
          Forged Intelligence Dashboard
        </h2>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live Forging Active</span>
        </div>
      </div>

      {/* Wallet Strategies: Forged Intelligence Panel - MOVED UP */}
      <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-white/5 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2 uppercase tracking-widest">
            <Search className="w-4 h-4 text-blue-500" />
            Elite Wallet Targets
            <Tooltip content="Real-time performance tracking of elite wallets currently being forged by AlphaMark.">
              <Info className="w-3 h-3 text-gray-600 cursor-help" />
            </Tooltip>
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase">MEV Resistant Only</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/30">
                <th 
                  className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:text-white transition-colors"
                  onClick={() => requestSort('label')}
                >
                  <div className="flex items-center gap-1">Target Wallet <SortIcon column="label" /></div>
                </th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Wallet Address</th>
                <th 
                  className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer group hover:text-white transition-colors"
                  onClick={() => requestSort('chain')}
                >
                  <div className="flex items-center gap-1">Chain <SortIcon column="chain" /></div>
                </th>
                <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Strategies</th>
                <th 
                  className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right cursor-pointer group hover:text-white transition-colors"
                  onClick={() => requestSort('profitPerTrade')}
                >
                  <div className="flex items-center justify-end gap-1">Profit/Trade <SortIcon column="profitPerTrade" /></div>
                </th>
                <th 
                  className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right cursor-pointer group hover:text-white transition-colors"
                  onClick={() => requestSort('tradesPerHour')}
                >
                  <div className="flex items-center justify-end gap-1">Trades/Hr <SortIcon column="tradesPerHour" /></div>
                </th>
                <th 
                  className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right cursor-pointer group hover:text-white transition-colors"
                  onClick={() => requestSort('totalProfitDay')}
                >
                  <div className="flex items-center justify-end gap-1">Profit/Day <SortIcon column="totalProfitDay" /></div>
                </th>
                <th 
                  className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right cursor-pointer group hover:text-white transition-colors"
                  onClick={() => requestSort('executionLatency')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Latency
                    <SortIcon column="executionLatency" />
                  </div>
                </th>
                <th 
                  className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right cursor-pointer group hover:text-white transition-colors"
                  onClick={() => requestSort('forgingEfficiency')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Forging Eff.
                    <SortIcon column="forgingEfficiency" />
                    <Tooltip content="Measures AlphaMark's precision in mirroring target volume. (Forged Vol / Target Vol)">
                      <Info className="w-2.5 h-2.5 text-gray-600 cursor-help" />
                    </Tooltip>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedWallets.map((tw) => (
                <tr key={tw.address} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-4">
                    <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{tw.label}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[10px] text-gray-500 font-mono bg-slate-800/50 px-2 py-0.5 rounded border border-white/5">{tw.address}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[10px] font-bold text-gray-300 uppercase">{tw.chain}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {tw.strategies.map(s => (
                        <span key={s} className="text-[8px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded uppercase">
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-xs font-bold text-emerald-400 font-mono">+{tw.profitPerTrade.toFixed(2)}Ξ</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-xs font-bold text-white">{tw.tradesPerHour}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-xs font-bold text-white font-mono">{tw.totalProfitDay}Ξ</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className={cn(
                      "text-xs font-bold font-mono",
                      tw.executionLatency < 30 ? "text-emerald-400" : "text-yellow-400"
                    )}>{tw.executionLatency}ms</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-bold text-blue-400">{tw.forgingEfficiency}%</span>
                      <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${tw.forgingEfficiency}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-800/20 border-t border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-gray-500" />
              <span className="text-[10px] text-gray-500 uppercase font-bold">Min Days Active: <span className="text-white">30d</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-gray-500" />
              <span className="text-[10px] text-gray-500 uppercase font-bold">Min Win Rate: <span className="text-white">85%</span></span>
            </div>
          </div>
          <span className="text-[9px] text-gray-600 italic font-medium uppercase tracking-tighter">
            * Precision competitive mirroring system active
          </span>
        </div>
      </div>

      {/* Active Forging Nodes Section - REPLACING OLD METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {strategies.map((strategy) => (
          <div key={strategy.id} className="space-y-4">
            <div className={cn(
              "bg-slate-900/40 backdrop-blur-sm rounded-xl p-5 border border-white/5 shadow-xl flex items-center justify-between group hover:border-blue-500/30 transition-all",
              editingId === strategy.id && "border-blue-500/50 ring-1 ring-blue-500/20"
            )}>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-lg bg-slate-800 group-hover:bg-blue-500/10 transition-colors",
                  strategy.status === 'active' ? "text-blue-400" : "text-gray-500"
                )}>
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{strategy.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{strategy.type}</span>
                    <span className="text-[10px] text-gray-700">•</span>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                      {formatVal(strategy.config.minProfitThreshold)} Min Gap
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</div>
                  <div className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    strategy.status === 'active' ? "text-emerald-500" : "text-yellow-500"
                  )}>
                    {strategy.status}
                  </div>
                </div>
                <button 
                  onClick={() => handleEdit(strategy)}
                  className={cn(
                    "p-2 hover:bg-slate-700 rounded-lg transition-all",
                    editingId === strategy.id ? "bg-blue-600 text-white" : "bg-slate-800 text-gray-400 hover:text-white"
                  )}
                >
                  <Settings2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onToggle(strategy.id, strategy.status === 'active' ? 'paused' : 'active')}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-white rounded-lg transition-all"
                >
                  {strategy.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {editingId === strategy.id && (
              <div className="bg-slate-900/60 border border-blue-500/30 rounded-xl p-5 animate-in fade-in slide-in-from-top-2 space-y-4">
                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <Settings2 className="w-3 h-3" />
                  Node Production Configuration
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                      Mainnet Contract Address
                      <Tooltip content="The deployed smart contract address that the bot will interact with for this specific strategy.">
                        <Info className="w-3 h-3 text-gray-700" />
                      </Tooltip>
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={editConfig.contractAddress || ''}
                        onChange={(e) => setEditConfig({ ...editConfig, contractAddress: e.target.value })}
                        placeholder="0x..."
                        className="flex-1 bg-slate-950/50 border border-white/10 rounded px-3 py-2 text-xs text-white font-mono placeholder:text-gray-700 focus:border-blue-500 outline-none transition-all"
                      />
                      <button 
                        onClick={() => {
                          // Suggest a standard Uniswap V3 Router or similar if empty
                          setEditConfig({ ...editConfig, contractAddress: '0xE592427A0AEce92De3Edee1F18E0157C05861564' });
                        }}
                        className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[8px] font-bold uppercase rounded border border-blue-500/20 transition-all"
                      >
                        Auto-Detect Protocol
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                      Max Bribe Percent
                      <Tooltip content="Maximum percentage of gross profit the bot is allowed to tip block builders to win the gas war.">
                        <Info className="w-3 h-3 text-gray-700" />
                      </Tooltip>
                    </label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range"
                        min="0"
                        max="70"
                        value={editConfig.maxBribePercent || 0}
                        onChange={(e) => setEditConfig({ ...editConfig, maxBribePercent: Number(e.target.value) })}
                        className="flex-1 accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-xs font-bold text-white w-8">{editConfig.maxBribePercent}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                    Hex Call Data / Strategy Payload
                    <Tooltip content="The pre-encoded hex-formatted data used to execute the specific on-chain swap or arbitrage logic.">
                      <Info className="w-3 h-3 text-gray-700" />
                    </Tooltip>
                  </label>
                  <textarea 
                    value={editConfig.callData || ''}
                    onChange={(e) => setEditConfig({ ...editConfig, callData: e.target.value })}
                    placeholder="0x..."
                    rows={2}
                    className="w-full bg-slate-950/50 border border-white/10 rounded px-3 py-2 text-[10px] text-white font-mono placeholder:text-gray-700 focus:border-blue-500 outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleSave(strategy.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded transition-all"
                  >
                    Save Configuration
                  </button>
                  <button 
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-400 text-[10px] font-bold rounded transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-white/5">
          <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-5 border border-white/5 shadow-xl">
            <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
              <Brain className="w-4 h-4 text-pink-500" />
              Neural Memory & Self-Learning
              <Tooltip content="Bot evolution progress. Higher percentage unlocks independent discovery logic.">
                <Info className="w-3 h-3 text-gray-600 cursor-help" />
              </Tooltip>
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Learning Progress</span>
                  <div className="text-2xl font-bold text-white">{stats.learningProgress.toFixed(1)}%</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Phase</span>
                  <div className="text-xs font-bold text-pink-400 uppercase tracking-widest">
                    {stats.learningProgress < 40 ? 'Forging (Shadow)' : stats.learningProgress < 80 ? 'Hybrid Adaptation' : 'Cognitive Independence'}
                  </div>
                </div>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-1000"
                  style={{ width: `${stats.learningProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed">
                AlphaMark is currently in the <span className="text-white">Forging Phase</span>, shadowing elite wallets to build its execution memory. At 100%, the bot will transition to fully independent discovery.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-5 border border-white/5 shadow-xl">
            <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-widest">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Optimal Bribe Escalation (70/30 Rule)
              <Tooltip content="Dynamic gas war strategy ensuring AlphaMark retains 30% of gross profit.">
                <Info className="w-3 h-3 text-gray-600 cursor-help" />
              </Tooltip>
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              The engine dynamically escalates bribes from a <span className="text-white font-bold">0.5% minimum</span> up to a <span className="text-blue-400 font-bold">70% maximum</span> to win gas wars. AlphaMark is guaranteed to retain at least <span className="text-emerald-400 font-bold">30% of gross profit</span> on every successful execution.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-500" style={{ width: '70%' }} />
                <div className="h-full bg-emerald-500" style={{ width: '30%' }} />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">70% Bribe / 30% Alpha</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
