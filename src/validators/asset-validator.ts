import type { AssetDefinition, AssetStatus, PrivacyMode, RiskClass } from '../types/asset.js';

const VALID_STATUSES: AssetStatus[] = ['proposed', 'active', 'restricted', 'disabled'];
const VALID_RISK_CLASSES: RiskClass[] = ['low', 'medium', 'high', 'restricted'];
const VALID_PRIVACY_MODES: PrivacyMode[] = ['public', 'shielded', 'stealth', 'zk'];

export interface AssetValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateAssetDefinition(asset: AssetDefinition): AssetValidationResult {
  const errors: string[] = [];

  if (!asset.asset_id.trim()) errors.push('asset_id is required');
  if (!asset.reference_id.trim()) errors.push('reference_id is required');
  if (!asset.correlation_id.trim()) errors.push('correlation_id is required');
  if (!asset.policy_version.trim()) errors.push('policy_version is required');
  if (!asset.symbol.trim()) errors.push('symbol is required');
  if (!asset.name.trim()) errors.push('name is required');
  if (!Number.isInteger(asset.decimals) || asset.decimals < 0) {
    errors.push('decimals must be a non-negative integer');
  }
  if (!VALID_STATUSES.includes(asset.status)) {
    errors.push('status must be one of proposed, active, restricted, disabled');
  }

  if (asset.account_abstraction) {
    if (typeof asset.account_abstraction.compatible !== 'boolean') {
      errors.push('account_abstraction.compatible must be a boolean');
    }

    if (asset.risk) {
      if (!VALID_RISK_CLASSES.includes(asset.risk.risk_class)) {
        errors.push('risk.risk_class must be one of low, medium, high, restricted');
      }
      if (!asset.risk.risk_tier.trim()) {
        errors.push('risk.risk_tier is required');
      }
      if (!Number.isFinite(asset.risk.risk_score) || asset.risk.risk_score < 0 || asset.risk.risk_score > 100) {
        errors.push('risk.risk_score must be between 0 and 100');
      }
    }

    if (asset.collateral) {
      if (typeof asset.collateral.eligible !== 'boolean') {
        errors.push('collateral.eligible must be a boolean');
      }
      if (!Number.isFinite(asset.collateral.haircut_bps) || asset.collateral.haircut_bps < 0) {
        errors.push('collateral.haircut_bps must be non-negative');
      }
      if (!Number.isFinite(asset.collateral.max_ltv_bps) || asset.collateral.max_ltv_bps < 0) {
        errors.push('collateral.max_ltv_bps must be non-negative');
      }
    }

    if (asset.margin) {
      if (typeof asset.margin.eligible !== 'boolean') {
        errors.push('margin.eligible must be a boolean');
      }
      if (!Number.isFinite(asset.margin.max_leverage) || asset.margin.max_leverage < 0) {
        errors.push('margin.max_leverage must be non-negative');
      }
      if (!Number.isFinite(asset.margin.initial_margin_bps) || asset.margin.initial_margin_bps < 0) {
        errors.push('margin.initial_margin_bps must be non-negative');
      }
      if (!Number.isFinite(asset.margin.maintenance_margin_bps) || asset.margin.maintenance_margin_bps < 0) {
        errors.push('margin.maintenance_margin_bps must be non-negative');
      }
      if (!Number.isFinite(asset.margin.liquidation_threshold_bps) || asset.margin.liquidation_threshold_bps < 0) {
        errors.push('margin.liquidation_threshold_bps must be non-negative');
      }
    }

    if (asset.oracle) {
      const sourceIds = new Set<string>();
      const priorities = new Set<number>();
      for (const source of asset.oracle.sources) {
        if (!source.source_id.trim()) {
          errors.push('oracle.sources[].source_id is required');
        }
        if (!source.source_type.trim()) {
          errors.push('oracle.sources[].source_type is required');
        }
        if (!Number.isFinite(source.confidence) || source.confidence < 0 || source.confidence > 1) {
          errors.push('oracle.sources[].confidence must be between 0 and 1');
        }
        if (!Number.isInteger(source.max_staleness_seconds) || source.max_staleness_seconds < 0) {
          errors.push('oracle.sources[].max_staleness_seconds must be a non-negative integer');
        }
        if (!Number.isInteger(source.fallback_priority) || source.fallback_priority < 0) {
          errors.push('oracle.sources[].fallback_priority must be a non-negative integer');
        }

        sourceIds.add(source.source_id);
        priorities.add(source.fallback_priority);
      }

      if (sourceIds.size !== asset.oracle.sources.length) {
        errors.push('oracle.sources[].source_id must be unique');
      }
      if (priorities.size !== asset.oracle.sources.length) {
        errors.push('oracle.sources[].fallback_priority must be unique');
      }

      if (
        !Array.isArray(asset.oracle.fallback_order) ||
        asset.oracle.fallback_order.some((sourceId) => !sourceId.trim() || !sourceIds.has(sourceId))
      ) {
        errors.push('oracle.fallback_order must contain valid source IDs from oracle.sources');
      }
    }

    if (asset.privacy) {
      if (typeof asset.privacy.privacy_enabled !== 'boolean') {
        errors.push('privacy.privacy_enabled must be a boolean');
      }
      if (
        !Array.isArray(asset.privacy.supported_modes) ||
        asset.privacy.supported_modes.length === 0 ||
        asset.privacy.supported_modes.some((mode) => !VALID_PRIVACY_MODES.includes(mode))
      ) {
        errors.push('privacy.supported_modes must contain one or more valid modes');
      }
      if (!VALID_PRIVACY_MODES.includes(asset.privacy.default_mode)) {
        errors.push('privacy.default_mode must be one of public, shielded, stealth, zk');
      } else if (!asset.privacy.supported_modes.includes(asset.privacy.default_mode)) {
        errors.push('privacy.default_mode must be included in privacy.supported_modes');
      }
    }

    if (asset.confidential_compute) {
      if (typeof asset.confidential_compute.supported !== 'boolean') {
        errors.push('confidential_compute.supported must be a boolean');
      }
      if (
        !Array.isArray(asset.confidential_compute.provider_compatibility) ||
        asset.confidential_compute.provider_compatibility.some((provider) => !provider.trim())
      ) {
        errors.push('confidential_compute.provider_compatibility must contain non-empty strings');
      }
    }

    if (asset.settlement) {
      if (typeof asset.settlement.supports_settlement !== 'boolean') {
        errors.push('settlement.supports_settlement must be a boolean');
      }
      if (!asset.settlement.finality_profile.trim()) {
        errors.push('settlement.finality_profile is required');
      }
      if (!Number.isInteger(asset.settlement.finality_blocks) || asset.settlement.finality_blocks < 0) {
        errors.push('settlement.finality_blocks must be a non-negative integer');
      }
      if (!Number.isInteger(asset.settlement.finality_seconds) || asset.settlement.finality_seconds < 0) {
        errors.push('settlement.finality_seconds must be a non-negative integer');
      }
    }

    if (asset.chain_support) {
      const chainIds = new Set<string>();
      for (const chainSupport of asset.chain_support) {
        if (!chainSupport.chain_id.trim()) {
          errors.push('chain_support[].chain_id is required');
        }
        if (!chainSupport.contract_address.trim()) {
          errors.push('chain_support[].contract_address is required');
        }
        if (!chainSupport.deploy_status.trim()) {
          errors.push('chain_support[].deploy_status is required');
        }
        if (!chainSupport.finality_profile.trim()) {
          errors.push('chain_support[].finality_profile is required');
        }
        chainIds.add(chainSupport.chain_id.trim().toLowerCase());
      }

      if (chainIds.size !== asset.chain_support.length) {
        errors.push('chain_support[].chain_id must be unique per asset');
      }
    }

    if (asset.metadata_audit_history) {
      for (const entry of asset.metadata_audit_history) {
        if (!entry.metadata_version.trim()) {
          errors.push('metadata_audit_history[].metadata_version is required');
        }
        if (!entry.changed_at.trim()) {
          errors.push('metadata_audit_history[].changed_at is required');
        }
        if (!entry.changed_by.trim()) {
          errors.push('metadata_audit_history[].changed_by is required');
        }
        if (!entry.reason.trim()) {
          errors.push('metadata_audit_history[].reason is required');
        }
      }
    }
    if (typeof asset.account_abstraction.gas_token_capable !== 'boolean') {
      errors.push('account_abstraction.gas_token_capable must be a boolean');
    }
    if (!asset.account_abstraction.transfer_unit.trim()) {
      errors.push('account_abstraction.transfer_unit is required');
    }

    const sponsorship = asset.account_abstraction.sponsorship;
    if (sponsorship) {
      if (typeof sponsorship.eligible !== 'boolean') {
        errors.push('account_abstraction.sponsorship.eligible must be a boolean');
      }
      if (
        sponsorship.allowed_sponsors !== undefined &&
        (!Array.isArray(sponsorship.allowed_sponsors) || sponsorship.allowed_sponsors.some((item) => !item.trim()))
      ) {
        errors.push('account_abstraction.sponsorship.allowed_sponsors must contain non-empty strings');
      }
      if (
        sponsorship.denied_sponsors !== undefined &&
        (!Array.isArray(sponsorship.denied_sponsors) || sponsorship.denied_sponsors.some((item) => !item.trim()))
      ) {
        errors.push('account_abstraction.sponsorship.denied_sponsors must contain non-empty strings');
      }
      if (
        sponsorship.required_context_flags !== undefined &&
        (!Array.isArray(sponsorship.required_context_flags) ||
          sponsorship.required_context_flags.some((item) => !item.trim()))
      ) {
        errors.push('account_abstraction.sponsorship.required_context_flags must contain non-empty strings');
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
