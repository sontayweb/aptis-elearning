import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')
stdin, stdout, stderr = ssh.exec_command("docker inspect rujigoulsjkdrha58tgtrvsr-091026370145 --format '{{json .Config.Env}}'")
print(stdout.read().decode('utf-8'))
ssh.close()
