import paramiko
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

cmd = 'docker exec coolify-db psql -U coolify -d coolify -t -A -c "SELECT logs FROM application_deployment_queues WHERE deployment_uuid = \'cf72ce6b-1548-4ba5-a3a3-e56a5fdab7ff\';"'
stdin, stdout, stderr = ssh.exec_command(cmd)
raw = stdout.read().decode('utf-8', errors='ignore')
try:
    data = json.loads(raw)
    for entry in data[-15:]:
        out = entry.get('output', '')
        if out:
            print(out)
except Exception as e:
    print(raw[-2000:])

ssh.close()
