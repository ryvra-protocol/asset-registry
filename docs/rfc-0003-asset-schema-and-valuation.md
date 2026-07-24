# RFC-0003: Asset Schema and Valuation (v1)

## Status
Draft. Not production-ready.

## Canonical asset schema (v1)

Each asset record must include:

- `asset_id`
- `symbol`
- `name`
- `asset_class`
- `issuer`
- `chain_id`
- `contract_address`
- `decimals`
- `reference_id`
- `correlation_id`
- `policy_version`
- `liquidity_tier`
- `risk_weight`
- `settlement_constraints`
- `status`
- `version`

### Field expectations

- `asset_id`: globally unique, immutable identifier.
- `symbol`: normalized display symbol, unique within active namespace policy (TBD by governance/policy).
- `name`: canonical display name.
- `asset_class`: one of `stablecoin | crypto | rwa | stock | metal`.
- `issuer`: issuing entity or protocol descriptor.
- `chain_id`: network identifier where applicable; non-chain assets use policy placeholder values (TBD by governance/policy).
- `contract_address`: on-chain address where applicable; off-chain assets use policy placeholder values (TBD by governance/policy).
- `decimals`: integer precision value.
- `reference_id`: canonical reference identifier for related valuation/catalog records.
- `correlation_id`: canonical correlation identifier for cross-service workflows/audit traces.
- `policy_version`: effective governance/policy version used for review and decisioning.
- `liquidity_tier`: normalized tier label and mapping (TBD by governance/policy).
- `risk_weight`: normalized risk factor and bounds (TBD by governance/policy).
- `settlement_constraints`: structured settlement rules and restrictions.
- `status`: lifecycle state.
- `version`: schema or record version marker.

## Validation rules and uniqueness constraints

- `asset_id` must be unique and immutable.
- `(chain_id, contract_address)` must be unique when both are set.
- `symbol` collisions across asset classes require explicit governance exception handling (TBD by governance/policy).
- `decimals` must be a non-negative integer.
- `risk_weight` bounds and units are policy-defined (TBD by governance/policy).
- `reference_id` must reference an approved source.
- `correlation_id` must be present for workflow traceability.
- `policy_version` must reference an approved governance/policy release.
- `status` must be one of lifecycle states defined below.
- `version` must be monotonically increasing for updates to the same logical `asset_id`.

## Lifecycle states

`proposed` → `active` → `restricted` → `disabled`

- `proposed`: submitted, under review, not available to production consumers.
- `active`: approved and consumable by protocol modules.
- `restricted`: available with policy-enforced limits or warnings.
- `disabled`: retained for audit/history but blocked from new use.

State transition exceptions are controlled by governance and emergency procedures (TBD by governance/policy).

## Versioning and backward compatibility policy

- Schema versioning follows semantic change intent:
  - additive, backward-compatible fields: minor increment.
  - removals or incompatible type/semantic changes: major increment.
- Records must preserve prior required fields unless a major migration is approved.
- Consumers must ignore unknown additive fields and fail clearly on missing required fields.
- Migration windows and deprecation timelines are defined by governance (TBD by governance/policy).

## Examples

### USDC (stablecoin)

```json
{
  "asset_id": "asset:stablecoin:usdc:ethereum",
  "symbol": "USDC",
  "name": "USD Coin",
  "asset_class": "stablecoin",
  "issuer": "Circle",
  "chain_id": "1",
  "contract_address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "decimals": 6,
  "reference_id": "ref:valuation:usd-stablecoin-basket",
  "correlation_id": "corr:asset-registry:onboard:usdc",
  "liquidity_tier": "tier-1",
  "risk_weight": "TBD by governance/policy",
  "settlement_constraints": "TBD by governance/policy",
  "status": "active",
  "version": "1.0.0",
  "policy_version": "policy.asset-registry.2026-07"
}
```

### BTC (crypto)

```json
{
  "asset_id": "asset:crypto:btc:native",
  "symbol": "BTC",
  "name": "Bitcoin",
  "asset_class": "crypto",
  "issuer": "Bitcoin Network",
  "chain_id": "bitcoin",
  "contract_address": "TBD by governance/policy",
  "decimals": 8,
  "reference_id": "ref:valuation:btc-usd-composite",
  "correlation_id": "corr:asset-registry:onboard:btc",
  "liquidity_tier": "tier-1",
  "risk_weight": "TBD by governance/policy",
  "settlement_constraints": "TBD by governance/policy",
  "status": "active",
  "version": "1.0.0",
  "policy_version": "policy.asset-registry.2026-07"
}
```

### Tokenized T-bill (RWA)

```json
{
  "asset_id": "asset:rwa:tbill:tokenized",
  "symbol": "USTB",
  "name": "Tokenized US Treasury Bill",
  "asset_class": "rwa",
  "issuer": "TBD by governance/policy",
  "chain_id": "1",
  "contract_address": "TBD by governance/policy",
  "decimals": 6,
  "reference_id": "ref:valuation:tbill-index",
  "correlation_id": "corr:asset-registry:onboard:ustb",
  "liquidity_tier": "tier-2",
  "risk_weight": "TBD by governance/policy",
  "settlement_constraints": "TBD by governance/policy",
  "status": "proposed",
  "version": "1.0.0",
  "policy_version": "policy.asset-registry.2026-07"
}
```

### Tokenized gold (metal)

```json
{
  "asset_id": "asset:metal:xau:tokenized",
  "symbol": "XAUt",
  "name": "Tokenized Gold",
  "asset_class": "metal",
  "issuer": "TBD by governance/policy",
  "chain_id": "1",
  "contract_address": "TBD by governance/policy",
  "decimals": 6,
  "reference_id": "ref:valuation:xau-usd-index",
  "correlation_id": "corr:asset-registry:onboard:xaut",
  "liquidity_tier": "tier-2",
  "risk_weight": "TBD by governance/policy",
  "settlement_constraints": "TBD by governance/policy",
  "status": "proposed",
  "version": "1.0.0",
  "policy_version": "policy.asset-registry.2026-07"
}
```

### Stock

```json
{
  "asset_id": "asset:stock:aapl:tokenized",
  "symbol": "AAPL",
  "name": "Apple Inc. (Tokenized)",
  "asset_class": "stock",
  "issuer": "TBD by governance/policy",
  "chain_id": "1",
  "contract_address": "TBD by governance/policy",
  "decimals": 6,
  "reference_id": "ref:valuation:aapl-nbbo-index",
  "correlation_id": "corr:asset-registry:onboard:aapl",
  "liquidity_tier": "tier-2",
  "risk_weight": "TBD by governance/policy",
  "settlement_constraints": "TBD by governance/policy",
  "status": "proposed",
  "version": "1.0.0",
  "policy_version": "policy.asset-registry.2026-07"
}
```
