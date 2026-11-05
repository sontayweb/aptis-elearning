import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', timeout=10, look_for_keys=False, allow_agent=False)

cmd = "docker exec cdoa9kmxi37x3m3n38451b2r-092312393197 find /app -name 'image10.png'"
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode())
ssh.close()
