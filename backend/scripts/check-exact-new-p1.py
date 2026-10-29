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

sql = """
SELECT e.title, count(q.id), sum(q.max_score)
FROM "Exam" e
JOIN "ExamPart" p ON p.exam_id = e.id
JOIN "Question" q ON q.part_id = p.id
WHERE e.description = 'Bộ đề trọng điểm Reading Part 1 – Gap Fill từ Aptis Tiên Phong'
GROUP BY e.title
ORDER BY e.title;
"""
res = run_sql(sql)
lines = [l for l in res.split('\n') if l.strip()]
print(f"Total new Aptis Tien Phong Part 1 exams: {len(lines)}")
for l in lines[:10]:
    print("  ", l)
print("...")
for l in lines[-5:]:
    print("  ", l)

all_5q = all(int(l.split('|||')[1]) == 5 for l in lines)
all_10pts = all(float(l.split('|||')[2]) == 10.0 for l in lines)
print(f"\nAll have 5 questions: {all_5q}")
print(f"All have 10.0 max score: {all_10pts}")

ssh.close()
