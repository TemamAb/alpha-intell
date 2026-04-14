import { Router } from 'express';
import { db } from './db';
import { engine } from './engine';

const router = Router();

// --- SECURITY: Rate Limiting ---
// Simple in-memory rate limiter for control endpoints
const rateLimit = new Map<string, number>();
const LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;

const controlRateLimiter = (req: any, res: any, next: any) => {
  const ip = req.ip;
  const now = Date.now();
  const userData = rateLimit.get(ip) || 0;

  if (userData > MAX_REQUESTS) {
    return res.status(429).json({ error: "Too many requests. Please wait before attempting to control the engine again." });
  }

  rateLimit.set(ip, userData + 1);
  setTimeout(() => rateLimit.set(ip, (rateLimit.get(ip) || 1) - 1), LIMIT_WINDOW);
  next();
};

// Stats & Infrastructure
router.get("/stats", (req, res) => {
  res.json({
    ...db.getStats(),
    ethPrice: db.getEthPrice()
  });
});

router.get("/rpc/quotas", (req, res) => {
  res.json(db.getRPCQuotas());
});

router.get("/readiness", (req, res) => {
  res.json(db.getReadiness());
});

router.post("/readiness/update", (req, res) => {
  const { id, status } = req.body;
  db.updateReadiness(id, status);
  res.json({ success: true });
});

router.get("/forging/targets", (req, res) => {
  res.json(db.getTargetWallets());
});

router.get("/ping", (req, res) => {
  res.json({
    ethereum: Math.floor(Math.random() * 50) + 20,
    polygon: Math.floor(Math.random() * 30) + 10,
    bsc: Math.floor(Math.random() * 60) + 30,
    arbitrum: Math.floor(Math.random() * 40) + 15,
  });
});

// Wallets
router.get("/wallets", (req, res) => {
  res.json(db.getWallets());
});

router.post("/wallet/add", (req, res) => {
  const { address, chain } = req.body;
  const newWallet = {
    id: Math.random().toString(36).substr(2, 9),
    address,
    key: '••••••••••••••••',
    chain,
    balance: 0,
    isAA: true,
    paymasterStatus: 'active' as const
  };
  db.addWallet(newWallet);
  res.json({ success: true, wallet: newWallet });
});

router.post("/wallet/remove", (req, res) => {
  const { id } = req.body;
  db.removeWallet(id);
  res.json({ success: true });
});

// Strategies
router.get("/strategies", (req, res) => {
  res.json(db.getStrategies());
});

router.post("/strategy/toggle", (req, res) => {
  const { id, status } = req.body;
  db.updateStrategy(id, { status });
  res.json({ success: true });
});

// Control (Rate Limited for Enterprise Security)
router.get("/control/status", (req, res) => {
  res.json(db.getEngineStatus());
});

router.post("/control/start", controlRateLimiter, (req, res) => {
  const { mode, bribeStrategy, flashLoanEnabled } = req.body;
  
  // Auditor Fix: Block live mode if readiness is not 100%
  if (mode === 'live') {
    const readiness = db.getReadiness();
    const allCompleted = readiness.every(s => s.status === 'completed');
    if (!allCompleted) {
      return res.status(400).json({ 
        success: false, 
        error: "Security Protocol Violation: Cannot start Live Mode until all readiness requirements are met.",
        missing: readiness.filter(s => s.status !== 'completed').map(s => s.id)
      });
    }
  }

  db.setEngineStatus({ 
    running: true, 
    mode, 
    gasless: true,
    bribeStrategy: bribeStrategy || 'dynamic',
    flashLoanEnabled: flashLoanEnabled !== undefined ? flashLoanEnabled : true
  });
  engine.start();
  res.json({ success: true, status: db.getEngineStatus() });
});

router.post("/wallet/withdraw", (req, res) => {
  const { amount } = req.body;
  const success = db.withdraw(Number(amount));
  if (success) {
    res.json({ success: true, message: `Successfully initiated withdrawal of ${amount} ETH to external vault.` });
  } else {
    res.status(400).json({ success: false, error: 'Insufficient balance in execution wallet.' });
  }
});

router.post("/control/stop", (req, res) => {
  const current = db.getEngineStatus();
  db.setEngineStatus({ 
    ...current,
    running: false 
  });
  engine.stop();
  res.json({ success: true, status: db.getEngineStatus() });
});

// Live Trades Stream (SSE)
router.get("/trades/stream", (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial history
  const history = db.getTrades().slice(0, 10);
  res.write(`data: ${JSON.stringify({ type: 'history', trades: history })}\n\n`);

  const unsubscribe = engine.subscribe((trade) => {
    res.write(`data: ${JSON.stringify({ type: 'trade', trade })}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});

// AI Copilot Proxy (Prevents API Key Leakage)
router.post("/ai/query", async (req, res) => {
  const { prompt, stats } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Gemini API Key not configured on server." });
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const genAI = new GoogleGenAI({ apiKey });
    const response = await genAI.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `
          You are AlphaMark AI, an institutional-grade trading assistant.
          Current User Telemetry:
          - Total Profit: ${stats?.totalProfit.toFixed(4)} ETH (Equivalent to $${(stats?.totalProfit * (stats?.ethPrice || 2500)).toLocaleString()})
          - Current ETH Price: $${stats?.ethPrice || 'N/A'}
          - Trading Win Rate: ${stats?.winRate?.toFixed(1)}%
          - Execution Success: ${stats?.totalTrades} completed trades.

          CRITICAL: Always refer to profit in ETH unless specifically asked for USD. Never confuse the two.
        `
      }
    });
    res.json({ response: response.text });
  } catch (error: any) {
    console.error("AI Proxy Error:", error);
    res.status(500).json({ error: "Failed to process AI query." });
  }
});

export default router;
