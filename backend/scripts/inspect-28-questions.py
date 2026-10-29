import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

cmd = '''docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -c "
SELECT e.skill, e.title, q.id, q.prompt, q.options, q.correct_answer
FROM \\"Question\\" q
JOIN \\"ExamPart\\" p ON q.part_id = p.id
JOIN \\"Exam\\" e ON p.exam_id = e.id
WHERE q.question_type = 'MULTIPLE_CHOICE' 
  AND (q.options IS NULL OR q.options = '[]'::jsonb OR q.correct_answer IS NULL OR q.correct_answer = '');
"'''
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8'))
ssh.close()
