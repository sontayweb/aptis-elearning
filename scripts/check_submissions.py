from inspect_schema import query_db

out, err = query_db("""
SELECT es.id, es.user_id, es.exam_id, es.score, es.total_score, es.status, es.created_at
FROM "ExamSubmission" es
WHERE es.exam_id = 'aebb3f72-9280-4bc7-a9cc-d503c46b08be'
ORDER BY es.created_at DESC
LIMIT 5;
""")
print("Submissions:\n", out)

out_ans, err_ans = query_db("""
SELECT sa.id, sa.submission_id, sa.question_id, sa.user_answer, sa.is_correct, sa.score
FROM "SubmissionAnswer" sa
JOIN "ExamSubmission" es ON es.id = sa.submission_id
WHERE es.exam_id = 'aebb3f72-9280-4bc7-a9cc-d503c46b08be'
ORDER BY sa.created_at DESC
LIMIT 10;
""")
print("Answers:\n", out_ans)
