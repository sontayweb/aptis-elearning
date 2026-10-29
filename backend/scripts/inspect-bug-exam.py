import paramiko
import sys
import json

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

def run_sql(sql):
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/q_bug.sql', 'w') as f:
        f.write(sql)
    sftp.close()
    stdin, stdout, stderr = ssh.exec_command('docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" < /tmp/q_bug.sql')
    return stdout.read().decode('utf-8', errors='replace').strip()

eid = 'ed08b4a6-ccbb-4105-9649-a12503aa0053'

print(f"=== 1. EXAM INFO FOR ID: {eid} ===")
sql_exam = f'SELECT id, title, skill, type, source, hot_level FROM "Exam" WHERE id = \'{eid}\';'
print(run_sql(sql_exam))

print("\n=== 2. PARTS FOR THIS EXAM ===")
sql_parts = f'SELECT id, part_number, title, passage_title, passage_text FROM "ExamPart" WHERE exam_id = \'{eid}\' ORDER BY part_number;'
for l in run_sql(sql_parts).split('\n'):
    p = l.split('|||')
    if len(p) >= 3:
        print(f"Part {p[1]} (id: {p[0]}): Title='{p[2]}', PassageTitle='{p[3] if len(p)>3 else ''}'")
        print(f"Passage text: {p[4][:150] if len(p)>4 else ''}...")

print("\n=== 3. QUESTIONS FOR PART 1 ===")
sql_q = f"""
SELECT q.question_number, q.question_type, q.prompt, q.correct_answer, q.options
FROM "Question" q
JOIN "ExamPart" p ON p.id = q.part_id
WHERE p.exam_id = '{eid}'
ORDER BY p.part_number, q.question_number;
"""
for l in run_sql(sql_q).split('\n'):
    p = l.split('|||')
    if len(p) >= 4:
        print(f"Q{p[0]} ({p[1]}): Prompt='{p[2]}', Ans='{p[3]}'")
        print(f"  Options: {p[4] if len(p)>4 else ''}")

ssh.close()
