import json
import paramiko
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

with open('backend/scripts/part3_single_images_audit.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

print(f"Loaded {len(items)} Part 3 items to update with dual pictures.")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)
print("=== CONNECTED TO VPS (103.90.227.117) ===")

sql_statements = []
for item in items:
    part_id = item['part_id']
    sug = item['suggested']
    sql_statements.append(f"UPDATE \"ExamPart\" SET image_url = '{sug}' WHERE id = '{part_id}';")

if sql_statements:
    batch_sql = " ".join(sql_statements)
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/update_part3_pairs.sql', 'w') as f:
        f.write(batch_sql)
    sftp.close()

    exec_cmd = "docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db < /tmp/update_part3_pairs.sql"
    stdin, stdout, stderr = ssh.exec_command(exec_cmd)
    res_out = stdout.read().decode('utf-8', errors='replace')
    print("VPS SQL Execution completed. Updated:", res_out.count("UPDATE"), "parts.")

# Verify on VPS:
sql_check = """
SELECT count(*) FROM "ExamPart" p 
JOIN "Exam" e ON p.exam_id = e.id 
WHERE e.skill = 'SPEAKING' AND (p.part_number = 3 OR p.title ILIKE '%part 3%') AND p.image_url ILIKE '%,%';
"""
cmd_chk = f"docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -c '{sql_check}'"
stdin_c, stdout_c, stderr_c = ssh.exec_command(cmd_chk)
print("Speaking Part 3 with dual images on VPS now:", stdout_c.read().strip(), "/ 168")

ssh.close()
