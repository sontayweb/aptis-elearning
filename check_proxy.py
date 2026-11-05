import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', timeout=10, look_for_keys=False, allow_agent=False)

# Let's inspect which container serves aptisesolpremier.com
cmd = "docker exec coolify-proxy traefik version || true"
stdin, stdout, stderr = ssh.exec_command("docker exec coolify-proxy wget -qO- http://localhost:8080/api/rawdata 2>/dev/null | grep -o '\"rule\":\"[^\"]*\"' | head -n 30")
print("Traefik rules:\n", stdout.read().decode())

# Check where image10.png is in the active frontend container
cmd_check = "docker exec cdoa9kmxi37x3m3n38451b2r-092312393197 ls -la /app/public/uploads/speaking/part2/image10.png"
stdin, stdout, stderr = ssh.exec_command(cmd_check)
print("Image10 check in cdoa9kmxi37x3m3n38451b2r:\n", stdout.read().decode())

# Check active frontend container name from Traefik
cmd_ps = "docker ps --filter name=cdoa9kmxi37x3m3n38451b2r --format '{{.Names}} - {{.Status}}'"
stdin, stdout, stderr = ssh.exec_command(cmd_ps)
print("cdoa status:\n", stdout.read().decode())

# Check rujigoulsjkdrha58tgtrvsr
cmd_ruji = "docker ps --filter name=rujigoulsjkdrha58tgtrvsr --format '{{.Names}} - {{.Status}}'"
stdin, stdout, stderr = ssh.exec_command(cmd_ruji)
print("ruji status:\n", stdout.read().decode())

ssh.close()
