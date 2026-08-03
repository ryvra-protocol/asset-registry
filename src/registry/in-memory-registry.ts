import type {
  AssetDefinition,
  SponsorshipPolicyContext
} from '../types/asset.js';
import {
  type AssetRef,
  isAssetIdentityRef,
  isAssetLocator,
  normalizeAssetRef as normalizeAssetRefValue
} from './asset-resolution.js';
import {
  AssetAaCompatibilityError,
  AssetDecimalsMismatchError,
  AssetUnitMismatchError,
  InvalidAssetReferenceError,
  MismatchedAssetError,
  UnresolvedAssetError
} from './errors.js';

export interface AaAssetCapabilities {
  compatible: boolean;
  gas_token_capable: boolean;
  transfer_unit: string;
  sponsorship: {
    eligible: boolean;
    required_policy_version?: string;
    allowed_sponsors?: string[];
    denied_sponsors?: string[];
    required_context_flags?: string[];
  };
}

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

  getAaAssetCapabilities(assetId: string, chainId: string): AaAssetCapabilities {
    const asset = this.getAssetMetadata(assetId);
    this.assertChainCompatibility(asset, chainId);
    const aaMetadata = asset.account_abstraction;

    return {
      compatible: aaMetadata?.compatible ?? false,
      gas_token_capable: aaMetadata?.gas_token_capable ?? false,
      transfer_unit: aaMetadata?.transfer_unit ?? `decimals:${asset.decimals}`,
      sponsorship: {
        eligible: aaMetadata?.sponsorship?.eligible ?? false,
        required_policy_version: aaMetadata?.sponsorship?.required_policy_version,
        allowed_sponsors: aaMetadata?.sponsorship?.allowed_sponsors,
        denied_sponsors: aaMetadata?.sponsorship?.denied_sponsors,
        required_context_flags: aaMetadata?.sponsorship?.required_context_flags
      }
    };
  }

  isSponsorEligible(assetId: string, chainId: string, policyContext: SponsorshipPolicyContext): boolean {
    const capabilities = this.getAaAssetCapabilities(assetId, chainId);
    if (!capabilities.compatible || !capabilities.sponsorship.eligible) {
      return false;
    }

    const requiredPolicyVersion = capabilities.sponsorship.required_policy_version;
    if (requiredPolicyVersion && policyContext.policyVersion !== requiredPolicyVersion) {
      return false;
    }

    const sponsorId = policyContext.sponsorId;
    const allowedSponsors = capabilities.sponsorship.allowed_sponsors;
    if (allowedSponsors && (!sponsorId || !allowedSponsors.includes(sponsorId))) {
      return false;
    }

    const deniedSponsors = capabilities.sponsorship.denied_sponsors;
    if (deniedSponsors && sponsorId && deniedSponsors.includes(sponsorId)) {
      return false;
    }

    const requiredFlags = capabilities.sponsorship.required_context_flags;
    if (requiredFlags && requiredFlags.some((flag) => policyContext.flags?.[flag] !== true)) {
      return false;
    }

    return true;
  }

  validateUserOpTransferCompatibility(
    assetId: string,
    chainId: string,
    transferDecimals: number,
    transferUnit: string
  ): void {
    if (!Number.isInteger(transferDecimals) || transferDecimals < 0) {
      throw new InvalidAssetReferenceError('transferDecimals must be a non-negative integer');
    }

    if (!transferUnit.trim()) {
      throw new InvalidAssetReferenceError('transferUnit must be a non-empty string');
    }

    const asset = this.getAssetMetadata(assetId);
    this.assertChainCompatibility(asset, chainId);
    const capabilities = this.getAaAssetCapabilities(assetId, chainId);

    if (!capabilities.compatible) {
      throw new AssetAaCompatibilityError(`asset_id ${assetId} is not account-abstraction compatible on chain ${chainId}`);
    }

    if (asset.decimals !== transferDecimals) {
      throw new AssetDecimalsMismatchError(
        `userop transfer decimals mismatch for asset_id ${assetId}: expected ${asset.decimals}, received ${transferDecimals}`
      );
    }

    if (capabilities.transfer_unit.trim().toLowerCase() !== transferUnit.trim().toLowerCase()) {
      throw new AssetUnitMismatchError(
        `userop transfer unit mismatch for asset_id ${assetId}: expected ${capabilities.transfer_unit}, received ${transferUnit}`
      );
    }
  }

  private assertChainCompatibility(asset: AssetDefinition, chainId: string): void {
    const normalizedChainId = chainId.trim().toLowerCase();
    if (!normalizedChainId) {
      throw new InvalidAssetReferenceError('chainId must be a non-empty string');
    }

    const assetChainId = asset.chain_id.trim().toLowerCase();
    if (assetChainId !== normalizedChainId) {
      throw new MismatchedAssetError(
        `asset_id ${asset.asset_id} belongs to chain ${assetChainId}, received ${normalizedChainId}`
      );
    }
  }
}
