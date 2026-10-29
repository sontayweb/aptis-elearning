import sys, os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from run_sql import run_sql

sql = """
SELECT es.id, es.status, es.total_score, es.reading_score, es.started_at, count(sa.id) as ans_cnt
FROM "ExamSubmission" es
LEFT JOIN "SubmissionAnswer" sa ON sa.submission_id = es.id
WHERE es.exam_id = 'aebb3f72-9280-4bc7-a9cc-d503c46b08be'
GROUP BY es.id, es.status, es.total_score, es.reading_score, es.started_at
ORDER BY es.started_at DESC
LIMIT 5;
"""
run_sql(sql)
