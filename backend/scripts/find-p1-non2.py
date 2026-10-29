import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = """
SELECT e.id, e.title, ep.title as part_title, count(q.id) as q_cnt, min(q.max_score) as min_score, max(q.max_score) as max_score
FROM "Question" q
JOIN "ExamPart" ep ON q.part_id = ep.id
JOIN "Exam" e ON ep.exam_id = e.id
WHERE e.skill = 'READING' AND ep.part_number = 1 AND q.max_score != 2
GROUP BY e.id, e.title, ep.title
ORDER BY e.title;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/chk_p1_non2.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = "docker cp /tmp/chk_p1_non2.sql wlafe5vr5fwx6rn3curavktm:/tmp/chk_p1_non2.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/chk_p1_non2.sql"
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8'))
ssh.close()
