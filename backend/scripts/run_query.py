import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = sys.stdin.read().strip() if not sys.stdin.isatty() else (sys.argv[1] if len(sys.argv) > 1 else 'SELECT role, count(*) FROM "User" GROUP BY role;')

stdin, stdout, stderr = client.exec_command("docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db")
stdin.write(sql)
stdin.channel.shutdown_write()
print(stdout.read().decode('utf-8'))
client.close()
