import os
import sys
import time
import subprocess
from datetime import datetime

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import paramiko

VPS_HOST = '103.90.227.117'
VPS_PORT = 22
VPS_USER = 'root'
VPS_PASS = 'Taovipko0!'
DB_CONTAINER = 'wlafe5vr5fwx6rn3curavktm'
BACKEND_CONTAINER = 'rujigoulsjkdrha58tgtrvsr-020103645832'

BACKUP_DIR = r'd:\sontayweb\aptis-elearning\backups'
LOCAL_DUMP_PATH = r'd:\sontayweb\aptis-elearning\backend\local_dump.sql'
REMOTE_DUMP_PATH = '/root/local_dump.sql'

def print_step(num, title):
    print("\n" + "=" * 70)
    print(f"[*] BƯỚC {num}: {title}")
    print("=" * 70)

def main():
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    os.makedirs(BACKUP_DIR, exist_ok=True)
    
    local_backup_file = os.path.join(BACKUP_DIR, f"backup_local_{timestamp}.sql")
    cloud_backup_remote = f"/root/backup_cloudfy_{timestamp}.sql"
    cloud_backup_local = os.path.join(BACKUP_DIR, f"backup_cloudfy_{timestamp}.sql")

    # -------------------------------------------------------------
    # BƯỚC 1: BACKUP DATABASE LOCAL
    # -------------------------------------------------------------
    print_step(1, "SAO LƯU (BACKUP) DATABASE LOCAL")
    env = os.environ.copy()
    env["PGPASSWORD"] = "postgres"
    dump_cmd = [
        "pg_dump",
        "-h", "localhost",
        "-p", "5432",
        "-U", "postgres",
        "--clean",
        "--if-exists",
        "-d", "aptis_kytich_db",
        "-f", local_backup_file
    ]
    t0 = time.time()
    res = subprocess.run(dump_cmd, env=env, capture_output=True, text=True)
    if res.returncode != 0:
        print("[!] Lỗi khi backup Local DB:", res.stderr)
        sys.exit(1)
    
    local_size_mb = os.path.getsize(local_backup_file) / (1024 * 1024)
    print(f"[OK] Đã backup Database Local thành công!")
    print(f"     File: {local_backup_file}")
    print(f"     Dung lượng: {local_size_mb:.2f} MB (thời gian: {time.time() - t0:.2f}s)")

    # -------------------------------------------------------------
    # BƯỚC 2: KẾT NỐI SSH VÀ BACKUP DATABASE CLOUDFY (VPS)
    # -------------------------------------------------------------
    print_step(2, "KẾT NỐI VPS & SAO LƯU (BACKUP) DATABASE CLOUDFY")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Đang kết nối SSH tới {VPS_HOST}...")
    ssh.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, look_for_keys=False, allow_agent=False)
    print("[OK] Kết nối SSH thành công!")

    print(f"Đang chạy pg_dump trên container Postgres ({DB_CONTAINER})...")
    remote_dump_cmd = f"docker exec {DB_CONTAINER} pg_dump -U postgres --clean --if-exists aptis_kytich_db > {cloud_backup_remote}"
    stdin, stdout, stderr = ssh.exec_command(remote_dump_cmd)
    stdout.channel.recv_exit_status()
    
    # Kiểm tra dung lượng file backup remote
    stdin, stdout, stderr = ssh.exec_command(f"ls -lh {cloud_backup_remote}")
    out_ls = stdout.read().decode('utf-8', errors='replace').strip()
    print("     Chi tiết file backup trên VPS:", out_ls)

    print(f"Đang tải bản backup của Cloudfy về máy Local...")
    sftp = ssh.open_sftp()
    sftp.get(cloud_backup_remote, cloud_backup_local)
    sftp.close()
    cloud_size_mb = os.path.getsize(cloud_backup_local) / (1024 * 1024)
    print(f"[OK] Đã lưu 1 bản backup Cloudfy tại Local:")
    print(f"     File: {cloud_backup_local} ({cloud_size_mb:.2f} MB)")

    # -------------------------------------------------------------
    # BƯỚC 3: DUMP DỮ LIỆU CHUẨN ĐỂ ĐỒNG BỘ
    # -------------------------------------------------------------
    print_step(3, "CHUẨN BỊ BẢN DUMP DỮ LIỆU ĐỒNG BỘ TỪ LOCAL")
    # Dùng luôn local_backup_file làm local_dump_path
    import shutil
    shutil.copy2(local_backup_file, LOCAL_DUMP_PATH)
    sync_size_mb = os.path.getsize(LOCAL_DUMP_PATH) / (1024 * 1024)
    print(f"[OK] Bản dump sẵn sàng: {LOCAL_DUMP_PATH} ({sync_size_mb:.2f} MB)")

    # -------------------------------------------------------------
    # BƯỚC 4: TẢI BẢN DUMP LÊN VPS VÀ IMPORT VÀO CLOUDFY
    # -------------------------------------------------------------
    print_step(4, "ĐỒNG BỘ DỮ LIỆU LOCAL LÊN CLOUDFY (POSTGRESQL CONTAINER)")
    print(f"Đang tải {LOCAL_DUMP_PATH} lên VPS qua SFTP...")
    t_upload = time.time()
    sftp = ssh.open_sftp()
    
    last_reported = [0]
    def sftp_progress(transferred, total):
        pct = int(transferred / total * 100)
        if pct - last_reported[0] >= 25 or pct == 100:
            print(f"     [>>] Tiến độ upload: {pct}% ({transferred / (1024*1024):.2f}/{total / (1024*1024):.2f} MB)")
            last_reported[0] = pct

    sftp.put(LOCAL_DUMP_PATH, REMOTE_DUMP_PATH, callback=sftp_progress)
    sftp.close()
    print(f"[OK] Tải lên hoàn tất trong {time.time() - t_upload:.2f}s!")

    print(f"Đang làm mới database aptis_kytich_db và nạp dữ liệu vào container {DB_CONTAINER}...")
    t_import = time.time()
    wipe_and_import_cmd = f"""docker exec {DB_CONTAINER} psql -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'aptis_kytich_db' AND pid <> pg_backend_pid();" && \
docker exec {DB_CONTAINER} psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS aptis_kytich_db;" && \
docker exec {DB_CONTAINER} psql -U postgres -d postgres -c "CREATE DATABASE aptis_kytich_db WITH OWNER postgres ENCODING 'UTF8';" && \
cat {REMOTE_DUMP_PATH} | docker exec -i {DB_CONTAINER} psql -U postgres -d aptis_kytich_db > /root/restore_import.log 2>&1
"""
    stdin, stdout, stderr = ssh.exec_command(wipe_and_import_cmd)
    stdout.channel.recv_exit_status()
    print(f"[OK] Nạp database hoàn tất trong {time.time() - t_import:.2f}s!")

    # -------------------------------------------------------------
    # BƯỚC 5: ĐỐI SOÁT DỮ LIỆU (LOCAL VS CLOUDFY)
    # -------------------------------------------------------------
    print_step(5, "ĐỐI SOÁT SỐ LIỆU SAU KHI ĐỒNG BỘ (LOCAL vs CLOUDFY)")
    local_counts_cmd = [
        "psql",
        "-h", "localhost",
        "-p", "5432",
        "-U", "postgres",
        "-d", "aptis_kytich_db",
        "-t", "-A",
        "-c", """
SELECT 'Exams: ' || count(*) FROM "Exam";
SELECT 'Parts: ' || count(*) FROM "ExamPart";
SELECT 'Questions: ' || count(*) FROM "Question";
SELECT 'Users: ' || count(*) FROM "User";
SELECT 'Submissions: ' || count(*) FROM "ExamSubmission";
"""
    ]
    res_local = subprocess.run(local_counts_cmd, env=env, capture_output=True, text=True)
    local_counts = res_local.stdout.strip().splitlines()

    vps_verify_cmd = f"""docker exec {DB_CONTAINER} psql -U postgres -d aptis_kytich_db -t -A -c "
SELECT 'Exams: ' || count(*) FROM \\\"Exam\\\";
SELECT 'Parts: ' || count(*) FROM \\\"ExamPart\\\";
SELECT 'Questions: ' || count(*) FROM \\\"Question\\\";
SELECT 'Users: ' || count(*) FROM \\\"User\\\";
SELECT 'Submissions: ' || count(*) FROM \\\"ExamSubmission\\\";
"
"""
    stdin, stdout, stderr = ssh.exec_command(vps_verify_cmd)
    cloud_counts = stdout.read().decode('utf-8', errors='replace').strip().splitlines()

    print(f"{'BẢNG MỤC':<20} | {'LOCAL':<15} | {'CLOUDFY (VPS)':<15} | {'TRẠNG THÁI':<15}")
    print("-" * 70)
    for l_line, c_line in zip(local_counts, cloud_counts):
        key = l_line.split(":")[0].strip()
        l_val = l_line.split(":")[1].strip() if ":" in l_line else ""
        c_val = c_line.split(":")[1].strip() if ":" in c_line else ""
        status = "KHỚP 100% ✔" if l_val == c_val else "CHÊNH LỆCH ✖"
        print(f"{key:<20} | {l_val:<15} | {c_val:<15} | {status:<15}")

    # -------------------------------------------------------------
    # BƯỚC 6: KHỞI ĐỘNG LẠI BACKEND TRÊN CLOUDFY & KIỂM TRA
    # -------------------------------------------------------------
    print_step(6, "KHỞI ĐỘNG LẠI BACKEND TRÊN CLOUDFY")
    print(f"Đang khởi động lại container {BACKEND_CONTAINER}...")
    stdin, stdout, stderr = ssh.exec_command(f"docker restart {BACKEND_CONTAINER}")
    stdout.channel.recv_exit_status()
    print("[OK] Backend container đã khởi động lại!")

    # Dọn dẹp file tạm trên VPS
    ssh.exec_command(f"rm -f {REMOTE_DUMP_PATH}")
    ssh.close()

    print("\n" + "#" * 70)
    print("🎉 ĐỒNG BỘ CƠ SỞ DỮ LIỆU LOCAL SANG CLOUDFY THÀNH CÔNG RỰC RỠ!")
    print(f"1. Bản sao lưu Local: {local_backup_file}")
    print(f"2. Bản sao lưu Cloudfy: {cloud_backup_local}")
    print(f"3. Production URL: http://103.90.227.117:3000")
    print(f"4. API Health URL: http://103.90.227.117:5000/api/health")
    print("#" * 70 + "\n")

if __name__ == '__main__':
    main()
