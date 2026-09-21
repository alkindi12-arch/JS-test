-- Seed activities / daily updates / attachment metadata for Lineage demo
-- Safe to re-run (INSERT IGNORE)

INSERT IGNORE INTO activities (
  id, equipment_id, title, activity_type, severity, status, assigned_team,
  start_date, created_by
) VALUES
  ('ACT-1042', 'EQ-120P-001A', 'Pump vibration high — drive end', 'breakdown', 'high', 'in_progress', 'rotating', '2026-09-18', 'system'),
  ('ACT-1038', 'EQ-130E-012', 'Bundle inspection — fouling check', 'inspection', 'medium', 'waiting_parts', 'static', '2026-09-12', 'system'),
  ('ACT-1021', 'EQ-210C-003', 'Monthly vibration survey', 'pm', 'low', 'open', 'rotating', '2026-09-20', 'system'),
  ('ACT-1015', 'EQ-120P-001B', 'Seal flush line check', 'routine', 'low', 'completed', 'ops', '2026-09-17', 'system'),
  ('ACT-1009', 'EQ-120P-001A', 'Motor insulation test', 'inspection', 'medium', 'closed', 'electrical', '2026-09-01', 'system');

INSERT IGNORE INTO daily_updates (
  id, activity_id, update_date, author, progress_notes, findings, condition_check
) VALUES
  ('UPD-1042-1', 'ACT-1042', '2026-09-18', 'Tech. Rahman',
   'Vibration confirmed on DE bearing. Peak 12.4 mm/s. Isolation requested.',
   'High radial vibration on drive end', 'worsened'),
  ('UPD-1042-2', 'ACT-1042', '2026-09-19', 'Tech. Rahman',
   'Bearing housing opened. Evidence of lubricant degradation. Parts indent raised.',
   'Lubricant dark / metallic particles', 'unchanged'),
  ('UPD-1042-3', 'ACT-1042', '2026-09-20', 'Superv. Khan',
   'Waiting seal kit ETA tomorrow. Continue standby on 120P-001B.',
   NULL, 'unchanged'),
  ('UPD-1038-1', 'ACT-1038', '2026-09-12', 'Tech. Ali',
   'Opened channel cover. Fouling moderate on tube side.',
   'Fouling observed', 'unchanged'),
  ('UPD-1038-2', 'ACT-1038', '2026-09-19', 'Tech. Ali',
   'Gasket set on order. Work paused until parts arrive.',
   NULL, 'unchanged');

INSERT IGNORE INTO attachments (
  id, activity_id, update_id, file_name, file_type, file_url, uploaded_by
) VALUES
  ('ATT-1042-1', 'ACT-1042', 'UPD-1042-1', 'vibration_trend_0918.jpg', 'image/jpeg', '#', 'Tech. Rahman'),
  ('ATT-1042-2', 'ACT-1042', NULL, 'permit_LOTO_1042.pdf', 'application/pdf', '#', 'Superv. Khan'),
  ('ATT-1042-3', 'ACT-1042', 'UPD-1042-2', 'bearing_housing.mp4', 'video/mp4', '#', 'Tech. Rahman');
