import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = """
SELECT e.title, ep.part_number, length(coalesce(ep.passage_text, '')) as passage_len, 
       count(q.id) as q_cnt, 
       min(length(q.prompt)) as min_prompt_len, 
       max(length(q.prompt)) as max_prompt_len
FROM "ExamPart" ep
JOIN "Exam" e ON ep.exam_id = e.id
LEFT JOIN "Question" q ON q.part_id = ep.id
WHERE e.skill = 'READING' AND e.is_published = true AND ep.part_number = 5
GROUP BY e.title, ep.part_number, ep.passage_text
ORDER BY e.title;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/q_p4_prompts.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = 'docker cp /tmp/q_p4_prompts.sql wlafe5vr5fwx6rn3curavktm:/tmp/q_p4_prompts.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/q_p4_prompts.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
ssh.close()
