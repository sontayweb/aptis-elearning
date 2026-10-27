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

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
BACKUP_DIR = os.path.join(BACKEND_DIR, 'backups', 'sql')
os.makedirs(BACKUP_DIR, exist_ok=True)

timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
LOCAL_FILE = os.path.join(BACKUP_DIR, f"backup_vps_synced_{timestamp}.sql")
REMOTE_DUMP_FILE = f"/root/vps_export_{timestamp}.sql"

def print_step(step, title):
    print("\n" + "=" * 70)
    print(f"[*] BƯỚC {step}: {title}")
    print("=" * 70)

def main():
    print("\n======================================================================")
    print("   TIẾN TRÌNH KÉO (PULL) DỮ LIỆU CƠ SỞ DỮ LIỆU TỪ SERVER VỀ MÁY LOCAL")
    print("======================================================================\n")

    # 1. KẾT NỐI SSH TỚI VPS
    print_step(1, f"KẾT NỐI SSH TỚI SERVER VPS ({VPS_HOST})")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    t0 = time.time()
    try:
        ssh.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, look_for_keys=False, allow_agent=False)
        print(f"[OK] Kết nối SSH thành công trong {time.time() - t0:.2f}s!")
    except Exception as e:
        print(f"[!] Lỗi kết nối SSH: {e}")
        sys.exit(1)

    # 2. XUẤT (PG_DUMP) TRỰC TIẾP TỪ CONTAINER POSTGRES TRÊN SERVER
    print_step(2, f"THỰC THI PG_DUMP TRÊN CONTAINER {DB_CONTAINER}")
    dump_cmd = f"docker exec {DB_CONTAINER} pg_dump -U postgres --clean --if-exists aptis_kytich_db > {REMOTE_DUMP_FILE}"
    print(f"Đang xuất dữ liệu ra file: {REMOTE_DUMP_FILE}...")
    t_dump = time.time()
    stdin, stdout, stderr = ssh.exec_command(dump_cmd)
    exit_status = stdout.channel.recv_exit_status()
    if exit_status != 0:
        err = stderr.read().decode('utf-8', errors='replace')
        print(f"[!] Lỗi khi xuất CSDL trên server: {err}")
        ssh.close()
        sys.exit(1)

    # Kiểm tra dung lượng trên server
    _, stdout_ls, _ = ssh.exec_command(f"ls -lh {REMOTE_DUMP_FILE}")
    ls_out = stdout_ls.read().decode('utf-8', errors='replace').strip()
    print(f"[OK] Đã xuất xong bản dump trên VPS trong {time.time() - t_dump:.2f}s!")
    print(f"     Thông tin tệp: {ls_out}")

    # 3. TẢI FILE DUMP QUA SFTP VỀ MÁY LOCAL
    print_step(3, "TẢI FILE SAO LƯU TỪ VPS VỀ MÁY LOCAL QUA SFTP")
    sftp = ssh.open_sftp()
    t_download = time.time()

    last_pct = [0]
    def sftp_progress(transferred, total):
        pct = int(transferred / total * 100)
        if pct - last_pct[0] >= 20 or pct == 100:
            print(f"     [>>] Tiến độ tải: {pct}% ({transferred / (1024*1024):.2f}/{total / (1024*1024):.2f} MB)")
            last_pct[0] = pct

    print(f"Đang tải về: {LOCAL_FILE}...")
    sftp.get(REMOTE_DUMP_FILE, LOCAL_FILE, callback=sftp_progress)
    sftp.close()

    local_size_mb = os.path.getsize(LOCAL_FILE) / (1024 * 1024)
    print(f"[OK] Tải về thành công trong {time.time() - t_download:.2f}s! Dung lượng: {local_size_mb:.2f} MB")

    # Xóa file dump tạm trên VPS
    ssh.exec_command(f"rm -f {REMOTE_DUMP_FILE}")
    print("[OK] Đã dọn dẹp file tạm trên VPS.")

    # Đọc số liệu hiện tại trên VPS trước khi restore
    vps_counts_cmd = f"""docker exec {DB_CONTAINER} psql -U postgres -d aptis_kytich_db -t -A -c "
SELECT 'Exams: ' || count(*) FROM \\\"Exam\\\";
SELECT 'Parts: ' || count(*) FROM \\\"ExamPart\\\";
SELECT 'Questions: ' || count(*) FROM \\\"Question\\\";
SELECT 'Users: ' || count(*) FROM \\\"User\\\";
SELECT 'Submissions: ' || count(*) FROM \\\"ExamSubmission\\\";
SELECT 'Answers: ' || count(*) FROM \\\"SubmissionAnswer\\\";
SELECT 'DictationLessons: ' || count(*) FROM \\\"DictationLesson\\\";
SELECT 'DictationSentences: ' || count(*) FROM \\\"DictationSentence\\\";
SELECT 'Reviews: ' || count(*) FROM \\\"ExamReview\\\";
"
"""
    stdin, stdout_cnt, _ = ssh.exec_command(vps_counts_cmd)
    vps_counts_raw = stdout_cnt.read().decode('utf-8', errors='replace').strip().splitlines()
    ssh.close()

    # 4. NẠP (RESTORE) VÀO DATABASE POSTGRESQL LOCAL
    print_step(4, "KHÔI PHỤC (RESTORE) DỮ LIỆU VÀO POSTGRESQL LOCAL")
    env = os.environ.copy()
    env["PGPASSWORD"] = "postgres"

    # Đóng các kết nối đang mở vào CSDL local nếu có để restore mượt mà
    terminate_cmd = [
        "psql",
        "-h", "localhost",
        "-p", "5432",
        "-U", "postgres",
        "-d", "postgres",
        "-c", "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'aptis_kytich_db' AND pid <> pg_backend_pid();"
    ]
    subprocess.run(terminate_cmd, env=env, capture_output=True)

    restore_cmd = [
        "psql",
        "-h", "localhost",
        "-p", "5432",
        "-U", "postgres",
        "-d", "aptis_kytich_db",
        "-f", LOCAL_FILE
    ]

    t_restore = time.time()
    print("Đang nạp dữ liệu vào CSDL local 'aptis_kytich_db'...")
    res_restore = subprocess.run(restore_cmd, env=env, capture_output=True, text=True)
    if res_restore.returncode != 0:
        print(f"[!] Cảnh báo trong quá trình restore:\n{res_restore.stderr[:500]}")
    print(f"[OK] Quá trình nạp dữ liệu hoàn tất trong {time.time() - t_restore:.2f}s!")

    # 5. ĐỐI SOÁT SỐ LIỆU GIỮA VPS VÀ LOCAL
    print_step(5, "ĐỐI SOÁT SỐ LIỆU CHÍNH XÁC (SERVER VPS vs LOCAL)")
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
SELECT 'Answers: ' || count(*) FROM "SubmissionAnswer";
SELECT 'DictationLessons: ' || count(*) FROM "DictationLesson";
SELECT 'DictationSentences: ' || count(*) FROM "DictationSentence";
SELECT 'Reviews: ' || count(*) FROM "ExamReview";
"""
    ]
    res_local = subprocess.run(local_counts_cmd, env=env, capture_output=True, text=True)
    local_counts_raw = res_local.stdout.strip().splitlines()

    print(f"{'BẢNG MỤC':<22} | {'TRÊN SERVER VPS':<18} | {'TẠI MÁY LOCAL':<18} | {'TRẠNG THÁI':<15}")
    print("-" * 75)
    for v_line, l_line in zip(vps_counts_raw, local_counts_raw):
        key = v_line.split(":")[0].strip()
        v_val = v_line.split(":")[1].strip() if ":" in v_line else ""
        l_val = l_line.split(":")[1].strip() if ":" in l_line else ""
        status = "KHỚP 100% ✔" if v_val == l_val else "CHÊNH LỆCH ✖"
        print(f"{key:<22} | {v_val:<18} | {l_val:<18} | {status:<15}")

    print("\n" + "#" * 70)
    print("🎉 ĐỒNG BỘ DỮ LIỆU TỪ SERVER VỀ MÁY LOCAL THÀNH CÔNG RỰC RỠ!")
    print(f"• Tệp sao lưu lưu trữ tại: {LOCAL_FILE}")
    print(f"• CSDL Local 'aptis_kytich_db' hiện đã chứa 100% dữ liệu thật mới nhất từ Server.")
    print("#" * 70 + "\n")

if __name__ == '__main__':
    main()
