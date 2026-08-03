export class AssetRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssetRegistryError';
  }
}

export class InvalidAssetReferenceError extends AssetRegistryError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAssetReferenceError';
  }
}

export class UnresolvedAssetError extends AssetRegistryError {
  constructor(message: string) {
    super(message);
    this.name = 'UnresolvedAssetError';
  }
}

export class MismatchedAssetError extends AssetRegistryError {
  constructor(message: string) {
    super(message);
    this.name = 'MismatchedAssetError';
  }
}

export class AssetDecimalsMismatchError extends MismatchedAssetError {
  constructor(message: string) {
    super(message);
    this.name = 'AssetDecimalsMismatchError';
  }
}

export class AssetUnitMismatchError extends MismatchedAssetError {
  constructor(message: string) {
    super(message);
    this.name = 'AssetUnitMismatchError';
  }
}

export class AssetAaCompatibilityError extends MismatchedAssetError {
  constructor(message: string) {
    super(message);
    this.name = 'AssetAaCompatibilityError';
  }
}
