import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = """
BEGIN;

-- 1. Update Đề 01 (standalone: ed88b4a6-ecbb-4185-9649-a12503aa0053) in-place
UPDATE "Question" SET 
    prompt = 'I saw some shoes in the [gap] of one store.',
    options = '["market", "window", "shoe"]',
    correct_answer = 'window',
    max_score = 2.0
WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id = 'ed88b4a6-ecbb-4185-9649-a12503aa0053') AND question_number = 1;

UPDATE "Question" SET 
    prompt = 'I didn''t [gap] it.',
    options = '["eat", "drink", "buy"]',
    correct_answer = 'buy',
    max_score = 2.0
WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id = 'ed88b4a6-ecbb-4185-9649-a12503aa0053') AND question_number = 2;

UPDATE "Question" SET 
    prompt = 'I buy some food at the [gap].',
    options = '["classroom", "park", "market"]',
    correct_answer = 'market',
    max_score = 2.0
WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id = 'ed88b4a6-ecbb-4185-9649-a12503aa0053') AND question_number = 3;

UPDATE "Question" SET 
    prompt = 'I ate [gap].',
    options = '["watch", "door", "cake"]',
    correct_answer = 'cake',
    max_score = 2.0
WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id = 'ed88b4a6-ecbb-4185-9649-a12503aa0053') AND question_number = 4;

UPDATE "Question" SET 
    prompt = 'I [gap] a program on TV.',
    options = '["ate", "saw", "watched"]',
    correct_answer = 'watched',
    max_score = 2.0
WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id = 'ed88b4a6-ecbb-4185-9649-a12503aa0053') AND question_number = 5;

-- 2. Update Đề 08 (standalone: c2e73cb3-4226-4521-bd36-b165f30db5da) in-place
UPDATE "Question" SET 
    prompt = 'I saw some shoes in the [gap] of one store.',
    options = '["market", "window", "shoe"]',
    correct_answer = 'window',
    max_score = 2.0
WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id = 'c2e73cb3-4226-4521-bd36-b165f30db5da') AND question_number = 1;

UPDATE "Question" SET 
    prompt = 'I didn''t [gap] it.',
    options = '["eat", "drink", "buy"]',
    correct_answer = 'buy',
    max_score = 2.0
WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id = 'c2e73cb3-4226-4521-bd36-b165f30db5da') AND question_number = 2;

UPDATE "Question" SET 
    prompt = 'I buy some food at the [gap].',
    options = '["classroom", "park", "market"]',
    correct_answer = 'market',
    max_score = 2.0
WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id = 'c2e73cb3-4226-4521-bd36-b165f30db5da') AND question_number = 3;

UPDATE "Question" SET 
    prompt = 'I ate [gap].',
    options = '["watch", "door", "cake"]',
    correct_answer = 'cake',
    max_score = 2.0
WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id = 'c2e73cb3-4226-4521-bd36-b165f30db5da') AND question_number = 4;

UPDATE "Question" SET 
    prompt = 'I [gap] a program on TV.',
    options = '["ate", "saw", "watched"]',
    correct_answer = 'watched',
    max_score = 2.0
WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id = 'c2e73cb3-4226-4521-bd36-b165f30db5da') AND question_number = 5;

-- 3. Update Đề 08 Full Reading (d0ed94eb-a1cb-4e41-a9c0-98c60c8244e8, Part 1) in-place
UPDATE "Question" SET 
    prompt = 'I saw some shoes in the [gap] of one store.',
    options = '["market", "window", "shoe"]',
    correct_answer = 'window',
    max_score = 2.0
WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id = 'd0ed94eb-a1cb-4e41-a9c0-98c60c8244e8' AND (part_number = 1 OR title ILIKE '%Part 1%')) AND question_number = 1;

UPDATE "Question" SET 
    prompt = 'I didn''t [gap] it.',
    options = '["eat", "drink", "buy"]',
    correct_answer = 'buy',
    max_score = 2.0
WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id = 'd0ed94eb-a1cb-4e41-a9c0-98c60c8244e8' AND (part_number = 1 OR title ILIKE '%Part 1%')) AND question_number = 2;

UPDATE "Question" SET 
    prompt = 'I buy some food at the [gap].',
    options = '["classroom", "park", "market"]',
    correct_answer = 'market',
    max_score = 2.0
WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id = 'd0ed94eb-a1cb-4e41-a9c0-98c60c8244e8' AND (part_number = 1 OR title ILIKE '%Part 1%')) AND question_number = 3;

UPDATE "Question" SET 
    prompt = 'I ate [gap].',
    options = '["watch", "door", "cake"]',
    correct_answer = 'cake',
    max_score = 2.0
WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id = 'd0ed94eb-a1cb-4e41-a9c0-98c60c8244e8' AND (part_number = 1 OR title ILIKE '%Part 1%')) AND question_number = 4;

UPDATE "Question" SET 
    prompt = 'I [gap] a program on TV.',
    options = '["ate", "saw", "watched"]',
    correct_answer = 'watched',
    max_score = 2.0
WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id = 'd0ed94eb-a1cb-4e41-a9c0-98c60c8244e8' AND (part_number = 1 OR title ILIKE '%Part 1%')) AND question_number = 5;

-- 4. Update Đề 01 Full Reading (519a8525-c364-469a-9bf1-4b9474807314, Part 1) in-place
UPDATE "Question" SET 
    prompt = 'I saw some shoes in the [gap] of one store.',
    options = '["market", "window", "shoe"]',
    correct_answer = 'window',
    max_score = 2.0
WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id = '519a8525-c364-469a-9bf1-4b9474807314' AND (part_number = 1 OR title ILIKE '%Part 1%')) AND question_number = 1;

UPDATE "Question" SET 
    prompt = 'I didn''t [gap] it.',
    options = '["eat", "drink", "buy"]',
    correct_answer = 'buy',
    max_score = 2.0
WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id = '519a8525-c364-469a-9bf1-4b9474807314' AND (part_number = 1 OR title ILIKE '%Part 1%')) AND question_number = 2;

UPDATE "Question" SET 
    prompt = 'I buy some food at the [gap].',
    options = '["classroom", "park", "market"]',
    correct_answer = 'market',
    max_score = 2.0
WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id = '519a8525-c364-469a-9bf1-4b9474807314' AND (part_number = 1 OR title ILIKE '%Part 1%')) AND question_number = 3;

UPDATE "Question" SET 
    prompt = 'I ate [gap].',
    options = '["watch", "door", "cake"]',
    correct_answer = 'cake',
    max_score = 2.0
WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id = '519a8525-c364-469a-9bf1-4b9474807314' AND (part_number = 1 OR title ILIKE '%Part 1%')) AND question_number = 4;

UPDATE "Question" SET 
    prompt = 'I [gap] a program on TV.',
    options = '["ate", "saw", "watched"]',
    correct_answer = 'watched',
    max_score = 2.0
WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id = '519a8525-c364-469a-9bf1-4b9474807314' AND (part_number = 1 OR title ILIKE '%Part 1%')) AND question_number = 5;

COMMIT;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/fix_p1_de01_08.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = 'docker cp /tmp/fix_p1_de01_08.sql wlafe5vr5fwx6rn3curavktm:/tmp/fix_p1_de01_08.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/fix_p1_de01_08.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
print("STDOUT:", stdout.read().decode('utf-8', errors='replace'))
print("STDERR:", stderr.read().decode('utf-8', errors='replace'))
ssh.close()
