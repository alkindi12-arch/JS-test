-- Lineage canonical schema (Hostinger MySQL) — ERD-aligned Phase A
-- Plant codes kept as VARCHAR PKs (A01, CDU, EQ-…). Org tables use INT PKs.
-- severity renamed to priority per product decision.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS roles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  permissions_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teams (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  discipline VARCHAR(64) NOT NULL,
  manager_user_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_teams_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

ALTER TABLE teams
  ADD CONSTRAINT fk_teams_manager FOREIGN KEY (manager_user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS areas (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  created_by VARCHAR(120) NULL,
  updated_by VARCHAR(120) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS units (
  id VARCHAR(32) PRIMARY KEY,
  area_id VARCHAR(32) NOT NULL,
  name VARCHAR(120) NOT NULL,
  type ENUM('process', 'utilities', 'offsites', 'other') NOT NULL DEFAULT 'process',
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_units_area FOREIGN KEY (area_id) REFERENCES areas (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS equipment (
  id VARCHAR(64) PRIMARY KEY,
  unit_id VARCHAR(32) NOT NULL,
  tag_number VARCHAR(64) NOT NULL,
  description VARCHAR(255) NOT NULL,
  make VARCHAR(120) NULL,
  model VARCHAR(120) NULL,
  serial VARCHAR(120) NULL,
  criticality ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  status ENUM('running', 'standby', 'offline', 'maintenance') NOT NULL DEFAULT 'running',
  history_summary TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_equipment_tag (tag_number),
  CONSTRAINT fk_equipment_unit FOREIGN KEY (unit_id) REFERENCES units (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(64) PRIMARY KEY,
  equipment_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  activity_type ENUM('breakdown', 'pm', 'inspection', 'routine', 'project') NOT NULL,
  priority ENUM('low', 'medium', 'high', 'emergency') NOT NULL DEFAULT 'medium',
  status ENUM('open', 'in_progress', 'waiting_parts', 'completed', 'closed') NOT NULL DEFAULT 'open',
  assigned_team ENUM('rotating', 'electrical', 'instrument', 'static', 'ops', 'vendor') NOT NULL,
  assigned_team_id INT UNSIGNED NULL,
  start_date DATE NOT NULL,
  opened_at DATETIME NULL,
  end_date DATE NULL,
  closed_at DATETIME NULL,
  closing_notes TEXT NULL,
  root_cause TEXT NULL,
  corrective_action TEXT NULL,
  duration_hours DECIMAL(10, 2) NULL,
  created_by VARCHAR(120) NULL,
  opened_by_user_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_activities_equipment FOREIGN KEY (equipment_id) REFERENCES equipment (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_activities_team FOREIGN KEY (assigned_team_id) REFERENCES teams (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_activities_opened_by FOREIGN KEY (opened_by_user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  KEY idx_activities_status (status),
  KEY idx_activities_equipment (equipment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS root_cause_analysis (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  activity_id VARCHAR(64) NOT NULL,
  failure_mode VARCHAR(255) NULL,
  root_cause TEXT NULL,
  corrective_action TEXT NULL,
  verified_by_user_id INT UNSIGNED NULL,
  verified_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_rca_activity (activity_id),
  CONSTRAINT fk_rca_activity FOREIGN KEY (activity_id) REFERENCES activities (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_rca_verified_by FOREIGN KEY (verified_by_user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS daily_updates (
  id VARCHAR(64) PRIMARY KEY,
  activity_id VARCHAR(64) NOT NULL,
  update_date DATE NOT NULL,
  author VARCHAR(120) NOT NULL,
  updated_by_user_id INT UNSIGNED NULL,
  progress_notes TEXT NOT NULL,
  findings TEXT NULL,
  condition_check VARCHAR(64) NULL,
  progress_pct TINYINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_updates_activity FOREIGN KEY (activity_id) REFERENCES activities (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_updates_user FOREIGN KEY (updated_by_user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  KEY idx_updates_activity (activity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attachments (
  id VARCHAR(64) PRIMARY KEY,
  activity_id VARCHAR(64) NOT NULL,
  update_id VARCHAR(64) NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(64) NOT NULL,
  file_size INT UNSIGNED NULL,
  file_url VARCHAR(1024) NOT NULL,
  uploaded_by VARCHAR(120) NOT NULL,
  uploaded_by_user_id INT UNSIGNED NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attachments_activity FOREIGN KEY (activity_id) REFERENCES activities (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_attachments_update FOREIGN KEY (update_id) REFERENCES daily_updates (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_attachments_user FOREIGN KEY (uploaded_by_user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
