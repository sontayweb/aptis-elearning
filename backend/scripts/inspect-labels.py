import paramiko
import json

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

stdin, stdout, stderr = ssh.exec_command('docker ps -q')
cids = stdout.read().decode().split()
for cid in cids:
    stdin, stdout, stderr = ssh.exec_command(f'docker inspect {cid} --format "{{{{.Name}}}} | {{{{json .Config.Labels}}}}"')
    out = stdout.read().decode()
    if 'traefik.http.routers' in out:
        name = out.split(' | ')[0]
        labels = json.loads(out.split(' | ')[1])
        for k, v in labels.items():
            if 'rule' in k:
                print(f"{name}: {v}")

print("\n--- FRONTEND ENV VARS ---")
stdin, stdout, stderr = ssh.exec_command('docker exec c1e4e12fb076 env')
print(stdout.read().decode())

ssh.close()
