import sys
import json
sys.stdout.reconfigure(encoding='utf-8')

with open('backend/scripts/p2_topics_out.txt', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

lines = text.split('\n')
for line in lines:
    parts = [p.strip() for p in line.split('|')]
    if len(parts) >= 7 and len(parts[0]) == 36:
        eid, title, ptitle, qid, prompt, opts, ans = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6]
        if 'Text Cohesion' in ptitle or 'Part 2' in ptitle or 'Part 2' in title or 'Cohesion' in title:
            print(f"\n=== {title} (Part: {ptitle}) ===")
            print(f"  QID: {qid} | Prompt: {prompt}")
            print(f"  Correct Answer: {ans}")
            try:
                parsed_opts = json.loads(opts)
                if isinstance(parsed_opts, list):
                    print(f"  Options ({len(parsed_opts)} items):")
                    for idx, s in enumerate(parsed_opts):
                        print(f"    [{idx}]: {s}")
                elif isinstance(parsed_opts, dict):
                    print(f"  Options (Dict): {list(parsed_opts.keys())}")
            except Exception as e:
                print(f"  Raw opts: {opts[:100]}...")
