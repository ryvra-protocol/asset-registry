# Data Quality and Governance

## Status
Draft. Not production-ready.

## Asset onboarding checklist

- Canonical identity fields completed (`asset_id`, `symbol`, `name`, `asset_class`).
- Issuer and provenance validated with supporting evidence.
- Chain and contract metadata verified where applicable.
- Valuation source mapping proposed and reviewed.
- Risk and settlement attributes proposed (TBD by governance/policy).
- Lifecycle state initialized as `proposed`.

## Change control process

1. Submit change request with rationale and impact scope.
2. Attach required evidence and policy references.
3. Review by designated maintainers and governance participants.
4. Approve, reject, or request revision.
5. Publish versioned change log entry.

Approval quorum and timing SLAs are TBD by governance/policy.

## Required evidence for updates

- Trusted source references for issuer/asset metadata.
- Verification evidence for contract addresses and chain mapping.
- Valuation source suitability analysis.
- Risk and settlement impact note.
- Backward compatibility assessment for schema or field semantics.

Evidence retention and archive policy are TBD by governance/policy.

## Emergency disable process

- Trigger conditions: critical integrity issue, compromised issuer metadata, valuation failure cascade, or governance directive.
- Designated responders set `status=disabled` and record incident context.
- Notify downstream consumers (`accounts`, `ledger-settlement`, `pay`, `markets`) immediately.
- Require post-incident review before any reactivation.

Emergency authority boundaries are TBD by governance/policy.

## Governance notes and policy versioning

- Governance policies are versioned independently from schema versions.
- Every asset update must reference the effective `policy_version`.
- Non-final policy parameters remain explicitly marked as TBD by governance/policy.
