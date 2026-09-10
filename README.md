# Ryvra Asset Registry

Ryvra Asset Registry is the canonical source of asset definitions for Ryvra Protocol.

It provides a shared baseline for:
- canonical asset identity
- metadata normalization
- valuation source references
- risk and settlement attributes
- RFC-0018 risk/privacy/confidential metadata extensions

Canonical contract vocabulary aligned with protocol-core hardening baseline:
- `asset_id`, `reference_id`, `correlation_id`, `policy_version`
- event envelope fields: `event_id`, `correlation_id`, `reference_id`, `event_type`, `timestamp`, `payload`

Status: **early draft / not production-ready**.

## Module boundaries

This repository defines and validates asset and valuation metadata contracts. It does **not** implement execution, custody, or market making logic.

## Canonical registry API surface

The public registry surface includes deterministic reference normalization and canonical resolution APIs:
- `normalizeAssetRef(chainId, tokenRef)`
- `resolveAsset(assetRef)`
- `getAssetMetadata(assetId)`
- `isSupportedAsset(assetId, chainId)`
- `listByCollateralEligibility(eligible?)`
- `listByMarginEligibility(eligible?)`
- `listByPrivacyCapability({ mode?, confidential_compute_supported? })`
- `listSupportedChains(assetId)`
- `getOracleSourceProfile(assetId)`
- `selectOracleSource(assetId, healthySourceIds?)`
- `getAaAssetCapabilities(assetId, chainId)`
- `isSponsorEligible(assetId, chainId, policyContext)`
- `validateUserOpTransferCompatibility(assetId, chainId, transferDecimals, transferUnit)`

Typed error classes are exported for invalid, unresolved, mismatched, and decimals-conflict references.

PR8-specific scope in this package is metadata and validation only; runtime bundler/paymaster orchestration and market flow logic remain out of scope.

## Primary consumers

- `accounts`
- `ledger-settlement`
- `pay`
- `markets`

## Extended canonical schema ownership (RFC-0018)

`AssetDefinition` now supports additive metadata blocks for deterministic downstream policy decisions:
- `risk`: `risk_class` enum (`low|medium|high|restricted`), `risk_tier`, `risk_score` (0-100)
- `collateral`: `eligible`, `haircut_bps`, `max_ltv_bps`
- `margin`: `eligible`, `max_leverage`, `initial_margin_bps`, `maintenance_margin_bps`, `liquidation_threshold_bps`
- `oracle`: source set with `confidence` bounds, `max_staleness_seconds`, `fallback_priority`, and explicit `fallback_order`
- `privacy`: `privacy_enabled`, supported/default privacy modes
- `confidential_compute`: support flag and provider compatibility list
- `settlement`: settlement support and finality profile
- `chain_support`: per-network deployment/status/finality capability matrix
- `metadata_audit_history`: configured metadata change lineage

All attributes are explicit configured values (no AI-driven classification), versioned, and auditable through canonical metadata updates.

## Deterministic consumer guidance

Downstream services should consume registry metadata as follows:
- **policy/risk/collateral/margin**: read `risk`, `collateral`, and `margin` blocks directly; treat missing blocks as not-enabled defaults
- **oracle confidence/fallback**: use `getOracleSourceProfile` for full source metadata and `selectOracleSource` for deterministic fallback ordering
- **privacy/confidential routing**: use `listByPrivacyCapability` to filter for privacy mode + confidential compute requirements
- **chain settlement support**: use `listSupportedChains` + `isSupportedAsset` for per-network eligibility and finality checks

## Migration and compatibility notes

- Schema changes are additive and backward compatible: existing assets without RFC-0018 blocks remain valid.
- Validation enforces deterministic constraints (risk enum, non-negative risk/collateral/margin limits, confidence bounds, unique chain mappings).
- For relational persistence layers, map the additive blocks into normalized linked entities (risk/collateral/margin policy, oracle sources, privacy/confidential capabilities, chain support matrix, metadata audit history) keyed by `asset_id`.

## RFC links

- [Protocol Core RFC Placeholder: Asset Schema](./docs/rfc-0003-asset-schema-and-valuation.md)
- [Protocol Core RFC Placeholder: Risk and Policy Dependencies](./docs/rfc-0005-risk-and-policy-controls.md)
- [Protocol Core RFC Placeholder: Privacy and Confidential Execution Dependencies](./docs/rfc-0009-privacy-and-confidential-execution.md)
- [Protocol Core RFC-0018: Asset Metadata Extensions](./docs/rfc-0018-asset-metadata-extensions.md)
- [Protocol Core RFC Placeholder: Valuation Sources](./docs/valuation-sources.md)
- [Protocol Core RFC Placeholder: Data Quality and Governance](./docs/data-quality-and-governance.md)
