import sshtunnel
import psycopg2
import sys

sys.stdout.reconfigure(encoding='utf-8')

VPS_IP = '103.90.227.117'
VPS_USER = 'root'
VPS_PASS = 'Taovipko0!'
DB_CONTAINER_IP = '10.0.1.8'

print("⏳ Đang thử nghiệm mở SSH Tunnel tới Postgres container 10.0.1.8:5432...")
with sshtunnel.SSHTunnelForwarder(
    (VPS_IP, 22),
    ssh_username=VPS_USER,
    ssh_password=VPS_PASS,
    remote_bind_address=(DB_CONTAINER_IP, 5432),
    local_bind_address=('127.0.0.1', 5433)
) as tunnel:
    print(f"✅ SSH Tunnel đã mở thành công tại 127.0.0.1:{tunnel.local_bind_port}")
    conn = psycopg2.connect(
        host='127.0.0.1',
        port=tunnel.local_bind_port,
        user='postgres',
        password='12345678',
        dbname='aptis_kytich_db'
    )
    cur = conn.cursor()
    cur.execute('SELECT count(*) FROM "Exam";')
    cnt = cur.fetchone()[0]
    print(f"🎉 Kết nối thành công! Tổng số đề thi hiện tại: {cnt} đề.")
    cur.close()
    conn.close()
