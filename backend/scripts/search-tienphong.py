import paramiko
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

def run_sql(sql):
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/q_search.sql', 'w') as f:
        f.write(sql)
    sftp.close()
    stdin, stdout, stderr = ssh.exec_command('docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" < /tmp/q_search.sql')
    return stdout.read().decode('utf-8', errors='replace').strip()

print("=== TÌM KIẾM THEO TIENPHONGSPACE HOẶC HEY LEWIS ===")
sql = """
SELECT e.id, e.title, p.part_number, q.question_number, q.prompt
FROM "Question" q
JOIN "ExamPart" p ON p.id = q.part_id
JOIN "Exam" e ON e.id = p.exam_id
WHERE q.prompt ILIKE '%tienphongSpace%' OR q.prompt ILIKE '%Hey Lewis%' OR p.passage_text ILIKE '%Hey Lewis%'
LIMIT 10;
"""
print(run_sql(sql))

print("\n=== TÌM KIẾM ĐỀ CÓ TITLE 'Đề 01' ===")
sql_de01 = """
SELECT id, title, skill, type, source FROM "Exam" WHERE title = 'Đề 01' OR title ILIKE '%Đề 01%' LIMIT 10;
"""
print(run_sql(sql_de01))

ssh.close()
