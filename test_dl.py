import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&q=80"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
res = urllib.request.urlopen(req, context=ctx, timeout=10)
with open("test_ebook.jpg", "wb") as f:
    f.write(res.read())
print("Downloaded test_ebook.jpg")
