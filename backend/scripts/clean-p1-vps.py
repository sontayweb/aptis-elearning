import json
import re
import sys
import paramiko

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

with open('backend/scripts/vps_exams_list.json', 'r', encoding='utf-8') as f:
    exams = json.load(f)

p1_exams = [e for e in exams if 'reading part 1' in e['title'].lower() and re.match(r'^Đề \d+', e['title'])]

print(f"Total Reading Part 1 exams to clean: {len(p1_exams)}")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

sql_statements = []
for e in p1_exams:
    new_title = re.sub(r'\s*[-–]\s*Reading Part 1.*', '', e['title']).strip()
    print(f"  '{e['title']}' -> '{new_title}'")
    sql_statements.append(f"UPDATE \"Exam\" SET title = '{new_title}' WHERE id = '{e['id']}';")

if sql_statements:
    batch = " ".join(sql_statements)
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/clean_p1_titles.sql', 'w') as f:
        f.write(batch)
    sftp.close()

    exec_cmd = "docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db < /tmp/clean_p1_titles.sql"
    stdin, stdout, stderr = ssh.exec_command(exec_cmd)
    res = stdout.read().decode('utf-8', errors='replace')
    print("VPS SQL Execution updated:", res.count("UPDATE"), "records.")

ssh.close()
