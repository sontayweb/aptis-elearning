import paramiko
import sys
import json
import uuid
import re

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

def run_sql(sql):
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/q_master.sql', 'wb') as f:
        f.write(sql.encode('utf-8'))
    sftp.close()
    
    cmd = 'docker cp /tmp/q_master.sql wlafe5vr5fwx6rn3curavktm:/tmp/q_in.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" -f /tmp/q_in.sql'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if err and "ERROR" in err:
        print("SQL ERROR:", err, flush=True)
    return out

print("==================================================================")
print("BẮT ĐẦU DỌN DẸP TOÀN DIỆN VÀ CHUẨN HÓA BỘ ĐỀ READING TRÊN VPS")
print("==================================================================")

# ==============================================================================
# BƯỚC 1: XÓA CÁC ĐỀ RÁC / SUB-EXAM LẺ BỊ CÀO LỖI (CHỈ XÓA TRONG KỸ NĂNG READING)
# ==============================================================================
print("\n[BƯỚC 1] Dọn dẹp và xóa các đề con lẻ / sub-exams lỗi của Reading...")

# 1.1 Tìm ID của các sub-exam rác
sql_find_junk = """
SELECT id, title
FROM "Exam"
WHERE skill = 'READING'
  AND (
    description = 'Bộ đề trọng điểm Reading Part 1 – Gap Fill từ Aptis Tiên Phong'
    OR description LIKE '%Bộ đề tủ Part 2 & 3 Text Cohesion%'
    OR title LIKE 'Đề % - Đề %'
    OR title LIKE 'Đề % - Dề %'
    OR title LIKE 'Đề 07 - Games from childhood%'
    OR title LIKE 'Đề 07 - Making films%'
    OR (title LIKE 'Đề % - %' AND duration_minutes <= 15 AND title NOT LIKE '%Full Reading%')
  );
"""
junk_exams = run_sql(sql_find_junk)
junk_ids = []
if junk_exams:
    for line in junk_exams.splitlines():
        if "|||" in line:
            eid, etitle = line.split("|||", 1)
            junk_ids.append(eid.strip())
            print(f"  -> Xóa đề con rác: [{eid.strip()}] {etitle.strip()}")

if junk_ids:
    id_list_str = "'" + "','".join(junk_ids) + "'"
    del_sql = f"""
    -- Xóa bài nộp liên quan đến các đề này nếu có
    DELETE FROM "ExamSubmissionAnswer" WHERE submission_id IN (SELECT id FROM "ExamSubmission" WHERE exam_id IN ({id_list_str}));
    DELETE FROM "ExamSubmission" WHERE exam_id IN ({id_list_str});
    
    -- Xóa câu hỏi và phần thi
    DELETE FROM "Question" WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id IN ({id_list_str}));
    DELETE FROM "ExamPart" WHERE exam_id IN ({id_list_str});
    
    -- Xóa đề thi
    DELETE FROM "Exam" WHERE id IN ({id_list_str});
    """
    run_sql(del_sql)
    print(f"  ✅ Đã xóa thành công {len(junk_ids)} đề con rác!")
else:
    print("  ✅ Không tìm thấy đề con rác cần xóa.")

# ==============================================================================
# BƯỚC 2: XÓA CÁC ĐỀ TRÙNG TRONG BỘ 32 ĐỀ FULL READING THEO YÊU CẦU USER
# ==============================================================================
print("\n[BƯỚC 2] Xóa các đề Full Reading bị trùng theo yêu cầu người dùng...")

# Các đề cần xóa: 06, 09, 11, 13, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32
dup_numbers = ['06', '09', '11', '13', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32']
dup_clauses = " OR ".join([f"title LIKE 'Đề {num}%'" for num in dup_numbers])

sql_find_dups = f"""
SELECT id, title
FROM "Exam"
WHERE skill = 'READING'
  AND ({dup_clauses});
"""
dup_exams = run_sql(sql_find_dups)
dup_ids = []
if dup_exams:
    for line in dup_exams.splitlines():
        if "|||" in line:
            eid, etitle = line.split("|||", 1)
            dup_ids.append(eid.strip())
            print(f"  -> Xóa đề trùng: [{eid.strip()}] {etitle.strip()}")

if dup_ids:
    dup_id_list = "'" + "','".join(dup_ids) + "'"
    del_dup_sql = f"""
    DELETE FROM "ExamSubmissionAnswer" WHERE submission_id IN (SELECT id FROM "ExamSubmission" WHERE exam_id IN ({dup_id_list}));
    DELETE FROM "ExamSubmission" WHERE exam_id IN ({dup_id_list});
    DELETE FROM "Question" WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id IN ({dup_id_list}));
    DELETE FROM "ExamPart" WHERE exam_id IN ({dup_id_list});
    DELETE FROM "Exam" WHERE id IN ({dup_id_list});
    """
    run_sql(del_dup_sql)
    print(f"  ✅ Đã xóa thành công {len(dup_ids)} đề trùng lặp!")
else:
    print("  ✅ Không tìm thấy đề trùng cần xóa.")

# ==============================================================================
# BƯỚC 3: CẬP NHẬT ĐÁP ÁN VÀ ĐIỂM (2.0Đ/CÂU, TỔNG 10Đ) CHO PART 1 CÁC ĐỀ CHUẨN
# ==============================================================================
print("\n[BƯỚC 3] Chuẩn hóa Part 1: Cập nhật đáp án chuẩn, điểm 2.0đ/câu và làm sạch prompt...")

part1_keys = {
    '01': ["window", "buy", "market", "cake", "watched"],
    '02': ["live", "share", "class", "drive", "cook"],
    '03': ["near", "friendly", "practices", "say", "then"],
    '04': ["friendly", "walk", "first", "speak", "together"],
    '05': ["Clear", "sun", "enjoyable", "working", "read"],
    '07': ["station", "stops", "green", "dinner", "films"],
    '08': ["window", "buy", "market", "cake", "watched"],
    '10': ["morning", "friends", "leave", "good", "food"],
    '12': ["early", "lunch", "go", "car", "sleepy"],
    '14': ["miss", "called", "ready", "meet", "dinner"],
    '15': ["balance", "statement", "think", "slowly", "before"],
    '16': ["just", "too", "to", "some", "give"],
    '17': ["meetings", "park", "shop", "cook", "late"],
    '18': ["great", "boat", "then", "see", "too"],
    '19': ["open", "send", "easy", "so", "page"],
    '20': ["detail", "copy", "busy", "client", "long"],
}

for num_str, answers in part1_keys.items():
    # Tìm Part 1 của đề này
    sql_get_p1 = f"""
    SELECT ep.id, e.title
    FROM "ExamPart" ep
    JOIN "Exam" e ON ep.exam_id = e.id
    WHERE e.skill = 'READING' AND e.title LIKE 'Đề {num_str}%' AND ep.part_number = 1
    LIMIT 1;
    """
    res = run_sql(sql_get_p1)
    if res and "|||" in res:
        p1_id, e_title = res.split("|||", 1)
        p1_id = p1_id.strip()
        e_title = e_title.strip()
        
        # Lấy danh sách 5 câu hỏi của Part 1 này
        sql_get_qs = f"""
        SELECT id, question_number, prompt, options::text
        FROM "Question"
        WHERE part_id = '{p1_id}'
        ORDER BY question_number ASC;
        """
        qs_res = run_sql(sql_get_qs)
        if qs_res:
            lines = qs_res.splitlines()
            for idx, line in enumerate(lines[:5]):
                parts = line.split("|||")
                qid = parts[0].strip()
                prompt = parts[2].strip() if len(parts) > 2 else ""
                options_str = parts[3].strip() if len(parts) > 3 else "[]"
                
                # Làm sạch prompt: replace tienphongSpace và strip html
                clean_prompt = prompt.replace("tienphongSpace", "[gap]").replace("<p>", "").replace("</p>", "").strip()
                ans = answers[idx].strip()
                
                # Cập nhật options nếu chưa có đáp án đúng trong options
                try:
                    opts = json.loads(options_str)
                    if not any(opt.strip().lower() == ans.lower() for opt in opts):
                        opts.append(ans)
                    opts_clean = [opt.replace("tienphongSpace", "").strip() for opt in opts if opt.strip()]
                    opts_json = json.dumps(opts_clean, ensure_ascii=False).replace("'", "''")
                except:
                    opts_json = "[]"
                
                update_q_sql = f"""
                UPDATE "Question"
                SET correct_answer = '{ans.replace("'", "''")}',
                    prompt = '{clean_prompt.replace("'", "''")}',
                    options = '{opts_json}'::jsonb,
                    max_score = 2.0
                WHERE id = '{qid}';
                """
                run_sql(update_q_sql)
            
            print(f"  ✅ Đã cập nhật Part 1 cho {e_title} (5 câu x 2.0đ = 10đ, đáp án: {', '.join(answers)})")

# ==============================================================================
# BƯỚC 4: CHUẨN HÓA PART 2 & PART 3 (TEXT COHESION): 5 CÂU KÉO THẢ, 1.0Đ/CÂU
# ==============================================================================
print("\n[BƯỚC 4] Chuẩn hóa Part 2 & 3: 5 câu kéo thả (1.0đ/câu, fixedSentence = null, 5 slots)...")

# Bộ dữ liệu chuẩn cho các câu chuyện Text Cohesion
stories_bank = {
    "making films": {
        "title": "Making films",
        "sentences": [
            "The films in that time period were very different from the films of today.",
            "This is because these films were only in all 2 black and white, and they also had no sound.",
            "In addition to these technological limitations, the film producers has also a very low budget",
            "This lack of money affected mostly the actors, so they didn’t earn much money.",
            "Things have changed over time, and some of them now earn thousands of dollars after appearing in films."
        ]
    },
    "family sport": {
        "title": "Family sport days",
        "sentences": [
            "It took place on Saturday morning, there was a 10-meter race for adults.",
            "Sixty people took part, and among them, Ms. Kamus kept the fastest pace and won the race.",
            "After she received her prize, the following time was dedicated to children’s activities.",
            "The activities included football, swimming, skipping, and more, and the kids played happily together.",
            "After finishing the games, the children were very hungry and ate with their parents."
        ]
    },
    "new coffee shop": {
        "title": "My visit to a new coffee shop",
        "sentences": [
            "When I arrived, the place was very crowded, and the staff were extremely busy on the first day.",
            "Even though it was crowded, the staff still managed to find a table for me.",
            "They handed me the menu, and when I looked through it, I saw quite a variety of dishes.",
            "After checking them all, I decided to order the most expensive sandwich.",
            "It tasted really good with melted cheese on top, and I'll definitely come back to this place again."
        ]
    },
    "famous singer": {
        "title": "A famous singer",
        "sentences": [
            "Before becoming famous at this young age, he studied art and music at high school.",
            "During this education, he learned to be creative and to practise singing on stage.",
            "In these performances, he liked to wear bright clothes and paint his face.",
            "This strange way of dressing and his songs have attracted people's attention.",
            "They started to follow him on social media, and now he is very popular."
        ]
    },
    "end-of-term": {
        "title": "End-of-term project",
        "sentences": [
            "Your end of term project needs to focus on at least two of them.",
            "It has to include relevant pictures and your own written text about the topic",
            "You then have to use these pictures and your written work to create a presentation for the class.",
            "This talk will give your key points and it should be around five minutes.",
            "After this time, other students will be able to ask some questions and you will answer those."
        ]
    },
    "eating at a cafe": {
        "title": "Eating at a cafe",
        "sentences": [
            "I decided to try a new café located at the end of the street.",
            "The place was quite busy, with a lively atmosphere.",
            "Even so, a staff member quickly noticed me and brought over the menu.",
            "I was a bit surprised to see that there were only a few items to choose from.",
            "In the end, I went for the most expensive salad on the menu."
        ]
    }
}

# Lấy tất cả các câu hỏi Part 2 trong bảng
sql_get_p2_qs = """
SELECT q.id, q.part_id, e.title, q.prompt, q.options::text
FROM "Question" q
JOIN "ExamPart" ep ON q.part_id = ep.id
JOIN "Exam" e ON ep.exam_id = e.id
WHERE e.skill = 'READING' AND ep.part_number = 2;
"""
p2_qs_data = run_sql(sql_get_p2_qs)
if p2_qs_data:
    for line in p2_qs_data.splitlines():
        parts = line.split("|||")
        if len(parts) >= 5:
            qid = parts[0].strip()
            e_title = parts[2].strip()
            prompt = parts[3].strip()
            opts_str = parts[4].strip()
            
            # Khớp với story chuẩn
            matched_bank = None
            prompt_lower = prompt.lower()
            for key, bank in stories_bank.items():
                if key in prompt_lower or bank["title"].lower() in prompt_lower:
                    matched_bank = bank
                    break
            
            if matched_bank:
                sent_objs = [{"id": f"s{s_i+1}", "text": s_text} for s_i, s_text in enumerate(matched_bank["sentences"])]
                opts_dict = {
                    "title": matched_bank["title"],
                    "fixedSentence": None,
                    "sentences": sent_objs
                }
                cor_order = ["s1", "s2", "s3", "s4", "s5"]
            else:
                # Nếu không trong 6 câu chuyện hot, parse options hiện tại và chuyển sang fixedSentence: None
                try:
                    curr_opts = json.loads(opts_str)
                    sentences = curr_opts.get("sentences", [])
                    fixed = curr_opts.get("fixedSentence")
                    
                    if fixed and not re.search(r'sentence 1 is fixed', fixed, re.I) and len(sentences) == 4:
                        # Gộp câu cố định thành câu thứ 1 trong 5 câu kéo thả
                        new_sents = [{"id": "s1", "text": fixed}]
                        for idx, s in enumerate(sentences):
                            new_sents.append({"id": f"s{idx+2}", "text": s.get("text", "")})
                        sent_objs = new_sents
                        cor_order = [f"s{i+1}" for i in range(len(new_sents))]
                    elif len(sentences) == 5:
                        sent_objs = sentences
                        cor_order = [s.get("id", f"s{i+1}") for i, s in enumerate(sentences)]
                    else:
                        sent_objs = sentences
                        cor_order = [s.get("id", f"s{i+1}") for i, s in enumerate(sentences)]
                    
                    opts_dict = {
                        "title": curr_opts.get("title", prompt),
                        "fixedSentence": None,
                        "sentences": sent_objs
                    }
                except:
                    continue
            
            clean_opts_json = json.dumps(opts_dict, ensure_ascii=False).replace("'", "''")
            clean_cor_json = json.dumps(cor_order).replace("'", "''")
            
            up_p2_sql = f"""
            UPDATE "Question"
            SET options = '{clean_opts_json}'::jsonb,
                correct_answer = '{clean_cor_json}',
                max_score = 5.0
            WHERE id = '{qid}';
            """
            run_sql(up_p2_sql)
            print(f"  ✅ Đã chuẩn hóa Part 2 câu hỏi [{qid}] của {e_title} -> 5 câu kéo thả, fixedSentence = null")

# ==============================================================================
# BƯỚC 5: KIỂM TRA VÀ BẢO ĐẢM PASSAGE_TEXT CỦA PART 3 & PART 4 ĐẦY ĐỦ
# ==============================================================================
print("\n[BƯỚC 5] Kiểm tra và cập nhật bài đọc passage_text cho Part 3 & Part 4...")

# Điền nội dung cho Part 3 "Games from childhood" nếu bị thiếu
games_childhood_text = """Person Odilia:
I spent hours playing board games when I was a child. The rules were straightforward and easy to understand. Now that I have children of my own, I play board games with them because I want them to spend less time on computers, and we laugh a lot while we do it. But modern games seem so complicated with endless characters and options. I have to think very hard every time we play.

Person Chris:
I was very lucky to grow up in a place with good weather. I loved going outside to play with my peers. We just chased each other around. If we had a ball, we would play football, and if we didn't, we would play catch until it got dark. Having had that experience, I find it hard to be alone even now, and some of those children are still my friends today.

Person Jan:
I was unable to go outside much when I was little, and I still don't go out a lot now. I had plenty of books, and the stories really gripped me. My parents wanted me to do art, but I wasn't interested in it at all. There was a library near my house, and I could spend hours there, completely lost in a book. These days I really enjoy playing games, because I get so involved in them.

Person Shelly:
When I was young, I loved going outside to play with my friends. When it rained, which it often did, I would look gloomily out of the window and hope it would stop. On days like that, my mother used to give me books, but I didn't like sitting still and reading. Then she gave me some pencils and paints instead. I realised that I was actually quite good at it, and I couldn't stop drawing for hours."""

sql_fix_p3_text = f"""
UPDATE "ExamPart"
SET passage_text = '{games_childhood_text.replace("'", "''")}'
WHERE skill = 'READING' AND (title LIKE '%Part 3%' OR title LIKE '%Part 4%' OR part_number IN (3, 4))
  AND (passage_text IS NULL OR length(passage_text) < 50)
  AND id IN (
    SELECT ep.id
    FROM "ExamPart" ep
    JOIN "Question" q ON q.part_id = ep.id
    WHERE q.prompt LIKE '%childhood games%' OR q.prompt LIKE '%Who likes modern games%'
  );
"""
run_sql(sql_fix_p3_text)
print("  ✅ Đã đảm bảo passage_text cho bài Games from childhood!")

# ==============================================================================
# BƯỚC 6: KIỂM TRA TỔNG QUÁT SỐ LƯỢNG ĐỀ READING SAU KHI DỌN DẸP
# ==============================================================================
print("\n[BƯỚC 6] Báo cáo thống kê sau khi dọn dẹp:")
sql_summary = """
SELECT id, title, skill, duration_minutes, is_published,
       (SELECT count(*) FROM "ExamPart" WHERE exam_id = "Exam".id) as parts_count,
       (SELECT count(*) FROM "Question" q JOIN "ExamPart" ep ON q.part_id = ep.id WHERE ep.exam_id = "Exam".id) as questions_count
FROM "Exam"
WHERE skill = 'READING'
ORDER BY title;
"""
final_report = run_sql(sql_summary)
print(final_report)

ssh.close()
print("\n🎉 HOÀN THÀNH QUÁ TRÌNH DỌN DẸP VÀ CHUẨN HÓA TRÊN VPS!")
