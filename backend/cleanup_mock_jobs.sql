-- Limpieza de vacantes mock + aplicaciones asociadas
-- Ajusta la lista de títulos si necesitas conservar alguno.

BEGIN;

WITH mock_jobs AS (
  SELECT id
  FROM jobs
  WHERE LOWER(title) IN (
    'senior product designer',
    'backend engineer (go)'
  )
  OR title ILIKE '%product designer%'
  OR title ILIKE '%backend engineer%go%'
)
DELETE FROM applications
WHERE "jobId" IN (SELECT id FROM mock_jobs);

UPDATE jobs
SET "isActive" = false,
    "updatedAt" = NOW()
WHERE id IN (
  SELECT id
  FROM jobs
  WHERE LOWER(title) IN (
    'senior product designer',
    'backend engineer (go)'
  )
  OR title ILIKE '%product designer%'
  OR title ILIKE '%backend engineer%go%'
);

COMMIT;
