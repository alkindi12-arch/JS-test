-- Migration 004: Phase D — work orders linked to activities
-- Hostinger MySQL — additive

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS work_orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  activity_id VARCHAR(64) NOT NULL,
  external_ref VARCHAR(64) NOT NULL,
  title VARCHAR(255) NULL,
  status ENUM('planned', 'released', 'in_progress', 'completed', 'cancelled')
    NOT NULL DEFAULT 'planned',
  planned_start DATE NULL,
  planned_finish DATE NULL,
  notes TEXT NULL,
  created_by_user_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wo_external_ref (external_ref),
  KEY idx_wo_activity (activity_id),
  KEY idx_wo_status (status),
  CONSTRAINT fk_wo_activity FOREIGN KEY (activity_id) REFERENCES activities (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_wo_created_by FOREIGN KEY (created_by_user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
