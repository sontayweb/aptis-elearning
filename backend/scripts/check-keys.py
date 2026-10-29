import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

cmd = 'ls -la /root/.ssh; docker exec coolify-db psql -U coolify -d coolify -c "SELECT id, name, private_key IS NOT NULL as has_key FROM private_keys;"'
stdin, stdout, stderr = ssh.exec_command(cmd)
print("STDOUT:", stdout.read().decode('utf-8', errors='replace'))
ssh.close()
