export interface Wallet {
  id: string;
  address: string;
  key: string;
  chain: string;
  balance: number;
  isAA: boolean;
  paymasterStatus: 'active' | 'inactive';
}

export interface BotSystem {
  scanners: number;
  orchestrators: number;
  executors: number;
  cpuUsage: number;
  memoryUsage: number;
}

export interface TargetWallet {
  address: string;
  label: string;
  chain: string;
  strategies: string[];
  profitPerTrade: number;
  tradesPerHour: number;
  totalProfitDay: number;
  profitLast30Days: number;
  forgingEfficiency: number; // %
  winRate: number;
  daysActive: number;
  isMevResistant: boolean;
  avgSlippageTolerance: number; // %
  executionLatency: number; // ms
}

export interface Stats {
  totalProfit: number;
  winRate: number;
  activeOpps: number;
  profitPerTrade: number;
  tradesPerHour: number;
  totalTrades: number;
  learningProgress: number;
  shadowedWallets: number;
  avgLatency: number; // ms
  botSystem: BotSystem;
  chartData: { time: string; profit: number }[];
}

export type StrategyType = 'arbitrage' | 'trend' | 'mean-reversion' | 'forging';

export type Currency = 'ETH' | 'USD';

export interface LatencyData {
  [key: string]: number;
}

export interface EngineStatus {
  running: boolean;
  mode: 'paper' | 'live';
  gasless: boolean;
  bribeStrategy: 'conservative' | 'aggressive' | 'dynamic';
  flashLoanEnabled: boolean;
}

export interface RPCQuota {
  provider: 'infura' | 'alchemy' | 'drpc';
  requestsUsed: number;
  limit: number;
  status: 'healthy' | 'warning' | 'exhausted';
}

export interface Strategy {
  id: string;
  name: string;
  type: StrategyType;
  status: 'active' | 'paused';
  config: {
    minProfitThreshold: number;
    maxBribePercent: number;
    flashLoanProvider?: 'aave' | 'uniswap' | 'balancer';
    hops?: string[];
    shadowTarget?: string; // For Forging strategy
    contractAddress?: string;
    callData?: string;
    tradeAmount?: number;
  };
}

export interface ArbOpportunity {
  poolA: `0x${string}`;
  poolB: `0x${string}`;
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  amountIn: bigint;
  amountOutExpected: bigint;
  priceDiff: number; // %
  profitETH: number;
  gasEstimate: number;
  executionWindow: number; // blocks
}

export interface Trade {
  id: string;
  timestamp: string;
  pair: string;
  type: 'buy' | 'sell' | 'arb';
  price: number;
  amount: number;
  profit: number;
  bribePaid?: number;
  flashLoanUsed?: boolean;
  arbOpp?: ArbOpportunity;
  status: 'completed' | 'pending' | 'failed' | 'reverted';
  isBundled?: boolean;
  bundleNode?: 'Flashbots' | 'Pimlico' | 'Builder0x69' | 'Beaver';
  strategyId?: string;
  hash?: string;
}

export interface ReadinessStep {
  id: string;
  status: 'completed' | 'pending' | 'critical';
  discoveredValue?: string;
  label?: string;
}
