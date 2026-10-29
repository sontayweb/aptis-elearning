import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = """
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Exam';

SELECT *
FROM "Exam"
WHERE id = '9db34976-63d5-41d8-99c7-055443b5c4c6' OR title LIKE '%48%' OR title LIKE '%39%';
"""

# write sql via sftp to avoid escaping issues
sftp = ssh.open_sftp()
with sftp.file('/tmp/check_exam.sql', 'w') as f:
    f.write(sql)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db < /tmp/check_exam.sql')
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
print("STDOUT:\n", out)
if err:
    print("STDERR:\n", err)

# Also let's inspect the parts and questions for 9db34976-63d5-41d8-99c7-055443b5c4c6
sql2 = """
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Question';

SELECT ep.id as part_id, ep.part_number, ep.title as part_title, q.*
FROM "ExamPart" ep
LEFT JOIN "Question" q ON q.part_id = ep.id
WHERE ep.exam_id = '9db34976-63d5-41d8-99c7-055443b5c4c6';
"""
sftp = ssh.open_sftp()
with sftp.file('/tmp/check_part.sql', 'w') as f:
    f.write(sql2)
sftp.close()

stdin2, stdout2, stderr2 = ssh.exec_command('docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db < /tmp/check_part.sql')
out2 = stdout2.read().decode('utf-8')
err2 = stderr2.read().decode('utf-8')
print("PARTS & QUESTIONS STDOUT:\n", out2)
if err2:
    print("PARTS & QUESTIONS STDERR:\n", err2)

ssh.close()
