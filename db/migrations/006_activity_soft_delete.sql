-- Migration 006: Soft-delete for activities (Admin remove without losing FK history option)
SET NAMES utf8mb4;

SET @has_deleted := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'activities'
    AND COLUMN_NAME = 'deleted_at'
);
SET @sql := IF(
  @has_deleted = 0,
  'ALTER TABLE activities ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL AFTER closed_at, ADD KEY idx_activities_deleted (deleted_at)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
