from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017/")
db = client["ds-engine-osys"]

print("Employees:")
for emp in db["employees"].find({}):
    print(emp)
