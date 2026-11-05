import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://upload.wikimedia.org/wikipedia/commons/0/00/Amazon_Kindle_3.JPG"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
res = urllib.request.urlopen(req, context=ctx, timeout=10)
with open("test_kindle_real.jpg", "wb") as f:
    f.write(res.read())
print("Downloaded test_kindle_real.jpg!")
