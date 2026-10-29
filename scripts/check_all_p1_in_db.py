from inspect_schema import query_db

out, err = query_db("""
SELECT e.id, e.title, q.question_number, q.prompt, q.correct_answer, q.max_score
FROM "Exam" e
JOIN "ExamPart" ep ON ep.exam_id = e.id
JOIN "Question" q ON q.part_id = ep.id
WHERE e.skill = 'READING' AND ep.part_number = 1 AND (e.title LIKE 'Đề %' OR e.title LIKE 'Practice Test %')
ORDER BY e.title, q.question_number;
""")

lines = out.strip().split("\n")
current_title = None
exam_answers = {}

for line in lines:
    parts = [p.strip() for p in line.split("|")]
    if len(parts) >= 6:
        eid, title, qnum, prompt, ans, score = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5]
        if title not in exam_answers:
            exam_answers[title] = []
        exam_answers[title].append((prompt, ans, score))

for t, qlist in sorted(exam_answers.items()):
    answers = [a[1] for a in qlist]
    scores = [a[2] for a in qlist]
    print(f"{t}: {answers} (scores: {set(scores)})")
