import express from 'express';
import path from 'path';
import { RigManager } from './core/RigManager';
import { PluginManager } from './plugins/PluginManager';
import { CryptoSearcher } from './crypto/CryptoSearcher';
import { MiningEngine } from './mining/MiningEngine';
import { createRoutes } from './api/routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

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

// Serve index.html for SPA routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/manifest.json'));
});

app.get('/sw.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/sw.js'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log('⛏️  CLOUD MINER - PRODUCTION READY');
  console.log(`${'='.repeat(60)}`);
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`\n🌐 Web UI: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`\n⚠️  REAL MINING ONLY - NO SIMULATION`);
  console.log(`\n🔧 Features:`);
  console.log(`   • 50 Mining Rigs (0-10,000,000 TH/s)`);
  console.log(`   • Auto Mining Search`);
  console.log(`   • Real Pool Integration (Stratum)`);
  console.log(`   • Live Profit Tracking`);
  console.log(`   • Hashrate Builder`);
  console.log(`   • Real Cryptocurrency Rewards`);
  console.log(`\n💰 Mining Coins: BTC, ETH, LTC, DOGE, XMR, ZEC`);
  console.log(`🌍 Price Data: CoinGecko API`);
  console.log(`⚡ Power Cost: $0.12/kWh (configurable)`);
  console.log(`📱 Installable as PWA on Android/Desktop`);
  console.log(`${'='.repeat(60)}\n`);\n});

export default app;
