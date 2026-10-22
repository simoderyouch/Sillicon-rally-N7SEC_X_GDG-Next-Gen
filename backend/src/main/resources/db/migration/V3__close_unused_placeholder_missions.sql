-- Keep historic score rows intact while removing unused placeholder cards from players.
UPDATE missions
SET release_state = 'CLOSED'
WHERE slug IN ('access-control', 'trace');
