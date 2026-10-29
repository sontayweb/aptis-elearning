import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))
from run_sql import run_sql

sql = """
SELECT e.id, e.title, ep.part_number, ep.title as part_title, count(q.id) as q_cnt
FROM "Exam" e
JOIN "ExamPart" ep ON ep.exam_id = e.id
LEFT JOIN "Question" q ON q.part_id = ep.id
WHERE e.skill = 'READING' AND (e.title ILIKE '%Đề 03%' OR e.title ILIKE '%Đề 3%' OR e.title ILIKE '%De 03%')
GROUP BY e.id, e.title, ep.part_number, ep.title
ORDER BY e.title, ep.part_number;
"""
run_sql(sql)
