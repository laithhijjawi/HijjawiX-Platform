PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('OWNER','GARAGE_ADMIN','TECHNICIAN','VEHICLE_OWNER')),
  locale TEXT NOT NULL DEFAULT 'ar' CHECK(locale IN ('ar','en')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','revoked')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS garages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_account_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(owner_account_id) REFERENCES accounts(id)
);

CREATE TABLE IF NOT EXISTS garage_members (
  garage_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('GARAGE_ADMIN','TECHNICIAN')),
  created_at INTEGER NOT NULL,
  PRIMARY KEY(garage_id, account_id),
  FOREIGN KEY(garage_id) REFERENCES garages(id),
  FOREIGN KEY(account_id) REFERENCES accounts(id)
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  serial TEXT NOT NULL UNIQUE,
  hardware_family TEXT NOT NULL,
  hardware_revision TEXT,
  esp_mac TEXT,
  public_key_jwk TEXT NOT NULL,
  key_fingerprint TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'provisioned'
    CHECK(status IN ('provisioned','active','suspended','revoked','retired')),
  assigned_account_id TEXT,
  assigned_garage_id TEXT,
  firmware_version TEXT,
  profile_id TEXT,
  last_seen_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(assigned_account_id) REFERENCES accounts(id),
  FOREIGN KEY(assigned_garage_id) REFERENCES garages(id)
);

CREATE TABLE IF NOT EXISTS device_challenges (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  nonce TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  FOREIGN KEY(device_id) REFERENCES devices(id)
);

CREATE INDEX IF NOT EXISTS idx_device_challenges_device
  ON device_challenges(device_id, expires_at);

CREATE TABLE IF NOT EXISTS device_sessions (
  token_hash TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  FOREIGN KEY(device_id) REFERENCES devices(id)
);

CREATE INDEX IF NOT EXISTS idx_device_sessions_device
  ON device_sessions(device_id, expires_at);

CREATE TABLE IF NOT EXISTS user_sessions (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  FOREIGN KEY(account_id) REFERENCES accounts(id)
);

CREATE TABLE IF NOT EXISTS vehicle_profiles (
  id TEXT PRIMARY KEY,
  manufacturer TEXT NOT NULL,
  family TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','retired')),
  manifest_json TEXT NOT NULL,
  signature TEXT,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  published_at INTEGER,
  FOREIGN KEY(created_by) REFERENCES accounts(id)
);

CREATE TABLE IF NOT EXISTS firmware_releases (
  id TEXT PRIMARY KEY,
  hardware_family TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','retired')),
  r2_key TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  signature TEXT NOT NULL,
  minimum_version TEXT,
  notes_ar TEXT,
  notes_en TEXT,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  published_at INTEGER,
  UNIQUE(hardware_family, version),
  FOREIGN KEY(created_by) REFERENCES accounts(id)
);

CREATE TABLE IF NOT EXISTS diagnostic_sessions (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  garage_id TEXT,
  profile_id TEXT NOT NULL,
  vehicle_identifier TEXT,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  status TEXT NOT NULL DEFAULT 'running',
  summary_json TEXT,
  FOREIGN KEY(device_id) REFERENCES devices(id),
  FOREIGN KEY(account_id) REFERENCES accounts(id),
  FOREIGN KEY(garage_id) REFERENCES garages(id),
  FOREIGN KEY(profile_id) REFERENCES vehicle_profiles(id)
);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  garage_id TEXT,
  device_id TEXT,
  category TEXT NOT NULL,
  language TEXT NOT NULL CHECK(language IN ('ar','en')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK(status IN ('new','reviewing','planned','done','rejected')),
  admin_notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY(account_id) REFERENCES accounts(id),
  FOREIGN KEY(garage_id) REFERENCES garages(id),
  FOREIGN KEY(device_id) REFERENCES devices(id)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_account_id TEXT,
  actor_device_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  detail_json TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(actor_account_id) REFERENCES accounts(id),
  FOREIGN KEY(actor_device_id) REFERENCES devices(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_devices_assignment ON devices(assigned_garage_id, assigned_account_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status, created_at DESC);
