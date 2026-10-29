import sys, os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from run_sql import run_sql

sql = """
SELECT q.id, q.question_number, q.prompt, q.options, q.correct_answer, q.max_score
FROM "Question" q
JOIN "ExamPart" ep ON ep.id = q.part_id
WHERE ep.exam_id = 'aebb3f72-9280-4bc7-a9cc-d503c46b08be'
ORDER BY q.question_number;
"""
run_sql(sql)
