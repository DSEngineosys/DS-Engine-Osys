/* global use, db */
// MongoDB Playground
// Use this to quickly create your database and collections in Compass.

const database = 'ds-engine-osys';
use(database);

// 1. Create Collections with initial data
db.getCollection('users').insertMany([
  {
    "name": "System Admin",
    "email": "admin@admin.com",
    "password": "admin",
    "role": "admin",
    "status": "approved",
    "createdAt": new Date(),
    "updatedAt": new Date()
  }
]);

db.getCollection('departments').insertMany([
  { "name": "Information Technology", "description": "Handles all software and hardware infrastructure", "createdAt": new Date(), "updatedAt": new Date() },
  { "name": "Human Resources", "description": "People operations and recruitment", "createdAt": new Date(), "updatedAt": new Date() },
  { "name": "Sales & Marketing", "description": "Driving growth and customer acquisition", "createdAt": new Date(), "updatedAt": new Date() }
]);

db.getCollection('products').insertMany([
  {
    "name": "Enterprise Cloud Suite",
    "category": "Software",
    "sku": "ECS-001",
    "price": 1200,
    "cost": 400,
    "stock": 50,
    "soldUnits": 120,
    "revenue": 144000,
    "marketStatus": "high_demand",
    "createdAt": new Date(),
    "updatedAt": new Date()
  },
  {
    "name": "AI Analytics Pro",
    "category": "Software",
    "sku": "AAP-002",
    "price": 800,
    "cost": 200,
    "stock": 100,
    "soldUnits": 45,
    "revenue": 36000,
    "marketStatus": "moderate",
    "createdAt": new Date(),
    "updatedAt": new Date()
  }
]);

// 2. Create Indexes (Optional but recommended)
db.getCollection('users').createIndex({ "email": 1 }, { unique: true });
db.getCollection('employees').createIndex({ "email": 1 }, { unique: true });
db.getCollection('employees').createIndex({ "employeeId": 1 }, { unique: true });
db.getCollection('products').createIndex({ "sku": 1 }, { unique: true });

console.log(`Database ${database} initialized with collections: users, departments, products.`);
