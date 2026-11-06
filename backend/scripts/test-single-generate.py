import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

js_test = """
const { speakingHintsGeneratorService } = require('./dist/modules/admin/speaking-hints-generator.service');

async function testSingle() {
  console.log('1. Testing generateHintsForPart on valid image Part (f6df3512-c976-41dc-98e6-69784273096c - Tin tốt)...');
  try {
    const hints = await speakingHintsGeneratorService.generateHintsForPart('f6df3512-c976-41dc-98e6-69784273096c');
    console.log('  -> Generated successfully!');
    console.log('  -> Keywords count:', hints.keywords?.length);
    console.log('  -> Sample keywords:', hints.keywords?.slice(0, 3));
    console.log('  -> Starting phrase:', hints.startingPhrases?.[0]);
  } catch (err) {
    console.error('  -> Failed:', err.message || err);
  }
}

testSingle().catch(console.error);
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/test_single.js', 'w') as f:
    f.write(js_test)

cmd = """
docker cp /tmp/test_single.js rujigoulsjkdrha58tgtrvsr-115453976318:/app/test_single.js
docker exec rujigoulsjkdrha58tgtrvsr-115453976318 node /app/test_single.js
docker exec rujigoulsjkdrha58tgtrvsr-115453976318 rm -f /app/test_single.js
"""

stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
print("OUTPUT:")
print(out)
if err:
    print("ERR:", err)

ssh.close()

