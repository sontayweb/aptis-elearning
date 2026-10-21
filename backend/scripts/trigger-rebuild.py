import paramiko
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

print("--- Triggering Coolify deployments for backend and frontend ---")
tinker_cmd = '''docker exec coolify php artisan tinker --execute='
$front = App\\Models\\Application::where("name", "like", "%frontend%")->first();
$back = App\\Models\\Application::where("name", "like", "%backend%")->first();

if ($front) {
    $u1 = (string) Illuminate\\Support\\Str::uuid();
    queue_application_deployment(application: $front, deployment_uuid: $u1, force_rebuild: true);
    echo "FRONTEND_QUEUED: " . $u1 . "\n";
}

if ($back) {
    $u2 = (string) Illuminate\\Support\\Str::uuid();
    queue_application_deployment(application: $back, deployment_uuid: $u2, force_rebuild: true);
    echo "BACKEND_QUEUED: " . $u2 . "\n";
}
' '''

stdin, stdout, stderr = ssh.exec_command(tinker_cmd)
out = stdout.read().decode('utf-8', errors='ignore')
print(out)

ssh.close()
