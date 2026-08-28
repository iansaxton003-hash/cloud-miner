export interface Rig {
  id: string;
  name: string;
  hashrate: number; // 0 to 10,000,000 TH/s
  status: 'active' | 'inactive' | 'error';
  cryptocurrency: string;
  uptime: number; // seconds
  temperature: number;
  powerConsumption: number; // watts
  createdAt: Date;
  updatedAt: Date;
}

export interface MiningPool {
  id: string;
  name: string;
  url: string;
  supportedCoins: string[];
  difficulty: number;
  minPayment: number;
}

export interface Cryptocurrency {
  symbol: string;
  name: string;
  algorithm: string;
  difficulty: number;
  blockReward: number;
  networkHashrate: number;
  profitability: number; // $per TH/s
}

export interface PluginProvider {
  name: string;
  version: string;
  query(): Promise<number>; // Returns hashrate
}

export interface MinerConfig {
  maxRigs: number;
  updateInterval: number; // milliseconds
  pluginPorts: PluginPort[];
}

export interface PluginPort {
  id: string;
  name: string;
  enabled: boolean;
  provider: PluginProvider;
}
