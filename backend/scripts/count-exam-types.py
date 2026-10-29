import sys, os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from run_sql import run_sql

sql = """
SELECT 
  CASE 
    WHEN e.title LIKE '%Full Reading%' THEN 'Full Reading'
    WHEN ep.title LIKE '%Part 1%' OR ep.title LIKE '%Sentence comprehension%' THEN 'Part 1'
    WHEN ep.title LIKE '%Part 2%' OR ep.title LIKE '%Cohesion%' THEN 'Part 2'
    WHEN ep.title LIKE '%Part 3%' OR ep.title LIKE '%Gap Fill%' OR ep.title LIKE '%Opinion%' THEN 'Part 3'
    WHEN ep.title LIKE '%Part 4%' OR ep.title LIKE '%Long Text%' THEN 'Part 4'
    ELSE 'Other'
  END as category,
  count(distinct e.id) as exam_count
FROM "Exam" e
JOIN "ExamPart" ep ON ep.exam_id = e.id
WHERE e.skill = 'READING' AND e.is_published = true
GROUP BY 1
ORDER BY 1;
"""
run_sql(sql)
