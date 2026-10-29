from check_pending_sub import run_sql

print(run_sql("""
SELECT id, user_id, status, started_at, submitted_at, reading_score, total_score 
FROM "ExamSubmission" 
ORDER BY started_at DESC NULLS LAST
LIMIT 10;
"""))
