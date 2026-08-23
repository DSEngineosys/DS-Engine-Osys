from pymongo import MongoClient

client = MongoClient("mongodb://127.0.0.1:27017/")
db = client["ds-engineosys"]

print("Collections:", db.list_collection_names())
