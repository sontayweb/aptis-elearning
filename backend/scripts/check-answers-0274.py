import paramiko, sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = '''
SELECT q.id, q.prompt, q.correct_answer, q.explanation
FROM "Question" q
JOIN "ExamPart" ep ON q.part_id = ep.id
WHERE ep.exam_id = '0274ec40-ea8f-405a-9cdd-c56e806a8559'
ORDER BY q.order_index ASC;
'''
clean_sql = "SELECT q.id, q.question_number, q.prompt, q.correct_answer, q.explanation FROM \\\"Question\\\" q JOIN \\\"ExamPart\\\" ep ON q.part_id = ep.id WHERE ep.exam_id = '0274ec40-ea8f-405a-9cdd-c56e806a8559' ORDER BY q.question_number ASC;"
cmd = f'docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -c "{clean_sql}"'
stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print("OUT:", out)
print("ERR:", err)
ssh.close()
