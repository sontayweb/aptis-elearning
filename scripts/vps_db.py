import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

VPS_HOST = "103.90.227.117"
VPS_USER = "root"
VPS_PASS = "Taovipko0!"
CONTAINER = "wlafe5vr5fwx6rn3curavktm"
DB_NAME = "aptis_kytich_db"

def run_remote_sql(sql_command):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASS, timeout=15)
    
    # We pipe sql via stdin to docker exec
    cmd = f'docker exec -i {CONTAINER} psql -U postgres -d {DB_NAME}'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    stdin.write(sql_command + "\n")
    stdin.flush()
    stdin.channel.shutdown_write()
    
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    ssh.close()
    if err and "ERROR:" in err:
        raise RuntimeError(err)
    return out

if __name__ == "__main__":
    query = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else 'SELECT id, title, skill, "isActive" FROM "Exam" WHERE skill = \'READING\' ORDER BY title;'
    print(run_remote_sql(query))
