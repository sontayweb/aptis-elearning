from inspect_schema import query_db

out, err = query_db("""
SELECT es.exam_id, e.title, count(es.id) as sub_count
FROM "ExamSubmission" es
JOIN "Exam" e ON e.id = es.exam_id
GROUP BY es.exam_id, e.title
ORDER BY sub_count DESC
LIMIT 20;
""")
print("Submissions by exam:\n", out)
