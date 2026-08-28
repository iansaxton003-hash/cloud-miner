import { Rig, Cryptocurrency } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class RigManager {
  private rigs: Map<string, Rig> = new Map();
  private maxRigs: number = 50;
  private totalHashrate: number = 0;

  constructor(maxRigs: number = 50) {
    this.maxRigs = maxRigs;
  }

  /**
   * Create a new mining rig
   */
  createRig(name: string, cryptocurrency: string): Rig | null {
    if (this.rigs.size >= this.maxRigs) {
      console.error(`Maximum rig limit (${this.maxRigs}) reached`);
      return null;
    }

    const rig: Rig = {
      id: uuidv4(),
      name,
      hashrate: 0,
      status: 'inactive',
      cryptocurrency,
      uptime: 0,
      temperature: 0,
      powerConsumption: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.rigs.set(rig.id, rig);
    return rig;
  }

  /**
   * Update rig hashrate (0 to 10,000,000 TH/s)
   */
  updateHashrate(rigId: string, hashrate: number): boolean {
    const rig = this.rigs.get(rigId);
    if (!rig) return false;

    // Validate hashrate range
    if (hashrate < 0 || hashrate > 10_000_000) {
      console.error(`Hashrate must be between 0 and 10,000,000 TH/s`);
      return false;
    }

    // Update total hashrate
    this.totalHashrate -= rig.hashrate;
    this.totalHashrate += hashrate;

    rig.hashrate = hashrate;
    rig.status = hashrate > 0 ? 'active' : 'inactive';
    rig.updatedAt = new Date();

    return true;
  }

  /**
   * Get rig by ID
   */
  getRig(rigId: string): Rig | undefined {
    return this.rigs.get(rigId);
  }

  /**
   * Get all rigs
   */
  getAllRigs(): Rig[] {
    return Array.from(this.rigs.values());
  }

  /**
   * Get rigs by cryptocurrency
   */
  getRigsByCrypto(crypto: string): Rig[] {
    return Array.from(this.rigs.values()).filter(
      (rig) => rig.cryptocurrency === crypto
    );
  }

  /**
   * Delete a rig
   */
  deleteRig(rigId: string): boolean {
    const rig = this.rigs.get(rigId);
    if (!rig) return false;

    this.totalHashrate -= rig.hashrate;
    this.rigs.delete(rigId);
    return true;
  }

  /**
   * Get total hashrate across all rigs
   */
  getTotalHashrate(): number {
    return this.totalHashrate;
  }

  /**
   * Get number of active rigs
   */
  getActiveRigCount(): number {
    return Array.from(this.rigs.values()).filter(
      (rig) => rig.status === 'active'
    ).length;
  }

  /**
   * Upgrade rig capacity
   */
  upgradeCapacity(newMaxRigs: number): boolean {
    if (newMaxRigs <= this.maxRigs) {
      console.error('New capacity must be greater than current capacity');
      return false;
    }
    this.maxRigs = newMaxRigs;
    return true;
  }
}
