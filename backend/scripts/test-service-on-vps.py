import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

js_test = """
const { speakingHintsGeneratorService } = require('./dist/modules/admin/speaking-hints-generator.service');

async function test() {
  console.log('Testing speakingHintsGeneratorService.getOverview()...');
  const res = await speakingHintsGeneratorService.getOverview();
  console.log('Overview Summary:', JSON.stringify(res.summary, null, 2));
  console.log('Sample item:', {
    partId: res.items[0]?.partId,
    examTitle: res.items[0]?.examTitle,
    partNumber: res.items[0]?.partNumber,
    imageUrl: res.items[0]?.imageUrl,
    status: res.items[0]?.status,
    hasImage: res.items[0]?.hasImage,
    isImageBroken: res.items[0]?.isImageBroken
  });
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/test_hints.js', 'w') as f:
    f.write(js_test)

cmd = """
docker cp /tmp/test_hints.js rujigoulsjkdrha58tgtrvsr-115453976318:/app/test_hints.js
docker exec rujigoulsjkdrha58tgtrvsr-115453976318 node /app/test_hints.js
docker exec rujigoulsjkdrha58tgtrvsr-115453976318 rm -f /app/test_hints.js
"""

stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
print("OUTPUT:")
print(out)
if err:
    print("ERR:", err)

ssh.close()

