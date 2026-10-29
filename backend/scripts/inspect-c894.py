import sys, os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from run_sql import run_sql

sql = """
SELECT q.id, q.question_number, q.question_type, q.prompt, q.correct_answer, q.max_score, q.options
FROM "Question" q
JOIN "ExamPart" ep ON ep.id = q.part_id
WHERE ep.exam_id = 'c894c481-d501-459e-ae11-d012264a9139'
ORDER BY q.question_number;
"""
run_sql(sql)
