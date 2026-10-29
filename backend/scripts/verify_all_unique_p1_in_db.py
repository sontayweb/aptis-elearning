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
    norm = " ".join(passage.split()[:6]).lower()
    if norm not in unique_crawled:
        unique_crawled[norm] = (s["title"], passage[:60])

print(f"Total unique crawled Part 1 passages: {len(unique_crawled)}")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("103.90.227.117", port=22, username="root", password="Taovipko0!")

cmd = "docker exec 100eba9cfa4d node -e \"const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function main() { const parts = await prisma.part.findMany({ where: { part_number: 1 }, select: { id: true, passage_text: true, exam: { select: { id: true, title: true, is_published: true } } } }); console.log(JSON.stringify(parts)); } main().finally(() => prisma.\\$disconnect());\""

stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode('utf-8').strip()
ssh.close()

db_parts = json.loads(out)
print(f"Total Part 1 parts in DB: {len(db_parts)}")

matched = 0
missing = []
for norm, (title, snippet) in unique_crawled.items():
    found = False
    found_in_exams = []
    for dbp in db_parts:
        ptxt = (dbp.get("passage_text") or "").lower()
        if norm in ptxt or snippet[:20].lower() in ptxt:
            found = True
            found_in_exams.append(dbp["exam"]["title"])
    if found:
        matched += 1
        print(f"  ✓ CÓ TRONG DB: '{title}' -> tìm thấy trong đề: {', '.join(set(found_in_exams))}")
    else:
        missing.append((title, snippet))

print(f"\n--- KẾT QUẢ ĐỐI SOÁT ---")
print(f"Tổng số đoạn văn độc bản từ aptiskytich: {len(unique_crawled)}")
print(f"Số đoạn văn CÓ MẶT trong DB: {matched} / {len(unique_crawled)}")
if missing:
    print(f"Số đoạn văn thiếu: {len(missing)}")
    for t, s in missing:
        print(f"  ❌ Thiếu: {t} -> {s}")
else:
    print("🎉 100% ĐỀ ĐỘC BẢN TỪ APTIS KY TICH ĐỀU CÓ MẶT ĐẦY ĐỦ TRONG DATABASE!")
