import sys
import paramiko

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

stdin, stdout, stderr = ssh.exec_command('docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -c "SELECT email, role, full_name FROM \\"User\\";"')
print(stdout.read().decode('utf-8', errors='replace'))
ssh.close()
