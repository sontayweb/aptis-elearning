import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

VPS_HOST = "103.90.227.117"
VPS_USER = "root"
VPS_PASS = "Taovipko0!"
CONTAINER = "wlafe5vr5fwx6rn3curavktm"
DB_NAME = "aptis_kytich_db"

def run_clean_sql(sql):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASS, timeout=15)
    
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/cmd.sql', 'w') as f:
        f.write(sql)
    sftp.close()
    
    cmd = f'docker exec -i {CONTAINER} psql -U postgres -d {DB_NAME} -t -A -F "|||" < /tmp/cmd.sql'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    ssh.close()
    return out

out = run_clean_sql("""
SELECT q.id, e.title, q.prompt, q.options, q.correct_answer, q.explanation
FROM "Question" q
JOIN "ExamPart" ep ON ep.id = q.part_id
JOIN "Exam" e ON e.id = ep.exam_id
WHERE e.title = 'Đề 01 - Tom Harper'
ORDER BY q.question_number;
""")

for row in out.strip().split("\n"):
    parts = row.split("|||")
    if len(parts) >= 6:
        print(f"Exam: {parts[1]} | Q: {parts[2]}")
        print("  options:", parts[3][:100])
        print("  correct_answer:", parts[4])
        print("  explanation snippet:\n", parts[5][:300])
