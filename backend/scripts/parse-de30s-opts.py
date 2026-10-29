import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('backend/scripts/de30s_options.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Match rows
rows = text.split('\n')
for r in rows:
    parts = r.split('|')
    if len(parts) >= 4:
        exam_id = parts[0].strip()
        title = parts[1].strip()
        if 'Đề 3' in title and 'Part 2' in title or 'Family' in title or 'Making' in title or 'End' in title or 'Wellness' in title:
            q_id = parts[2].strip()
            opts_str = parts[3].strip()
            print(f"\n==================== {title} (q_id={q_id}) ====================")
            try:
                opts = json.loads(opts_str)
                if isinstance(opts, list):
                    for i, item in enumerate(opts):
                        print(f"  [{i}] {item}")
                elif isinstance(opts, dict):
                    print("Dict keys:", opts.keys())
                    print("sentences:", len(opts.get('sentences', [])))
                    for s in opts.get('sentences', []):
                        print(f"    - {s}")
            except Exception as e:
                print(f"Error parsing json: {e}")
