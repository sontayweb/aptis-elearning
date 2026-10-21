import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

print("--- Triggering deployment for aptis-frontend (id 9) ---")
tinker_cmd = '''docker exec coolify php artisan tinker --execute='
$front = App\\Models\\Application::find(9);

if ($front) {
    $u1 = (string) Illuminate\\Support\\Str::uuid();
    queue_application_deployment(application: $front, deployment_uuid: $u1, force_rebuild: true);
    echo "APTIS_FRONTEND_QUEUED: " . $u1 . "\n";
}
' '''

stdin, stdout, stderr = ssh.exec_command(tinker_cmd)
out = stdout.read().decode('utf-8', errors='ignore')
print(out)

ssh.close()
