import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', timeout=10, look_for_keys=False, allow_agent=False)

cmd = "docker ps -q"
stdin, stdout, stderr = ssh.exec_command(cmd)
cids = stdout.read().decode().strip().split()

for cid in cids:
    cmd_name = f"docker inspect --format '{{{{.Name}}}}' {cid}"
    stdin, stdout, stderr = ssh.exec_command(cmd_name)
    name = stdout.read().decode().strip()
    
    cmd_find = f"docker exec {cid} find / -name 'image10.png' 2>/dev/null"
    stdin, stdout, stderr = ssh.exec_command(cmd_find)
    found = stdout.read().decode().strip()
    if found:
        print(f"Found in container {name}: {found}")

ssh.close()

