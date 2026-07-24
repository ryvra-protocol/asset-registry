import type { CanonicalEventEnvelope } from '../contracts/compatibility.js';

export type RegistryEvent<TPayload = Record<string, unknown>> = CanonicalEventEnvelope<TPayload>;
