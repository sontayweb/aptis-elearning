import paramiko
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

def run_sql(sql):
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/q_tienphong.sql', 'w') as f:
        f.write(sql)
    sftp.close()
    stdin, stdout, stderr = ssh.exec_command('docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" < /tmp/q_tienphong.sql')
    return stdout.read().decode('utf-8', errors='replace').strip()

print("=== SỐ LƯỢNG CÂU HỎI CHỨA TIENPHONGSPACE ===")
print("Question prompt:", run_sql("SELECT count(*) FROM \"Question\" WHERE prompt LIKE '%tienphongSpace%';"))
print("ExamPart passage_text:", run_sql("SELECT count(*) FROM \"ExamPart\" WHERE passage_text LIKE '%tienphongSpace%';"))

print("\n=== DANH SÁCH CÁC ĐỀ CHỨA TIENPHONGSPACE ===")
sql_exams = """
SELECT DISTINCT e.id, e.title, e.skill, e.type
FROM "Question" q
JOIN "ExamPart" p ON p.id = q.part_id
JOIN "Exam" e ON e.id = p.exam_id
WHERE q.prompt LIKE '%tienphongSpace%' OR p.passage_text LIKE '%tienphongSpace%'
ORDER BY e.title;
"""
print(run_sql(sql_exams))

print("\n=== SỐ LƯỢNG EXAMPART CHỨA RAW HTML TAGS (<p><span...) ===")
print("ExamPart có thẻ HTML:", run_sql("SELECT count(*) FROM \"ExamPart\" WHERE passage_text LIKE '%<p>%' OR passage_text LIKE '%<span%';"))
print("Question có thẻ HTML:", run_sql("SELECT count(*) FROM \"Question\" WHERE prompt LIKE '%<p>%' OR prompt LIKE '%<span%';"))

ssh.close()
