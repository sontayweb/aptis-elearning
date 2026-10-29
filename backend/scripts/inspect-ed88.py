import sys, os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from run_sql import run_sql

sql = """
SELECT e.id, e.title, ep.id as part_id, ep.part_number, ep.title as part_title, q.id as q_id, q.question_number, q.prompt, q.options, q.correct_answer, q.max_score
FROM "Exam" e
JOIN "ExamPart" ep ON ep.exam_id = e.id
JOIN "Question" q ON q.part_id = ep.id
WHERE e.id = 'ed88b4a6-ecbb-4185-9649-a12503aa0053'
ORDER BY q.question_number;
"""
run_sql(sql)
