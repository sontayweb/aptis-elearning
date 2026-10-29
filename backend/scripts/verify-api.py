import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

# Curl backend API through Docker or localhost
cmd = 'docker exec backend-sontayweb wget -qO- "http://localhost:3001/api/exams?skill=READING&limit=100" | grep -o \'"title":"[^"]*"\' | head -n 35'
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
ssh.close()
