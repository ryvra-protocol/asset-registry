export { InMemoryAssetRegistry } from './in-memory-registry.js';
export { normalizeAssetRef, isAssetIdentityRef, isAssetLocator } from './asset-resolution.js';
export type { AssetRef, AssetIdentityRef, AssetLocator } from './asset-resolution.js';
export {
  AssetRegistryError,
  InvalidAssetReferenceError,
  UnresolvedAssetError,
  MismatchedAssetError,
  AssetDecimalsMismatchError
} from './errors.js';
