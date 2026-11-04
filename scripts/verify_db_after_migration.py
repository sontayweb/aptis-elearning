from vps_db import run_remote_sql

sql = """
SELECT e.skill,
       COUNT(CASE WHEN q.correct_answer ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 1 END) as uuid_count,
       COUNT(CASE WHEN q.correct_answer ~ '^[0-9]+$' THEN 1 END) as numeric_count,
       COUNT(CASE WHEN q.correct_answer IS NOT NULL THEN 1 END) as non_null_count,
       COUNT(*) as total_questions
FROM "Question" q
JOIN "ExamPart" ep ON q.part_id = ep.id
JOIN "Exam" e ON ep.exam_id = e.id
GROUP BY e.skill
ORDER BY e.skill;
"""
print(run_remote_sql(sql))

