import paramiko
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = """
SELECT e.id, e.title, e.is_published, ep.id as part_id, ep.title as part_title, q.id as q_id, q.question_number, q.prompt, q.max_score
FROM "Exam" e
JOIN "ExamPart" ep ON ep.exam_id = e.id
JOIN "Question" q ON q.part_id = ep.id
WHERE e.skill = 'READING'
  AND (ep.title ILIKE '%Part 2%' OR ep.title ILIKE '%Text cohesion%')
  AND (
    e.title LIKE 'Đề 07%' OR e.title LIKE 'Đề 09%' OR e.title LIKE 'Đề 13%'
    OR e.title LIKE 'Đề 27%' OR e.title LIKE 'Đề 29%' OR e.title LIKE 'Đề 34%'
    OR e.title LIKE 'Đề 36%' OR e.title LIKE 'Đề 37%'
  )
ORDER BY e.title, q.question_number;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/chk_hot_list.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = 'docker cp /tmp/chk_hot_list.sql wlafe5vr5fwx6rn3curavktm:/tmp/chk_hot_list.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/chk_hot_list.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8'))
ssh.close()
