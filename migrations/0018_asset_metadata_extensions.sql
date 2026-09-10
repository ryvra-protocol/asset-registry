-- RFC-0018 additive migration blueprint for relational stores.
-- This repository ships in-memory contracts; SQL is provided for deterministic integration alignment.

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS risk_class TEXT,
  ADD COLUMN IF NOT EXISTS risk_tier TEXT,
  ADD COLUMN IF NOT EXISTS risk_score NUMERIC,
  ADD COLUMN IF NOT EXISTS metadata_policy_version TEXT;

ALTER TABLE assets
  ADD CONSTRAINT assets_risk_class_valid
  CHECK (risk_class IS NULL OR risk_class IN ('low', 'medium', 'high', 'restricted'));

ALTER TABLE assets
  ADD CONSTRAINT assets_risk_score_valid
  CHECK (risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100));

CREATE TABLE IF NOT EXISTS asset_collateral_policy (
  asset_id TEXT PRIMARY KEY REFERENCES assets(asset_id),
  eligible BOOLEAN NOT NULL,
  haircut_bps NUMERIC NOT NULL CHECK (haircut_bps >= 0),
  max_ltv_bps NUMERIC NOT NULL CHECK (max_ltv_bps >= 0),
  policy_version TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS asset_margin_policy (
  asset_id TEXT PRIMARY KEY REFERENCES assets(asset_id),
  eligible BOOLEAN NOT NULL,
  max_leverage NUMERIC NOT NULL CHECK (max_leverage >= 0),
  initial_margin_bps NUMERIC NOT NULL CHECK (initial_margin_bps >= 0),
  maintenance_margin_bps NUMERIC NOT NULL CHECK (maintenance_margin_bps >= 0),
  liquidation_threshold_bps NUMERIC NOT NULL CHECK (liquidation_threshold_bps >= 0),
  policy_version TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS asset_oracle_sources (
  asset_id TEXT NOT NULL REFERENCES assets(asset_id),
  source_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  max_staleness_seconds INTEGER NOT NULL CHECK (max_staleness_seconds >= 0),
  fallback_priority INTEGER NOT NULL CHECK (fallback_priority >= 0),
  PRIMARY KEY (asset_id, source_id),
  UNIQUE (asset_id, fallback_priority)
);

CREATE TABLE IF NOT EXISTS asset_oracle_fallback (
  asset_id TEXT NOT NULL REFERENCES assets(asset_id),
  source_id TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  PRIMARY KEY (asset_id, position),
  UNIQUE (asset_id, source_id)
);

CREATE TABLE IF NOT EXISTS asset_privacy_capability (
  asset_id TEXT PRIMARY KEY REFERENCES assets(asset_id),
  privacy_enabled BOOLEAN NOT NULL,
  default_mode TEXT NOT NULL,
  confidential_compute_supported BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS asset_privacy_modes (
  asset_id TEXT NOT NULL REFERENCES assets(asset_id),
  mode TEXT NOT NULL,
  PRIMARY KEY (asset_id, mode)
);

CREATE TABLE IF NOT EXISTS asset_confidential_compute_providers (
  asset_id TEXT NOT NULL REFERENCES assets(asset_id),
  provider_id TEXT NOT NULL,
  PRIMARY KEY (asset_id, provider_id)
);

CREATE TABLE IF NOT EXISTS asset_settlement_capability (
  asset_id TEXT PRIMARY KEY REFERENCES assets(asset_id),
  supports_settlement BOOLEAN NOT NULL,
  finality_profile TEXT NOT NULL,
  finality_blocks INTEGER NOT NULL CHECK (finality_blocks >= 0),
  finality_seconds INTEGER NOT NULL CHECK (finality_seconds >= 0)
);

CREATE TABLE IF NOT EXISTS asset_chain_support (
  asset_id TEXT NOT NULL REFERENCES assets(asset_id),
  chain_id TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  deploy_status TEXT NOT NULL,
  settlement_supported BOOLEAN NOT NULL,
  finality_profile TEXT NOT NULL,
  PRIMARY KEY (asset_id, chain_id),
  UNIQUE (chain_id, contract_address)
);

CREATE TABLE IF NOT EXISTS asset_metadata_audit (
  asset_id TEXT NOT NULL REFERENCES assets(asset_id),
  metadata_version TEXT NOT NULL,
  changed_at TIMESTAMP NOT NULL,
  changed_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  PRIMARY KEY (asset_id, metadata_version)
);

CREATE INDEX IF NOT EXISTS idx_asset_collateral_eligible
  ON asset_collateral_policy(eligible);

CREATE INDEX IF NOT EXISTS idx_asset_margin_eligible
  ON asset_margin_policy(eligible);

CREATE INDEX IF NOT EXISTS idx_asset_chain_support_chain
  ON asset_chain_support(chain_id);
