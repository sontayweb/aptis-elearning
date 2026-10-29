from check_pending_sub import run_sql

print(run_sql("""
SELECT ep.part_number, ep.title, count(q.id) as q_count
FROM "ExamPart" ep
LEFT JOIN "Question" q ON q.part_id = ep.id
WHERE ep.exam_id = 'de6944db-8d8c-4681-9173-05f2752e6268'
GROUP BY ep.part_number, ep.title
ORDER BY ep.part_number;
"""))
