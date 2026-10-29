import paramiko
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

# Script to copy clean Part 2 questions from Full Reading exams to standalone exams
# and normalize De 34, 36, 37.

sql = """
DO $$
DECLARE
    rec RECORD;
    v_standalone_part_id text;
    v_full_part_id text;
    v_q1 RECORD;
    v_q2 RECORD;
    v_existing_q_count int;
    v_standalone_q1_id text;
    v_standalone_q2_id text;
BEGIN
    -- Loop through numbers 1 to 20
    FOR rec IN 
        SELECT 
            s.id as standalone_exam_id, 
            s.title as standalone_title,
            f.id as full_exam_id,
            f.title as full_title,
            substring(s.title from 'Đề\\s*0*(\\d+)')::int as num
        FROM "Exam" s
        JOIN "Exam" f ON f.title ILIKE 'Đề ' || lpad(substring(s.title from 'Đề\\s*0*(\\d+)'), 2, '0') || ' — Full Reading%'
        WHERE s.title NOT ILIKE '%Full Reading%' 
          AND EXISTS (
              SELECT 1 FROM "ExamPart" ep 
              WHERE ep.exam_id = s.id 
                AND (ep.title ILIKE '%Text Cohesion%' OR ep.title ILIKE '%Part 2%' OR ep.part_number = 2)
          )
    LOOP
        -- Get Part 2 part_id of full exam
        SELECT id INTO v_full_part_id FROM "ExamPart"
        WHERE exam_id = rec.full_exam_id AND (title ILIKE '%Text Cohesion%' OR title ILIKE '%Part 2%' OR part_number = 2)
        LIMIT 1;

        -- Get Part 2 part_id of standalone exam
        SELECT id INTO v_standalone_part_id FROM "ExamPart"
        WHERE exam_id = rec.standalone_exam_id AND (title ILIKE '%Text Cohesion%' OR title ILIKE '%Part 2%' OR part_number = 2)
        LIMIT 1;

        IF v_full_part_id IS NOT NULL AND v_standalone_part_id IS NOT NULL THEN
            -- Get 2 clean questions from full exam
            SELECT * INTO v_q1 FROM "Question" WHERE part_id = v_full_part_id AND question_number = 1;
            SELECT * INTO v_q2 FROM "Question" WHERE part_id = v_full_part_id AND question_number = 2;

            IF v_q1.id IS NOT NULL AND v_q2.id IS NOT NULL THEN
                SELECT count(*) INTO v_existing_q_count FROM "Question" WHERE part_id = v_standalone_part_id;

                IF v_existing_q_count = 1 THEN
                    -- Update question 1
                    SELECT id INTO v_standalone_q1_id FROM "Question" WHERE part_id = v_standalone_part_id LIMIT 1;
                    UPDATE "Question" SET 
                        prompt = v_q1.prompt,
                        options = v_q1.options,
                        correct_answer = v_q1.correct_answer,
                        max_score = 5.0,
                        question_number = 1
                    WHERE id = v_standalone_q1_id;

                    -- Insert question 2
                    INSERT INTO "Question" (id, part_id, question_number, question_type, prompt, options, correct_answer, max_score)
                    VALUES (gen_random_uuid(), v_standalone_part_id, 2, 'SENTENCE_ORDER', v_q2.prompt, v_q2.options, v_q2.correct_answer, 5.0);

                    RAISE NOTICE 'Updated 1 + Inserted 1 for % (Exam: %)', rec.standalone_title, rec.standalone_exam_id;
                ELSIF v_existing_q_count >= 2 THEN
                    -- Update both questions
                    SELECT id INTO v_standalone_q1_id FROM "Question" WHERE part_id = v_standalone_part_id AND question_number = 1;
                    SELECT id INTO v_standalone_q2_id FROM "Question" WHERE part_id = v_standalone_part_id AND question_number = 2;

                    IF v_standalone_q1_id IS NULL THEN
                        SELECT id INTO v_standalone_q1_id FROM "Question" WHERE part_id = v_standalone_part_id ORDER BY id LIMIT 1;
                    END IF;
                    IF v_standalone_q2_id IS NULL THEN
                        SELECT id INTO v_standalone_q2_id FROM "Question" WHERE part_id = v_standalone_part_id AND id != v_standalone_q1_id ORDER BY id LIMIT 1;
                    END IF;

                    UPDATE "Question" SET 
                        prompt = v_q1.prompt,
                        options = v_q1.options,
                        correct_answer = v_q1.correct_answer,
                        max_score = 5.0,
                        question_number = 1
                    WHERE id = v_standalone_q1_id;

                    UPDATE "Question" SET 
                        prompt = v_q2.prompt,
                        options = v_q2.options,
                        correct_answer = v_q2.correct_answer,
                        max_score = 5.0,
                        question_number = 2
                    WHERE id = v_standalone_q2_id;

                    RAISE NOTICE 'Updated 2 existing questions for % (Exam: %)', rec.standalone_title, rec.standalone_exam_id;
                END IF;
            END IF;
        END IF;
    END LOOP;
END $$;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/sync_p2_standalone.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = 'docker cp /tmp/sync_p2_standalone.sql wlafe5vr5fwx6rn3curavktm:/tmp/sync_p2_standalone.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/sync_p2_standalone.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
print("STDOUT:", stdout.read().decode('utf-8', errors='replace'))
print("STDERR:", stderr.read().decode('utf-8', errors='replace'))
ssh.close()
