from inspect_schema import query_db

out, err = query_db("""
SELECT e.id, e.title, e.skill, ep.part_number, ep.title as part_title, q.question_number, q.prompt, q.correct_answer, q.options, q.max_score
FROM "Exam" e
JOIN "ExamPart" ep ON ep.exam_id = e.id
JOIN "Question" q ON q.part_id = ep.id
WHERE e.id = 'aebb3f72-9280-4bc7-a9cc-d503c46b08be'
ORDER BY ep.part_number, q.question_number;
""")
print(out)
