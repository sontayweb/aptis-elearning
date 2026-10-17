import sys
import os
import re
import asyncio
import edge_tts

async def run_single_tts(text, voice, output_path):
    for attempt in range(3):
        try:
            communicate = edge_tts.Communicate(text, voice)
            await asyncio.wait_for(communicate.save(output_path), timeout=30.0)
            return True
        except Exception as e:
            if attempt == 2:
                raise e
            await asyncio.sleep(1.0)
    return False

async def run_dialogue_tts(dialogue_lines, output_path):
    all_chunks = bytearray()
    for speaker, content in dialogue_lines:
        if not content.strip():
            continue
        is_female = speaker.upper() in ["WOMAN", "FEMALE", "GIRL", "W"] or "FEMALE" in speaker.upper()
        voice = "en-GB-SoniaNeural" if is_female else "en-GB-RyanNeural"
        
        for attempt in range(3):
            try:
                comm = edge_tts.Communicate(content.strip(), voice)
                async for chunk in comm.stream():
                    if chunk["type"] == "audio":
                        all_chunks.extend(chunk["data"])
                break
            except Exception as e:
                if attempt == 2:
                    raise e
                await asyncio.sleep(1.0)

    with open(output_path, "wb") as f:
        f.write(all_chunks)
    return True

async def main():
    if len(sys.argv) < 3:
        print("Usage: python tts_helper.py <text_file_path> <output_mp3_path> [voice]")
        sys.exit(1)

    text_file_path = sys.argv[1]
    output_path = sys.argv[2]
    default_voice = sys.argv[3] if len(sys.argv) > 3 else "en-GB-RyanNeural"

    with open(text_file_path, "r", encoding="utf-8") as f:
        raw_text = f.read().strip()

    if not raw_text:
        sys.exit(0)

    # Check if text is a dialogue (contains Man: / Woman:)
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    dialogue_pairs = []
    has_dialogue = False

    for line in lines:
        m = re.match(r'^(Man|Woman|Narrator|Male|Female|Person 1|Person 2)\s*[:\-]\s*(.+)$', line, re.IGNORECASE)
        if m:
            has_dialogue = True
            speaker = m.group(1).strip()
            content = m.group(2).strip()
            dialogue_pairs.append((speaker, content))
        elif dialogue_pairs:
            # Continuation of previous speaker's line
            prev_spk, prev_content = dialogue_pairs[-1]
            dialogue_pairs[-1] = (prev_spk, f"{prev_content} {line}")
        else:
            dialogue_pairs.append(("NARRATOR", line))

    try:
        if has_dialogue and any(s.upper() == "WOMAN" for s, _ in dialogue_pairs):
            await run_dialogue_tts(dialogue_pairs, output_path)
        else:
            await run_single_tts(raw_text, default_voice, output_path)
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
