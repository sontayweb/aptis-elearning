from inspect_schema import query_db

out, err = query_db("""
SELECT e.id, e.title, e.is_published, count(ep.id) as part_count, count(q.id) as question_count
FROM "Exam" e
LEFT JOIN "ExamPart" ep ON ep.exam_id = e.id
LEFT JOIN "Question" q ON q.part_id = ep.id
WHERE e.skill = 'READING'
GROUP BY e.id, e.title, e.is_published
ORDER BY e.title;
""")
print(out)
