import express, { Router, Request, Response } from 'express';
import { RigManager } from '../core/RigManager';
import { PluginManager } from '../plugins/PluginManager';
import { CryptoSearcher } from '../crypto/CryptoSearcher';

export function createRoutes(
  rigManager: RigManager,
  pluginManager: PluginManager,
  cryptoSearcher: CryptoSearcher
): Router {
  const router = express.Router();

  // Rig Management Routes
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

  // Plugin Routes
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

  // Cryptocurrency Routes
  router.get('/crypto/search', async (req: Request, res: Response) => {
    const { query } = req.query;
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

  return router;
}
