import paramiko
import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

def run_sql(sql):
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/q_exec.sql', 'wb') as f:
        f.write(sql.encode('utf-8'))
    sftp.close()
    
    cmd = 'docker cp /tmp/q_exec.sql wlafe5vr5fwx6rn3curavktm:/tmp/q_in.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" -f /tmp/q_in.sql'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if err and "ERROR" in err:
        print("SQL ERROR:", err, flush=True)
    return out

print("=== 1. CẬP NHẬT PART 1 CHO TẤT CẢ CÁC ĐỀ FULL READING ===", flush=True)

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
    # Lấy Part 1 của đề Full Reading
    sql_get_p1 = f"""
    SELECT ep.id, e.title
    FROM "ExamPart" ep
    JOIN "Exam" e ON ep.exam_id = e.id
    WHERE e.skill = 'READING' AND e.title LIKE 'Đề {num_str}%Full Reading%' AND ep.part_number = 1
    LIMIT 1;
    """
    res = run_sql(sql_get_p1)
    if res and "|||" in res:
        p1_id, e_title = res.split("|||", 1)
        p1_id = p1_id.strip()
        e_title = e_title.strip()
        
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
                
                clean_prompt = prompt.replace("tienphongSpace", "[gap]").replace("<p>", "").replace("</p>", "").strip()
                ans = answers[idx].strip()
                
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
            
            print(f"  ✅ Đã cập nhật Part 1 cho {e_title} (5 câu x 2.0đ, key: {', '.join(answers)})", flush=True)

print("\n=== 2. CHUẨN HÓA PART 2 CỦA TẤT CẢ CÁC ĐỀ FULL READING SANG 5 CÂU KÉO THẢ ===", flush=True)

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

sql_get_p2_qs = """
SELECT q.id, q.part_id, e.title, q.prompt, q.options::text
FROM "Question" q
JOIN "ExamPart" ep ON q.part_id = ep.id
JOIN "Exam" e ON ep.exam_id = e.id
WHERE e.skill = 'READING' AND ep.part_number = 2 AND e.title LIKE '%Full Reading%';
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
                try:
                    curr_opts = json.loads(opts_str)
                    sentences = curr_opts.get("sentences", [])
                    fixed = curr_opts.get("fixedSentence")
                    
                    if fixed and not re.search(r'sentence 1 is fixed', fixed, re.I) and len(sentences) == 4:
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
            print(f"  ✅ Đã chuẩn hóa Part 2 câu hỏi [{qid}] của {e_title} -> 5 câu kéo thả (1đ/câu), fixedSentence = null", flush=True)

print("\n=== 3. ẨN TẤT CẢ CÁC ĐỀ SUB-EXAM LẺ (CHỈ HIỂN THỊ FULL READING TRÊN DANH SÁCH) ===", flush=True)
sql_hide_sub = """
UPDATE "Exam"
SET is_published = false
WHERE skill = 'READING' AND title NOT LIKE '%Full Reading%';
"""
run_sql(sql_hide_sub)
print("  ✅ Đã ẩn toàn bộ các đề sub-exam đơn lẻ (chỉ hiển thị các đề Full Reading hoàn chỉnh)", flush=True)

ssh.close()
print("\n🎉 HOÀN TẤT CẬP NHẬT DATABASE!")
