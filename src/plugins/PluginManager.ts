import { PluginPort, PluginProvider } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class PluginManager {
  private ports: Map<string, PluginPort> = new Map();
  private maxPorts: number = 10;

  constructor(maxPorts: number = 10) {
    this.maxPorts = maxPorts;
  }

  /**
   * Register a new plugin provider
   */
  registerPlugin(
    name: string,
    provider: PluginProvider
  ): PluginPort | null {
    if (this.ports.size >= this.maxPorts) {
      console.error(`Maximum plugin ports (${this.maxPorts}) reached`);
      return null;
    }

    const port: PluginPort = {
      id: uuidv4(),
      name,
      enabled: true,
      provider,
    };

    this.ports.set(port.id, port);
    return port;
  }

  /**
   * Query all enabled plugins for hashrate
   */
  async queryAllPlugins(): Promise<Map<string, number>> {
    const results = new Map<string, number>();

    for (const [portId, port] of this.ports) {
      if (!port.enabled) continue;

      try {
        const hashrate = await port.provider.query();
        results.set(portId, hashrate);
      } catch (error) {
        console.error(`Plugin ${port.name} query failed:`, error);
        results.set(portId, 0);
      }
    }

    return results;
  }

  /**
   * Query a specific plugin
   */
  async queryPlugin(portId: string): Promise<number | null> {
    const port = this.ports.get(portId);
    if (!port || !port.enabled) return null;

    try {
      return await port.provider.query();
    } catch (error) {
      console.error(`Plugin ${port.name} query failed:`, error);
      return null;
    }
  }

  /**
   * Enable/disable a plugin
   */
  togglePlugin(portId: string, enabled: boolean): boolean {
    const port = this.ports.get(portId);
    if (!port) return false;

    port.enabled = enabled;
    return true;
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): PluginPort[] {
    return Array.from(this.ports.values());
  }

  /**
   * Remove a plugin
   */
  removePlugin(portId: string): boolean {
    return this.ports.delete(portId);
  }
}
