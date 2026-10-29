import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

# Kiểm tra docker inspect IP của container postgres
stdin, stdout, stderr = ssh.exec_command("docker inspect wlafe5vr5fwx6rn3curavktm --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'")
db_ip = stdout.read().decode('utf-8').strip()
print("Postgres Container Docker IP:", db_ip)

# Kiểm tra netstat hoặc ss trên VPS xem port 5432 có listen trên 127.0.0.1 không
stdin, stdout, stderr = ssh.exec_command("ss -tlpn | grep 5432")
print("Host 5432 listening:", stdout.read().decode('utf-8').strip())

ssh.close()
