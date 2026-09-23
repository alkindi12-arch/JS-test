-- Migration 003: Phase C — equipment status history
-- Hostinger MySQL — additive, preserves live equipment.status

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS equipment_status_history (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  equipment_id VARCHAR(64) NOT NULL,
  status ENUM('running', 'standby', 'offline', 'maintenance') NOT NULL,
  previous_status ENUM('running', 'standby', 'offline', 'maintenance') NULL,
  reason VARCHAR(255) NULL,
  notes TEXT NULL,
  activity_id VARCHAR(64) NULL,
  changed_by_user_id INT UNSIGNED NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_esh_equipment (equipment_id, changed_at),
  KEY idx_esh_activity (activity_id),
  CONSTRAINT fk_esh_equipment FOREIGN KEY (equipment_id) REFERENCES equipment (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_esh_activity FOREIGN KEY (activity_id) REFERENCES activities (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_esh_user FOREIGN KEY (changed_by_user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed one baseline row per equipment from current status (idempotent)
INSERT INTO equipment_status_history (
  equipment_id, status, previous_status, reason, notes, changed_at
)
SELECT
  e.id,
  e.status,
  NULL,
  'baseline',
  'Seeded from equipment.status at Phase C migration',
  COALESCE(e.created_at, NOW())
FROM equipment e
WHERE NOT EXISTS (
  SELECT 1 FROM equipment_status_history h WHERE h.equipment_id = e.id
);
