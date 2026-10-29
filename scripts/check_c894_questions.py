from check_pending_sub import run_sql

print(run_sql("""
SELECT q.id, q.question_number, q.prompt, q.options, q.correct_answer, q.max_score
FROM "Question" q
JOIN "ExamPart" ep ON ep.id = q.part_id
JOIN "Exam" e ON e.id = ep.exam_id
WHERE e.id = 'c894c481-d501-459e-ae11-d012264a9139'
ORDER BY q.question_number;
"""))
