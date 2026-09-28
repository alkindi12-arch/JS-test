-- Migration 007: Comments on uploaded attachments (shown with photos in reports)
SET NAMES utf8mb4;

SET @has_comment := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'attachments'
    AND COLUMN_NAME = 'comment'
);
SET @sql := IF(
  @has_comment = 0,
  'ALTER TABLE attachments ADD COLUMN comment TEXT NULL AFTER file_url',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
