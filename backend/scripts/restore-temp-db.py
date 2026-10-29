import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

commands = [
    # 1. Copy backup dump into postgres container
    "docker cp /root/backup_vps_aptis_kytich_db_20261028_231241.dump wlafe5vr5fwx6rn3curavktm:/tmp/backup_clean.dump",
    # 2. Drop temp db if exists and recreate
    "docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -c 'DROP DATABASE IF EXISTS aptis_temp_db;'",
    "docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -c 'CREATE DATABASE aptis_temp_db;'",
    # 3. Restore schema & data into temp db (ignoring non-fatal errors)
    "docker exec wlafe5vr5fwx6rn3curavktm pg_restore -U postgres -d aptis_temp_db /tmp/backup_clean.dump || true",
    # 4. Check Question count in temp db
    "docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_temp_db -c 'SELECT count(*) FROM \"Question\";'",
]

for cmd in commands:
    print(f"Executing: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out:
        print("OUT:", out)
    if err and "WARNING" not in err and "error ignored" not in err:
        print("ERR:", err)

ssh.close()
