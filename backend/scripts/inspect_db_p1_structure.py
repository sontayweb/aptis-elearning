import json, sys, paramiko
sys.stdout.reconfigure(encoding="utf-8")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("103.90.227.117", port=22, username="root", password="Taovipko0!")

cmd = "docker exec 100eba9cfa4d node -e \"const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function main() { const exam = await prisma.exam.findFirst({ where: { id: 'aebb3f72-9280-4bc7-a9cc-d503c46b08be' }, include: { parts: { include: { questions: true } } } }); console.log(JSON.stringify(exam)); } main().finally(() => prisma.\\$disconnect());\""

stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode('utf-8').strip()
ssh.close()

exam = json.loads(out)
print("Exam Title:", exam.get("title"))
print("Parts count:", len(exam.get("parts", [])))
for p in exam.get("parts", []):
    print(f"Part {p['part_number']}: Title: {p.get('title')}, passage_text: {p.get('passage_text')[:60] if p.get('passage_text') else None}")
    for q in p.get("questions", [])[:2]:
        print(f"  Q{q['question_number']}: prompt: '{q.get('prompt')}', options: {q.get('options')}, correct: '{q.get('correct_answer')}'")
