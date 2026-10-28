import paramiko
import sshtunnel
import subprocess
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

VPS_IP = '103.90.227.117'
VPS_USER = 'root'
VPS_PASS = 'Taovipko0!'

print("================================================================================")
print("🚀 THIẾT LẬP SSH TUNNEL VÀ ĐỒNG BỘ DEEP UPSERT LÊN DATABASE PRODUCTION VPS")
print("================================================================================\n")

try:
    with sshtunnel.SSHTunnelForwarder(
        (VPS_IP, 22),
        ssh_username=VPS_USER,
        ssh_password=VPS_PASS,
        remote_bind_address=('10.0.1.8', 5432),
        local_bind_address=('127.0.0.1', 5433)
    ) as tunnel:
        print(f"✅ SSH Tunnel đã kết nối thành công qua cổng cục bộ: {tunnel.local_bind_port}")
        
        env = os.environ.copy()
        env['DATABASE_URL'] = 'postgresql://postgres:12345678@127.0.0.1:5433/aptis_kytich_db?schema=public'
        
        cmd = ['node', 'tools/sync.js', '--source=aptisacademy', '--db']
        print(f"▶️ Đang chạy lệnh: {' '.join(cmd)}...")
        proc = subprocess.run(cmd, env=env, cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
        print(f"🏁 Tiến trình hoàn tất với Exit Code: {proc.returncode}")

except Exception as e:
    print(f"❌ Lỗi thiết lập SSH tunnel hoặc chạy sync: {e}")
