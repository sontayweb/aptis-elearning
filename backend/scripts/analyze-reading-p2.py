import paramiko
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = """
SELECT json_agg(json_build_object(
    'exam_id', e.id,
    'exam_title', e.title,
    'is_published', e.is_published,
    'part_id', ep.id,
    'part_title', ep.title,
    'q_count', (SELECT count(*) FROM "Question" q WHERE q.part_id = ep.id),
    'questions', (
        SELECT json_agg(json_build_object(
            'id', q.id,
            'q_num', q.question_number,
            'prompt', q.prompt,
            'max_score', q.max_score,
            'options', q.options,
            'correct_answer', q.correct_answer
        ) ORDER BY q.question_number)
        FROM "Question" q WHERE q.part_id = ep.id
    )
) ORDER BY e.title)
FROM "Exam" e
JOIN "ExamPart" ep ON ep.exam_id = e.id
WHERE e.skill = 'READING'
  AND (ep.title ILIKE '%Part 2%' OR ep.title ILIKE '%Text cohesion%');
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/q_p2_json.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = 'docker cp /tmp/q_p2_json.sql wlafe5vr5fwx6rn3curavktm:/tmp/q_p2_json.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -f /tmp/q_p2_json.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
content = stdout.read().decode('utf-8')
ssh.close()

data = json.loads(content)
print(f"Total Reading Part 2 exams: {len(data)}")

for item in data:
    title = item['exam_title']
    qs = item['questions'] or []
    print(f"\n[{item['exam_id']}] {title} (pub={item['is_published']}) - {len(qs)} questions:")
    for q in qs:
        opts = q.get('options')
        opt_type = type(opts).__name__
        sentences = []
        fixed = None
        if isinstance(opts, dict):
            sentences = opts.get('sentences', [])
            fixed = opts.get('fixedSentence')
        elif isinstance(opts, list):
            sentences = opts
        print(f"  Q{q['q_num']}: prompt='{q['prompt'][:50] if q['prompt'] else ''}' | opt_type={opt_type} len={len(sentences)} fixed={fixed != None} | max_score={q['max_score']} | ans={q['correct_answer']}")
