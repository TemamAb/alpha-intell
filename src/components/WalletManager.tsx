import React, { useState } from 'react';
import { Wallet as WalletIcon, Plus, Trash2, Edit2, ExternalLink, Shield, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Wallet, Currency } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface WalletManagerProps {
  wallets: Wallet[];
  onAdd: (address: string, chain: string) => void;
  onRemove: (id: string) => void;
  currency: Currency;
  ethPrice: number;
}

export default function WalletManager({ wallets, onAdd, onRemove, currency, ethPrice }: WalletManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAddr, setNewAddr] = useState('');
  const [newChain, setNewChain] = useState('polygon');
  const [withdrawMode, setWithdrawMode] = useState<'auto' | 'manual'>('auto');

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdraw = async () => {
    if (!withdrawAmount || Number(withdrawAmount) <= 0) return;
    setIsWithdrawing(true);
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: withdrawAmount })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setWithdrawAmount('');
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("Withdrawal failed. Check network connection.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const formatVal = (val: number) => {
    if (currency === 'USD') return `$${(val * ethPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `${val.toFixed(4)} ETH`;
  };

  const handleAdd = () => {
    if (newAddr.startsWith('0x') && newAddr.length >= 42) {
      onAdd(newAddr, newChain);
      setNewAddr('');
      setIsModalOpen(false);
    } else {
      alert("Invalid Ethereum Address");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-6 border border-white/5 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <WalletIcon className="w-6 h-6 text-blue-500" />
              Wallet Management
            </h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              Add Wallet
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">
                  <th className="px-4 py-2">Wallet Address</th>
                  <th className="px-4 py-2">Chain</th>
                  <th className="px-4 py-2">Balance</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((w) => (
                  <tr key={w.id} className="bg-slate-800/30 hover:bg-slate-800/50 transition-all group">
                    <td className="px-4 py-4 font-mono text-sm text-blue-400">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {w.address.slice(0, 6)}...{w.address.slice(-4)}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                        </div>
                        {w.isAA && (
                          <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-tighter flex items-center gap-1">
                            <Shield className="w-2 h-2" /> Smart Account (AA)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="uppercase text-[10px] font-bold tracking-widest text-gray-400 bg-slate-800 px-2 py-1 rounded w-fit">
                          {w.chain}
                        </span>
                        {w.paymasterStatus === 'active' && (
                          <span className="text-[9px] text-blue-400 font-bold uppercase tracking-tighter">
                            Pimlico Paymaster Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-bold text-white">
                      <div className="flex flex-col">
                        {formatVal(w.balance)}
                        {w.balance > 0 && (
                          <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-tighter flex items-center gap-1 animate-pulse">
                            <TrendingUp className="w-2 h-2" /> Live Yield
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button className="p-2 text-gray-500 hover:text-white transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onRemove(w.id)}
                          className="p-2 text-red-900/60 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-6 border-l-4 border-emerald-500 shadow-xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
            <ArrowUpRight className="w-6 h-6 text-emerald-500" />
            Profit Withdrawal
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-2">Withdrawal Mode</label>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-white/5">
                <button 
                  onClick={() => setWithdrawMode('auto')}
                  className={cn(
                    "flex-1 py-2 text-[10px] font-bold rounded-md transition-all",
                    withdrawMode === 'auto' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  AUTO-PILOT
                </button>
                <button 
                  onClick={() => setWithdrawMode('manual')}
                  className={cn(
                    "flex-1 py-2 text-[10px] font-bold rounded-md transition-all",
                    withdrawMode === 'manual' ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  MANUAL
                </button>
              </div>
            </div>

            {withdrawMode === 'auto' ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                  <p className="text-[10px] text-blue-400/80 leading-relaxed flex gap-2">
                    <Shield className="w-3 h-3 shrink-0" />
                    System will automatically sweep profits to your vault once the threshold is met.
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Min Threshold (ETH)</label>
                  <input 
                    type="number" 
                    defaultValue={0.05}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors" 
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Amount to Withdraw</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors" 
                  />
                </div>
                <button 
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50"
                >
                  {isWithdrawing ? 'Processing...' : 'Withdraw Now'}
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-white/5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Status</span>
                <span className="text-emerald-400 font-bold uppercase tracking-widest">Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold mb-6 text-white">Add Trading Wallet</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Public Address</label>
                <input 
                  type="text" 
                  value={newAddr}
                  onChange={(e) => setNewAddr(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500" 
                  placeholder="0x..." 
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Blockchain Network</label>
                <select 
                  value={newChain}
                  onChange={(e) => setNewChain(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 appearance-none"
                >
                  <option value="polygon">Polygon (Mainnet)</option>
                  <option value="ethereum">Ethereum (Mainnet)</option>
                  <option value="bsc">Binance Smart Chain</option>
                  <option value="arbitrum">Arbitrum One</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAdd}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20"
                >
                  Secure Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
