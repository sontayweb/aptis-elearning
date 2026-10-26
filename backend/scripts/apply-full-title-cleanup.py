import json
import re
import sys
import paramiko

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

# Fetch all exams
sql_all = """SELECT id, title, skill FROM "Exam" WHERE skill = 'READING';"""
cmd = f"docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F '|||' -c '{sql_all}'"
stdin, stdout, stderr = ssh.exec_command(cmd)
res = stdout.read().decode('utf-8', errors='replace')

sql_updates = []
for line in res.strip().split('\n'):
    if not line.strip(): continue
    parts = line.split('|||')
    if len(parts) >= 2:
        eid = parts[0]
        title = parts[1]
        
        # Check if title is "Đề XX - Reading Part 1" or similar
        # E.g., "Đề 01 - Reading Part 1" -> "Đề 01"
        m = re.match(r'^(Đề\s+\d+)\s*[-–]\s*Reading Part 1.*$', title, re.IGNORECASE)
        if m:
            clean_title = m.group(1)
            sql_updates.append((eid, title, clean_title))

print(f"Found {len(sql_updates)} Reading Part 1 exams to rename to 'Đề XX':")
for eid, old, new_t in sql_updates:
    print(f"  '{old}' -> '{new_t}'")

# Execute updates on VPS
if sql_updates:
    stmts = [f"UPDATE \"Exam\" SET title = '{new_t}' WHERE id = '{eid}';" for eid, old, new_t in sql_updates]
    batch = " ".join(stmts)
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/clean_p1_titles.sql', 'w') as f:
        f.write(batch)
    sftp.close()

    exec_cmd = "docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db < /tmp/clean_p1_titles.sql"
    stdin_e, stdout_e, stderr_e = ssh.exec_command(exec_cmd)
    res_e = stdout_e.read().decode('utf-8', errors='replace')
    print("Updated on VPS:", res_e.count("UPDATE"), "records.")

ssh.close()
