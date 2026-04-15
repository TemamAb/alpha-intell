/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Dashboard from './components/Dashboard';
import WalletManager from './components/WalletManager';
import StrategyManager from './components/StrategyManager';
import LiveTrades from './components/LiveTrades';
import AiCopilot from './components/AiCopilot';
import LiveReadiness from './components/LiveReadiness';
import BlockchainStreaming from './components/BlockchainStreaming';
import { Stats, Wallet, LatencyData, EngineStatus, Strategy, Currency, TargetWallet } from './types';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [stats, setStats] = useState<(Stats & { ethPrice: number }) | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [targetWallets, setTargetWallets] = useState<TargetWallet[]>([]);
  const [latency, setLatency] = useState<LatencyData>({});
  const [engineStatus, setEngineStatus] = useState<EngineStatus>({ 
    running: false, 
    mode: 'paper', 
    gasless: true,
    bribeStrategy: 'dynamic',
    flashLoanEnabled: true
  });
  const [isConnected, setIsConnected] = useState(false);
  const [currency, setCurrency] = useState<Currency>('ETH');
  const [refreshRate, setRefreshRate] = useState(5); // Default to 5s

  // Initial Fetch & Dynamic Polling
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, walletRes, strategyRes, statusRes, targetsRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/wallets'),
          fetch('/api/strategies'),
          fetch('/api/control/status'),
          fetch('/api/forging/targets')
        ]);
        
        const statsData = await statsRes.json();
        setStats(statsData);
        setWallets(await walletRes.json());
        setStrategies(await strategyRes.json());
        setEngineStatus(await statusRes.json());
        setTargetWallets(await targetsRes.json());
        setIsConnected(true);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
        setIsConnected(false);
      }
    };

    fetchData();
    
    // Polling with dynamic interval
    const interval = setInterval(async () => {
      try {
        const [statsRes, latencyRes, walletsRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/ping'),
          fetch('/api/wallets')
        ]);
        const statsData = await statsRes.json();
        setStats(statsData);
        setLatency(await latencyRes.json());
        setWallets(await walletsRes.json());
        setIsConnected(true);
      } catch (e) {
        setIsConnected(false);
      }
    }, refreshRate * 1000);

    return () => clearInterval(interval);
  }, [refreshRate]);

  const handleStart = async () => {
    // SYSTEM UPGRADE: AlphaMark Pro now defaults to 100% Live Trading on Trigger.
    // Simulation/Paper mode logic has been deprecated for high-performance live execution.
    const mode = 'live';
    
    try {
      const res = await fetch('/api/control/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mode,
          bribeStrategy: 'dynamic',
          flashLoanEnabled: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setEngineStatus(data.status);
      } else {
        alert(`Safety Block: ${data.error}`);
      }
    } catch (e) {
      alert("Failed to start Live Engine");
    }
  };

  const handleStop = async () => {
    try {
      const res = await fetch('/api/control/stop', { method: 'POST' });
      const data = await res.json();
      if (data.success) setEngineStatus(data.status);
    } catch (e) {
      alert("Failed to stop engine");
    }
  };

  const handleAddWallet = async (address: string, chain: string) => {
    try {
      const res = await fetch('/api/wallet/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, chain })
      });
      const data = await res.json();
      if (data.success) setWallets([...wallets, data.wallet]);
    } catch (e) {
      alert("Failed to add wallet");
    }
  };

  const handleRemoveWallet = async (id: string) => {
    if (!confirm("Permanently remove this execution wallet?")) return;
    try {
      const res = await fetch('/api/wallet/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) setWallets(wallets.filter(w => w.id !== id));
    } catch (e) {
      alert("Failed to remove wallet");
    }
  };

  const handleToggleStrategy = async (id: string, status: 'active' | 'paused') => {
    try {
      const res = await fetch('/api/strategy/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();
      if (data.success) {
        setStrategies(strategies.map(s => s.id === id ? { ...s, status } : s));
      }
    } catch (e) {
      alert("Failed to toggle strategy");
    }
  };

  const handleUpdateStrategyConfig = async (id: string, config: Partial<Strategy['config']>) => {
    try {
      const res = await fetch('/api/strategy/update-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, config })
      });
      const data = await res.json();
      if (data.success) {
        setStrategies(strategies.map(s => s.id === id ? { ...s, config: { ...s.config, ...config } } : s));
      }
    } catch (e) {
      alert("Failed to update strategy configuration");
    }
  };

  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#0B0E14] text-slate-200 font-sans">
      <TopNav 
        totalBalance={totalBalance} 
        isConnected={isConnected} 
        currency={currency} 
        setCurrency={setCurrency} 
        ethPrice={stats?.ethPrice || 2500}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          activePage={activePage} 
          setActivePage={setActivePage} 
          onStart={handleStart}
          onStop={handleStop}
          isRunning={engineStatus.running}
          mode={engineStatus.mode}
        />

        <main className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          {activePage === 'dashboard' && (
            <Dashboard 
              stats={stats} 
              latency={latency} 
              currency={currency} 
              ethPrice={stats?.ethPrice || 2500} 
              totalBalance={totalBalance}
              refreshRate={refreshRate}
              onRefreshRateChange={setRefreshRate}
            />
          )}
          {activePage === 'strategies' && (
            <StrategyManager 
              strategies={strategies} 
              onToggle={handleToggleStrategy} 
              currency={currency}
              ethPrice={stats?.ethPrice || 2500}
              stats={stats}
              targetWallets={targetWallets}
              onUpdateConfig={handleUpdateStrategyConfig}
            />
          )}
          {activePage === 'wallet' && (
            <WalletManager 
              wallets={wallets} 
              onAdd={handleAddWallet} 
              onRemove={handleRemoveWallet} 
              currency={currency}
              ethPrice={stats?.ethPrice || 2500}
            />
          )}
          {activePage === 'streams' && (
            <LiveTrades 
              currency={currency} 
              ethPrice={stats?.ethPrice || 2500} 
            />
          )}
          {activePage === 'copilot' && <AiCopilot stats={stats} />}
          {activePage === 'blockchain-streaming' && <BlockchainStreaming mode={engineStatus.mode} />}
          {activePage === 'settings' && (
            <LiveReadiness 
              strategies={strategies} 
              onNavigate={setActivePage} 
            />
          )}
        </main>
      </div>
    </div>
  );
}
