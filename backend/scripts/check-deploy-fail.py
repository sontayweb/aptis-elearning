import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

sftp = ssh.open_sftp()
sql = """
SELECT logs 
FROM application_deployment_queues 
WHERE deployment_uuid = 'd698014f-d868-4d55-b9ce-b8bc11fba6bf';
"""
with sftp.file('/tmp/get_deploy_log.sql', 'w') as f:
    f.write(sql)

cmd = 'cat /tmp/get_deploy_log.sql | docker exec -i coolify-db psql -U coolify -d coolify'
stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode('utf-8', errors='replace')
with open('backend/scripts/deploy_fail.log', 'w', encoding='utf-8') as f:
    f.write(out)

print(f"Log length: {len(out)}")
lines = out.split('\n')
for line in lines[-50:]:
    print(line[:120])

ssh.close()

