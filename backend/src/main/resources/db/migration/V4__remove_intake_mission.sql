DELETE FROM game_scores
WHERE mission_id IN (SELECT id FROM missions WHERE slug = 'intake');

DELETE FROM missions
WHERE slug = 'intake';
