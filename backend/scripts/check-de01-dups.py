import sys, os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from run_sql import run_sql

sql = """
SELECT e.id, e.title, e.is_published, ep.id as part_id, ep.part_number, ep.title as part_title, count(q.id) as q_cnt
FROM "Exam" e
JOIN "ExamPart" ep ON ep.exam_id = e.id
LEFT JOIN "Question" q ON q.part_id = ep.id
WHERE e.skill = 'READING' AND (e.id = 'ed88b4a6-ecbb-4185-9649-a12503aa0053' OR e.title ILIKE '%Đề 01%' OR e.title ILIKE '%Đề 1%')
GROUP BY e.id, e.title, e.is_published, ep.id, ep.part_number, ep.title
ORDER BY e.title, ep.part_number;
"""
run_sql(sql)
