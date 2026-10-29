import sys, os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from run_sql import run_sql

sql = """
SELECT es.id, es.status, es.total_score, es.reading_score, sa.question_id, q.prompt, q.correct_answer, sa.selected_option, sa.score
FROM "ExamSubmission" es
JOIN "SubmissionAnswer" sa ON sa.submission_id = es.id
JOIN "Question" q ON q.id = sa.question_id
WHERE es.id = 'd087bbfe-a663-4243-9bf6-9198427207b2'
ORDER BY q.question_number;
"""
run_sql(sql)
