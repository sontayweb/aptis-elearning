import json, sys, paramiko
sys.stdout.reconfigure(encoding="utf-8")

# 1. Load crawled data from aptiskytich
with open("tools/data/aptiskytich/exam_sets_catalog.json", "r", encoding="utf-8") as f:
    sets = json.load(f)

with open("tools/data/aptiskytich/all_exam_questions.json", "r", encoding="utf-8") as f:
    questions = json.load(f)

q_by_set = {q["exam_set_id"]: q for q in questions}
p1_sets = [s for s in sets if (s.get("skill") or "").lower() == "reading" and "Part 1" in (s.get("part") or "")]

unique_crawled = {}
for s in p1_sets:
    q = q_by_set.get(s["id"])
    extra = q.get("extra_data") if q else {}
    passage = (extra.get("passage") if extra else "") or (q.get("question_text") if q else "")
    norm = " ".join(passage.split()[:5]).lower()
    if norm not in unique_crawled:
        unique_crawled[norm] = (s["title"], passage[:60])

print(f"Total unique crawled Part 1 passages: {len(unique_crawled)}")

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
            is_published: true,
            parts: {
                where: { part_number: 1 },
                select: { id: true, passage_text: true }
            }
        }
    });
    console.log(JSON.stringify(exams));
}
main().finally(() => prisma.$disconnect());
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/get_p1_parts.js', 'w') as f:
    f.write(js_code)
sftp.close()

stdin, stdout, stderr = ssh.exec_command("docker cp /tmp/get_p1_parts.js 100eba9cfa4d:/app/get_p1_parts.js && docker exec 100eba9cfa4d node /app/get_p1_parts.js")
out = stdout.read().decode('utf-8').strip()
err = stderr.read().decode('utf-8').strip()
ssh.close()

if err:
    print("ERR:", err)

db_exams = json.loads(out)
print(f"Total Reading exams in DB: {len(db_exams)}")

matched = 0
missing = []
for norm, (title, snippet) in unique_crawled.items():
    found = False
    found_in_exams = []
    for ex in db_exams:
        for p in ex.get("parts", []):
            ptxt = (p.get("passage_text") or "").lower()
            if norm in ptxt or snippet[:15].lower() in ptxt:
                found = True
                pub_tag = "[PUBLISHED]" if ex.get("is_published") else "[UNPUBLISHED]"
                found_in_exams.append(f"{ex['title']} {pub_tag}")
    if found:
        matched += 1
        print(f"  ✓ CÓ TRONG DB: '{title}' -> có trong: {', '.join(set(found_in_exams))}")
    else:
        missing.append((title, snippet))

print(f"\n--- KẾT QUẢ ĐỐI SOÁT ---")
print(f"Tổng số đoạn văn độc bản từ aptiskytich: {len(unique_crawled)}")
print(f"Số đoạn văn CÓ MẶT trong DB: {matched} / {len(unique_crawled)}")
if missing:
    print(f"Số đoạn văn thiếu ({len(missing)}):")
    for t, s in missing:
        print(f"  ❌ Thiếu: {t} -> {s}")
else:
    print("\n🎉 100% ĐỀ ĐỘC BẢN TỪ APTIS KY TICH ĐỀU CÓ MẶT ĐẦY ĐỦ TRONG DATABASE!")
