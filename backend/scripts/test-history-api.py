import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

node_script = """
const { submissionService } = require('./dist/modules/submissions/submission.service');
submissionService.getMyHistory('58858abc-1c49-4d17-b7e4-0e5541801cbb', { page: 1, limit: 3 }).then(r => {
  console.log(JSON.stringify(r.items.map(i => ({ id: i.id, title: i.examTitle, score: i.score, maxScore: i.maxScore })), null, 2));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
"""

cmd = f"docker exec 100eba9cfa4d node -e \"{node_script.strip().replace(chr(10), ' ')}\""
stdin, stdout, stderr = ssh.exec_command(cmd)
print("OUT:", stdout.read().decode())
print("ERR:", stderr.read().decode())
ssh.close()
