from check_pending_sub import run_sql

print(run_sql("""
SELECT es.id, es.exam_id, e.title, es.reading_score, es.total_score, es.submitted_at
FROM "ExamSubmission" es
JOIN "Exam" e ON e.id = es.exam_id
WHERE es.id = '30e89685-966a-4e1d-a3b6-fd929a8efabf';
"""))

print(run_sql("""
SELECT q.question_number, q.prompt, q.correct_answer, sa.selected_option, sa.score
FROM "SubmissionAnswer" sa
JOIN "Question" q ON q.id = sa.question_id
WHERE sa.submission_id = '30e89685-966a-4e1d-a3b6-fd929a8efabf'
ORDER BY q.question_number;
"""))
