import { db } from './db';
import { createPublicClient, http, fallback } from 'viem';
import { mainnet } from 'viem/chains';
import { ReadinessStep } from '../types';

export async function checkLiveReadiness(): Promise<ReadinessStep[]> {
  const client = createPublicClient({
    chain: mainnet,
    transport: fallback([
      process.env.ALCHEMY_ETH_KEY ? http(`https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_ETH_KEY}`) : undefined,
      process.env.INFURA_ETH_KEY ? http(`https://mainnet.infura.io/v3/${process.env.INFURA_ETH_KEY}`) : undefined,
      http('https://rpc.ankr.com/eth'),
    ].filter(Boolean))
  });

  const readiness: ReadinessStep[] = [];

  // RPC Check
  try {
    const chainId = await client.getChainId();
    readiness.push({ id: 'rpc', status: 'completed', discoveredValue: `Chain ${chainId}` });
  } catch {
    readiness.push({ id: 'rpc', status: 'critical' });
  }

  // Blockchain Sync
  try {
    const block = await client.getBlockNumber();
    readiness.push({ id: 'blockchain', status: 'completed', discoveredValue: `Block ${block}` });
  } catch {
    readiness.push({ id: 'blockchain', status: 'critical' });
  }

  // Wallet Check
  const wallets = db.getWallets();
  const hasValidWallet = wallets.some(w => w.address && !w.address.includes('...') && w.address.startsWith('0x'));
  readiness.push({ id: 'wallet', status: hasValidWallet ? 'completed' : 'critical', discoveredValue: hasValidWallet ? wallets[0].address.slice(0, 10) + '...' : undefined });

  // Key Decryption
  const decrypted = db.getDecryptedKey(wallets[0]?.id);
  readiness.push({ id: 'key', status: decrypted ? 'completed' : 'critical' });

  // Balance Check - Skip if gasless AA enabled
  const engineStatus = db.getEngineStatus();
  if (engineStatus.gasless) {
    readiness.push({ id: 'balance', status: 'completed', discoveredValue: 'Gasless AA' });
  } else {
    try {
      if (hasValidWallet) {
        const balance = await client.getBalance({ address: wallets[0].address as `0x${string}` });
        const ethBalance = Number(balance) / 1e18;
        readiness.push({ id: 'balance', status: ethBalance > 0.1 ? 'completed' : 'critical', discoveredValue: `${ethBalance.toFixed(4)} ETH` });
      } else {
        readiness.push({ id: 'balance', status: 'critical' });
      }
    } catch {
      readiness.push({ id: 'balance', status: 'critical' });
    }
  }

  // Strategy Professional Naming
  const strategies = db.getStrategies();
  const hasProfessionalNames = strategies.every(s => !s.name.toLowerCase().includes('neural') && !s.name.toLowerCase().includes('alphamark') && s.name.length < 50);
  readiness.push({ id: 'strategy_naming', status: hasProfessionalNames ? 'completed' : 'critical', label: 'Professional Strategy Names' });

  // Target Wallets Professional Naming
  const targets = db.getTargetWallets();
  const hasCleanTargets = targets.every(t => !t.label.toLowerCase().includes('jared') && !t.label.toLowerCase().includes('subway'));
  readiness.push({ id: 'target_naming', status: hasCleanTargets ? 'completed' : 'critical', label: 'Clean Target Labels' });

  return readiness;
}