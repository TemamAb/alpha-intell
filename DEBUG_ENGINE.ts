import { db } from './db';
import { engine } from './engine';

console.log('DEBUG: Engine status:', db.getEngineStatus());
console.log('DEBUG: Wallets:', db.getWallets());
console.log('DEBUG: Readiness:', db.getVerifiedReadiness());
console.log('DEBUG: RPC Quotas:', db.getRPCQuotas());
console.log('DEBUG: Strategies:', db.getStrategies());

(async () => {
  await engine.start();
})().catch(console.error);
