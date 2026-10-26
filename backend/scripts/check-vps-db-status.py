import sys
import os
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import paramiko
import json

def run_query():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

    sql = """
    SELECT 
        e.id, 
        e.title, 
        e.skill, 
        e.hot_level, 
        e.is_published,
        count(p.id) as parts_count
    FROM "Exam" e
    LEFT JOIN "ExamPart" p ON p.exam_id = e.id
    GROUP BY e.id, e.title, e.skill, e.hot_level, e.is_published
    ORDER BY e.skill, e.title;
    """

    cmd = f"docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F '|||' -c '{sql}'"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    
    lines = out.strip().split('\n')
    print(f"Total exams in VPS DB: {len(lines)}")
    
    all_exams = []
    for l in lines:
        if not l.strip(): continue
        parts = l.split('|||')
        if len(parts) >= 6:
            all_exams.append({
                'id': parts[0],
                'title': parts[1],
                'skill': parts[2],
                'hot_level': int(parts[3] or 0),
                'is_published': parts[4] == 't',
                'parts_count': int(parts[5] or 0)
            })

    # Save to file
    with open('backend/scripts/vps_exams_list.json', 'w', encoding='utf-8') as f:
        json.dump(all_exams, f, ensure_ascii=False, indent=2)

    # Fetch speaking parts and images
    sql_parts = """
    SELECT 
        p.id, p.part_number, p.title, p.image_url, e.title as exam_title, e.skill
    FROM "ExamPart" p
    JOIN "Exam" e ON p.exam_id = e.id
    ORDER BY e.skill, e.title, p.part_number;
    """
    cmd2 = f"docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F '|||' -c '{sql_parts}'"
    stdin2, stdout2, stderr2 = ssh.exec_command(cmd2)
    out_parts = stdout2.read().decode('utf-8', errors='replace')
    
    all_parts = []
    for p in out_parts.strip().split('\n'):
        if not p.strip(): continue
        pts = p.split('|||')
        if len(pts) >= 6:
            all_parts.append({
                'id': pts[0],
                'part_number': int(pts[1] or 0),
                'title': pts[2],
                'image_url': pts[3],
                'exam_title': pts[4],
                'skill': pts[5]
            })

    with open('backend/scripts/vps_parts_list.json', 'w', encoding='utf-8') as f:
        json.dump(all_parts, f, ensure_ascii=False, indent=2)

    print(f"Saved {len(all_exams)} exams to vps_exams_list.json and {len(all_parts)} parts to vps_parts_list.json")
    ssh.close()

if __name__ == '__main__':
    run_query()
