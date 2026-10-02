import express, { Router, Request, Response } from 'express';
import { RigManager } from '../core/RigManager';
import { PluginManager } from '../plugins/PluginManager';
import { CryptoSearcher } from '../crypto/CryptoSearcher';
import { MiningEngine, PoolConnection } from '../mining/MiningEngine';

export function createRoutes(
  rigManager: RigManager,
  pluginManager: PluginManager,
  cryptoSearcher: CryptoSearcher,
  miningEngine: MiningEngine
): Router {
  const router = express.Router();

  // ==================== RIG MANAGEMENT ====================
  router.post('/rigs', (req: Request, res: Response) => {
    const { name, cryptocurrency } = req.body;
    const rig = rigManager.createRig(name, cryptocurrency);
    res.json(rig || { error: 'Failed to create rig' });
  });

  router.get('/rigs', (req: Request, res: Response) => {
    res.json(rigManager.getAllRigs());
  });

  router.get('/rigs/:rigId', (req: Request, res: Response) => {
    const rig = rigManager.getRig(req.params.rigId);
    res.json(rig || { error: 'Rig not found' });
  });

  router.put('/rigs/:rigId/hashrate', (req: Request, res: Response) => {
    const { hashrate } = req.body;
    const success = rigManager.updateHashrate(req.params.rigId, hashrate);
    res.json({ success, message: success ? 'Updated' : 'Failed' });
  });

  router.delete('/rigs/:rigId', (req: Request, res: Response) => {
    const success = rigManager.deleteRig(req.params.rigId);
    res.json({ success, message: success ? 'Deleted' : 'Not found' });
  });

  router.get('/stats', (req: Request, res: Response) => {
    res.json({
      totalHashrate: rigManager.getTotalHashrate(),
      activeRigs: rigManager.getActiveRigCount(),
      totalRigs: rigManager.getAllRigs().length,
    });
  });

  // ==================== NON-CUSTODIAL POOL CATALOG ====================
  // Metadata only: the client must provide its own wallet and authorize any connection.
  router.get('/pools', (_req: Request, res: Response) => {
    res.json([
      { id: 'braiins-pool', name: 'Braiins Pool', website: 'https://braiins.com/pool', network: 'Bitcoin', connectionType: 'stratum', requiresUserWallet: true },
      { id: 'btc-com', name: 'BTC.com Pool', website: 'https://pool.btc.com', network: 'Bitcoin', connectionType: 'stratum', requiresUserWallet: true },
      { id: 'binance-pool', name: 'Binance Pool', website: 'https://pool.binance.com', network: 'Bitcoin', connectionType: 'stratum', requiresUserWallet: true },
    ]);
  });

  router.post('/wallet/claim-review', (req: Request, res: Response) => {
    const { amount = 0, currency = 'USD', walletAddress } = req.body || {};
    res.json({
      kind: 'claim-review',
      amount: Math.max(0, Number(amount) || 0),
      currency,
      walletAddress: walletAddress || null,
      requiresUserConfirmation: true,
      requiresProviderAuthorization: true,
      custodialTransfer: false,
      message: 'Review only. No funds were transferred by this request.',
    });
  });

  // ==================== PLUGIN ROUTES ====================
  router.get('/plugins', (req: Request, res: Response) => {
    res.json(pluginManager.getAllPlugins());
  });

  router.put('/plugins/:portId/toggle', (req: Request, res: Response) => {
    const { enabled } = req.body;
    const success = pluginManager.togglePlugin(req.params.portId, enabled);
    res.json({ success });
  });

  router.post('/plugins/:portId/query', async (req: Request, res: Response) => {
    const hashrate = await pluginManager.queryPlugin(req.params.portId);
    res.json({ hashrate: hashrate ?? 0 });
  });

  // ==================== CRYPTOCURRENCY SEARCH & DISCOVERY ====================
  router.get('/crypto/search', async (req: Request, res: Response) => {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }
    const results = await cryptoSearcher.searchCrypto(query as string);
    res.json(results);
  });

  router.get('/crypto/:symbol', async (req: Request, res: Response) => {
    const info = await cryptoSearcher.getCryptoInfo(req.params.symbol);
    res.json(info || { error: 'Not found' });
  });

  router.get('/crypto/popular/mining', async (req: Request, res: Response) => {
    const coins = await cryptoSearcher.getPopularMiningCoins();
    res.json(coins);
  });

  // ==================== MINING ENGINE - AUTO MINE TAB ====================
  // Legacy automatic discovery is intentionally disabled. Pool and rig authorization must be explicit.
  router.post('/mining/auto/start', (_req: Request, res: Response) => {
    res.status(410).json({ success: false, error: 'Legacy auto-mining is disabled. Configure an approved pool and authorize an owned rig through the non-custodial flow.' });
  });
  router.post('/mining/auto/search-and-mine', (_req: Request, res: Response) => {
    res.status(410).json({ success: false, error: 'Automatic pool discovery and mining are disabled. Use explicit approved pool authorization.' });
  });

  /**
   * GET /api/mining/auto - Get all active auto-mining sessions
   */
  router.get('/mining/auto', (req: Request, res: Response) => {
    const sessions = miningEngine.getActiveSessions();
    const totalProfit = miningEngine.getTotalProfit();
    
    res.json({
      activeSessions: sessions.length,
      totalProfit: totalProfit.toFixed(2),
      sessions: sessions.map((s) => ({
        id: s.id,
        rigId: s.rigId,
        cryptocurrency: s.cryptocurrency,
        poolAddress: s.poolAddress,
        workerName: s.workerName,
        hashrate: s.hashrate,
        status: s.status,
        uptime: s.uptime,
        sharesAccepted: s.sharesAccepted,
        hashAccuracy: s.hashAccuracy.toFixed(2),
        dailyProfit: s.netProfitUSD.toFixed(2),
        poolLatency: s.poolLatency,
      })),
    });
  });

  /**
   * POST /api/mining/auto/stop/:sessionId - Stop specific mining session
   */
  router.post('/mining/auto/stop/:sessionId', (req: Request, res: Response) => {
    const success = miningEngine.stopMining(req.params.sessionId);
    res.json({
      success,
      message: success ? 'Mining stopped' : 'Session not found',
    });
  });

  /**
   * GET /api/mining/auto/profit-analysis - Get profit analysis for all active sessions
   */
  router.get('/mining/auto/profit-analysis', (req: Request, res: Response) => {
    const sessions = miningEngine.getActiveSessions();

    const analysis = sessions.map((s) => ({
      cryptocurrency: s.cryptocurrency,
      hashrate: s.hashrate,
      dailyReward: `$${s.rewardUSD.toFixed(2)}`,
      dailyPower: `$${s.powerCostUSD.toFixed(2)}`,
      dailyProfit: `$${s.netProfitUSD.toFixed(2)}`,
      poolLatency: `${s.poolLatency}ms`,
      hashAccuracy: `${s.hashAccuracy.toFixed(2)}%`,
      sharesAccepted: s.sharesAccepted,
      uptime: `${Math.floor(s.uptime / 3600)}h ${Math.floor((s.uptime % 3600) / 60)}m`,
    }));

    res.json({
      activeSessions: sessions.length,
      totalDailyProfit: `$${miningEngine.getTotalProfit().toFixed(2)}`,
      sessions: analysis,
    });
  });

  /**
   * POST /api/mining/auto/start-simulation - Start mining simulation loop
   */
  router.post('/mining/auto/start-simulation', (req: Request, res: Response) => {
    res.status(410).json({ success: false, error: 'Simulation is disabled; connect authorized hardware or a documented pool integration.' });
  });

  /**
   * POST /api/mining/auto/stop-simulation - Stop mining simulation
   */
  router.post('/mining/auto/stop-simulation', (req: Request, res: Response) => {
    res.status(410).json({ success: false, error: 'Simulation is disabled.' });
  });

  /**
   * GET /api/mining/auto/session/:sessionId - Get detailed session info
   */
  router.get('/mining/auto/session/:sessionId', (req: Request, res: Response) => {
    const session = miningEngine.getSession(req.params.sessionId);
    res.json(session || { error: 'Session not found' });
  });

  return router;
}
