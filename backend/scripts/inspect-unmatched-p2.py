import paramiko
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', username='root', password='Taovipko0!')

query = """
SELECT json_build_object(
  'id', q.id,
  'exam_title', e.title,
  'question_number', q.question_number,
  'prompt', q.prompt,
  'correct_answer', q.correct_answer,
  'max_score', q.max_score,
  'explanation', q.explanation
)::text
FROM "Question" q
JOIN "ExamPart" ep ON ep.id = q.part_id
JOIN "Exam" e ON e.id = ep.exam_id
WHERE e.skill = 'READING' AND (
  ep.title LIKE '%Part 2%' OR ep.title LIKE '%Cohesion%' OR e.title LIKE '%Part 2%' OR (e.title LIKE '%Full Reading%' AND ep.part_number = 2)
)
ORDER BY e.title, q.question_number;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/chk_p2.sql', 'w') as f:
    f.write(query)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A < /tmp/chk_p2.sql')
lines = stdout.read().decode('utf-8').strip().split('\n')
rows = [json.loads(l) for l in lines if l.strip().startswith('{')]

print(f"Total Part 2 questions found: {len(rows)}")
for r in rows:
    ca = r['correct_answer']
    if ca == '["s1", "s2", "s3", "s4", "s5"]':
        print(f"STILL DEFAULT: {r['exam_title']} - Q{r['question_number']} - {r['prompt'][:50]}")
        print(f"Explanation: {r.get('explanation')}")
        print("---")
    elif r.get('max_score') != 5.0:
        print(f"NON-5 SCORE: {r['exam_title']} - Q{r['question_number']} - score: {r['max_score']}")

ssh.close()
