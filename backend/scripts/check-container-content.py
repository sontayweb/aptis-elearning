import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

cmd = 'docker exec coolify-db psql -U coolify -d coolify -c "SELECT id, name, fqdn, ports_mappings, base_directory FROM applications WHERE id IN (8, 9);"'
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode())
ssh.close()
