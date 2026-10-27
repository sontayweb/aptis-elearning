import paramiko
import time
import sys
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

front_uuid = '2f363eda-6f6e-4c29-a550-fe6ceb3b5091'
back_uuid = 'd4b3a189-b68d-4a00-8585-0da3761f1f54'

print("Monitoring build progress...")

for i in range(24): # 24 x 10s = 4 mins
    time.sleep(10)
    cmd = f"""docker exec coolify-db psql -U coolify -d coolify -t -A -c "SELECT deployment_uuid, status FROM application_deployment_queues WHERE deployment_uuid IN ('{front_uuid}', '{back_uuid}');" """
    stdin, stdout, stderr = ssh.exec_command(cmd)
    res = stdout.read().decode('utf-8', errors='ignore').strip()
    print(f"[{i*10}s] Status:\n{res}", flush=True)
    
    statuses = [line.split('|')[1] for line in res.split('\n') if '|' in line]
    if len(statuses) >= 2 and all(s in ['finished', 'failed', 'killed'] for s in statuses):
        print("All builds finalized!", flush=True)
        break

ssh.close()
