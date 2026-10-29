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
    with sftp.file('/tmp/q_check_ed.sql', 'w') as f:
        f.write(sql)
    sftp.close()
    stdin, stdout, stderr = ssh.exec_command('docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" < /tmp/q_check_ed.sql')
    return stdout.read().decode('utf-8', errors='replace').strip()

eid = 'ed88b4a6-ecbb-4185-9649-a12503aa0053'

print("=== EXAMPART DETAILS ===")
sql_p = f"""
SELECT id, part_number, title, instructions, passage_title, passage_text
FROM "ExamPart"
WHERE exam_id = '{eid}';
"""
res_p = run_sql(sql_p)
for l in res_p.split('\n'):
    parts = l.split('|||')
    if len(parts) >= 6:
        print(f"ID: {parts[0]}")
        print(f"part_number: {parts[1]}")
        print(f"title: {parts[2]}")
        print(f"instructions: {parts[3]}")
        print(f"passage_title: {parts[4]}")
        print(f"passage_text: {parts[5]}")

print("\n=== QUESTIONS DETAILS ===")
sql_q = f"""
SELECT q.id, q.question_number, q.prompt, q.options, q.correct_answer
FROM "Question" q
JOIN "ExamPart" p ON p.id = q.part_id
WHERE p.exam_id = '{eid}'
ORDER BY q.question_number;
"""
res_q = run_sql(sql_q)
for l in res_q.split('\n'):
    parts = l.split('|||')
    if len(parts) >= 5:
        print(f"Q{parts[1]}: prompt='{parts[2]}', ans='{parts[4]}', opts={parts[3]}")

ssh.close()
