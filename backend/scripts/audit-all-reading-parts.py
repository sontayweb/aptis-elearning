import paramiko
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = """
SELECT 
    ep.part_number,
    ep.title as part_title,
    count(DISTINCT e.id) as total_exams,
    count(q.id) as total_questions,
    round(avg(length(coalesce(ep.passage_text, ''))), 0) as avg_passage_len,
    round(avg(length(coalesce(q.prompt, ''))), 0) as avg_prompt_len,
    count(CASE WHEN q.correct_answer IS NOT NULL AND q.correct_answer != '' THEN 1 END) as qs_with_answer,
    count(CASE WHEN q.options IS NOT NULL THEN 1 END) as qs_with_options
FROM "Exam" e
JOIN "ExamPart" ep ON ep.exam_id = e.id
LEFT JOIN "Question" q ON q.part_id = ep.id
WHERE e.skill = 'READING' AND e.is_published = true
GROUP BY ep.part_number, ep.title
ORDER BY ep.part_number;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/q_audit_parts.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = 'docker cp /tmp/q_audit_parts.sql wlafe5vr5fwx6rn3curavktm:/tmp/q_audit_parts.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/q_audit_parts.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
ssh.close()
