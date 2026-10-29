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
  'options', q.options,
  'correct_answer', q.correct_answer,
  'max_score', q.max_score,
  'explanation', q.explanation
)::text
FROM "Question" q
JOIN "ExamPart" ep ON ep.id = q.part_id
JOIN "Exam" e ON e.id = ep.exam_id
WHERE e.skill = 'READING' AND e.title IN (
  'Đề 33 - A wellness day + A group presentation',
  'Đề 34 - Family sports day + The first American woman in space',
  'Đề 36 - Making films + My visit to a new coffee shop',
  'Đề 37 - End of term project + Music show at the park'
)
ORDER BY e.title, q.question_number;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/inspect_30s.sql', 'w') as f:
    f.write(query)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A < /tmp/inspect_30s.sql')
lines = stdout.read().decode('utf-8').strip().split('\n')
rows = [json.loads(l) for l in lines if l.strip().startswith('{')]

for r in rows:
    opts = r.get('options') or {}
    sents = opts.get('sentences') or []
    print(f"\n--- {r['exam_title']} - Q{r['question_number']} ({r['prompt']}) ---")
    print(f"Sentences count: {len(sents)}")
    for s in sents:
        sid = s.get('id') if isinstance(s, dict) else '?'
        st = s.get('text') if isinstance(s, dict) else s
        print(f"  [{sid}] {st}")
    print(f"Current correct_answer: {r['correct_answer']}")

ssh.close()
