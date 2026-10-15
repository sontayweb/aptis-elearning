import sys
import asyncio
import edge_tts

async def run_with_timeout(text, voice, output_path):
    for attempt in range(3):
        try:
            communicate = edge_tts.Communicate(text, voice)
            await asyncio.wait_for(communicate.save(output_path), timeout=25.0)
            return True
        except Exception as e:
            if attempt == 2:
                raise e
            await asyncio.sleep(1.0)
    return False

async def main():
    if len(sys.argv) < 3:
        print("Usage: python tts_helper.py <text_file_path> <output_mp3_path> [voice]")
        sys.exit(1)

    text_file_path = sys.argv[1]
    output_path = sys.argv[2]
    voice = sys.argv[3] if len(sys.argv) > 3 else "en-GB-RyanNeural"

    with open(text_file_path, "r", encoding="utf-8") as f:
        text = f.read().strip()

    if not text:
        sys.exit(0)

    try:
        await run_with_timeout(text, voice, output_path)
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
