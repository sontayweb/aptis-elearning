import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

sftp = ssh.open_sftp()
sql = """
SELECT id, application_id, deployment_uuid, status, created_at, updated_at 
FROM application_deployment_queues 
ORDER BY id DESC LIMIT 5;
"""
with sftp.file('/tmp/check_deploy.sql', 'w') as f:
    f.write(sql)

cmd = 'cat /tmp/check_deploy.sql | docker exec -i coolify-db psql -U coolify -d coolify'
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8'))
ssh.close()

