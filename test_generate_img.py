import urllib.request
import ssl
import os

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Test generating a clean photo for Aptis Speaking Part 2: "A vibrant amusement park with roller coasters and families having fun"
prompt = "authentic photo, Aptis exam picture, children and families having fun in a colorful amusement park with roller coasters and ferris wheel in the background, daytime, realistic lighting, high resolution, candid photography"
url = f"https://image.pollinations.ai/prompt/{urllib.parse.quote(prompt)}?width=768&height=512&model=flux&nologo=true"

print("Fetching test image from Pollinations Flux...")
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
res = urllib.request.urlopen(req, context=ctx, timeout=30)
data = res.read()
print(f"Downloaded image size: {len(data)} bytes, Content-Type: {res.headers.get('content-type')}")

os.makedirs("scratch_images", exist_ok=True)
test_path = "scratch_images/amusement_park_test.jpg"
with open(test_path, "wb") as f:
    f.write(data)

print(f"Saved to {test_path}!")

