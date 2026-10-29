import paramiko
import os
import sys
import tarfile

sys.stdout.reconfigure(encoding='utf-8')

tar_path = 'backend/scripts/frontend_full_patch.tar.gz'
print(f"Creating patch tar: {tar_path}...")

with tarfile.open(tar_path, 'w:gz') as tar:
    # 1. Add standalone .next
    standalone_next = 'frontend/.next/standalone/.next'
    if os.path.exists(standalone_next):
        print("Adding standalone .next...")
        tar.add(standalone_next, arcname='.next')
        
    # 2. Add static chunks
    static_dir = 'frontend/.next/static'
    if os.path.exists(static_dir):
        print("Adding .next/static...")
        tar.add(static_dir, arcname='.next/static')
        
    # 3. Add standalone server.js
    server_js = 'frontend/.next/standalone/server.js'
    if os.path.exists(server_js):
        print("Adding server.js...")
        tar.add(server_js, arcname='server.js')

size_mb = os.path.getsize(tar_path) / (1024 * 1024)
print(f"Patch tar created: {size_mb:.2f} MB")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

print("Uploading patch to VPS /tmp...")
sftp = ssh.open_sftp()
sftp.put(tar_path, '/tmp/frontend_full_patch.tar.gz')
sftp.close()
print("Upload completed.")

CONTAINER = "c1e4e12fb076"
cmds = [
    f"docker exec {CONTAINER} mkdir -p /tmp/patch",
    f"docker cp /tmp/frontend_full_patch.tar.gz {CONTAINER}:/tmp/patch/patch.tar.gz",
    f"docker exec {CONTAINER} tar -xzf /tmp/patch/patch.tar.gz -C /app",
    f"docker exec {CONTAINER} rm -rf /tmp/patch",
    f"docker restart {CONTAINER}"
]

for cmd in cmds:
    print(f"Exec: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out: print("OUT:", out)
    if err: print("ERR:", err)

ssh.close()
print("\n✅ Hoàn tất deploy frontend patch và restart container thành công!")
