import type { AssetDefinition, AssetStatus } from '../types/asset.js';

const VALID_STATUSES: AssetStatus[] = ['proposed', 'active', 'restricted', 'disabled'];

export interface AssetValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateAssetDefinition(asset: AssetDefinition): AssetValidationResult {
  const errors: string[] = [];

  if (!asset.asset_id.trim()) errors.push('asset_id is required');
  if (!asset.symbol.trim()) errors.push('symbol is required');
  if (!asset.name.trim()) errors.push('name is required');
  if (!Number.isInteger(asset.decimals) || asset.decimals < 0) {
    errors.push('decimals must be a non-negative integer');
  }
  if (!VALID_STATUSES.includes(asset.status)) {
    errors.push('status must be one of proposed, active, restricted, disabled');
  }

  return { valid: errors.length === 0, errors };
}
