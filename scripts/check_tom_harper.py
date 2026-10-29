from check_pending_sub import run_sql

print(run_sql("""
SELECT e.title, ep.part_number, q.question_number, q.prompt, q.options, q.correct_answer, q.explanation
FROM "Question" q
JOIN "ExamPart" ep ON ep.id = q.part_id
JOIN "Exam" e ON e.id = ep.exam_id
WHERE e.title LIKE '%Tom Harper%' OR (e.title = 'Đề 01 — Full Reading · 4 Parts' AND ep.part_number = 2);
"""))
