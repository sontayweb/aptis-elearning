import paramiko
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

sql = """
SELECT q.id, q.part_id, ep.part_number, e.title as exam_title, q.prompt, q.options::text
FROM "Question" q
JOIN "ExamPart" ep ON q.part_id = ep.id
JOIN "Exam" e ON ep.exam_id = e.id
WHERE q.options::text LIKE '%Sentence 1 is fixed%'
   OR q.options::text LIKE '%fixedSentence%'
ORDER BY e.title
LIMIT 20;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/q_fixed.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db < /tmp/q_fixed.sql')
out = stdout.read().decode('utf-8', errors='replace')
print("RESULTS:\n", out)

# Let's also check questions where prompt contains 'Family sport'
sql2 = """
SELECT q.id, q.part_id, ep.part_number, e.id as exam_id, e.title as exam_title, q.prompt, q.options::text
FROM "Question" q
JOIN "ExamPart" ep ON q.part_id = ep.id
JOIN "Exam" e ON ep.exam_id = e.id
WHERE q.prompt LIKE '%Family sport%' OR q.options::text LIKE '%Family sport%'
LIMIT 5;
"""
sftp = ssh.open_sftp()
with sftp.file('/tmp/q_fs.sql', 'wb') as f:
    f.write(sql2.encode('utf-8'))
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db < /tmp/q_fs.sql')
out2 = stdout.read().decode('utf-8', errors='replace')
print("\nFAMILY SPORT DAYS:\n", out2)

ssh.close()
