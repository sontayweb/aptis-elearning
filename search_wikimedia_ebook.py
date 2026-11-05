import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Let's search Unsplash source or Wikimedia Commons for "reading kindle" or "ereader"
url = "https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=reading%20ebook%20kindle&gsrlimit=5&prop=imageinfo&iiprop=url"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
res = urllib.request.urlopen(req, context=ctx, timeout=10)
data = json.loads(res.read().decode('utf-8'))

for page_id, page in data.get('query', {}).get('pages', {}).items():
    title = page.get('title')
    img_url = page.get('imageinfo', [{}])[0].get('url')
    print("Found Wikimedia:", title, "->", img_url)
