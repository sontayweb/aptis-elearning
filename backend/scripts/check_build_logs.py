import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

cmd = "docker exec coolify-db psql -U coolify -d coolify -c 'SELECT deployment_uuid, application_name, status, updated_at FROM application_deployment_queues ORDER BY created_at DESC LIMIT 4;'"
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))

cmd_ps = "docker ps -a --filter 'status=running' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
stdin, stdout, stderr = ssh.exec_command(cmd_ps)
print('--- RUNNING CONTAINERS ---')
print(stdout.read().decode('utf-8', errors='replace'))

cmd_log_detail = """docker exec coolify-db psql -U coolify -d coolify -t -A -c "
SELECT (item->>'order') || ': ' || (item->>'output')
FROM application_deployment_queues,
json_array_elements(logs::json) AS item
WHERE deployment_uuid='780c45fc-f583-4148-826d-87afcadce05c'
AND (item->>'order')::int BETWEEN 115 AND 135;
" """
stdin, stdout, stderr = ssh.exec_command(cmd_log_detail)
print('--- BUILD ERROR DETAIL ---')
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()
