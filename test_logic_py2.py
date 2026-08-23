from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017/")
db = client["ds-engine-osys"]

input_email = "zaidkhanadale@gmail.com"
password = "Zaid@123"

emp = db["employees"].find_one({"email": input_email.lower()})
ds = db["dsengineers"].find_one({"email": input_email.lower()})
hr = db["hrs"].find_one({"email": input_email.lower()})
ad = db["admins"].find_one({"email": input_email.lower()})

print("Employee:", emp is not None)
print("DSEngineer:", ds is not None)
print("HR:", hr is not None)
print("Admin:", ad is not None)

if ds:
    print("DS Eng pass:", ds.get("password"))
if hr:
    print("HR pass:", hr.get("password"))

