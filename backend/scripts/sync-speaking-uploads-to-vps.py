import os
import sys
import tarfile
import paramiko
import time

VPS_HOST = '103.90.227.117'
VPS_PORT = 22
VPS_USER = 'root'
VPS_PASS = 'Taovipko0!'
FRONTEND_CONTAINER = 'cdoa9kmxi37x3m3n38451b2r-221452110732'
LOCAL_UPLOADS_DIR = r'd:\sontayweb\aptis-elearning\frontend\public\uploads'
TAR_FILE = r'd:\sontayweb\aptis-elearning\uploads_speaking.tar.gz'
REMOTE_TAR = '/root/uploads_speaking.tar.gz'

def main():
    print("[1] Dang dong goi folder frontend/public/uploads thanh tar.gz...")
    with tarfile.open(TAR_FILE, "w:gz") as tar:
        tar.add(LOCAL_UPLOADS_DIR, arcname="uploads")
    
    size_mb = os.path.getsize(TAR_FILE) / (1024 * 1024)
    print(f"   [OK] Dong goi thanh cong: {size_mb:.2f} MB")

    print("[2] Dang ket noi SSH toi VPS 103.90.227.117...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, look_for_keys=False, allow_agent=False)
    print("   [OK] Ket noi SSH thanh cong!")

    print(f"[3] Dang tai {TAR_FILE} len VPS qua SFTP...")
    sftp = ssh.open_sftp()
    sftp.put(TAR_FILE, REMOTE_TAR)
    sftp.close()
    print("   [OK] Tai len VPS hoan tat!")

    print("[4] Dang giai nen vao container frontend (public/)...")
    cmd = f"""
    docker exec {FRONTEND_CONTAINER} mkdir -p /app/public
    docker cp {REMOTE_TAR} {FRONTEND_CONTAINER}:/app/public/uploads_speaking.tar.gz
    docker exec {FRONTEND_CONTAINER} tar -xzf /app/public/uploads_speaking.tar.gz -C /app/public/
    docker exec {FRONTEND_CONTAINER} rm -f /app/public/uploads_speaking.tar.gz
    rm -f {REMOTE_TAR}
    """
    stdin, stdout, stderr = ssh.exec_command(cmd)
    stdout.channel.recv_exit_status()
    print("   [OK] Da giai nen truc tiep vao /app/public/uploads tren container frontend!")

    # Verify inside container
    stdin, stdout, stderr = ssh.exec_command(f"docker exec {FRONTEND_CONTAINER} ls -la /app/public/uploads/speaking/part2 | head -n 5")
    out = stdout.read().decode('utf-8', errors='replace')
    print("   Kiem tra file trong container:")
    print(out)

    ssh.close()
    try:
        os.remove(TAR_FILE)
    except:
        pass
    print("=== DONG BO HOAN TAT ===")

if __name__ == "__main__":
    main()
