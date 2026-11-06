import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

js_test = """
const { speakingHintsGeneratorService } = require('./dist/modules/admin/speaking-hints-generator.service');

async function testBroken() {
  console.log('2. Testing generateHints directly with a broken/non-existent image URL...');
  try {
    const hints = await speakingHintsGeneratorService.generateHints(
      'Test broken image',
      2,
      ['Describe the picture'],
      'https://invalid-host-404.example.com/notfound.jpg'
    );
    console.log('Unexpected success:', hints);
  } catch (err) {
    console.log('  -> Correctly rejected with error:');
    console.log('  -> Status code:', err.statusCode);
    console.log('  -> Message:', err.message);
    console.log('  -> isImageError flag:', err.isImageError);
  }
}

testBroken().catch(console.error);
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/test_broken.js', 'w') as f:
    f.write(js_test)

cmd = """
docker cp /tmp/test_broken.js rujigoulsjkdrha58tgtrvsr-115453976318:/app/test_broken.js
docker exec rujigoulsjkdrha58tgtrvsr-115453976318 node /app/test_broken.js
docker exec rujigoulsjkdrha58tgtrvsr-115453976318 rm -f /app/test_broken.js
"""

stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode('utf-8')
err = stderr.read().decode('utf-8')
print("OUTPUT:")
print(out)
if err:
    print("ERR:", err)

ssh.close()

