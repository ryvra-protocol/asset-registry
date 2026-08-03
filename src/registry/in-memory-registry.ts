import type { AssetDefinition } from '../types/asset.js';
import {
  type AssetRef,
  isAssetIdentityRef,
  isAssetLocator,
  normalizeAssetRef as normalizeAssetRefValue
} from './asset-resolution.js';
import {
  AssetDecimalsMismatchError,
  InvalidAssetReferenceError,
  MismatchedAssetError,
  UnresolvedAssetError
} from './errors.js';

export class InMemoryAssetRegistry {
  private readonly assets = new Map<string, AssetDefinition>();

  private readonly assetIdsByNormalizedRef = new Map<string, string>();

  private readonly decimalsByNormalizedRef = new Map<string, number>();

  upsert(asset: AssetDefinition): void {
    const normalizedRef = this.normalizeAssetRef(asset.chain_id, asset.contract_address);
    const existingAssetByRef = this.assetIdsByNormalizedRef.get(normalizedRef);

    if (existingAssetByRef && existingAssetByRef !== asset.asset_id) {
      throw new MismatchedAssetError(
        `normalized asset reference ${normalizedRef} already maps to asset_id ${existingAssetByRef}`
      );
    }

    const existingDecimalsByRef = this.decimalsByNormalizedRef.get(normalizedRef);
    if (existingDecimalsByRef !== undefined && existingDecimalsByRef !== asset.decimals) {
      throw new AssetDecimalsMismatchError(
        `decimals mismatch for ${normalizedRef}: expected ${existingDecimalsByRef}, received ${asset.decimals}`
      );
    }

    const existingAssetById = this.assets.get(asset.asset_id);
    if (existingAssetById) {
      const existingNormalizedRef = this.normalizeAssetRef(
        existingAssetById.chain_id,
        existingAssetById.contract_address
      );

      if (existingNormalizedRef !== normalizedRef) {
        throw new MismatchedAssetError(
          `asset_id ${asset.asset_id} is already mapped to ${existingNormalizedRef}, received ${normalizedRef}`
        );
      }

      if (existingAssetById.decimals !== asset.decimals) {
        throw new AssetDecimalsMismatchError(
          `decimals mismatch for asset_id ${asset.asset_id}: expected ${existingAssetById.decimals}, received ${asset.decimals}`
        );
      }
    }

    this.assets.set(asset.asset_id, asset);
    this.assetIdsByNormalizedRef.set(normalizedRef, asset.asset_id);
    this.decimalsByNormalizedRef.set(normalizedRef, asset.decimals);
  }

  getById(assetId: string): AssetDefinition | undefined {
    return this.assets.get(assetId);
  }

  list(): AssetDefinition[] {
    return [...this.assets.values()];
  }

  normalizeAssetRef(chainId: string, tokenRef: string): string {
    return normalizeAssetRefValue(chainId, tokenRef);
  }

  getAssetMetadata(assetId: string): AssetDefinition {
    if (!assetId.trim()) {
      throw new InvalidAssetReferenceError('assetId must be a non-empty string');
    }

    const asset = this.assets.get(assetId);
    if (!asset) {
      throw new UnresolvedAssetError(`asset_id ${assetId} is not registered`);
    }

    return asset;
  }

  resolveAsset(assetRef: AssetRef): AssetDefinition {
    if (typeof assetRef === 'string') {
      return this.getAssetMetadata(assetRef);
    }

    if (isAssetIdentityRef(assetRef)) {
      const asset = this.getAssetMetadata(assetRef.assetId);
      if ('chainId' in assetRef && assetRef.chainId !== undefined) {
        const resolvedChainId = this.normalizeAssetRef(asset.chain_id, asset.contract_address).split(':', 1)[0];
        const requestedChainId = assetRef.chainId.trim().toLowerCase();
        if (!requestedChainId) {
          throw new InvalidAssetReferenceError('chainId must be a non-empty string when provided');
        }
        if (resolvedChainId !== requestedChainId) {
          throw new MismatchedAssetError(
            `asset_id ${asset.asset_id} belongs to chain ${resolvedChainId}, received ${requestedChainId}`
          );
        }
      }

      if ('tokenRef' in assetRef && assetRef.tokenRef !== undefined) {
        const expectedRef = this.normalizeAssetRef(asset.chain_id, asset.contract_address);
        const requestedRef = this.normalizeAssetRef(asset.chain_id, assetRef.tokenRef);
        if (expectedRef !== requestedRef) {
          throw new MismatchedAssetError(
            `asset_id ${asset.asset_id} has token_ref ${asset.contract_address}, received ${assetRef.tokenRef}`
          );
        }
      }

      return asset;
    }

    if (isAssetLocator(assetRef)) {
      const normalizedRef = this.normalizeAssetRef(assetRef.chainId, assetRef.tokenRef);
      const assetId = this.assetIdsByNormalizedRef.get(normalizedRef);
      if (!assetId) {
        throw new UnresolvedAssetError(`asset reference ${normalizedRef} is not registered`);
      }

      return this.getAssetMetadata(assetId);
    }

    throw new InvalidAssetReferenceError('assetRef must be an assetId string or object reference');
  }

  isSupportedAsset(assetId: string, chainId: string): boolean {
    if (!assetId.trim() || !chainId.trim()) {
      return false;
    }

    const asset = this.assets.get(assetId);
    if (!asset) {
      return false;
    }

    return asset.chain_id.trim().toLowerCase() === chainId.trim().toLowerCase();
  }
}
