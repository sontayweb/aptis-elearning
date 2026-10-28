import paramiko
import os
import sys
import datetime

sys.stdout.reconfigure(encoding='utf-8')

VPS_IP = '103.90.227.117'
VPS_USER = 'root'
VPS_PASS = 'Taovipko0!'
CONTAINER_NAME = 'wlafe5vr5fwx6rn3curavktm'
DB_NAME = 'aptis_kytich_db'
DB_USER = 'postgres'

now_str = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
backup_filename_sql = f'backup_vps_{DB_NAME}_{now_str}.sql.gz'
backup_filename_dump = f'backup_vps_{DB_NAME}_{now_str}.dump'
remote_sql_path = f'/root/{backup_filename_sql}'
remote_dump_path = f'/root/{backup_filename_dump}'

local_backups_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backups'))
os.makedirs(local_backups_dir, exist_ok=True)
local_sql_path = os.path.join(local_backups_dir, backup_filename_sql)
local_dump_path = os.path.join(local_backups_dir, backup_filename_dump)

print("================================================================================")
print(f"📦 BẮT ĐẦU DUMP DỮ LIỆU CƠ SỞ DỮ LIỆU TỪ VPS PRODUCTION ({VPS_IP})")
print("================================================================================\n")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(VPS_IP, port=22, username=VPS_USER, password=VPS_PASS)

# 1. Tạo file .sql.gz (nén văn bản đầy đủ)
print(f"⏳ [1/4] Đang thực hiện pg_dump sang file SQL nén: {remote_sql_path}...")
cmd_dump_sql = f'docker exec {CONTAINER_NAME} pg_dump -U {DB_USER} -d {DB_NAME} | gzip > {remote_sql_path}'
stdin, stdout, stderr = ssh.exec_command(cmd_dump_sql)
exit_status = stdout.channel.recv_exit_status()
if exit_status != 0:
    print(f"❌ Lỗi pg_dump SQL: {stderr.read().decode('utf-8')}")
    sys.exit(1)
print("  ✅ Đã dump xong file .sql.gz trên server!")

# 2. Tạo file .dump (PostgreSQL Custom Archive Format)
print(f"⏳ [2/4] Đang thực hiện pg_dump định dạng Custom Archive: {remote_dump_path}...")
cmd_dump_custom = f'docker exec {CONTAINER_NAME} pg_dump -U {DB_USER} -d {DB_NAME} -F c -b -v -f /tmp/{backup_filename_dump} && docker cp {CONTAINER_NAME}:/tmp/{backup_filename_dump} {remote_dump_path}'
stdin, stdout, stderr = ssh.exec_command(cmd_dump_custom)
exit_status = stdout.channel.recv_exit_status()
if exit_status != 0:
    print(f"⚠️ Cảnh báo dump custom: {stderr.read().decode('utf-8')}")
else:
    print("  ✅ Đã dump xong file .dump trên server!")

# 3. Kiểm tra kích thước file trên server
stdin, stdout, stderr = ssh.exec_command(f'ls -lh {remote_sql_path} {remote_dump_path}')
print("\n📊 Kích thước file trên VPS:")
print(stdout.read().decode('utf-8'))

# 4. Tải file về máy cục bộ qua SFTP
print(f"⏳ [3/4] Đang tải bản backup về máy: {local_sql_path}...")
sftp = ssh.open_sftp()
sftp.get(remote_sql_path, local_sql_path)
sql_size = os.path.getsize(local_sql_path)
print(f"  ✅ Đã tải xong {backup_filename_sql} ({sql_size / 1024 / 1024:.2f} MB)")

if os.path.exists(local_dump_path) or sftp.stat(remote_dump_path):
    print(f"⏳ [4/4] Đang tải bản backup {backup_filename_dump} về máy...")
    sftp.get(remote_dump_path, local_dump_path)
    dump_size = os.path.getsize(local_dump_path)
    print(f"  ✅ Đã tải xong {backup_filename_dump} ({dump_size / 1024 / 1024:.2f} MB)")

sftp.close()
ssh.close()

print("\n================================================================================")
print("🎉 DUMP VÀ SAO LƯU DỮ LIỆU THÀNH CÔNG 100%!")
print(f"📁 Bản lưu trên VPS:  {remote_sql_path} & {remote_dump_path}")
print(f"📁 Bản lưu trên máy:  {local_sql_path}")
print("================================================================================\n")
