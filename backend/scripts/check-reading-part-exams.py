import paramiko
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

def run_sql(sql):
    escaped_sql = sql.replace('"', '\\"')
    cmd = f'docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" -c "{escaped_sql}"'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    return out

print("--- ALL PARTS IN EXAM 'Reading Part 1' (74a44505-042d-4c5f-a389-96119ea141f8) ---")
res = run_sql("""
SELECT part_number, title, count(q.id)
FROM "ExamPart" p
LEFT JOIN "Question" q ON q.part_id = p.id
WHERE p.exam_id = '74a44505-042d-4c5f-a389-96119ea141f8'
GROUP BY p.id, p.part_number, p.title
ORDER BY p.part_number;
""")
print(res)

print("\n--- ALL EXAMS TITLED 'Reading Part %' ---")
res2 = run_sql("""
SELECT id, title, is_published, hot_level
FROM "Exam"
WHERE skill = 'READING' AND title ~* '^Reading Part [0-9]'
ORDER BY title;
""")
print(res2)

ssh.close()
