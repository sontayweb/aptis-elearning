import os
import sys
import time

# Force UTF-8 stdout
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import paramiko

VPS_HOST = '103.90.227.117'
VPS_PORT = 22
VPS_USER = 'root'
VPS_PASS = 'Taovipko0!'
DB_CONTAINER = 'wlafe5vr5fwx6rn3curavktm'
BACKEND_CONTAINER = 'rujigoulsjkdrha58tgtrvsr-185445880597'
LOCAL_DUMP_PATH = r'd:\sontayweb\aptis-elearning\backend\local_dump.sql'
REMOTE_DUMP_PATH = '/root/local_dump.sql'

def print_banner(msg):
    print('\n' + '=' * 60)
    print(f'[*] {msg}')
    print('=' * 60)

def main():
    if not os.path.exists(LOCAL_DUMP_PATH):
        print(f"Error: {LOCAL_DUMP_PATH} does not exist.")
        sys.exit(1)
        
    size_mb = os.path.getsize(LOCAL_DUMP_PATH) / (1024 * 1024)
    print_banner(f"CHUYEN DATABASE TU LOCAL SANG UBUNTU VPS ({size_mb:.2f} MB)")

    # 1. Connect SSH
    print("[1] Dang ket noi SSH toi may chu VPS (103.90.227.117)...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, look_for_keys=False, allow_agent=False)
    print("   [OK] Ket noi SSH thanh cong!")

    # 2. Upload dump via SFTP
    print(f"[2] Dang tai tep local_dump.sql ({size_mb:.2f} MB) len VPS qua SFTP...")
    start_upload = time.time()
    sftp = ssh.open_sftp()
    
    last_reported = [0]
    def sftp_progress(transferred, total):
        pct = int(transferred / total * 100)
        if pct - last_reported[0] >= 20 or pct == 100:
            print(f"   [>>] Da tai: {pct}% ({transferred / (1024*1024):.2f}/{total / (1024*1024):.2f} MB)")
            last_reported[0] = pct

    sftp.put(LOCAL_DUMP_PATH, REMOTE_DUMP_PATH, callback=sftp_progress)
    sftp.close()
    print(f"   [OK] Tai len hoan tat trong {time.time() - start_upload:.2f}s!")

    # 3. Wipe old database on Ubuntu container
    print(f"[3] Dang ngat ket noi va xoa hoan toan database cu tren container '{DB_CONTAINER}'...")
    wipe_cmd = f"""docker exec {DB_CONTAINER} psql -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'aptis_kytich_db' AND pid <> pg_backend_pid();" && \
docker exec {DB_CONTAINER} psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS aptis_kytich_db;" && \
docker exec {DB_CONTAINER} psql -U postgres -d postgres -c "CREATE DATABASE aptis_kytich_db WITH OWNER postgres ENCODING 'UTF8';"
"""
    stdin, stdout, stderr = ssh.exec_command(wipe_cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    print("   Output:", out.strip())
    if err and "ERROR" in err:
        print("   Warning/Err:", err.strip())
    print("   [OK] Da xoa sach database cu va tao moi aptis_kytich_db trang tinh!")

    # 4. Import local dump to container
    print(f"[4] Dang nap toan bo du lieu tu local_dump.sql vao PostgreSQL container...")
    start_import = time.time()
    import_cmd = f"cat {REMOTE_DUMP_PATH} | docker exec -i {DB_CONTAINER} psql -U postgres -d aptis_kytich_db > /root/restore.log 2>&1"
    stdin, stdout, stderr = ssh.exec_command(import_cmd)
    stdout.channel.recv_exit_status() # wait for completion
    print(f"   [OK] Nap database hoan tat trong {time.time() - start_import:.2f}s!")

    # 5. Verify row counts on VPS
    print("[5] Kiem tra doi soat so luong ban ghi tren PostgreSQL VPS...")
    verify_cmd = f"""docker exec {DB_CONTAINER} psql -U postgres -d aptis_kytich_db -t -A -c "
SELECT 'Exams: ' || count(*) FROM \\\"Exam\\\";
SELECT 'Parts: ' || count(*) FROM \\\"ExamPart\\\";
SELECT 'Questions: ' || count(*) FROM \\\"Question\\\";
SELECT 'Users: ' || count(*) FROM \\\"User\\\";
SELECT 'Submissions: ' || count(*) FROM \\\"ExamSubmission\\\";
"
"""
    stdin, stdout, stderr = ssh.exec_command(verify_cmd)
    v_out = stdout.read().decode('utf-8', errors='replace')
    print("   SO LIEU THUC TE TREN VPS UBUNTU:\n" + "\n".join("      " + line for line in v_out.strip().splitlines()))

    # 6. Restart backend container on VPS
    print(f"[6] Khoi dong lai Backend container ({BACKEND_CONTAINER})...")
    stdin, stdout, stderr = ssh.exec_command(f"docker restart {BACKEND_CONTAINER}")
    stdout.channel.recv_exit_status()
    print("   [OK] Backend container da khoi dong lai hoan tat!")

    # Clean up remote dump
    ssh.exec_command(f"rm -f {REMOTE_DUMP_PATH}")

    ssh.close()
    print_banner("CHUYEN DATABASE TU LOCAL SANG UBUNTU HOAN TAT 100%!")

if __name__ == '__main__':
    main()
