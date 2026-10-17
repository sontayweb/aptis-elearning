import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

cmd = "docker exec coolify-db psql -U coolify -d coolify -c 'SELECT deployment_uuid, application_name, status, updated_at FROM application_deployment_queues ORDER BY created_at DESC LIMIT 2;'"
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
ssh.close()
