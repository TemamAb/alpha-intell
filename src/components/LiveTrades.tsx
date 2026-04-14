import React, { useEffect, useState, useRef } from 'react';
import { Activity, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { Trade, Currency } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface LiveTradesProps {
  currency: Currency;
  ethPrice: number;
}

export default function LiveTrades({ currency, ethPrice }: LiveTradesProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const formatVal = (val: number) => {
    if (currency === 'USD') return `$${(val * ethPrice).toFixed(2)}`;
    return `${val.toFixed(4)} ETH`;
  };

  useEffect(() => {
    const eventSource = new EventSource('/api/trades/stream');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'history') {
        setTrades(data.trades);
      } else if (data.type === 'trade') {
        setTrades(prev => [data.trade, ...prev].slice(0, 50));
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-500" />
          Live Execution Stream
        </h2>
        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </div>

      <div className="flex-1 bg-slate-900/40 backdrop-blur-sm rounded-xl border border-white/5 shadow-xl overflow-hidden flex flex-col">
        <div className="grid grid-cols-7 p-4 border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          <div className="col-span-1">Time</div>
          <div className="col-span-1">Pair</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-1">Bundle</div>
          <div className="col-span-1 text-right">Price</div>
          <div className="col-span-1 text-right">Bribe</div>
          <div className="col-span-1 text-right">Profit</div>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-1">
          {trades.map((trade) => (
            <div 
              key={trade.id} 
              className="grid grid-cols-7 p-3 rounded-lg hover:bg-white/5 transition-all animate-in fade-in slide-in-from-left-2 duration-300"
            >
              <div className="col-span-1 flex items-center gap-2 text-xs text-gray-500 font-mono">
                <Clock className="w-3 h-3" />
                {new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="col-span-1 flex flex-col">
                <span className="text-xs font-bold text-white">{trade.pair}</span>
                {trade.flashLoanUsed && (
                  <span className="text-[8px] text-purple-400 font-bold uppercase tracking-tighter">Flash Loan</span>
                )}
              </div>
              <div className="col-span-1 flex items-center">
                <span className={cn(
                  "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                  trade.type === 'buy' ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"
                )}>
                  {trade.type}
                </span>
              </div>
              <div className="col-span-1 flex items-center">
                {trade.isBundled ? (
                  <div className="flex flex-col gap-0.5">
                    <span 
                      className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-tighter w-fit"
                      title="MEV Shield Active"
                    >
                      Bundled
                    </span>
                    <span className="text-[8px] text-gray-600 font-mono">{trade.bundleNode}</span>
                  </div>
                ) : (
                  <span className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter">Public</span>
                )}
              </div>
              <div className="col-span-1 text-right text-xs font-mono text-gray-300">{formatVal(trade.price)}</div>
              <div className="col-span-1 text-right text-xs font-mono text-yellow-500/80">{formatVal(trade.bribePaid)}</div>
              <div className={cn(
                "col-span-1 text-right text-xs font-bold flex items-center justify-end gap-1",
                trade.profit > 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {trade.profit > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {formatVal(Math.abs(trade.profit))}
              </div>
            </div>
          ))}
          {trades.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 py-20">
              <Activity className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm">Waiting for engine execution...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
