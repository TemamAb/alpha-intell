import React from 'react';
import { ShieldCheck, Wifi, WifiOff, Coins } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Currency } from '../types';

interface TopNavProps {
  totalBalance: number;
  isConnected: boolean;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  ethPrice: number;
}

export default function TopNav({ totalBalance, isConnected, currency, setCurrency, ethPrice }: TopNavProps) {
  const displayBalance = currency === 'USD' ? (totalBalance * ethPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : totalBalance.toFixed(4);

  return (
    <nav className="h-16 border-b border-gray-800 bg-[#0F172A]/80 flex items-center justify-between px-6 z-50 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
          α
        </div>
        <span className="font-bold text-xl tracking-tight text-white">
          AlphaMark <span className="text-blue-500 text-sm font-normal ml-1">PRO</span>
        </span>
      </div>
      
      <div className="flex items-center gap-6">
        {/* Currency Toggle */}
        <div className="flex bg-slate-900 rounded-lg p-1 border border-white/5">
          <button 
            onClick={() => setCurrency('ETH')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${currency === 'ETH' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            ETH
          </button>
          <button 
            onClick={() => setCurrency('USD')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${currency === 'USD' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            USD
          </button>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-blue-500/20">
          <span className="text-xs text-gray-400">Total Wallet Balance:</span>
          <span className="text-sm font-bold text-blue-400 font-mono">
            {currency === 'USD' && '$'}{displayBalance} {currency}
          </span>
        </div>
        
        <div className={cn(
          "flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-all",
          isConnected 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
        )}>
          {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span className="font-medium uppercase tracking-wider">
            {isConnected ? 'Connected' : 'Connecting'}
          </span>
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            isConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-yellow-500 animate-pulse"
          )} />
        </div>
      </div>
    </nav>
  );
}
