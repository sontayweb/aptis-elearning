import sys
import paramiko

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

def run_sql(sql):
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/update_hot_levels.sql', 'w') as f:
        f.write(sql)
    sftp.close()
    cmd = 'docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" < /tmp/update_hot_levels.sql'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if err and "ERROR" in err:
        print("SQL ERROR:", err)
    return out

# Define topic keywords and their clover/hot_level
tier_5 = [
    # Part 2
    "film", "singer", "the famous singer", "a famous singer", "new coffee shop", "my visit to a new coffee shop",
    "busy coffee", "busy coffee shop", "end of term project",
    # Part 3 / 4 Opinion
    "childhood", "music festival", "games from childhood", "technology in childhood",
    # Part 4 / 5 Long
    "mountain", "four-day week", "women mathematicians", "woman mathematics", "mountain summits"
]

tier_4 = [
    # Part 2
    "the first american woman in space", "weekend activities", "movies then and now",
    "the history of transportation",
    # Part 3 / 4 Opinion
    "extreme sports"
]

tier_3 = [
    # Part 2
    "family sport day", "family sports day", "mae - the math girl", "cultural festival",
    "college welcoming day",
    # Part 3 / 4 Opinion
    "childhood memories", "free time activity", "job and trainning", "job and training",
    "volunteering", "career"
]

tier_2 = [
    # Part 2
    "public transportations", "writing about a place", "music show at the park"
]

# Fetch all reading exams
sql_get = """SELECT id, title, hot_level, is_published FROM "Exam" WHERE skill = 'READING';"""
rows = run_sql(sql_get)

updates = []
publish_ids = []

for line in rows.strip().split('\n'):
    if not line.strip(): continue
    parts = line.split('|||')
    if len(parts) >= 4:
        eid, title, current_hot, is_pub = parts[0], parts[1], int(parts[2] or 0), parts[3] == 't'
        t_low = title.lower()

        target_hot = None
        for kw in tier_5:
            if kw in t_low:
                target_hot = 5
                break
        if target_hot is None:
            for kw in tier_4:
                if kw in t_low:
                    target_hot = 4
                    break
        if target_hot is None:
            for kw in tier_3:
                if kw in t_low:
                    target_hot = 3
                    break
        if target_hot is None:
            for kw in tier_2:
                if kw in t_low:
                    target_hot = 2
                    break

        if target_hot is not None and target_hot != current_hot:
            updates.append((eid, title, current_hot, target_hot))

        # If matched or Part 1/Part 2 key, publish it
        if target_hot is not None and not is_pub:
            publish_ids.append(eid)
        elif ('part 1' in t_low or 'part1' in t_low or 'part 2' in t_low or 'part2' in t_low) and not is_pub:
            publish_ids.append(eid)

print(f"Total hot_level updates: {len(updates)}")
for u in updates[:20]:
    print(f"  '{u[1]}': {u[2]} -> {u[3]} ☘️")

print(f"Total exams to publish: {len(publish_ids)}")

# Prepare SQL statements
sql_stmts = []
for eid, title, old_h, new_h in updates:
    sql_stmts.append(f"UPDATE \"Exam\" SET hot_level = {new_h} WHERE id = '{eid}';")

for pid in publish_ids:
    sql_stmts.append(f"UPDATE \"Exam\" SET is_published = true WHERE id = '{pid}';")

# Also ensure any exam with hot_level > 0 is published
sql_stmts.append("""UPDATE "Exam" SET is_published = true WHERE skill = 'READING' AND hot_level > 0;""")

if sql_stmts:
    full_sql = "\n".join(sql_stmts)
    print("\nExecuting SQL batch update on VPS...")
    run_sql(full_sql)
    print("Execution completed.")

# Check final distribution
sql_dist = """SELECT hot_level, is_published, count(*) FROM "Exam" WHERE skill = 'READING' GROUP BY hot_level, is_published ORDER BY hot_level DESC, is_published;"""
print("\nFinal Hot Level & Publish Distribution for READING:")
print(run_sql(sql_dist))

ssh.close()
