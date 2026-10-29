import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

def run_sql(sql):
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/q_exec.sql', 'wb') as f:
        f.write(sql.encode('utf-8'))
    sftp.close()
    cmd = 'docker cp /tmp/q_exec.sql wlafe5vr5fwx6rn3curavktm:/tmp/q_in.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" -f /tmp/q_in.sql'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if err and "ERROR" in err:
        print("SQL ERROR:", err, flush=True)
    return out

print("Publishing all 52 topic exams for Part 2, Part 3, and Part 4...", flush=True)
res = run_sql("""
UPDATE "Exam"
SET is_published = true
WHERE skill = 'READING' AND title ~ 'Đề\\s*\\d+\\s*[-–:]';
""")
print("Result:", res, flush=True)

# Kiểm tra tổng số đề Reading đang publish theo từng loại
check_sql = """
SELECT 
  CASE 
    WHEN title LIKE '%Full Reading%' THEN 'Full Reading (4 Parts)'
    WHEN title ~ '^Đề\\s*\\d+$' THEN 'Part 1 lẻ (Đề XX)'
    WHEN title ~ 'Đề\\s*\\d+\\s*[-–:]' THEN 'Topic lẻ (Part 2, 3, 4)'
    ELSE 'Khác'
  END as exam_type,
  count(*) as total
FROM "Exam"
WHERE skill = 'READING' AND is_published = true
GROUP BY exam_type;
"""
print("\nThống kê các đề Reading đang hiển thị:", flush=True)
print(run_sql(check_sql), flush=True)

ssh.close()
print("🎉 Hoàn tất!")
