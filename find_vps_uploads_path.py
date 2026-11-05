import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', timeout=10, look_for_keys=False, allow_agent=False)

# Let's find where /uploads/speaking/part2/image10.png is stored on the VPS
cmd = "find / -name 'image10.png' 2>/dev/null"
stdin, stdout, stderr = ssh.exec_command(cmd)
print("Find image10.png on VPS:\n", stdout.read().decode())
ssh.close()

