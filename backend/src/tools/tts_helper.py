import sys
import asyncio
import edge_tts

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

    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)
    print("SUCCESS")

if __name__ == "__main__":
    asyncio.run(main())
