import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

sql = """
SELECT e.id, e.title, count(ep.id) as parts_cnt,
       (SELECT count(*) FROM "Question" q JOIN "ExamPart" ep2 ON q.part_id = ep2.id WHERE ep2.exam_id = e.id) as q_cnt
FROM "Exam" e
LEFT JOIN "ExamPart" ep ON ep.exam_id = e.id
WHERE e.skill = 'READING'
GROUP BY e.id, e.title
ORDER BY e.title;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/q_list_rd.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = 'docker cp /tmp/q_list_rd.sql wlafe5vr5fwx6rn3curavktm:/tmp/q_in.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F " | " -f /tmp/q_in.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode('utf-8', errors='replace').strip()
print(f"Total Reading Exams in DB: {len(out.splitlines()) if out else 0}")
print(out)

ssh.close()
