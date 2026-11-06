-- A tiny studio archive.
SELECT project.name, COUNT(visit.id) AS total_visits
FROM project
LEFT JOIN visit ON visit.project_id = project.id
WHERE project.published = TRUE AND project.name LIKE '%Byte%'
GROUP BY project.name
ORDER BY total_visits DESC
LIMIT 8;
