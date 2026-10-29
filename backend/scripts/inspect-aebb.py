import paramiko
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = """
SELECT json_build_object(
    'exam', (SELECT row_to_json(e) FROM "Exam" e WHERE e.id = 'aebb3f72-9280-4bc7-a9cc-d503c46b08be'),
    'parts', (SELECT json_agg(row_to_json(ep)) FROM "ExamPart" ep WHERE ep.exam_id = 'aebb3f72-9280-4bc7-a9cc-d503c46b08be'),
    'questions', (
        SELECT json_agg(json_build_object(
            'id', q.id,
            'q_num', q.question_number,
            'type', q.question_type,
            'prompt', q.prompt,
            'options', q.options,
            'correct_answer', q.correct_answer,
            'max_score', q.max_score
        ) ORDER BY q.question_number)
        FROM "Question" q
        JOIN "ExamPart" ep ON q.part_id = ep.id
        WHERE ep.exam_id = 'aebb3f72-9280-4bc7-a9cc-d503c46b08be'
    ),
    'submissions', (
        SELECT json_agg(json_build_object(
            'id', s.id,
            'status', s.status,
            'total_score', s.total_score,
            'reading_score', s.reading_score,
            'submitted_at', s.submitted_at,
            'answers', (
                SELECT json_agg(json_build_object(
                    'q_id', sa.question_id,
                    'selected_option', sa.selected_option,
                    'score', sa.score
                ))
                FROM "SubmissionAnswer" sa WHERE sa.submission_id = s.id
            )
        ) ORDER BY s.submitted_at DESC)
        FROM "ExamSubmission" s
        WHERE s.exam_id = 'aebb3f72-9280-4bc7-a9cc-d503c46b08be'
    )
);
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/inspect_aebb.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = "docker cp /tmp/inspect_aebb.sql wlafe5vr5fwx6rn3curavktm:/tmp/inspect_aebb.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -f /tmp/inspect_aebb.sql"
stdin, stdout, stderr = ssh.exec_command(cmd)
res_text = stdout.read().decode('utf-8')
ssh.close()

data = json.loads(res_text)
print("EXAM TITLE:", data['exam']['title'])
print("PARTS:")
for p in (data['parts'] or []):
    print(" ", p['id'], p['part_number'], p['title'])

print("\nQUESTIONS:")
for q in (data['questions'] or []):
    print(f"  Q{q['q_num']}: prompt='{q['prompt']}' | correct_answer='{q['correct_answer']}' | max_score={q['max_score']}")
    print(f"     options={q['options']}")

print("\nSUBMISSIONS (Latest 3):")
for s in (data['submissions'] or [])[:3]:
    print(f"  Sub {s['id']}: total_score={s['total_score']} reading_score={s['reading_score']} submitted_at={s['submitted_at']}")
    print(f"     answers: {s['answers']}")
