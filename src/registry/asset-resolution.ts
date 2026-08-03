import { InvalidAssetReferenceError } from './errors.js';

export interface AssetLocator {
  chainId: string;
  tokenRef: string;
}

export interface AssetIdentityRef extends Partial<AssetLocator> {
  assetId: string;
}

export type AssetRef = string | AssetLocator | AssetIdentityRef;

export function normalizeAssetRef(chainId: string, tokenRef: string): string {
  if (!chainId.trim()) {
    throw new InvalidAssetReferenceError('chainId must be a non-empty string');
  }

  if (!tokenRef.trim()) {
    throw new InvalidAssetReferenceError('tokenRef must be a non-empty string');
  }

  const normalizedChainId = chainId.trim().toLowerCase();
  const trimmedTokenRef = tokenRef.trim();
  const normalizedTokenRef = /^0x[a-fA-F0-9]{40}$/.test(trimmedTokenRef)
    ? trimmedTokenRef.toLowerCase()
    : trimmedTokenRef.toLowerCase();

  return `${normalizedChainId}:${normalizedTokenRef}`;
}

export function isAssetLocator(value: AssetRef): value is AssetLocator {
  return (
    typeof value === 'object' &&
    value !== null &&
    'chainId' in value &&
    typeof value.chainId === 'string' &&
    'tokenRef' in value &&
    typeof value.tokenRef === 'string'
  );
}

export function isAssetIdentityRef(value: AssetRef): value is AssetIdentityRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    'assetId' in value &&
    typeof value.assetId === 'string'
  );
}
