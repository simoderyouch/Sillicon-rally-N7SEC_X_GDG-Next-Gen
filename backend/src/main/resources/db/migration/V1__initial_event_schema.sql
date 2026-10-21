CREATE TABLE teams (
  id UUID PRIMARY KEY,
  display_name VARCHAR(60) NOT NULL UNIQUE,
  join_code_hash VARCHAR(100),
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE missions (
  id UUID PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(120) NOT NULL,
  description VARCHAR(1000) NOT NULL,
  max_score INTEGER NOT NULL CHECK (max_score >= 0),
  release_state VARCHAR(20) NOT NULL
);

CREATE TABLE event_state (
  id BIGINT PRIMARY KEY,
  is_open BOOLEAN NOT NULL DEFAULT FALSE,
  leaderboard_locked BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO event_state (id, is_open, leaderboard_locked) VALUES (1, FALSE, FALSE);

INSERT INTO missions (id, slug, title, description, max_score, release_state) VALUES
  ('52b5da59-650a-4c98-a29a-3daefa43a201', 'intake', 'Mission Intake', 'Triage suspicious messages and identify the real incident.', 100, 'PUBLISHED'),
  ('52b5da59-650a-4c98-a29a-3daefa43a202', 'access-control', 'Access Control', 'Repair a weak account and improve its protection.', 100, 'PUBLISHED'),
  ('52b5da59-650a-4c98-a29a-3daefa43a203', 'trace', 'Mission Trace', 'Follow public clues to find the relevant evidence.', 100, 'PUBLISHED'),
  ('52b5da59-650a-4c98-a29a-3daefa43a204', 'decode', 'Decode the Signal', 'Recover a message from safe encoded artefacts.', 100, 'DRAFT'),
  ('52b5da59-650a-4c98-a29a-3daefa43a205', 'response', 'Incident Response', 'Choose the best containment and communication actions.', 100, 'DRAFT');
