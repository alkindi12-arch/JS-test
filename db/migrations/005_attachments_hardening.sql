-- Migration 005: Phase E — attachments hardening
-- Columns file_size / uploaded_by_user_id already added in 001;
-- this migration is idempotent and adds a helpful index.

SET NAMES utf8mb4;

SET @has_size := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attachments' AND COLUMN_NAME = 'file_size'
);
SET @sql := IF(
  @has_size = 0,
  'ALTER TABLE attachments ADD COLUMN file_size INT UNSIGNED NULL AFTER file_type',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_uid := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attachments' AND COLUMN_NAME = 'uploaded_by_user_id'
);
SET @sql := IF(
  @has_uid = 0,
  'ALTER TABLE attachments ADD COLUMN uploaded_by_user_id INT UNSIGNED NULL AFTER uploaded_by',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_idx := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attachments' AND INDEX_NAME = 'idx_attachments_activity'
);
SET @sql := IF(
  @has_idx = 0,
  'ALTER TABLE attachments ADD KEY idx_attachments_activity (activity_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
