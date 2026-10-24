-- Existing startup registrations were drafts. Make the known shipped games visible once,
-- while leaving every custom mission and future administrator choice untouched.
UPDATE missions
SET release_state = 'PUBLISHED'
WHERE release_state = 'DRAFT'
  AND slug IN (
    'intake',
    'beacon-bounce',
    'code-breaker',
    'parcel-panic',
    'cyber-awareness-hub',
    'pacman',
    'word-scramble'
  );
