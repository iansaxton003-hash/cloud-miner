# Cloud Miner

A sophisticated cloud-based cryptocurrency mining platform with plug-in architecture for dynamic hashrate management.

## Features

- **50 Rig Slots**: Scalable mining rig management
- **Upgradeable Architecture**: Expand capacity as needed
- **Individual Rig Control**: Adjust each rig from 0 to 10,000,000 TH/s
- **Plugin System**: Add custom hashrate providers via internet queries
- **Cryptocurrency Selection**: Search and select mining parameters
- **Real-time Monitoring**: Track performance across all rigs

## Quick Start

```bash
npm install
npm run dev
```

## Architecture

- `src/core/` - Core mining engine
- `src/rigs/` - Rig management system
- `src/plugins/` - Plugin architecture for hashrate providers
- `src/crypto/` - Cryptocurrency search and parameters
- `src/api/` - REST API endpoints
