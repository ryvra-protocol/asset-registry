// TODO(protocol-core): replace this local mirror with `@ryvra/contracts` imports once published.
export interface CanonicalReferenceFields {
  reference_id: string;
  correlation_id: string;
}

export interface CanonicalPolicyFields {
  policy_version: string;
}

export interface CanonicalEventEnvelope<TPayload = Record<string, unknown>> {
  event_id: string;
  correlation_id: string;
  reference_id: string;
  event_type: string;
  timestamp: string;
  payload: TPayload;
}
