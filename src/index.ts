import express from 'express';
import { RigManager } from './core/RigManager';
import { PluginManager } from './plugins/PluginManager';
import { CryptoSearcher } from './crypto/CryptoSearcher';
import { createRoutes } from './api/routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Initialize managers
const rigManager = new RigManager(50);
const pluginManager = new PluginManager(10);
const cryptoSearcher = new CryptoSearcher();

// Setup routes
app.use('/api', createRoutes(rigManager, pluginManager, cryptoSearcher));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Cloud Miner running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

export default app;
