from test_clean_sql import run_clean_sql

out = run_clean_sql("""
UPDATE "Question"
SET max_score = 2.0
WHERE id IN (
  SELECT q.id
  FROM "Question" q
  JOIN "ExamPart" ep ON ep.id = q.part_id
  JOIN "Exam" e ON e.id = ep.exam_id
  WHERE e.skill = 'READING' AND ep.part_number = 1
);
""")
print("Updated Part 1 questions to max_score = 2.0:")
print(out.strip())

check_out = run_clean_sql("""
SELECT count(*) 
FROM "Question" q
JOIN "ExamPart" ep ON ep.id = q.part_id
JOIN "Exam" e ON e.id = ep.exam_id
WHERE e.skill = 'READING' AND ep.part_number = 1 AND q.max_score != 2.0;
""")
print("Remaining Part 1 with max_score != 2.0:", check_out.strip())
