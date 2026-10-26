import paramiko
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

def run_sql(sql):
    escaped_sql = sql.replace('"', '\\"')
    cmd = f'docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" -c "{escaped_sql}"'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    return out

topics_p2_p3 = [
    # 5 Cỏ:
    "Film", "singer", "famous singer", "new coffee shop", "My visit to a new coffee shop", "busy coffee", "End of term project",
    # 4 Cỏ:
    "The first American woman in Space", "Weekend activities", "Movies then and now", "The history of transportation",
    # 3 Cỏ:
    "Family Sport Day", "Family sports day", "Mae - The Math Girl", "Cultural festival", "College Welcoming Day",
    # 2 Cỏ:
    "Public Transportations", "Writing about a place", "Music show at the park"
]

print("=== CHECKING HOT_LEVEL IN VPS DB FOR READING PART 2+3 TOPICS ===")
for t in topics_p2_p3:
    res = run_sql(f"""
    SELECT e.id, e.title, e.hot_level, e.is_published, p.part_number, p.title
    FROM "Exam" e
    JOIN "ExamPart" p ON p.exam_id = e.id
    WHERE e.skill = 'READING' AND (e.title ILIKE '%{t}%' OR p.title ILIKE '%{t}%')
    LIMIT 2;
    """)
    if res:
        for l in res.split('\n'):
            print(f"[{t}] -> {l}")
    else:
        print(f"[{t}] -> NOT FOUND in DB!")

print("\n=== CHECKING HOT_LEVEL IN VPS DB FOR READING PART 4 TOPICS ===")
topics_p4 = [
    # 5 Cỏ
    "childhood", "Music festival - Version 3", "Games from childhood", "Music festival - Version 1",
    "Technology in childhood", "Music festival - Version 2", "Music festival - Version 4",
    # 4 Cỏ
    "Extreme sports",
    # 3 Cỏ
    "Childhood memories", "Free time activity", "Job and trainning", "Volunteering", "Career",
    # Part 4 Long reading (5 Cỏ)
    "Mountain", "The arrival of four-day week", "Women mathematicians", "Woman Mathematics", "Mountain Summits"
]

for t in topics_p4:
    res = run_sql(f"""
    SELECT e.id, e.title, e.hot_level, e.is_published
    FROM "Exam" e
    WHERE e.skill = 'READING' AND e.title ILIKE '%{t}%'
    LIMIT 2;
    """)
    if res:
        for l in res.split('\n'):
            print(f"[{t}] -> {l}")
    else:
        print(f"[{t}] -> NOT FOUND in DB!")

ssh.close()
