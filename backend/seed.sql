USE oncoflow;

INSERT INTO languages (code, name) VALUES
  ('en', 'English'),
  ('fr', 'Français');

INSERT INTO translations (language_code, ui_key, value) VALUES
  ('en', 'login.signIn', 'Sign In'),
  ('en', 'patients.title', 'Patients'),
  ('en', 'notes.title', 'Notes'),
  ('fr', 'login.signIn', 'Connexion'),
  ('fr', 'patients.title', 'Patients'),
  ('fr', 'notes.title', 'Notes');

INSERT INTO users (name, email, password_hash, role, language_code) VALUES
  ('Admin', 'admin@oncoflow.local',
   '$2a$10$azoobgBhU2C4dnIYmDEW.eWFRiMIK9H39X1cC/2FGfqFeWEbHJXO6',
   'admin', 'en'),
  ('Dr. Sarah Chen', 'dr.chen@hospital.org',
   '$2a$10$Iw2dbGeAGanpJDlwW.bnR.X5NQiB7PVVCaQHUp1IXGfioH4Ks8ncy',
   'doctor', 'en');

INSERT INTO patients (full_name, birth_date, gender, phone, email, diagnosis, doctor_id) VALUES
  ('Jane Doe',     '1972-04-12', 'female', '+1-555-0101', 'jane.doe@example.com',  'Breast cancer Stage II',     2),
  ('John Smith',   '1965-09-30', 'male',   '+1-555-0102', 'john.smith@example.com', 'Lung adenocarcinoma Stage III', 2),
  ('Maria Garcia', '1980-01-22', 'female', '+1-555-0103', 'maria.g@example.com',    'Colorectal cancer Stage I',  2);

INSERT INTO medical_records (patient_id, doctor_id, title, description, record_date) VALUES
  (1, 2, 'Initial consultation',   'Discussed diagnosis and treatment options.', '2026-01-10'),
  (1, 2, 'Cycle 1 chemotherapy',   'Tolerated well, no major side effects.',     '2026-02-05'),
  (2, 2, 'Imaging review',         'CT scan shows stable disease.',              '2026-03-12');

INSERT INTO appointments (patient_id, doctor_id, scheduled_at, reason) VALUES
  (1, 2, '2026-05-10 09:00:00', 'Follow-up after Cycle 2'),
  (2, 2, '2026-05-12 14:30:00', 'Treatment review'),
  (3, 2, '2026-05-15 10:00:00', 'Initial oncology consult');

INSERT INTO ai_models (name, version, task, description) VALUES
  ('OncoPredict', '1.0', 'risk-stratification', 'Placeholder risk-stratification model.');
