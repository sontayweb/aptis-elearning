import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

for folder in ['exams', 'exams_center_b']:
    p1_path = f'tools/data/aptisacademy/bo_de_key/{folder}/reading-part1.json'
    p2_path = f'tools/data/aptisacademy/bo_de_key/{folder}/reading-part2.json'
    
    with open(p1_path, 'r', encoding='utf-8') as f:
        d1 = json.load(f)
    with open(p2_path, 'r', encoding='utf-8') as f:
        d2 = json.load(f)
        
    print(f"\n==================== {folder} ====================")
    print(f"Reading Part 1: type={type(d1).__name__} len={len(d1)}")
    if isinstance(d1, list) and len(d1) > 0:
        print("  Sample P1 item keys:", d1[0].keys())
        for i, it in enumerate(d1[:5]):
            print(f"    [{i}] title: {it.get('title')} | id: {it.get('id') or it.get('_id')}")
            
    print(f"Reading Part 2: type={type(d2).__name__} len={len(d2)}")
    if isinstance(d2, list) and len(d2) > 0:
        print("  Sample P2 item keys:", d2[0].keys())
        for i, it in enumerate(d2[:5]):
            print(f"    [{i}] title: {it.get('title')} | id: {it.get('id') or it.get('_id')}")
