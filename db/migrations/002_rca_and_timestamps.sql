-- Migration 002: Phase B — RCA table + opened_at/closed_at on activities
-- Hostinger MySQL — additive, preserves plant code PKs and live data

SET NAMES utf8mb4;

-- —— Root cause analysis (1:0..1 per activity) ——
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

-- —— opened_at / closed_at (ERD timestamps — keep start_date/end_date for UI dates) ——
SET @has_opened := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activities' AND COLUMN_NAME = 'opened_at'
);
SET @sql := IF(
  @has_opened = 0,
  'ALTER TABLE activities ADD COLUMN opened_at DATETIME NULL AFTER start_date, ADD COLUMN closed_at DATETIME NULL AFTER end_date',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill opened_at / closed_at from existing date columns
UPDATE activities
SET opened_at = COALESCE(opened_at, TIMESTAMP(start_date)),
    closed_at = CASE
      WHEN status IN ('completed', 'closed') THEN COALESCE(closed_at, TIMESTAMP(COALESCE(end_date, start_date)))
      ELSE closed_at
    END
WHERE opened_at IS NULL
   OR (status IN ('completed', 'closed') AND closed_at IS NULL);

-- Migrate denormalized RCA fields into root_cause_analysis (once)
INSERT INTO root_cause_analysis (activity_id, failure_mode, root_cause, corrective_action)
SELECT a.id, NULL, a.root_cause, a.corrective_action
FROM activities a
WHERE (a.root_cause IS NOT NULL AND a.root_cause <> '')
   OR (a.corrective_action IS NOT NULL AND a.corrective_action <> '')
ON DUPLICATE KEY UPDATE
  root_cause = COALESCE(VALUES(root_cause), root_cause_analysis.root_cause),
  corrective_action = COALESCE(VALUES(corrective_action), root_cause_analysis.corrective_action);
