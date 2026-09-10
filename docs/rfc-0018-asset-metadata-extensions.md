# RFC-0018: Asset Metadata Extensions

## Status
Draft.

## Summary
RFC-0018 extends canonical asset metadata with deterministic policy attributes for:
- risk classification and score
- collateral and margin eligibility parameters
- oracle source confidence and fallback sequencing
- privacy and confidential-compute capabilities
- settlement/finality capability
- per-chain deployment and support metadata

## Deterministic semantics
- Values are explicitly configured by governance/policy operators.
- No probabilistic or AI-generated classification logic is allowed.
- Changes must be versioned and tracked in metadata audit history.

## Compatibility
- Extensions are additive and backward compatible with existing baseline records.
- Consumers must treat missing extension blocks as unsupported/not-enabled defaults.

## Dependencies
- RFC-0005 risk/policy controls
- RFC-0009 privacy/confidential execution controls
