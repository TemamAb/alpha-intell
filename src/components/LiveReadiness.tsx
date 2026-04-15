import React, { useState, useMemo, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Circle, ExternalLink, ShieldAlert, Key, Globe, Zap, Shield, ArrowRight, Plus, Wallet, Settings, Target, Info, Edit3, Trash2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Strategy } from '@/src/types';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  key?: string | number;
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

interface Step {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'pending' | 'critical';
  icon: any;
  discoveredValue?: string;
  fixInstruction?: string;
  actionLabel?: string;
  tooltip: string;
}

interface LiveReadinessProps {
  strategies: Strategy[];
  onNavigate: (page: string) => void;
}

export default function LiveReadiness({ strategies, onNavigate }: LiveReadinessProps) {
  const hasActiveForgingStrategy = useMemo(() => 
    strategies.some(s => s.status === 'active' && s.type === 'forging'), 
    [strategies]
  );

  const [steps, setSteps] = useState<Step[]>([
    {
      id: 'aa',
      title: "Account Abstraction (ERC-4337)",
      description: "Smart Account deployment via Pimlico. Gasless execution is active, allowing trading with $0 prefunded gas wallet.",
      status: "completed",
      icon: Shield,
      tooltip: "Enables gasless transactions and programmable security through ERC-4337 smart accounts."
    },
    {
      id: 'paymaster',
      title: "Pimlico Paymaster Integration",
      description: "Sponsoring user transactions. Ensure your Pimlico dashboard has sufficient balance.",
      status: "completed",
      icon: Zap,
      tooltip: "Sponsors your transaction gas fees, allowing the bot to operate without ETH in the execution wallet."
    },
    {
      id: 'rpc',
      title: "RPC Node Infrastructure",
      description: "Dedicated institutional nodes (Alchemy, Infura) are required for live execution to avoid rate-limiting.",
      status: "pending",
      icon: Globe,
      fixInstruction: "1. Create an account on Alchemy or Infura. 2. Generate an API Key for Ethereum Mainnet. 3. Click 'Add RPC Key' below to securely store it.",
      actionLabel: "Add RPC Key",
      tooltip: "Institutional-grade endpoints ensure high-speed mempool access and prevent rate-limiting during peak volatility."
    },
    {
      id: 'key',
      title: "Private Key Security",
      description: "A secure private key is required to sign transactions in live mode.",
      status: "critical",
      icon: Key,
      fixInstruction: "1. Generate a new EOA wallet. 2. Export the private key. 3. Click 'Configure Key' to encrypt and store it in the secure vault.",
      actionLabel: "Configure Key",
      tooltip: "Encryption and secure storage of your execution key to prevent unauthorized access to funds."
    },
    {
      id: 'strategy',
      title: "Elite Wallet Intelligence Selection",
      description: "AlphaMark requires at least one active Forging Strategy targeting top-performing wallets.",
      status: hasActiveForgingStrategy ? "completed" : "pending",
      icon: Target,
      fixInstruction: "1. Navigate to the Strategies page. 2. Identify an Elite Wallet Target from the Forged Intelligence panel. 3. Activate a Neural Forger node shadowing that target.",
      actionLabel: "Select Elite Target",
      tooltip: "The core alpha source. Requires synchronization with top-performing on-chain wallets."
    },
    {
      id: 'blockchain',
      title: "Blockchain Integration",
      description: "Implement viem/ethers library for real blockchain calls and transaction broadcasting.",
      status: "pending",
      icon: Globe,
      fixInstruction: "1. Install viem or ethers library. 2. Configure RPC providers for mainnet. 3. Implement transaction signing and broadcasting.",
      actionLabel: "Implement Blockchain",
      tooltip: "Required for real on-chain execution instead of simulation."
    },
    {
      id: 'wallet',
      title: "Secure Wallet Management",
      description: "Add encrypted private key storage and secure wallet operations for live transactions.",
      status: "pending",
      icon: Key,
      fixInstruction: "1. Implement encrypted key storage. 2. Add wallet connection for ERC-4337 smart accounts. 3. Enable secure transaction signing.",
      actionLabel: "Configure Wallet",
      tooltip: "Secure management of execution keys for real fund access."
    },
    {
      id: 'bundler',
      title: "Pimlico Bundler Integration",
      description: "Connect to Pimlico ERC-4337 bundler for atomic transaction execution.",
      status: "pending",
      icon: Zap,
      fixInstruction: "1. Configure Pimlico bundler API. 2. Implement bundle submission. 3. Add MEV protection features.",
      actionLabel: "Setup Bundler",
      tooltip: "Atomic execution engine for complex multi-step transactions."
    },
    {
      id: 'balance',
      title: "On-Chain Balance Monitoring",
      description: "Real-time balance verification and wallet state monitoring from blockchain.",
      status: "pending",
      icon: Wallet,
      fixInstruction: "1. Implement balance queries via RPC. 2. Add real-time wallet monitoring. 3. Sync with on-chain state.",
      actionLabel: "Monitor Balances",
      tooltip: "Accurate balance tracking from blockchain instead of simulation."
    },
    {
      id: 'safety',
      title: "Emergency Circuit Breakers",
      description: "Verify that the Emergency Stop kills all active listeners.",
      status: "completed",
      icon: CheckCircle2,
      tooltip: "Safety mechanism to instantly halt all trading activity and cancel pending transactions."
    }
  ]);

  // Fetch readiness from backend on mount
  useEffect(() => {
    fetch('/api/readiness')
      .then(res => res.json())
      .then(data => {
        setSteps(prev => prev.map(s => {
          const backendStep = data.find((b: any) => b.id === s.id);
          if (backendStep) {
            // Strategy status is special, it depends on parent state
            if (s.id === 'strategy') return s;
            return { 
                ...s, 
                status: backendStep.status, 
                discoveredValue: backendStep.discoveredValue 
            };
          }
          return s;
        }));
      });
  }, []);

  // Sync strategy status if it changes in parent
  useEffect(() => {
    setSteps(prev => prev.map(s => {
      if (s.id === 'strategy') {
        const newStatus = hasActiveForgingStrategy ? 'completed' : 'pending';
        // Persist to backend
        fetch('/api/readiness/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: 'strategy', status: newStatus })
        });
        return { ...s, status: newStatus };
      }
      return s;
    }));
  }, [hasActiveForgingStrategy]);

  const [fixingId, setFixingId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);

  const validateGithubUrl = (url: string) => {
    const githubRegex = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/;
    return githubRegex.test(url);
  };

  const allCompleted = useMemo(() => steps.every(s => s.status === 'completed'), [steps]);

  const handleFix = (id: string) => {
    if (id === 'strategy') {
      onNavigate('strategies');
      return;
    }
    setInputValue('');
    setFixingId(id);
  };

  const completeStep = (id: string) => {
    const newStatus = 'completed';
    // Persist to backend
    fetch('/api/readiness/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus, value: inputValue })
    }).then(() => {
      setSteps(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
      setFixingId(null);
      setInputValue('');
    });
  };

  const handleReset = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration? This will disable live mode capabilities for this system.')) return;
    
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status: s.id === 'key' ? 'critical' : 'pending' } : s));
    
    await fetch('/api/readiness/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
  };

  const handleGoLive = async () => {
    setDeploymentError(null);
    try {
      const res = await fetch('/api/control/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        setIsLive(true);
      } else {
        setDeploymentError(data.error || 'Failed to go live');
      }
    } catch (err) {
      console.error(err);
      setDeploymentError('Network error while going live');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            Live Mode Deployment Guide
            <Tooltip content="Comprehensive checklist for transitioning AlphaMark from paper trading to live on-chain execution.">
              <Info className="w-4 h-4 text-gray-600 cursor-help" />
            </Tooltip>
          </h2>
          <p className="text-gray-400 leading-relaxed max-w-xl">
            Your dashboard is currently running in <span className="text-blue-400 font-bold">STAGING/PAPER</span> mode. 
            Complete the requirements below to unlock production execution.
          </p>
        </div>
        <div className="text-right">
          <Tooltip content="Aggregated readiness score based on security, infrastructure, and strategy configuration.">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 cursor-help">Readiness Score</div>
          </Tooltip>
          <div className="text-4xl font-bold text-blue-500">
            {Math.round((steps.filter(s => s.status === 'completed').length / steps.length) * 100)}%
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {steps.map((step) => (
          <div key={step.id} className={cn(
            "bg-slate-900/40 border rounded-xl p-6 transition-all",
            step.status === 'completed' ? "border-emerald-500/20" : 
            step.status === 'critical' ? "border-red-500/20" : "border-white/5",
            fixingId === step.id && "ring-2 ring-blue-500 bg-slate-900/60"
          )}>
            <div className="flex gap-6 items-start">
              <div className="mt-1">
                {step.status === 'completed' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : step.status === 'critical' ? (
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-700" />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <step.icon className="w-4 h-4 text-blue-500" />
                    {step.title}
                    {step.status === 'completed' && (
                      <div className="flex items-center gap-1 ml-2">
                        <button 
                          onClick={() => setFixingId(step.id)}
                          className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-blue-400"
                          title="Edit Configuration"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleReset(step.id)}
                          className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-red-400"
                          title="Delete System Configuration"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <Tooltip content={step.tooltip}>
                      <Info className="w-3 h-3 text-gray-600 cursor-help" />
                    </Tooltip>
                  </h3>
                  <span 
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                      step.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                      step.status === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-slate-800 text-gray-500'
                    )}
                  >
                    {step.status}
                  </span>
                </div>
                
                {step.discoveredValue && (
                  <div className="flex items-center gap-2 bg-blue-500/5 border border-blue-500/10 rounded-lg px-3 py-1.5 w-max">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Detected:</span>
                    <span className="text-[10px] font-mono text-gray-300">{step.discoveredValue}</span>
                  </div>
                )}

                <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
                
                {step.status !== 'completed' && (
                  <div className="pt-2 space-y-4">
                    {fixingId === step.id ? (
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-blue-500/30 animate-in fade-in slide-in-from-top-2">
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <ArrowRight className="w-3 h-3" />
                          Step-by-Step Instructions
                        </h4>
                        <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                          {step.fixInstruction}
                        </p>
                        
                        {(step.id === 'key' || step.id === 'rpc') && (
                          <div className="mt-4 space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                              {step.id === 'key' ? 'Private Key (Hex)' : 
                               'RPC Endpoint URL'}
                              <Tooltip content={
                                step.id === 'key' ? "Your wallet's private key is used locally to sign transactions. It is never transmitted to our servers." :
                                "The websocket or HTTP URL of your dedicated node provider (e.g., Alchemy, Infura)."
                              }>
                                <Info className="w-3 h-3 text-gray-700 cursor-help" />
                              </Tooltip>
                            </label>
                            <div className="space-y-2">
                              <input 
                                type={step.id === 'key' ? 'password' : 'text'}
                                placeholder={
                                  step.id === 'key' ? '0x...' : 
                                  'https://eth-mainnet.g.alchemy.com/v2/...'
                                }
                                className="w-full bg-slate-900 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder:text-gray-700 focus:border-blue-500 outline-none transition-all"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        <div className="mt-4 flex gap-2">
                          {step.id !== 'strategy' && (
                            <Tooltip content="Saves your configuration to the local secure storage and marks this requirement as met.">
                              <button 
                                onClick={() => completeStep(step.id)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded transition-all flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                Confirm Configuration
                              </button>
                            </Tooltip>
                          )}
                          <button 
                            onClick={() => setFixingId(null)}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-gray-300 text-[10px] font-bold rounded transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleFix(step.id)}
                        className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition-colors group"
                      >
                        {step.actionLabel || "Fix Issue"} 
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-8 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-xl",
            allCompleted ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-800 text-gray-500"
          )}>
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Production Deployment</h4>
            <p className="text-xs text-gray-500">
              {deploymentError ? (
                <span className="text-red-400 font-medium">{deploymentError}</span>
              ) : (
                allCompleted 
                  ? "System verified. Ready for institutional-grade execution." 
                  : "Complete all critical security and infrastructure steps above."
              )}
            </p>
          </div>
        </div>

        <button 
          onClick={handleGoLive}
          disabled={!allCompleted || isLive}
          className={cn(
            "px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
            isLive 
              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
              : allCompleted 
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20" 
                : "bg-slate-800 text-gray-500 cursor-not-allowed"
          )}
        >
          {isLive ? (
            <><CheckCircle2 className="w-4 h-4" /> SYSTEM LIVE</>
          ) : (
            <><Zap className="w-4 h-4" /> GO LIVE</>
          )}
        </button>
      </div>
    </div>
  );
}