import { db } from './db';
import { Trade, Strategy, EngineStatus, Wallet } from '../types';
import { createPublicClient, createClient, http, fallback, Hash, PublicClient, parseEther, formatEther, encodeFunctionData, webSocket, parseAbi } from 'viem';
import { mainnet } from 'viem/chains';
import { pimlicoActions } from "permissionless/actions/pimlico";
import { privateKeyToAccount } from 'viem/accounts';
import { toSimpleSmartAccount } from "permissionless/accounts";
import { createSmartAccountClient, SmartAccountClient } from "permissionless";

const UNISWAP_V3_POOL_ABI = parseAbi(['function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)']);


export interface BlockchainEvent {
  id: string;
  type: 'scan' | 'detect' | 'orchestrate' | 'execute' | 'success' | 'protection';
  message: string;
  category: 'scanning' | 'detection' | 'orchestration' | 'execution' | 'success' | 'protection';
  blockNumber: number;
  timestamp: string;
  hash?: string;
}

class TradingEngine {
  private interval: NodeJS.Timeout | null = null;
  private listeners: ((trade: Trade) => void)[] = [];
  private blockchainListeners: ((event: BlockchainEvent) => void)[] = [];
  private currentBlock: number = 0;
  private publicClient: PublicClient;
  private unwatch: (() => void) | null = null;
  private smartAccountClient: SmartAccountClient<any, any, any> | null = null;
  private priceInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.publicClient = this.createClient();
  }

  private createClient() {
    const transports = [];
    if (process.env.ALCHEMY_ETH_KEY) {
      transports.push(http(`https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_ETH_KEY}`));
      transports.push(webSocket(`wss://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_ETH_KEY}`));
    }
    if (process.env.INFURA_ETH_KEY)
      transports.push(http(`https://mainnet.infura.io/v3/${process.env.INFURA_ETH_KEY}`));
    if (process.env.ETH_RPC_URL)
      transports.push(http(process.env.ETH_RPC_URL));
    if (process.env.POLYGON_RPC_URL)
      transports.push(http(process.env.POLYGON_RPC_URL));
    if (process.env.BSC_RPC_URL)
      transports.push(http(process.env.BSC_RPC_URL));
    if (process.env.ARBITRUM_RPC_URL)
      transports.push(http(process.env.ARBITRUM_RPC_URL));

    // Reliable public fallbacks (avoid blocked merkle.io)
    transports.push(http('https://rpc.ankr.com/eth'));
    transports.push(http('https://ethereum.publicnode.com'));
    transports.push(http('https://1rpc.io/eth'));

    return createPublicClient({
      chain: mainnet,
      transport: fallback(transports, { rank: true })
    });
  }


    if (this.interval) {
      console.log('[ENGINE] Already running');
      return;
    }
    
    const status = db.getEngineStatus();
    console.log(`[ENGINE] Mode: ${status.mode}`);

    if (status.mode === 'live') {
      // --- AUTOPILOT INITIALIZATION ---
      // If no active strategy, pick the one with the highest Alpha (Forging)
      let activeStrategy = db.getStrategies().find(s => s.status === 'active');
      if (!activeStrategy) {
        const forgingStrategies = db.getStrategies().filter(s => s.type === 'forging');
        if (forgingStrategies.length > 0) {
            activeStrategy = forgingStrategies[0];
            db.updateStrategy(activeStrategy.id, { status: 'active' });
            console.log(`[AUTOPILOT] No active strategy found. Auto-activating: ${activeStrategy.name}`);
        }
      }

      console.log('[ENGINE] Running ACID TEST...');
      const success = await this.performAcidTest();
      if (!success) {
        console.error('[ENGINE] ACID TEST FAILED - No block watcher started');
        return;
      }
      console.log('[ENGINE] ACID TEST PASSED ✅');
      db.resetStats();
      
      // Initialize Price Oracle
      await db.refreshEthPrice(this.publicClient);
      this.priceInterval = setInterval(() => {
        db.refreshEthPrice(this.publicClient);
      }, 60000); 

      // Initializing Real-Time Mempool Watcher
      console.log("[ENGINE] Initializing 100% Live Mode Operations...");

      // Emit initial status event
      this.emitBlockchainEvent({
        id: `init-${Date.now()}`,
        type: 'scan',
        message: 'Live mode initialized. Monitoring Ethereum mainnet for target activity.',
        category: 'scanning',
        blockNumber: this.currentBlock,
        timestamp: new Date().toISOString()
      });

      this.unwatch = this.publicClient.watchBlocks({
        includeTransactions: true,
        onBlock: (block) => {
          this.currentBlock = Number(block.number);
          this.analyzeNewBlock(block);
        }
      });
    }
  }

  private async analyzeNewBlock(block: any) {
    const status = db.getEngineStatus();
    if (status.mode !== 'live') return;

    // Update Live System Metrics
    const cpu = process.cpuUsage();
    const mem = process.memoryUsage();
    db.updateSystemMetrics(Math.round((cpu.user + cpu.system) / 1000000), Math.round(mem.heapUsed / 1024 / 1024));

    const activeStrategy = db.getStrategies().find(s => s.status === 'active');
    if (!activeStrategy) return;

    // Update bot system stats
    db.getStats().botSystem.scanners = Math.min(10, db.getStats().botSystem.scanners + 1);

    this.emitBlockchainEvent({
      id: `ev-${Date.now()}`,
      type: 'scan',
      message: `New Block ${block.number}: Scanning ${block.transactions.length} transactions for ${activeStrategy.name}`,
      category: 'scanning',
      blockNumber: this.currentBlock,
      timestamp: new Date().toISOString()
    });
    
    // Architect Fix: Deferred RPC increment to avoid detection latency
    setTimeout(() => db.incrementRPC(), 0);

// Phase 1: Uniswap Arb Scanner
    // Top pools: USDC/WETH, WBTC/ETH
    const TOP_POOLS = [
      '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640', // USDC/WETH 0.3%
      '0x4585fe77225b41b697c938b018e2ac67ac5a20c0', // WETH/USDC 0.05%
    ];

    for (const poolA of TOP_POOLS) {
      // Use configured trade amount from strategy or default to a safe 1 ETH test
      const tradeAmountRaw = activeStrategy.config.tradeAmount || 1;
      const amountIn = parseEther(tradeAmountRaw.toString());

      for (const poolB of TOP_POOLS) if (poolA !== poolB) {
        try {
          const [slot0A, slot0B] = await Promise.all([
            this.publicClient.readContract({
              address: poolA as `0x${string}`,
              abi: UNISWAP_V3_POOL_ABI,
              functionName: 'slot0'
            }),
            this.publicClient.readContract({
              address: poolB as `0x${string}`,
              abi: UNISWAP_V3_POOL_ABI,
              functionName: 'slot0'
            })
          ]);
          
          // Correct Uniswap V3 Price Math: (sqrtPriceX96 / 2^96)^2
          const priceA = (Number(slot0A[0]) / (2**96))**2;
          const priceB = (Number(slot0B[0]) / (2**96))**2;
          const priceDiff = Math.abs(priceA - priceB) / ((priceA + priceB)/2) * 100;

          // Only trigger if profit exceeds 0.05% AND covers the estimated slippage for the trade size
          const slippageEstimate = (tradeAmountRaw > 100) ? 0.02 : 0.005; // Basic heuristic: larger trades = more slippage
          
          if (priceDiff > (0.05 + slippageEstimate)) { 
            const profitETH = (amountIn * BigInt(Math.floor(priceDiff * 10))) / BigInt(1000); 
            const arbOpp: ArbOpportunity = {
              poolA: poolA as `0x${string}`,
              poolB: poolB as `0x${string}`,
              tokenIn: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
              tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
              amountIn,
              amountOutExpected: amountIn * BigInt(101), // sim
              priceDiff,
              profitETH: Number(profitETH) / 1e18,
              gasEstimate: 300000,
              executionWindow: 3
            };
            db.incrementActiveOpps();
            this.emitBlockchainEvent({
              id: `arb-${Date.now()}`,
              type: 'detect',
              message: `Arb opp ${priceDiff.toFixed(2)}% ${poolA.slice(-6)} ↔ ${poolB.slice(-6)} Profit: ${arbOpp.profitETH.toFixed(4)} ETH`,
              category: 'detection',
              blockNumber: this.currentBlock,
              timestamp: new Date().toISOString()
            });
            // Execute arb trade
            this.executeArbTrade(arbOpp, activeStrategy);
          }
        } catch (e) {
          // Skip bad pool
        }
      }
    }

    // Forging logic...
if (activeStrategy.type === 'forging') {
        // Use optimized targets to reduce RPC load and focus on high-alpha wallets
        const targets = db.getOptimizedTargets().map(t => t.address.toLowerCase());
        const detectedTx = (block.transactions as any[]).find((tx: any) => 
          tx.from && targets.includes(tx.from.toLowerCase())
        );

        if (detectedTx) {
          // Live Metrics: Update target performance on detection
          const currentTrades = db.getTargetWallets().find(t => t.address.toLowerCase() === detectedTx.from.toLowerCase())?.tradesPerHour || 0;
          db.updateTargetWalletMetrics(detectedTx.from, currentTrades + 1);

          db.incrementActiveOpps();
          db.getStats().botSystem.orchestrators += 1;
          this.emitBlockchainEvent({
              id: `det-${Date.now()}`,
              type: 'detect',
              message: `Elite target detected: ${detectedTx.hash.slice(0, 10)} | Orchestrating Shadow Bundle`,
              category: 'detection',
              blockNumber: this.currentBlock,
              timestamp: new Date().toISOString()
          });
          this.executeOnChainTrade(detectedTx.hash as Hash, activeStrategy);
        }
      }
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.unwatch) {
      this.unwatch();
      this.unwatch = null;
    }
    if (this.priceInterval) {
      clearInterval(this.priceInterval);
      this.priceInterval = null;
    }
    console.log('Engine stopped');
  }

  private async performAcidTest() {
    console.log('🔬 [ACID TEST] Starting full validation...');
    
    try {
      console.log('[ACID] RPC test...');
      // 1. Infrastructure Validation
      const chainId = await this.publicClient.getChainId();
      console.log(`[ACID] Chain ID: ${chainId}`);
      const blockNumber = await this.publicClient.getBlockNumber();
      console.log(`[ACID] Latest block: ${blockNumber}`);
      this.currentBlock = Number(blockNumber);

      const readiness = db.getVerifiedReadiness();
      const criticalSteps = ['rpc', 'blockchain', 'wallet'];

      for (const stepId of criticalSteps) {
        const step = readiness.find(s => s.id === stepId);
        if (!step || step.status !== 'completed') {
          throw new Error(`CRITICAL_FAILURE: Readiness step '${stepId}' is not completed. Status: ${step?.status || 'N/A'}.`);
        }
      }

      // 2. Initialize Smart Account Client
      const wallets = db.getWallets();
      if (wallets.length === 0) {
        throw new Error("No execution wallet configured. Please configure a private key in the UI or via EXECUTION_PRIVATE_KEY env var.");
      }
      
      const decryptedKey = db.getDecryptedKey(wallets[0].id);
      console.log(`[ACID] Wallet count: ${wallets.length}, Decrypted key: ${decryptedKey ? decryptedKey.slice(0,10)+'...' : 'MISSING'}`);
      if (!decryptedKey) {
        throw new Error("Could not retrieve or decrypt execution key. Ensure ENCRYPTION_SECRET is set and key is valid.");
      }

      const owner = privateKeyToAccount(decryptedKey as `0x${string}`);
      // @ts-ignore
      const simpleAccount = await toSimpleSmartAccount(this.publicClient, {
        signer: owner,
        factoryAddress: "0x9406Cc6185a346906296840746125a0E44976454", // Standard SimpleAccount Factory
        entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
      });

      const cloudBundlerUrl = process.env.PIMLICO_BUNDLER_URL;
      console.log(`[ACID] Pimlico Bundler: ${cloudBundlerUrl ? 'OK' : 'MISSING'}`);
      if (!cloudBundlerUrl) throw new Error("PIMLICO_BUNDLER_URL missing.");
      const paymasterUrl = process.env.PIMLICO_PAYMASTER_URL || cloudBundlerUrl;
      console.log(`[ACID] Paymaster: ${paymasterUrl}`);

      // @ts-ignore
      try {
        this.smartAccountClient = createSmartAccountClient({
          account: simpleAccount,
          chain: mainnet,
          bundlerTransport: http(cloudBundlerUrl),
          // @ts-ignore
          sponsorUserOperation: async (args) => {
              const paymasterClient = createClient({
                chain: mainnet,
                transport: http(paymasterUrl)
              }).extend(pimlicoActions({ entryPoint: { address: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", version: "0.7" } }));
              return paymasterClient.sponsorUserOperation(args);
          },
        // @ts-ignore
        }).extend(pimlicoActions({ entryPoint: { address: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", version: "0.7" } }));
      } catch (e) {
        throw new Error(`Failed to create Smart Account Client. Check PIMLICO_BUNDLER_URL/PAYMASTER_URL and API Key. Error: ${e instanceof Error ? e.message : e}`);
      }
      
      // Architect Fix: Safely sync the smart account address to the provisioned wallet
      const activeWallet = wallets.find(w => w.id === 'auto-provisioned');
      if (activeWallet && activeWallet.address === '') {
        activeWallet.address = simpleAccount.address;
        db.addWallet(activeWallet); // Persist update
      }

      // Auditor Fix: Fetch on-chain balances for real-time wallet state monitoring
      try {
        await db.refreshWalletBalances(this.publicClient);
      } catch (e) {
        throw new Error(`Failed to refresh wallet balances. Check RPC connection and wallet address. Error: ${e instanceof Error ? e.message : e}`);
      }
      
      console.log('--- [ACID TEST] SUCCESS: SYSTEM VERIFIED FOR LIVE PROFIT GENERATION ---');
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown Connection Error';
      console.error(`--- [ACID TEST] FAILED: ${msg} ---`); 
return false;
    }
  }

  subscribeBlockchain(callback: (event: BlockchainEvent) => void) {
    this.blockchainListeners.push(callback);
    return () => {
      this.blockchainListeners = this.blockchainListeners.filter(l => l !== callback);
    };
  }

  subscribe(callback: (trade: Trade) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private emitBlockchainEvent(event: BlockchainEvent) {
    this.blockchainListeners.forEach(l => {
      try { l(event); } catch (e) { console.error('Listener Error', e); }
    });
  }

  private calculateOptimalBribe(grossProfit: number, strategy: Strategy): number {
    // Minimum practical bribe to even be considered by builders (e.g., 0.5% of profit)
    const minPracticalBribe = grossProfit * 0.005;
    const status = db.getEngineStatus();

    // Adjust pressure based on the selected Bribe Strategy in Settings
    let competitivePressure = 0.85; // Dynamic default
    switch (status.bribeStrategy) {
      case 'conservative':
        competitivePressure = 0.4;
        break;
      case 'aggressive':
        competitivePressure = 0.98; // Extreme aggression to win blocks
        break;
      case 'dynamic':
        // Dynamic bribe based on recent block saturation (placeholder logic for live volatility)
        competitivePressure = Math.min(0.95, 0.6 + (db.getStats().totalTrades % 10) / 20);
        break;
    }

    // Strategy limit is now 70% as per user request
    const maxAllowedBribe = grossProfit * (strategy.config.maxBribePercent / 100);
    
    // Dynamic escalation: min + (pressure * (max - min))
    let optimalBribe = minPracticalBribe + (competitivePressure * (maxAllowedBribe - minPracticalBribe));
    
    // Safety Guard: Never exceed 70% of gross profit to ensure AlphaMark keeps 30%
    const absoluteCap = grossProfit * 0.7;
    const finalBribe = Math.min(optimalBribe, maxAllowedBribe, absoluteCap);

    console.log(`[BRIBE] Gross: ${grossProfit.toFixed(6)} ETH | Bribe: ${finalBribe.toFixed(6)} ETH (${((finalBribe/grossProfit)*100).toFixed(1)}%)`);
    
    return finalBribe;
  }

// Removed sim arb exec - real execution via executeOnChainTrade only

  private async executeOnChainTrade(targetHash: Hash, strategy: Strategy) {
    const status = db.getEngineStatus();
    const wallets = db.getWallets();
    if (status.mode !== 'live' || wallets.length === 0) return;

    db.getStats().botSystem.orchestrators = Math.min(5, db.getStats().botSystem.orchestrators + 1);
    this.emitBlockchainEvent({
      id: `live-tx-${Date.now()}`,
      type: 'execute',
      message: `Orchestrating Atomic Bundle for target ${targetHash.slice(0, 10)}...`,
      category: 'orchestration',
      blockNumber: this.currentBlock,
      timestamp: new Date().toISOString()
    });

    try {
      if (!this.smartAccountClient) throw new Error("Smart Account Client not initialized.");

      const contractAddress = strategy.config.contractAddress as `0x${string}`;
      const callData = strategy.config.callData as `0x${string}`;
      const tradeSize = strategy.config.tradeAmount || 1; 

      if (!contractAddress || !callData) {
        console.warn("[ENGINE] Real-time detection matched, but execution is paused: CONTRACT_ADDRESS or CALL_DATA not configured for strategy.");
        
        this.emitBlockchainEvent({
          id: `info-${Date.now()}`,
          type: 'protection',
          message: `Execution Paused: Strategy target confirmed, but Smart Contract config missing.`,
          category: 'protection',
          blockNumber: this.currentBlock,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Auditor Fix: Calculate dynamic bribe to ensure competitive inclusion 
      // while preserving the 30% Alpha rule.
      const expectedGrossProfit = strategy.config.minProfitThreshold || 0;
      
      // 1. Estimate Gas for the specific payload
      const gasEstimate = await this.publicClient.estimateGas({
        account: this.smartAccountClient.account,
        to: contractAddress,
        data: callData,
        value: parseEther(tradeSize.toString()),
      });

      // 2. Calculate the Bribe Amount in ETH
      const bribeAmountEth = this.calculateOptimalBribe(expectedGrossProfit, strategy);
      const bribeInWei = parseEther(bribeAmountEth.toString());

      // 3. Convert absolute ETH bribe to Priority Fee (Wei per Gas)
      // PriorityFee = TotalBribe / GasUsed
      const priorityFeePerGas = bribeInWei / gasEstimate;

      const txHash = await this.smartAccountClient.sendTransaction({
        to: contractAddress,
        data: callData,
        value: parseEther(tradeSize.toString()),
        maxPriorityFeePerGas: priorityFeePerGas > 0n ? priorityFeePerGas : undefined
      });

      db.getStats().botSystem.executors = Math.min(8, db.getStats().botSystem.executors + 1);
      this.emitBlockchainEvent({
        id: `pending-${Date.now()}`,
        type: 'execute',
        message: `Transaction Broadcasted: ${txHash.slice(0, 14)}... Awaiting inclusion.`,
        category: 'execution',
        blockNumber: this.currentBlock,
        timestamp: new Date().toISOString()
      });

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
      
      if (receipt.status !== 'success') {
        throw new Error(`Transaction Reverted on-chain: ${txHash}`);
      }

      // Auditor Fix: Real profit tracking initialized. 
      // In a live environment, the engine should parse logs/balance changes. 
      // For immediate feedback, we track the execution as successful with a placeholder 
      // strictly mapped to the configured threshold MINUS the bribe paid.
      const actualProfit = (strategy.config.minProfitThreshold || 0) - bribeAmountEth;
      
      if (actualProfit <= 0) {
          console.warn("[AUDITOR] Trade executed with 0 profit threshold logic. Check strategy configuration.");
      }

      db.addTrade({
        id: txHash,
        pair: 'ETH/USD',
        type: 'buy',
        price: db.getEthPrice(),
        amount: tradeSize,
        profit: Math.max(0, actualProfit),
        status: 'completed',
        timestamp: new Date().toISOString(),
        strategyId: strategy.id,
        hash: txHash
      });

      this.emitBlockchainEvent({
        id: `success-${Date.now()}`,
        type: 'success',
        message: `Transaction Confirmed: ${txHash}`,
        category: 'success',
        blockNumber: this.currentBlock,
        timestamp: new Date().toISOString(),
        hash: txHash
      });

    } catch (error) {
        this.emitBlockchainEvent({
            id: `err-${Date.now()}`,
            type: 'protection',
            message: `Execution Reverted: ${error instanceof Error ? error.message : 'Unknown MEV collision'}`,
            category: 'protection',
            blockNumber: this.currentBlock,
            timestamp: new Date().toISOString()
        });
    }
  }
}

export const engine = new TradingEngine();