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

sql = """
SELECT 
  count(CASE WHEN (p.part_number = 1 OR p.title ILIKE '%Part 1%') AND (e.title NOT ILIKE '%Full Reading%' AND e.title NOT ILIKE '%Full Test%') THEN 1 END) as p1_count,
  count(CASE WHEN (p.part_number = 2 OR p.title ILIKE '%Part 2%' OR p.title ILIKE '%Text cohesion%') AND (e.title NOT ILIKE '%Full Reading%' AND e.title NOT ILIKE '%Full Test%') THEN 1 END) as p2_count,
  count(CASE WHEN (p.part_number = 4 OR p.title ILIKE '%Opinion%') AND (e.title NOT ILIKE '%Full Reading%' AND e.title NOT ILIKE '%Full Test%') THEN 1 END) as p3_opinion_count,
  count(CASE WHEN (p.part_number = 5 OR p.title ILIKE '%Long%') AND (e.title NOT ILIKE '%Full Reading%' AND e.title NOT ILIKE '%Full Test%') THEN 1 END) as p4_long_count,
  count(CASE WHEN e.title ILIKE '%Full Reading%' THEN 1 END) as full_reading_count
FROM "Exam" e
JOIN "ExamPart" p ON p.exam_id = e.id
WHERE e.skill = 'READING' AND e.is_published = true;
"""

print("Published Breakdown by Part:\n", run_sql(sql))

ssh.close()
