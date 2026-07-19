import { describe, expect, it } from 'vitest';
import { InMemoryAssetRegistry, validateAssetDefinition, type AssetDefinition } from '../src/index.js';

describe('asset schema baseline', () => {
  const usdc: AssetDefinition = {
    asset_id: 'asset:stablecoin:usdc:ethereum',
    symbol: 'USDC',
    name: 'USD Coin',
    asset_class: 'stablecoin',
    issuer: 'Circle',
    chain_id: '1',
    contract_address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
    valuation_source_id: 'vs:usd-stablecoin-basket',
    liquidity_tier: 'tier-1',
    risk_weight: 'TBD by governance/policy',
    settlement_constraints: 'TBD by governance/policy',
    status: 'active',
    version: '1.0.0'
  };

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
});
