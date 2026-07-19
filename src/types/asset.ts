export type AssetClass = 'stablecoin' | 'crypto' | 'rwa' | 'stock' | 'metal';

export type AssetStatus = 'proposed' | 'active' | 'restricted' | 'disabled';

export interface AssetDefinition {
  asset_id: string;
  symbol: string;
  name: string;
  asset_class: AssetClass;
  issuer: string;
  chain_id: string;
  contract_address: string;
  decimals: number;
  valuation_source_id: string;
  liquidity_tier: string;
  risk_weight: string;
  settlement_constraints: string;
  status: AssetStatus;
  version: string;
}
