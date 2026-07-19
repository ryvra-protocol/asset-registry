import type { AssetDefinition } from '../types/asset.js';

export class InMemoryAssetRegistry {
  private readonly assets = new Map<string, AssetDefinition>();

  upsert(asset: AssetDefinition): void {
    this.assets.set(asset.asset_id, asset);
  }

  getById(assetId: string): AssetDefinition | undefined {
    return this.assets.get(assetId);
  }

  list(): AssetDefinition[] {
    return [...this.assets.values()];
  }
}
