import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

cmd = 'docker exec c1e4e12fb076 ls -la /app'
stdin, stdout, stderr = ssh.exec_command(cmd)
print("=== /app ===")
print(stdout.read().decode())

cmd2 = 'docker exec c1e4e12fb076 ls -la /app/.next/server/app/reading 2>/dev/null'
stdin, stdout, stderr = ssh.exec_command(cmd2)
print("=== /app/.next/server/app/reading ===")
print(stdout.read().decode())

ssh.close()
