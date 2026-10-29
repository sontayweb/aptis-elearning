import paramiko
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

def run_sql(sql):
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/query.sql', 'wb') as f:
        f.write(sql.encode('utf-8'))
    sftp.close()
    
    cmd = 'docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" < /tmp/query.sql'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    return out

print("--- COLUMNS OF ExamPart ---")
print(run_sql("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ExamPart';"))

print("\n--- COLUMNS OF Question ---")
print(run_sql("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Question';"))

print("\n--- CHECK QUESTIONS COUNT IN EXAM Đề 21 ---")
print(run_sql("""
SELECT e.title, count(q.id)
FROM "Exam" e
LEFT JOIN "ExamPart" p ON p.exam_id = e.id
LEFT JOIN "Question" q ON q.part_id = p.id
WHERE e.title ILIKE '%Đề 21%'
GROUP BY e.title;
"""))

print("\n--- CHECK EXAMS WITH 'Bộ Đề Tủ Part 2' ---")
print(run_sql("""
SELECT e.id, e.title, count(q.id)
FROM "Exam" e
LEFT JOIN "ExamPart" p ON p.exam_id = e.id
LEFT JOIN "Question" q ON q.part_id = p.id
WHERE e.title ILIKE '%Bộ Đề Tủ Part 2%'
GROUP BY e.id, e.title;
"""))

ssh.close()
