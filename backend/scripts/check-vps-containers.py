import paramiko
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

# Check inside frontend container
stdin, stdout, stderr = ssh.exec_command('docker exec dc855ac270a2 grep -rn "Sentence 1 is fixed" /app 2>/dev/null')
print("FRONTEND CONTAINER (dc855ac270a2):\n", stdout.read().decode('utf-8', errors='replace'))

# Check inside other frontend container (cdoa9kmxi37x3m3n38451b2r)
stdin, stdout, stderr = ssh.exec_command('docker exec 33d3ddc8d732 grep -rn "fixed here" /app 2>/dev/null')
print("CONTAINER 33d3ddc8d732:\n", stdout.read().decode('utf-8', errors='replace'))

# Check in postgres for any text with 'fixed here'
stdin, stdout, stderr = ssh.exec_command('docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -c "SELECT id, prompt, options FROM \\"Question\\" WHERE prompt LIKE \'%fixed here%\' OR options::text LIKE \'%fixed here%\';"')
print("DB CHECK:\n", stdout.read().decode('utf-8', errors='replace'))

ssh.close()
