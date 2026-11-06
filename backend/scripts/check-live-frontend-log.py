import json
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

sftp = ssh.open_sftp()
sql = "SELECT logs FROM application_deployment_queues WHERE deployment_uuid = 'l6n4xyi4yafdi23o0yn6rfh3';"
with sftp.file('/tmp/get_frontend_log.sql', 'w') as f:
    f.write(sql)

cmd = 'cat /tmp/get_frontend_log.sql | docker exec -i coolify-db psql -U coolify -d coolify'
stdin, stdout, stderr = ssh.exec_command(cmd)
raw = stdout.read().decode('utf-8', errors='replace')
ssh.close()

start = raw.find('[{')
end = raw.rfind('}]')
if start != -1 and end != -1:
    items = json.loads(raw[start:end+2])
    print(f"Log items count: {len(items)}")
    for it in items[-10:]:
        out = it.get('output', '').strip()
        if out:
            print(f"  [{it.get('type')}] {out[:120]}")
else:
    print("No JSON log found, raw length:", len(raw))

