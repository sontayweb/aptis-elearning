import paramiko, sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

cmd = 'docker exec 100eba9cfa4d env | grep PORT'
stdin, stdout, stderr = ssh.exec_command(cmd)
print("ENV PORT:", stdout.read().decode('utf-8'))

cmd2 = 'docker exec 100eba9cfa4d netstat -tulpn 2>/dev/null || docker exec 100eba9cfa4d ss -tulpn 2>/dev/null'
stdin, stdout, stderr = ssh.exec_command(cmd2)
print("NETSTAT:", stdout.read().decode('utf-8'))

ssh.close()
