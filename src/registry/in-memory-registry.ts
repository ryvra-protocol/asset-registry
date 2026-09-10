import type {
  AssetChainSupport,
  AssetDefinition,
  OracleSourceProfile,
  PrivacyMode,
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

export interface PrivacyCapabilityQuery {
  mode?: PrivacyMode;
  confidential_compute_supported?: boolean;
}

export class InMemoryAssetRegistry {
  private readonly assets = new Map<string, AssetDefinition>();

  private readonly assetIdsByNormalizedRef = new Map<string, string>();

  private readonly decimalsByNormalizedRef = new Map<string, number>();

  private readonly normalizedRefsByAssetId = new Map<string, string[]>();

  upsert(asset: AssetDefinition): void {
    const existingAssetById = this.assets.get(asset.asset_id);
    const nextRefs = this.collectNormalizedRefs(asset);
    for (const normalizedRef of nextRefs) {
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
    }

    if (existingAssetById && existingAssetById.decimals !== asset.decimals) {
      throw new AssetDecimalsMismatchError(
        `decimals mismatch for asset_id ${asset.asset_id}: expected ${existingAssetById.decimals}, received ${asset.decimals}`
      );
    }

    this.clearNormalizedRefsForAsset(asset.asset_id);
    this.assets.set(asset.asset_id, asset);
    this.normalizedRefsByAssetId.set(asset.asset_id, nextRefs);
    for (const normalizedRef of nextRefs) {
      this.assetIdsByNormalizedRef.set(normalizedRef, asset.asset_id);
      this.decimalsByNormalizedRef.set(normalizedRef, asset.decimals);
    }
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

    if (asset.chain_support?.length) {
      const normalizedChainId = chainId.trim().toLowerCase();
      return asset.chain_support.some(
        (item) => item.chain_id.trim().toLowerCase() === normalizedChainId && item.deploy_status !== 'disabled'
      );
    }

    return asset.chain_id.trim().toLowerCase() === chainId.trim().toLowerCase();
  }

  listByCollateralEligibility(eligible = true): AssetDefinition[] {
    return this.list().filter((asset) => (asset.collateral?.eligible ?? false) === eligible);
  }

  listByMarginEligibility(eligible = true): AssetDefinition[] {
    return this.list().filter((asset) => (asset.margin?.eligible ?? false) === eligible);
  }

  listByPrivacyCapability(query: PrivacyCapabilityQuery = {}): AssetDefinition[] {
    return this.list().filter((asset) => {
      if (!asset.privacy) {
        return false;
      }
      if (query.mode && !asset.privacy.supported_modes.includes(query.mode)) {
        return false;
      }
      if (
        query.confidential_compute_supported !== undefined &&
        (asset.confidential_compute?.supported ?? false) !== query.confidential_compute_supported
      ) {
        return false;
      }
      return true;
    });
  }

  listSupportedChains(assetId: string): AssetChainSupport[] {
    const asset = this.getAssetMetadata(assetId);
    if (asset.chain_support?.length) {
      return asset.chain_support;
    }
    return [
      {
        chain_id: asset.chain_id,
        contract_address: asset.contract_address,
        deploy_status: asset.status === 'disabled' ? 'disabled' : 'supported',
        settlement_supported: true,
        finality_profile: asset.settlement?.finality_profile ?? 'probabilistic'
      }
    ];
  }

  getOracleSourceProfile(assetId: string): AssetDefinition['oracle'] {
    return this.getAssetMetadata(assetId).oracle;
  }

  selectOracleSource(assetId: string, healthySourceIds?: string[]): OracleSourceProfile | undefined {
    const oracle = this.getAssetMetadata(assetId).oracle;
    if (!oracle) {
      return undefined;
    }

    const healthySourceSet = healthySourceIds ? new Set(healthySourceIds) : undefined;
    const byId = new Map(oracle.sources.map((source) => [source.source_id, source]));

    for (const fallbackSourceId of oracle.fallback_order) {
      if (healthySourceSet && !healthySourceSet.has(fallbackSourceId)) {
        continue;
      }
      const matched = byId.get(fallbackSourceId);
      if (matched) {
        return matched;
      }
    }

    return undefined;
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

    const supportedChainIds = asset.chain_support?.length
      ? asset.chain_support.map((item) => item.chain_id.trim().toLowerCase())
      : [asset.chain_id.trim().toLowerCase()];
    if (!supportedChainIds.includes(normalizedChainId)) {
      throw new MismatchedAssetError(
        `asset_id ${asset.asset_id} does not support chain ${normalizedChainId}`
      );
    }
  }

  private collectNormalizedRefs(asset: AssetDefinition): string[] {
    const refs = [this.normalizeAssetRef(asset.chain_id, asset.contract_address)];
    for (const chainSupport of asset.chain_support ?? []) {
      refs.push(this.normalizeAssetRef(chainSupport.chain_id, chainSupport.contract_address));
    }

    return refs;
  }

  private clearNormalizedRefsForAsset(assetId: string): void {
    const existingRefs = this.normalizedRefsByAssetId.get(assetId);
    if (!existingRefs) {
      return;
    }

    for (const ref of existingRefs) {
      this.assetIdsByNormalizedRef.delete(ref);
      this.decimalsByNormalizedRef.delete(ref);
    }
  }
}
