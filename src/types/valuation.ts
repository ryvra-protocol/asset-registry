export type ValuationSourceType = 'oracle' | 'exchange' | 'index';

export interface ValuationSource {
  source_id: string;
  source_type: ValuationSourceType;
  freshness_threshold: string;
  confidence_score: string;
  fallback_order: string[];
}
