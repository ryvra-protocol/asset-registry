import type { CanonicalReferenceFields } from '../contracts/compatibility.js';

export type ValuationSourceType = 'oracle' | 'exchange' | 'index';

export interface ValuationSource extends CanonicalReferenceFields {
  source_type: ValuationSourceType;
  freshness_threshold: string;
  confidence_score: string;
  fallback_order: string[];
}
