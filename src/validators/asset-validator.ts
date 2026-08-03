import type { AssetDefinition, AssetStatus } from '../types/asset.js';

const VALID_STATUSES: AssetStatus[] = ['proposed', 'active', 'restricted', 'disabled'];

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
