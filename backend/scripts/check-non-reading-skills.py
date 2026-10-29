import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = """
SELECT e.skill, ep.part_number, count(q.id)
FROM "Exam" e 
JOIN "ExamPart" ep ON ep.exam_id = e.id 
JOIN "Question" q ON q.part_id = ep.id 
WHERE e.skill != 'READING' AND q.options::text ILIKE '%fixedSentence%'
GROUP BY e.skill, ep.part_number;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/chk_skills.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = 'docker cp /tmp/chk_skills.sql wlafe5vr5fwx6rn3curavktm:/tmp/chk_skills.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/chk_skills.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
print("STDOUT:", stdout.read().decode('utf-8', errors='replace'))
print("STDERR:", stderr.read().decode('utf-8', errors='replace'))
ssh.close()
