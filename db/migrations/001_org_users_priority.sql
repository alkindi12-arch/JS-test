-- Migration 001: Org tables (roles/teams/users), priority rename, user/team FKs
-- Hostinger MySQL — safe additive migration for live u337841818_lineage

SET NAMES utf8mb4;

-- —— Roles ——
CREATE TABLE IF NOT EXISTS roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  permissions_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- —— Teams ——
CREATE TABLE IF NOT EXISTS teams (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  discipline VARCHAR(64) NOT NULL,
  manager_user_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_teams_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- —— Users ——
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(40) NULL,
  password_hash VARCHAR(255) NOT NULL,
  team_id INT UNSIGNED NULL,
  role_id INT UNSIGNED NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_users_team FOREIGN KEY (team_id) REFERENCES teams (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Team manager FK (after users exists) — idempotent
SET @has_mgr := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teams' AND CONSTRAINT_NAME = 'fk_teams_manager'
);
SET @sql := IF(
  @has_mgr = 0,
  'ALTER TABLE teams ADD CONSTRAINT fk_teams_manager FOREIGN KEY (manager_user_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Seed roles
INSERT IGNORE INTO roles (id, name, permissions_json) VALUES
  (1, 'Admin', JSON_OBJECT('all', true)),
  (2, 'Supervisor', JSON_OBJECT('activities', JSON_ARRAY('read','write','complete','close'), 'admin', false)),
  (3, 'Technician', JSON_OBJECT('activities', JSON_ARRAY('read','write','update'), 'admin', false)),
  (4, 'Operator', JSON_OBJECT('activities', JSON_ARRAY('read','create'), 'admin', false));

-- Seed teams (discipline matches old ENUM values)
INSERT IGNORE INTO teams (id, name, discipline) VALUES
  (1, 'Rotating', 'rotating'),
  (2, 'Electrical', 'electrical'),
  (3, 'Instrument', 'instrument'),
  (4, 'Static', 'static'),
  (5, 'Ops', 'ops'),
  (6, 'Vendor', 'vendor');

-- Rename severity → priority (idempotent-ish: only if severity exists)
SET @has_severity := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'activities'
    AND COLUMN_NAME = 'severity'
);
SET @sql := IF(
  @has_severity > 0,
  'ALTER TABLE activities CHANGE COLUMN severity priority ENUM(''low'',''medium'',''high'',''emergency'') NOT NULL DEFAULT ''medium''',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add team / user FKs on activities
SET @has_team_fk := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activities' AND COLUMN_NAME = 'assigned_team_id'
);
SET @sql := IF(
  @has_team_fk = 0,
  'ALTER TABLE activities ADD COLUMN assigned_team_id INT UNSIGNED NULL AFTER assigned_team, ADD COLUMN opened_by_user_id INT UNSIGNED NULL AFTER created_by',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill assigned_team_id from ENUM
UPDATE activities a
JOIN teams t ON t.discipline = a.assigned_team
SET a.assigned_team_id = t.id
WHERE a.assigned_team_id IS NULL;

-- Add FKs if missing
SET @has_fk_team := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activities' AND CONSTRAINT_NAME = 'fk_activities_team'
);
SET @sql := IF(
  @has_fk_team = 0,
  'ALTER TABLE activities ADD CONSTRAINT fk_activities_team FOREIGN KEY (assigned_team_id) REFERENCES teams (id) ON UPDATE CASCADE ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk_opened := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activities' AND CONSTRAINT_NAME = 'fk_activities_opened_by'
);
SET @sql := IF(
  @has_fk_opened = 0,
  'ALTER TABLE activities ADD CONSTRAINT fk_activities_opened_by FOREIGN KEY (opened_by_user_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- activity updates: user FK + progress_pct
SET @has_upd_user := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'daily_updates' AND COLUMN_NAME = 'updated_by_user_id'
);
SET @sql := IF(
  @has_upd_user = 0,
  'ALTER TABLE daily_updates ADD COLUMN updated_by_user_id INT UNSIGNED NULL AFTER author, ADD COLUMN progress_pct TINYINT UNSIGNED NULL AFTER condition_check',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk_upd := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'daily_updates' AND CONSTRAINT_NAME = 'fk_updates_user'
);
SET @sql := IF(
  @has_fk_upd = 0,
  'ALTER TABLE daily_updates ADD CONSTRAINT fk_updates_user FOREIGN KEY (updated_by_user_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- attachments user FK + file_size
SET @has_att_user := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attachments' AND COLUMN_NAME = 'uploaded_by_user_id'
);
SET @sql := IF(
  @has_att_user = 0,
  'ALTER TABLE attachments ADD COLUMN uploaded_by_user_id INT UNSIGNED NULL AFTER uploaded_by, ADD COLUMN file_size INT UNSIGNED NULL AFTER file_type',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk_att := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attachments' AND CONSTRAINT_NAME = 'fk_attachments_user'
);
SET @sql := IF(
  @has_fk_att = 0,
  'ALTER TABLE attachments ADD CONSTRAINT fk_attachments_user FOREIGN KEY (uploaded_by_user_id) REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
