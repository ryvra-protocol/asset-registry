# Ryvra Asset Registry

Ryvra Asset Registry is the canonical source of asset definitions for Ryvra Protocol.

It provides a shared baseline for:
- canonical asset identity
- metadata normalization
- valuation source references
- risk and settlement attributes

Canonical contract vocabulary aligned with protocol-core hardening baseline:
- `asset_id`, `reference_id`, `correlation_id`, `policy_version`
- event envelope fields: `event_id`, `correlation_id`, `reference_id`, `event_type`, `timestamp`, `payload`

Status: **early draft / not production-ready**.

## Module boundaries

This repository defines and validates asset and valuation metadata contracts. It does **not** implement execution, custody, or market making logic.

## Primary consumers

- `accounts`
- `ledger-settlement`
- `pay`
- `markets`

## RFC links

- [Protocol Core RFC Placeholder: Asset Schema](./docs/rfc-0003-asset-schema-and-valuation.md)
- [Protocol Core RFC Placeholder: Valuation Sources](./docs/valuation-sources.md)
- [Protocol Core RFC Placeholder: Data Quality and Governance](./docs/data-quality-and-governance.md)
