import json, sys, paramiko
sys.stdout.reconfigure(encoding="utf-8")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("103.90.227.117", port=22, username="root", password="Taovipko0!")

js_code = """
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const exams = await prisma.exam.findMany({
        where: { skill: 'READING' },
        select: {
            id: true,
            title: true,
            parts: {
                select: {
                    id: true,
                    part_number: true,
                    title: true,
                    passage_text: true,
                    questions: {
                        select: { id: true, question_number: true, question_type: true, prompt: true }
                    }
                }
            }
        }
    });
    console.log(JSON.stringify(exams));
}
main().finally(() => prisma.$disconnect());
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/inspect_p3_p4.js', 'w') as f:
    f.write(js_code)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("docker cp /tmp/inspect_p3_p4.js 100eba9cfa4d:/app/inspect_p3_p4.js && docker exec 100eba9cfa4d node /app/inspect_p3_p4.js")
out = stdout.read().decode('utf-8').strip()
ssh.close()

exams = json.loads(out)
print(f"Total Reading Exams in DB: {len(exams)}")

full_tests = [e for e in exams if len(e.get("parts", [])) >= 4]
single_part = [e for e in exams if len(e.get("parts", [])) == 1]
print(f"Full Tests (4 parts): {len(full_tests)}")
print(f"Single Part Tests: {len(single_part)}")

print("\n--- SINGLE PART TESTS BREAKDOWN ---")
for e in single_part:
    p = e["parts"][0]
    p_title = p.get("title", "")
    q_count = len(p.get("questions", []))
    has_passage = bool(p.get("passage_text"))
    print(f"[{e['id'][:8]}] '{e['title']}' | PartTitle: '{p_title}' | Questions: {q_count} | HasPassage: {has_passage}")
