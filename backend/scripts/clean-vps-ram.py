import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

# Clean up stopped containers and docker builder cache to free RAM & disk
stdin, stdout, stderr = ssh.exec_command('docker container prune -f && docker builder prune -f && sync && echo 3 > /proc/sys/vm/drop_caches')
print(stdout.read().decode())
stdin, stdout, stderr = ssh.exec_command('free -m')
print(stdout.read().decode())
ssh.close()
