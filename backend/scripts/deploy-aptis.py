import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

php_code = """
$app = App\\Models\\Application::find(8);
if ($app) {
    $u = (string) Illuminate\\Support\\Str::uuid();
    queue_application_deployment(application: $app, deployment_uuid: $u, force_rebuild: true);
    echo "APTIS_BACKEND_QUEUED: " . $u . "\\n";
}
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/deploy_back.php', 'w') as f:
    f.write(php_code)

cmd = "docker exec -i coolify php artisan tinker < /tmp/deploy_back.php"
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8'))
ssh.close()

