import sys, os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from run_sql import run_sql

sql = """
SELECT ep.part_number, ep.title as part_title, q.question_number, q.prompt, q.correct_answer, q.max_score
FROM "ExamPart" ep
JOIN "Exam" e ON e.id = ep.exam_id
JOIN "Question" q ON q.part_id = ep.id
WHERE e.id = '58a5282a-276e-422f-8caf-1a03218d9542' OR e.title = 'Đề 01 — Full Reading · 4 Parts'
ORDER BY ep.part_number, q.question_number;
"""
run_sql(sql)
