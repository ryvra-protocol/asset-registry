import type { CanonicalPolicyFields, CanonicalReferenceFields } from '../contracts/compatibility.js';

export type AssetClass = 'stablecoin' | 'crypto' | 'rwa' | 'stock' | 'metal';

export type AssetStatus = 'proposed' | 'active' | 'restricted' | 'disabled';

export interface SponsorshipPolicyContext {
  policyVersion?: string;
  sponsorId?: string;
  flags?: Record<string, boolean>;
}

export interface SponsorEligibilityRules {
  eligible: boolean;
  required_policy_version?: string;
  allowed_sponsors?: string[];
  denied_sponsors?: string[];
  required_context_flags?: string[];
}

export interface AccountAbstractionMetadata {
  compatible: boolean;
  gas_token_capable: boolean;
  transfer_unit: string;
  sponsorship?: SponsorEligibilityRules;
}

export interface AssetDefinition extends CanonicalReferenceFields, CanonicalPolicyFields {
  asset_id: string;
  symbol: string;
  name: string;
  asset_class: AssetClass;
  issuer: string;
  chain_id: string;
  contract_address: string;
  decimals: number;
  liquidity_tier: string;
  risk_weight: string;
  settlement_constraints: string;
  status: AssetStatus;
  version: string;
  account_abstraction?: AccountAbstractionMetadata;
}
