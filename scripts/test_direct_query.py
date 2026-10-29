import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

VPS_HOST = "103.90.227.117"
VPS_USER = "root"
VPS_PASS = "Taovipko0!"
CONTAINER = "wlafe5vr5fwx6rn3curavktm"
DB_NAME = "aptis_kytich_db"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASS, timeout=15)

cmd = f'docker exec -i {CONTAINER} psql -U postgres -d {DB_NAME} -c "SELECT id, user_id, score, total_score, created_at FROM \\"ExamSubmission\\" WHERE exam_id = \'aebb3f72-9280-4bc7-a9cc-d503c46b08be\';"'
stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
print("OUT:\n", out)
print("ERR:\n", err)
ssh.close()
