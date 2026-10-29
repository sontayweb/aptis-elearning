import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

def run_sql(sql):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)
    
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/query.sql', 'w') as f:
        f.write(sql)
    sftp.close()
    
    cmd = 'docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/query.sql'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    print(out)
    if err and "ERROR" in err:
        print("STDERR:", err)
    ssh.close()
    return out

if __name__ == '__main__':
    sql = sys.argv[1] if len(sys.argv) > 1 else 'SELECT 1;'
    run_sql(sql)
