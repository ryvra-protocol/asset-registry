# Valuation Sources Model

## Status
Draft. Not production-ready.

## Source model

Each valuation source includes:

- `reference_id`
- `correlation_id`
- `source_type` (`oracle | exchange | index`)
- freshness thresholds
- confidence scoring
- fallback order

### Field guidance

- `reference_id`: canonical reference identifier for valuation source definition.
- `correlation_id`: canonical correlation identifier for valuation source workflows.
- `source_type`: classification of source mechanism (`oracle`, `exchange`, `index`).
- freshness thresholds: max allowable quote age per asset or source tier (TBD by governance/policy).
- confidence scoring: normalized confidence metric and interpretation rules (TBD by governance/policy).
- fallback order: deterministic source priority when primary source is stale/unavailable (TBD by governance/policy).

## Stale price handling

- If quote freshness exceeds threshold, mark source output stale.
- Consumers must block high-risk operations or degrade behavior according to module policy (TBD by governance/policy).
- Fallback sequence must be attempted in configured order.
- If all configured sources are stale or unavailable, emit an explicit valuation failure state.

## Circuit-breaker behavior

Circuit-breakers should trigger when:

- source confidence drops below policy threshold,
- price deviation exceeds policy bounds,
- repeated stale-source events occur within policy window.

Circuit-breaker thresholds and reset criteria are TBD by governance/policy.

## Audit and observability requirements

- Log valuation source selected, candidate fallbacks, and rejection reasons.
- Log quote timestamp, freshness delta, and confidence score.
- Capture policy version used for valuation decisioning.
- Preserve immutable audit trail for incident review and governance reporting.
- Emit metrics for stale-rate, failover-rate, and valuation-latency.
