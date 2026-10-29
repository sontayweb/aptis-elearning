import paramiko
import os
import sys
import tarfile

sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

# ==========================================
# 1. DEPLOY BACKEND
# ==========================================
print("\n--- 1. DEPLOYING BACKEND ---")
BACKEND_CONTAINER = "100eba9cfa4d"
backend_service_js = "backend/dist/modules/submissions/submission.service.js"
if os.path.exists(backend_service_js):
    print("Uploading submission.service.js to /tmp/submission.service.js...")
    sftp = ssh.open_sftp()
    sftp.put(backend_service_js, '/tmp/submission.service.js')
    sftp.close()
    
    cmds_backend = [
        f"docker cp /tmp/submission.service.js {BACKEND_CONTAINER}:/app/dist/modules/submissions/submission.service.js",
        f"docker restart {BACKEND_CONTAINER}",
    ]
    for cmd in cmds_backend:
        print(f"Exec: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode().strip()
        err = stderr.read().decode().strip()
        if out: print("OUT:", out)
        if err: print("ERR:", err)
    print("Backend deploy completed!")
else:
    print("Error: backend/dist/modules/submissions/submission.service.js not found!")

# ==========================================
# 2. DEPLOY FRONTEND
# ==========================================
print("\n--- 2. DEPLOYING FRONTEND ---")
FE_CONTAINER = "c1e4e12fb076"
tar_path = 'backend/scripts/frontend_full_patch.tar.gz'
print(f"Creating patch tar: {tar_path}...")

with tarfile.open(tar_path, 'w:gz') as tar:
    standalone_next = 'frontend/.next/standalone/.next'
    if os.path.exists(standalone_next):
        print("Adding standalone .next...")
        tar.add(standalone_next, arcname='.next')
        
    static_dir = 'frontend/.next/static'
    if os.path.exists(static_dir):
        print("Adding .next/static...")
        tar.add(static_dir, arcname='.next/static')
        
    server_js = 'frontend/.next/standalone/server.js'
    if os.path.exists(server_js):
        print("Adding server.js...")
        tar.add(server_js, arcname='server.js')

size_mb = os.path.getsize(tar_path) / (1024 * 1024)
print(f"Patch tar created: {size_mb:.2f} MB")

print("Uploading frontend patch to VPS /tmp...")
sftp = ssh.open_sftp()
sftp.put(tar_path, '/tmp/frontend_full_patch.tar.gz')
sftp.close()
print("Upload completed.")

cmds_fe = [
    f"docker exec {FE_CONTAINER} mkdir -p /tmp/patch",
    f"docker cp /tmp/frontend_full_patch.tar.gz {FE_CONTAINER}:/tmp/patch/patch.tar.gz",
    f"docker exec {FE_CONTAINER} tar -xzf /tmp/patch/patch.tar.gz -C /app",
    f"docker exec {FE_CONTAINER} rm -rf /tmp/patch",
    f"docker restart {FE_CONTAINER}"
]

for cmd in cmds_fe:
    print(f"Exec: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out: print("OUT:", out)
    if err: print("ERR:", err)

ssh.close()
print("\n✅ All deployments and container restarts completed successfully!")
