import sys, os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from run_sql import run_sql

sql = """
SELECT es.id, e.title, es.status, es.total_score, es.reading_score, es.started_at, count(sa.id) as ans_cnt
FROM "ExamSubmission" es
JOIN "Exam" e ON e.id = es.exam_id
JOIN "ExamPart" ep ON ep.exam_id = e.id
LEFT JOIN "SubmissionAnswer" sa ON sa.submission_id = es.id
WHERE e.skill = 'READING' AND (ep.title ILIKE '%Part 2%' OR ep.title ILIKE '%Cohesion%')
GROUP BY es.id, e.title, es.status, es.total_score, es.reading_score, es.started_at
ORDER BY es.started_at DESC
LIMIT 10;
"""
run_sql(sql)
