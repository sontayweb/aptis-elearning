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
SELECT e.id, e.title, count(q.id) as q_cnt, max(q.prompt) as sample_prompt
FROM "Exam" e
LEFT JOIN "ExamPart" p ON p.exam_id = e.id
LEFT JOIN "Question" q ON q.part_id = p.id
WHERE e.id IN ('8de59a6f-647a-4f3d-8a9c-996321de29e5', '8505de1d-e7fe-4078-8227-5d284454dad2')
GROUP BY e.id, e.title;
"""

print(run_sql(sql))

ssh.close()
