import paramiko
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

def run_sql(sql):
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/q.sql', 'w') as f:
        f.write(sql)
    sftp.close()
    stdin, stdout, stderr = ssh.exec_command('docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" < /tmp/q.sql')
    return stdout.read().decode('utf-8', errors='replace').strip()

print("=== TẤT CẢ ĐỀ FULL READING VÀ SỐ PART / CÂU HỎI ===")
sql = """
SELECT e.id, e.title, count(DISTINCT p.id) as part_count, count(q.id) as q_count
FROM "Exam" e
LEFT JOIN "ExamPart" p ON p.exam_id = e.id
LEFT JOIN "Question" q ON q.part_id = p.id
WHERE e.skill = 'READING' AND e.title LIKE '%Full Reading%'
GROUP BY e.id, e.title
ORDER BY e.title;
"""
for l in run_sql(sql).split('\n'):
    if l.strip():
        parts = l.split('|||')
        print(f"  {parts[1]:<35} | ID: {parts[0]} | Parts: {parts[2]} | Questions: {parts[3]}")

print("\n=== KIỂM TRA ĐỀ 35 ===")
sql_35 = """
SELECT e.id, e.title, count(DISTINCT p.id) as part_count, count(q.id) as q_count
FROM "Exam" e
LEFT JOIN "ExamPart" p ON p.exam_id = e.id
LEFT JOIN "Question" q ON q.part_id = p.id
WHERE e.skill = 'READING' AND e.title LIKE '%35%'
GROUP BY e.id, e.title
ORDER BY e.title;
"""
for l in run_sql(sql_35).split('\n'):
    if l.strip():
        parts = l.split('|||')
        print(f"  {parts[1]:<50} | ID: {parts[0]} | Parts: {parts[2]} | Questions: {parts[3]}")

ssh.close()
