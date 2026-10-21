CREATE TABLE game_scores (
  id UUID PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT game_scores_team_mission_unique UNIQUE (team_id, mission_id)
);

CREATE INDEX game_scores_team_id_idx ON game_scores(team_id);

UPDATE event_state SET is_open = TRUE WHERE id = 1;
