-- These retired game modules must not remain visible as published cards. Related
-- game scores are removed through the game_scores.mission_id ON DELETE CASCADE constraint.
DELETE FROM missions
WHERE slug IN ('intake', 'parcel-panic');
