-- Lineage schema for Hostinger MySQL / MariaDB
-- Run in hPanel → Databases → phpMyAdmin (or mysql CLI) after creating the database.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

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
  severity ENUM('low', 'medium', 'high', 'emergency') NOT NULL DEFAULT 'medium',
  status ENUM('open', 'in_progress', 'waiting_parts', 'completed', 'closed') NOT NULL DEFAULT 'open',
  assigned_team ENUM('rotating', 'electrical', 'instrument', 'static', 'ops', 'vendor') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  closing_notes TEXT NULL,
  root_cause TEXT NULL,
  corrective_action TEXT NULL,
  duration_hours DECIMAL(10, 2) NULL,
  created_by VARCHAR(120) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_activities_equipment FOREIGN KEY (equipment_id) REFERENCES equipment (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  KEY idx_activities_status (status),
  KEY idx_activities_equipment (equipment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS daily_updates (
  id VARCHAR(64) PRIMARY KEY,
  activity_id VARCHAR(64) NOT NULL,
  update_date DATE NOT NULL,
  author VARCHAR(120) NOT NULL,
  progress_notes TEXT NOT NULL,
  findings TEXT NULL,
  condition_check VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_updates_activity FOREIGN KEY (activity_id) REFERENCES activities (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  KEY idx_updates_activity (activity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attachments (
  id VARCHAR(64) PRIMARY KEY,
  activity_id VARCHAR(64) NOT NULL,
  update_id VARCHAR(64) NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(64) NOT NULL,
  file_url VARCHAR(1024) NOT NULL,
  uploaded_by VARCHAR(120) NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attachments_activity FOREIGN KEY (activity_id) REFERENCES activities (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_attachments_update FOREIGN KEY (update_id) REFERENCES daily_updates (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional seed (safe to re-run with IGNORE)
INSERT IGNORE INTO areas (id, name, description, created_by) VALUES
  ('A01', 'Heavy Oil Complex', 'Crude and vacuum distillation cluster', 'system'),
  ('A02', 'Conversion Block', 'Hydrocracker and delayed coker', 'system'),
  ('A03', 'Utilities & Offsites', 'Steam, power, tankage', 'system');

INSERT IGNORE INTO units (id, area_id, name, type) VALUES
  ('CDU', 'A01', 'Crude Distillation', 'process'),
  ('VDU', 'A01', 'Vacuum Distillation', 'process'),
  ('HCU', 'A02', 'Hydrocracker', 'process'),
  ('DCU', 'A02', 'Delayed Coker', 'process'),
  ('STM', 'A03', 'Steam Generation', 'utilities');

INSERT IGNORE INTO equipment (id, unit_id, tag_number, description, criticality, status, make, model) VALUES
  ('EQ-120P-001A', 'CDU', '120P-001A', 'Crude Charge Pump A', 'high', 'maintenance', 'Flowserve', 'HPX-8x10'),
  ('EQ-120P-001B', 'CDU', '120P-001B', 'Crude Charge Pump B', 'high', 'running', 'Flowserve', 'HPX-8x10'),
  ('EQ-130E-012', 'CDU', '130E-012', 'Crude / Resid Exchanger', 'medium', 'running', NULL, NULL),
  ('EQ-210C-003', 'HCU', '210C-003', 'Recycle Gas Compressor', 'high', 'standby', NULL, NULL);
