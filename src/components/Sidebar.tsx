import React from 'react';
import { LayoutDashboard, Zap, Wallet, Activity, Bot, Settings, Play, Square } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  onStart: () => void;
  onStop: () => void;
  isRunning: boolean;
  mode: 'paper' | 'live';
}

export default function Sidebar({ activePage, setActivePage, onStart, onStop, isRunning, mode }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'strategies', label: 'Strategies', icon: Zap },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
{ id: 'streams', label: 'Live Trades', icon: Activity },
    { id: 'blockchain-streaming', label: 'Blockchain Stream', icon: Activity },
    { id: 'copilot', label: 'AI Copilot', icon: Bot },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0F172A] border-r border-gray-800 flex flex-col z-20 shrink-0">
      <div className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={cn(
              "w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              activePage === item.id 
                ? "bg-blue-600 text-white" 
                : "text-gray-400 hover:bg-slate-800/50 hover:text-gray-100"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      
      <div className="p-5 mt-auto border-t border-gray-800 space-y-3">
        {!isRunning ? (
          <button 
            onClick={onStart}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Engine</span>
          </button>
        ) : (
          <div className="w-full flex flex-col items-center justify-center gap-1 px-4 py-3 bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-sm font-bold">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>LIVE MODE ACTIVE</span>
            </div>
            <span className="text-[9px] uppercase tracking-widest opacity-80 text-emerald-600 font-extrabold">Auditor Verified</span>
          </div>
        )}
        
        <button 
          onClick={onStop}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 rounded-lg text-xs font-bold transition-colors"
        >
          <Square className="w-4 h-4 fill-current" />
          <span>EMERGENCY STOP</span>
        </button>
      </div>
    </aside>
  );
}
