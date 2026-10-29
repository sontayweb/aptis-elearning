import paramiko
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

def run_sql(sql):
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/q_detail3.sql', 'w') as f:
        f.write(sql)
    sftp.close()
    stdin, stdout, stderr = ssh.exec_command('docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "###" < /tmp/q_detail3.sql')
    return stdout.read().decode('utf-8', errors='replace').strip()

sql = """
SELECT e.id, e.title, e.skill, p.part_number, p.passage_title, p.passage_text, q.question_number, q.prompt, q.options, q.correct_answer
FROM "Question" q
JOIN "ExamPart" p ON p.id = q.part_id
JOIN "Exam" e ON e.id = p.exam_id
WHERE q.prompt LIKE '%tienphongSpace%'
ORDER BY e.id, q.question_number;
"""
res = run_sql(sql)
for line in res.split('\n'):
    parts = line.split('###')
    if len(parts) >= 10:
        eid, etitle, skill, pnum, ptitle, ptext, qnum, prompt, opts, ans = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6], parts[7], parts[8], parts[9]
        print(f"Exam ID: {eid} | Title: '{etitle}' | Skill: {skill} | Part: {pnum}")
        print(f"  Passage text: {ptext}")
        print(f"  Q{qnum}: Prompt='{prompt}', Ans='{ans}', Opts={opts}")

ssh.close()
