import paramiko
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

# 1. Archive local frontend/.next/server/app/reading/[id] and static chunks
import tarfile

tar_path = 'backend/scripts/reading_patch.tar.gz'
with tarfile.open(tar_path, 'w:gz') as tar:
    server_reading = 'frontend/.next/server/app/reading'
    if os.path.exists(server_reading):
        tar.add(server_reading, arcname='.next/server/app/reading')
    
    # Also find any static chunks for reading
    static_app = 'frontend/.next/static/chunks/app/reading'
    if os.path.exists(static_app):
        tar.add(static_app, arcname='.next/static/chunks/app/reading')

print(f"Created patch tar: {os.path.getsize(tar_path)} bytes")

# 2. Upload to VPS
sftp = ssh.open_sftp()
sftp.put(tar_path, '/tmp/reading_patch.tar.gz')
sftp.close()

# 3. Extract into container c1e4e12fb076
cmds = [
    "docker exec c1e4e12fb076 mkdir -p /tmp/patch",
    "docker cp /tmp/reading_patch.tar.gz c1e4e12fb076:/tmp/patch/reading_patch.tar.gz",
    "docker exec c1e4e12fb076 tar -xzf /tmp/patch/reading_patch.tar.gz -C /app",
    "docker exec c1e4e12fb076 rm -rf /tmp/patch",
    # Restart the container so next server reloads
    "docker restart c1e4e12fb076"
]

for cmd in cmds:
    print(f"Exec: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='replace'))
    err = stderr.read().decode('utf-8', errors='replace')
    if err:
        print("ERR:", err)

ssh.close()
print("Hot patch applied and frontend container restarted successfully!")
