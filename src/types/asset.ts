import type { CanonicalPolicyFields, CanonicalReferenceFields } from '../contracts/compatibility.js';

export type AssetClass = 'stablecoin' | 'crypto' | 'rwa' | 'stock' | 'metal';

export type AssetStatus = 'proposed' | 'active' | 'restricted' | 'disabled';
export type RiskClass = 'low' | 'medium' | 'high' | 'restricted';
export type PrivacyMode = 'public' | 'shielded' | 'stealth' | 'zk';
export type SettlementFinalityProfile = 'instant' | 'deterministic' | 'probabilistic';
export type ChainSupportStatus = 'supported' | 'degraded' | 'disabled';

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

export interface AssetRiskMetadata {
  risk_class: RiskClass;
  risk_tier: string;
  risk_score: number;
}

export interface AssetCollateralMetadata {
  eligible: boolean;
  haircut_bps: number;
  max_ltv_bps: number;
}

export interface AssetMarginMetadata {
  eligible: boolean;
  max_leverage: number;
  initial_margin_bps: number;
  maintenance_margin_bps: number;
  liquidation_threshold_bps: number;
}

export interface OracleSourceProfile {
  source_id: string;
  source_type: string;
  confidence: number;
  max_staleness_seconds: number;
  fallback_priority: number;
}

export interface AssetOracleMetadata {
  sources: OracleSourceProfile[];
  fallback_order: string[];
}

export interface AssetPrivacyMetadata {
  privacy_enabled: boolean;
  supported_modes: PrivacyMode[];
  default_mode: PrivacyMode;
}

export interface AssetConfidentialComputeMetadata {
  supported: boolean;
  provider_compatibility: string[];
}

export interface AssetSettlementMetadata {
  supports_settlement: boolean;
  finality_profile: SettlementFinalityProfile;
  finality_blocks: number;
  finality_seconds: number;
}

export interface AssetChainSupport {
  chain_id: string;
  contract_address: string;
  deploy_status: ChainSupportStatus;
  settlement_supported: boolean;
  finality_profile: SettlementFinalityProfile;
}

export interface AssetMetadataAuditEntry {
  metadata_version: string;
  changed_at: string;
  changed_by: string;
  reason: string;
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
  risk?: AssetRiskMetadata;
  collateral?: AssetCollateralMetadata;
  margin?: AssetMarginMetadata;
  oracle?: AssetOracleMetadata;
  privacy?: AssetPrivacyMetadata;
  confidential_compute?: AssetConfidentialComputeMetadata;
  settlement?: AssetSettlementMetadata;
  chain_support?: AssetChainSupport[];
  metadata_audit_history?: AssetMetadataAuditEntry[];
}
