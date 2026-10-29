import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = """
SELECT e.id, e.title, count(q.id) as q_cnt, 
       length(coalesce(ep.passage_text, '')) as passage_len,
       count(CASE WHEN q.correct_answer IS NOT NULL AND q.correct_answer != '' THEN 1 END) as answers_cnt
FROM "Exam" e
LEFT JOIN "ExamPart" ep ON ep.exam_id = e.id
LEFT JOIN "Question" q ON q.part_id = ep.id
WHERE e.skill = 'READING' AND e.title ~ 'Đề\\s*\\d+\\s*[-–:]'
GROUP BY e.id, e.title, ep.passage_text
ORDER BY e.title ASC;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/q_topics_audit.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = 'docker cp /tmp/q_topics_audit.sql wlafe5vr5fwx6rn3curavktm:/tmp/q_topics_audit.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/q_topics_audit.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
ssh.close()
