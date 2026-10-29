import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

cmd = '''docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -c "
SELECT e.id, e.title, e.skill, e.created_at, count(s.id) as sub_count
FROM \\"Exam\\" e
LEFT JOIN \\"ExamSubmission\\" s ON s.exam_id = e.id
WHERE e.title IN ('Reading Part 1', 'Grammar 2', 'Grammar 4')
GROUP BY e.id, e.title, e.skill, e.created_at;
"'''
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8'))
ssh.close()
