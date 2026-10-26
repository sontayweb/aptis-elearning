import sys
import paramiko

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

def run_sql(sql):
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/inspect_tmp.sql', 'w') as f:
        f.write(sql)
    sftp.close()
    cmd = 'docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" < /tmp/inspect_tmp.sql'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    return stdout.read().decode('utf-8', errors='replace')

# Find all exams where p.part_number = 1 or question count > 0 for Part 1
sql = """
SELECT e.id, e.title, e.is_published, p.part_number, p.title as part_title, count(q.id) as q_cnt
FROM "Exam" e
JOIN "ExamPart" p ON p.exam_id = e.id
LEFT JOIN "Question" q ON q.part_id = p.id
WHERE e.skill = 'READING' AND (p.part_number = 1 OR p.title ILIKE '%part 1%' OR p.title ILIKE '%part1%')
GROUP BY e.id, e.title, e.is_published, p.part_number, p.title
HAVING count(q.id) > 0
ORDER BY e.title;
"""

res = run_sql(sql)
lines = [l for l in res.strip().split('\n') if l.strip()]
print(f"Exams with Part 1 questions count: {len(lines)}")
for l in lines[:30]:
    print(l)

ssh.close()
