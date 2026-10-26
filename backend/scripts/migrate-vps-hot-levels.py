import sys
import os
import json
import re

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import paramiko

def execute_migration():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)
    print("=== CONNECTED TO VPS (103.90.227.117) ===")

    # 1. Load current exams from VPS
    sql_get = """SELECT id, title, skill, hot_level FROM "Exam";"""
    cmd = f"docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F '|||' -c '{sql_get}'"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    raw = stdout.read().decode('utf-8', errors='replace')
    
    exams = []
    for l in raw.strip().split('\n'):
        if not l.strip(): continue
        p = l.split('|||')
        if len(p) >= 4:
            exams.append({
                'id': p[0],
                'title': p[1],
                'skill': p[2],
                'hot_level': int(p[3] or 0)
            })
    print(f"Loaded {len(exams)} exams from VPS database.")

    # Rules for hot levels
    # Tier 3 (5 & 4 ☘️)
    tier_3_keywords = [
        "film", "singer", "the famous singer", "new coffee shop", "my visit to a new coffee shop",
        "busy coffee", "end of term project", "the first american woman in space", "weekend activities",
        "movies then and now", "the history of transportation",
        # Part 4
        "childhood", "music festival", "games from childhood", "technology in childhood", "extreme sports",
        # Part 5
        "mountain", "four-day week", "women mathematicians", "woman mathematics", "mountain summits"
    ]

    # Tier 2 (3 ☘️)
    tier_2_keywords = [
        "family sport day", "family sports day", "mae - the math girl", "cultural festival",
        "college welcoming day", "childhood memories", "free time activity", "job and trainning",
        "job and training", "volunteering", "career"
    ]

    # Tier 1 (2 ☘️)
    tier_1_keywords = [
        "public transportations", "writing about a place", "music show at the park"
    ]

    updates = []
    
    for e in exams:
        t_lower = e['title'].lower()
        new_hot = None
        
        # Check tier 3 first
        for kw in tier_3_keywords:
            if kw in t_lower:
                new_hot = 3
                break
                
        # If not matched, check tier 2
        if new_hot is None:
            for kw in tier_2_keywords:
                if kw in t_lower:
                    new_hot = 2
                    break
                    
        # If not matched, check tier 1
        if new_hot is None:
            for kw in tier_1_keywords:
                if kw in t_lower:
                    new_hot = 1
                    break

        if new_hot is not None and new_hot != e['hot_level']:
            updates.append((e['id'], e['title'], e['skill'], e['hot_level'], new_hot))

    print(f"\nFound {len(updates)} exams to update hot_level on VPS!")
    for u in updates[:20]:
        print(f"  [{u[2]}] '{u[1]}': {u[3]}⭐ -> {u[4]}⭐")

    # Generate SQL batch update
    sql_statements = []
    for uid, title, skill, old_h, new_h in updates:
        sql_statements.append(f"UPDATE \"Exam\" SET hot_level = {new_h} WHERE id = '{uid}';")

    if sql_statements:
        print(f"\nApplying {len(sql_statements)} updates to VPS Postgres...")
        batch_sql = " ".join(sql_statements)
        # Write to temp file on VPS and execute
        sftp = ssh.open_sftp()
        with sftp.file('/tmp/update_hot_levels.sql', 'w') as f:
            f.write(batch_sql)
        sftp.close()

        exec_cmd = f"docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db < /tmp/update_hot_levels.sql"
        stdin_ex, stdout_ex, stderr_ex = ssh.exec_command(exec_cmd)
        res_out = stdout_ex.read().decode('utf-8', errors='replace')
        res_err = stderr_ex.read().decode('utf-8', errors='replace')
        print("Batch update result:", res_out.count("UPDATE"), "records updated.")
        if res_err:
            print("Errors (if any):", res_err)

    # Verify updated stats
    sql_check = """SELECT hot_level, count(*) FROM "Exam" GROUP BY hot_level ORDER BY hot_level;"""
    cmd_chk = f"docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F '|||' -c '{sql_check}'"
    stdin_c, stdout_c, stderr_c = ssh.exec_command(cmd_chk)
    out_c = stdout_c.read().decode('utf-8', errors='replace')
    print("\n=== NEW HOT LEVEL DISTRIBUTION ON VPS ===")
    for row in out_c.strip().split('\n'):
        if row.strip():
            lvl, cnt = row.split('|||')
            print(f"  hot_level {lvl}⭐: {cnt} đề")

    ssh.close()

if __name__ == '__main__':
    execute_migration()
