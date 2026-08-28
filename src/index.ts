import express from 'express';
import { RigManager } from './core/RigManager';
import { PluginManager } from './plugins/PluginManager';
import { CryptoSearcher } from './crypto/CryptoSearcher';
import { MiningEngine } from './mining/MiningEngine';
import { createRoutes } from './api/routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Initialize managers
const rigManager = new RigManager(50);
const pluginManager = new PluginManager(10);
const cryptoSearcher = new CryptoSearcher();
const miningEngine = new MiningEngine(0.12, 1); // $0.12/kWh, 1% pool fee

// Setup routes
app.use('/api', createRoutes(rigManager, pluginManager, cryptoSearcher, miningEngine));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Cloud Miner running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`⚠️  REAL MINING ONLY - NO SIMULATION`);
  console.log(`    AUTO MINE: POST /api/mining/auto/search-and-mine`);
  console.log(`    Profits from actual pool rewards only`);
});

export default app;
