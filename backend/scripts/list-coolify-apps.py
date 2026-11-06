import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sftp = ssh.open_sftp()
sql = 'SELECT id, name, fqdn, status FROM applications;'
with sftp.file('/tmp/apps.sql', 'w') as f:
    f.write(sql)

cmd = 'cat /tmp/apps.sql | docker exec -i coolify-db psql -U coolify -d coolify'
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8'))
ssh.close()

