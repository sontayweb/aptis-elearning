from check_pending_sub import run_sql

print(run_sql("""
SELECT e.id as exam_id, e.title as exam_title, ep.id as part_id, ep.part_number, q.id as question_id, q.question_number, q.prompt
FROM "Question" q
JOIN "ExamPart" ep ON ep.id = q.part_id
JOIN "Exam" e ON e.id = ep.exam_id
WHERE e.skill = 'READING' AND (
  ep.title LIKE '%Part 2%' OR ep.title LIKE '%Cohesion%' OR e.title LIKE '%Part 2%' OR ep.part_number = 2
)
ORDER BY e.title, ep.part_number, q.question_number;
"""))
