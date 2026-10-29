import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = """
SELECT e.title, ep.part_number, length(coalesce(ep.passage_text, '')) as passage_len, count(q.id) as q_count, sum(q.max_score) as total_score
FROM "Exam" e
JOIN "ExamPart" ep ON ep.exam_id = e.id
LEFT JOIN "Question" q ON q.part_id = ep.id
WHERE e.skill = 'READING' AND e.is_published = true
GROUP BY e.title, ep.part_number, ep.passage_text
ORDER BY e.title ASC, ep.part_number ASC;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/q_ver.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = 'docker cp /tmp/q_ver.sql wlafe5vr5fwx6rn3curavktm:/tmp/q_ver.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/q_ver.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
print("ERR:", stderr.read().decode('utf-8', errors='replace'))
ssh.close()
