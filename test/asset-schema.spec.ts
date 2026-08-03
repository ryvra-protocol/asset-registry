import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  AssetAaCompatibilityError,
  AssetDecimalsMismatchError,
  AssetUnitMismatchError,
  InMemoryAssetRegistry,
  InvalidAssetReferenceError,
  MismatchedAssetError,
  UnresolvedAssetError,
  validateAssetDefinition,
  type AssetDefinition,
  type RegistryEvent,
  type ValuationSource
} from '../src/index.js';

const usdc: AssetDefinition = {
  asset_id: 'asset:stablecoin:usdc:ethereum',
  reference_id: 'ref:asset:stablecoin:usdc:ethereum',
  correlation_id: 'corr:asset-registry:onboard:usdc',
  policy_version: 'policy.asset-registry.2026-07',
  symbol: 'USDC',
  name: 'USD Coin',
  asset_class: 'stablecoin',
  issuer: 'Circle',
  chain_id: '1',
  contract_address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  decimals: 6,
  liquidity_tier: 'tier-1',
  risk_weight: 'TBD by governance/policy',
  settlement_constraints: 'TBD by governance/policy',
  status: 'active',
  version: '1.0.0',
  account_abstraction: {
    compatible: true,
    gas_token_capable: true,
    transfer_unit: 'base-10',
    sponsorship: {
      eligible: true,
      required_policy_version: 'policy.asset-registry.2026-07',
      allowed_sponsors: ['sponsor:trusted'],
      denied_sponsors: ['sponsor:blocked'],
      required_context_flags: ['kyc_passed']
    }
  }
};

describe('asset schema baseline', () => {
  it('validates a basic asset definition shape', () => {
    const result = validateAssetDefinition(usdc);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('stores assets in the in-memory registry', () => {
    const registry = new InMemoryAssetRegistry();
    registry.upsert(usdc);

    expect(registry.getById(usdc.asset_id)).toEqual(usdc);
    expect(registry.list()).toHaveLength(1);
  });

  it('enforces canonical reference and policy fields', () => {
    const result = validateAssetDefinition({
      ...usdc,
      reference_id: '',
      correlation_id: '',
      policy_version: ''
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('reference_id is required');
    expect(result.errors).toContain('correlation_id is required');
    expect(result.errors).toContain('policy_version is required');
  });

  it('matches canonical valuation source naming', () => {
    const valuationSource: ValuationSource = {
      reference_id: 'ref:valuation:usd-stablecoin-basket',
      correlation_id: 'corr:valuation:source:seed',
      source_type: 'index',
      freshness_threshold: 'PT30S',
      confidence_score: '0.99',
      fallback_order: ['ref:valuation:fallback-1']
    };

    expect(Object.keys(valuationSource)).toEqual([
      'reference_id',
      'correlation_id',
      'source_type',
      'freshness_threshold',
      'confidence_score',
      'fallback_order'
    ]);
  });

  it('matches canonical event envelope fields', () => {
    const event: RegistryEvent<{ asset_id: string }> = {
      event_id: 'event:asset:upserted:1',
      correlation_id: 'corr:asset-registry:onboard:usdc',
      reference_id: 'ref:asset:stablecoin:usdc:ethereum',
      event_type: 'asset.upserted',
      timestamp: '2026-07-24T00:00:00.000Z',
      payload: { asset_id: usdc.asset_id }
    };

    expect(Object.keys(event)).toEqual([
      'event_id',
      'correlation_id',
      'reference_id',
      'event_type',
      'timestamp',
      'payload'
    ]);
  });
});

describe('canonical asset resolution surface', () => {
  it('produces deterministic normalization using golden outputs', () => {
    const registry = new InMemoryAssetRegistry();
    const goldenPath = fileURLToPath(new URL('./fixtures/normalization-golden.json', import.meta.url));
    const cases: Array<{ chainId: string; tokenRef: string; normalized: string }> = JSON.parse(
      readFileSync(goldenPath, 'utf8')
    );

    const outputs = cases.map((item) => registry.normalizeAssetRef(item.chainId, item.tokenRef));
    expect(outputs).toEqual(cases.map((item) => item.normalized));
  });

  it('resolves by canonical APIs and reports support by chain', () => {
    const registry = new InMemoryAssetRegistry();
    registry.upsert(usdc);

    expect(registry.getAssetMetadata(usdc.asset_id)).toEqual(usdc);
    expect(
      registry.resolveAsset({
        chainId: '1',
        tokenRef: '0xA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48'
      })
    ).toEqual(usdc);
    expect(registry.resolveAsset({ assetId: usdc.asset_id })).toEqual(usdc);
    expect(registry.isSupportedAsset(usdc.asset_id, '1')).toBe(true);
    expect(registry.isSupportedAsset(usdc.asset_id, '10')).toBe(false);
  });

  it('throws typed errors for unresolved and invalid references', () => {
    const registry = new InMemoryAssetRegistry();

    expect(() => registry.getAssetMetadata('')).toThrow(InvalidAssetReferenceError);
    expect(() => registry.resolveAsset('asset:missing')).toThrow(UnresolvedAssetError);
    expect(() => registry.resolveAsset({ chainId: '', tokenRef: 'USDC' })).toThrow(
      InvalidAssetReferenceError
    );
  });

  it('throws typed mismatched and decimals consistency errors', () => {
    const registry = new InMemoryAssetRegistry();
    registry.upsert(usdc);

    expect(() =>
      registry.resolveAsset({
        assetId: usdc.asset_id,
        tokenRef: '0x0000000000000000000000000000000000000001'
      })
    ).toThrow(MismatchedAssetError);

    expect(() =>
      registry.upsert({
        ...usdc,
        asset_id: 'asset:stablecoin:usdc-clone:ethereum',
        symbol: 'USDCX',
        account_abstraction: {
          ...usdc.account_abstraction!
        }
      })
    ).toThrow(MismatchedAssetError);

    expect(() =>
      registry.upsert({
        ...usdc,
        decimals: 18
      })
    ).toThrow(AssetDecimalsMismatchError);
  });
});

describe('erc-4337 compatibility surface', () => {
  it('returns deterministic AA capabilities', () => {
    const registry = new InMemoryAssetRegistry();
    registry.upsert(usdc);

    expect(registry.getAaAssetCapabilities(usdc.asset_id, '1')).toEqual({
      compatible: true,
      gas_token_capable: true,
      transfer_unit: 'base-10',
      sponsorship: {
        eligible: true,
        required_policy_version: 'policy.asset-registry.2026-07',
        allowed_sponsors: ['sponsor:trusted'],
        denied_sponsors: ['sponsor:blocked'],
        required_context_flags: ['kyc_passed']
      }
    });
  });

  it('resolves sponsor eligibility deterministically from metadata hooks', () => {
    const registry = new InMemoryAssetRegistry();
    registry.upsert(usdc);

    expect(
      registry.isSponsorEligible(usdc.asset_id, '1', {
        policyVersion: 'policy.asset-registry.2026-07',
        sponsorId: 'sponsor:trusted',
        flags: { kyc_passed: true }
      })
    ).toBe(true);

    expect(
      registry.isSponsorEligible(usdc.asset_id, '1', {
        policyVersion: 'policy.asset-registry.2026-07',
        sponsorId: 'sponsor:blocked',
        flags: { kyc_passed: true }
      })
    ).toBe(false);

    expect(
      registry.isSponsorEligible(usdc.asset_id, '1', {
        policyVersion: 'policy.asset-registry.2026-07',
        sponsorId: 'sponsor:trusted',
        flags: { kyc_passed: false }
      })
    ).toBe(false);
  });

  it('enforces strict UserOp decimals and unit compatibility', () => {
    const registry = new InMemoryAssetRegistry();
    registry.upsert(usdc);

    expect(() =>
      registry.validateUserOpTransferCompatibility(usdc.asset_id, '1', 6, 'base-10')
    ).not.toThrow();
    expect(() =>
      registry.validateUserOpTransferCompatibility(usdc.asset_id, '1', 18, 'base-10')
    ).toThrow(AssetDecimalsMismatchError);
    expect(() =>
      registry.validateUserOpTransferCompatibility(usdc.asset_id, '1', 6, 'atom')
    ).toThrow(AssetUnitMismatchError);
  });

  it('fails UserOp compatibility checks when AA is disabled', () => {
    const registry = new InMemoryAssetRegistry();
    registry.upsert({
      ...usdc,
      asset_id: 'asset:stablecoin:usdc:no-aa',
      symbol: 'USDCN',
      contract_address: '0x00000000000000000000000000000000000000aa',
      account_abstraction: {
        compatible: false,
        gas_token_capable: false,
        transfer_unit: 'base-10',
        sponsorship: {
          eligible: false
        }
      }
    });

    expect(() =>
      registry.validateUserOpTransferCompatibility('asset:stablecoin:usdc:no-aa', '1', 6, 'base-10')
    ).toThrow(AssetAaCompatibilityError);
  });
});
