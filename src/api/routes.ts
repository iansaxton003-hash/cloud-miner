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
   * POST /api/mining/auto/start - Search blockchain and auto-start mining
   * Body: { cryptocurrency: 'BTC', hashrate: 1000, powerConsumption: 800 }
   */
  router.post('/mining/auto/start', async (req: Request, res: Response) => {
    const { cryptocurrency, hashrate = 500, powerConsumption = 800 } = req.body;

    if (!cryptocurrency) {
      return res.status(400).json({ error: 'Cryptocurrency required' });
    }

    // Create a rig for this mining session
    const rig = rigManager.createRig(
      `Auto-Miner-${cryptocurrency}`,
      cryptocurrency
    );

    if (!rig) {
      return res.status(400).json({ error: 'Cannot create rig - limit reached' });
    }

    // Default pool configs for major cryptos
    const poolConfigs: { [key: string]: PoolConnection } = {
      BTC: {
        poolUrl: 'stratum.mining.pool.com',
        poolPort: 3333,
        walletAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        workerName: `cloud-miner-${rig.id.slice(0, 8)}`,
        password: 'x',
      },
      ETH: {
        poolUrl: 'eth.mining.pool.com',
        poolPort: 3333,
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f42e6f',
        workerName: `cloud-miner-${rig.id.slice(0, 8)}`,
        password: 'x',
      },
      LTC: {
        poolUrl: 'ltc.mining.pool.com',
        poolPort: 3334,
        walletAddress: 'LepeMro9eHmirPUV6dEkRrGpjV6S6zUvEv',
        workerName: `cloud-miner-${rig.id.slice(0, 8)}`,
        password: 'x',
      },
      DOGE: {
        poolUrl: 'doge.mining.pool.com',
        poolPort: 3333,
        walletAddress: 'DDogepartyxxxxxxxxxxxxxxxxxxw1DADAob',
        workerName: `cloud-miner-${rig.id.slice(0, 8)}`,
        password: 'x',
      },
      XMR: {
        poolUrl: 'xmr.mining.pool.com',
        poolPort: 3333,
        walletAddress: '47BkjkhHVxvqHqJC7d5h9U6d2mV1MF9YJaUCmZBjPbgY7aASf4MqTvJhww1E7V3E6wNvjG7vJGZKz1cPmkP3dBWQ4DqAJNH',
        workerName: `cloud-miner-${rig.id.slice(0, 8)}`,
        password: 'x',
      },
      ZEC: {
        poolUrl: 'zec.mining.pool.com',
        poolPort: 3334,
        walletAddress: 't1VB7d3yw86h1JwqvNFM3H8wgqvGzXxT9gV',
        workerName: `cloud-miner-${rig.id.slice(0, 8)}`,
        password: 'x',
      },
    };

    const poolConfig = poolConfigs[cryptocurrency.toUpperCase()];
    if (!poolConfig) {
      return res.status(400).json({
        error: `No pool config for ${cryptocurrency}. Supported: BTC, ETH, LTC, DOGE, XMR, ZEC`,
      });
    }

    // Connect to pool and start mining
    const result = await miningEngine.connectAndMine(
      rig.id,
      poolConfig,
      cryptocurrency,
      hashrate,
      powerConsumption
    );

    if (result.success) {
      rigManager.updateHashrate(rig.id, hashrate);
      return res.json({
        success: true,
        message: `Auto-mining ${cryptocurrency} started`,
        session: result.session,
        rig: rig,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to start mining',
      });
    }
  });

  /**
   * POST /api/mining/auto/search-and-mine - Smart search for profitable coins and auto-mine
   */
  router.post('/mining/auto/search-and-mine', async (req: Request, res: Response) => {
    const { minProfitPerDay = 0.5, maxRigs = 3 } = req.body;

    try {
      // Get popular mining coins
      const popularCoins = await cryptoSearcher.getPopularMiningCoins();

      if (popularCoins.length === 0) {
        return res.status(400).json({ error: 'Could not fetch cryptocurrency data' });
      }

      const startedMining: any[] = [];
      const failedAttempts: any[] = [];
      let rigsStarted = 0;

      // Try to mine profitable coins
      for (const coin of popularCoins) {
        if (rigsStarted >= maxRigs) break;

        const rig = rigManager.createRig(
          `Auto-Smart-${coin.symbol}`,
          coin.symbol
        );

        if (!rig) break;

        // Default pool config
        const poolConfig: PoolConnection = {
          poolUrl: `${coin.symbol.toLowerCase()}.mining.pool.com`,
          poolPort: 3333,
          walletAddress: `wallet_${coin.symbol}`,
          workerName: `cloud-${rig.id.slice(0, 8)}`,
          password: 'x',
        };

        const result = await miningEngine.connectAndMine(
          rig.id,
          poolConfig,
          coin.symbol,
          500, // 500 TH/s default
          800 // 800W power
        );

        if (result.success && result.session) {
          rigManager.updateHashrate(rig.id, 500);
          startedMining.push({
            coin: coin.symbol,
            name: coin.name,
            profit: result.session.netProfitUSD,
          });
          rigsStarted++;
        } else {
          failedAttempts.push({
            coin: coin.symbol,
            error: result.error,
          });
        }
      }

      res.json({
        success: rigsStarted > 0,
        rigsStarted,
        mining: startedMining,
        failed: failedAttempts,
        totalProfit: miningEngine.getTotalProfit().toFixed(2),
      });
    } catch (error) {
      res.status(500).json({
        error: `Search and mine failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    }
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
    miningEngine.startMining();
    res.json({ success: true, message: 'Mining simulation started' });
  });

  /**
   * POST /api/mining/auto/stop-simulation - Stop mining simulation
   */
  router.post('/mining/auto/stop-simulation', (req: Request, res: Response) => {
    miningEngine.stopAllMining();
    res.json({ success: true, message: 'Mining simulation stopped' });
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
