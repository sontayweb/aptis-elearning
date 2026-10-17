import sys
import paramiko

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

exam_id = '86d3bd6f-a422-42a0-a6b8-a477da4a072e'
cmd = f"""docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F '|' -c "SELECT title, skill, duration_minutes, is_pro FROM \\\"Exam\\\" WHERE id = '{exam_id}';" """
stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode('utf-8', errors='replace').strip()
print(f"VPS Exam ID {exam_id}:")
print(out)

# Check Questions of this exam
cmd_q = f"""docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F '|' -c "SELECT question_number, prompt, correct_answer FROM \\\"Question\\\" WHERE exam_part_id IN (SELECT id FROM \\\"ExamPart\\\" WHERE exam_id = '{exam_id}') LIMIT 3;" """
stdin, stdout, stderr = ssh.exec_command(cmd_q)
out_q = stdout.read().decode('utf-8', errors='replace').strip()
print("\nVPS Sample Questions:")
print(out_q)

ssh.close()
