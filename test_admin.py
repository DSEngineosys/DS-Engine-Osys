import urllib.request
import json
import urllib.error

url = "http://localhost:3000/api/auth/login"
data = json.dumps({"email": "admin@admin.com", "password": "admin"}).encode("utf-8")
headers = {"Content-Type": "application/json"}

req = urllib.request.Request(url, data=data, headers=headers, method="POST")

try:
    with urllib.request.urlopen(req) as response:
        print("Admin Status:", response.status)
        print("Body:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("Admin Status:", e.code)
    print("Body:", e.read().decode('utf-8'))
