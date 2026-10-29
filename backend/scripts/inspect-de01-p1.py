import sys, os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from run_sql import run_sql

sql = """
SELECT q.question_number, q.prompt, q.correct_answer, q.max_score
FROM "ExamPart" ep
JOIN "Exam" e ON e.id = ep.exam_id
JOIN "Question" q ON q.part_id = ep.id
WHERE e.title = 'Đề 01 — Full Reading · 4 Parts' AND ep.part_number = 1
ORDER BY q.question_number;
"""
run_sql(sql)
