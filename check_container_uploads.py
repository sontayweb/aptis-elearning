import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', timeout=10, look_for_keys=False, allow_agent=False)

cmd = "docker exec backend-sontayweb ls -la ./uploads/speaking"
stdin, stdout, stderr = ssh.exec_command(cmd)
print("Backend container uploads:\n", stdout.read().decode())
err = stderr.read().decode()
if err:
    print("ERR:", err)

# Also check frontend container
cmd2 = "docker exec rujigoulsjkdrha58tgtrvsr-091947189692 ls -la public/uploads/speaking"
stdin, stdout, stderr = ssh.exec_command(cmd2)
print("Frontend container public/uploads:\n", stdout.read().decode())

ssh.close()

