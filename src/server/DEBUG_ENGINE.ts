import { db } from './db';
import { engine } from './engine';

console.log('DEBUG: Engine status:', db.getEngineStatus());
console.log('DEBUG: Wallets:', db.getWallets());
console.log('DEBUG: Readiness:', db.getVerifiedReadiness());
console.log('DEBUG: RPC Quotas:', db.getRPCQuotas());
console.log('DEBUG: Strategies:', db.getStrategies());
console.log('DEBUG: Env ALCHEMY:', process.env.ALCHEMY_ETH_KEY ? 'SET' : 'MISSING');
