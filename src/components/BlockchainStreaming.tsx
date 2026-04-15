import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu, Zap, Shield, Link, Database, Search, Activity, Box } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface BlockchainEvent {
  id: string;
  type: string;
  message: string;
  category: 'scanning' | 'detection' | 'orchestration' | 'execution' | 'success' | 'protection';
  blockNumber: number;
  timestamp: string;
}

export default function BlockchainStreaming({ mode }: { mode: 'paper' | 'live' }) {
  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== 'live') return;

    const eventSource = new EventSource('/api/blockchain/stream');
    
    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'event') {
        setEvents(prev => [...prev, data.event].slice(-100));
      }
    };

    return () => eventSource.close();
  }, [mode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  if (mode !== 'live') {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-500">
        <div className="p-8 bg-slate-900 border border-white/5 rounded-3xl relative">
          <Shield className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
             <Activity className="w-8 h-8 text-blue-500/20 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Real-Time Validation Required</h2>
          <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
            The Blockchain Streaming module provides raw, unmocked on-chain telemetry. Switch to 
            <span className="text-blue-400 font-bold mx-1">LIVE MODE</span> 
            to verify block-level execution and MEV protection cycles.
          </p>
        </div>
      </div>
    );
  }

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'scanning': return 'text-blue-400 border-blue-500/20 bg-blue-500/10';
      case 'detection': return 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10';
      case 'orchestration': return 'text-purple-400 border-purple-500/20 bg-purple-500/10';
      case 'execution': return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
      case 'success': return 'text-white border-emerald-500/50 bg-emerald-600/30 font-bold';
      case 'protection': return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
      default: return 'text-gray-400 border-white/5 bg-white/5';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Terminal className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Blockchain Telemetry Stream</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Real-time On-Chain Validator</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Live Sync Active</span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-4 overflow-y-auto font-mono text-xs space-y-2 scrollbar-hide"
      >
        {events.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-600 animate-pulse italic">
            Waiting for next block inclusion...
          </div>
        )}
        {events.map((event) => (
          <div key={event.id} className={cn(
            "p-3 rounded-lg border flex items-start gap-4 animate-in fade-in slide-in-from-left-2 transition-all",
            getCategoryStyles(event.category)
          )}>
            <div className="flex flex-col items-center gap-1 min-w-[80px] pt-0.5">
              <span className="text-[10px] opacity-60 font-bold">BLOCK</span>
              <span className="text-sm font-black tabular-nums">{event.blockNumber}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-black tracking-widest opacity-80">{event.category}</span>
                <span className="text-[9px] opacity-40">{new Date(event.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="leading-relaxed">{event.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}