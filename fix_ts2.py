import os
import re

def fix_db():
    p = 'backend/src/lib/db.ts'
    with open(p, 'r') as f: text = f.read()
    text = text.replace('User.deleteMany', 'Admin.deleteMany')
    with open(p, 'w') as f: f.write(text)

def fix_emp_reg():
    p = 'backend/src/routes/employee-registration.ts'
    with open(p, 'r') as f: text = f.read()
    text = text.replace('subDepartment: z.string().optional(),', 'subDepartmentId: z.string().optional(),')
    text = text.replace('subDepartment,', 'subDepartmentId,')
    text = text.replace('subDepartmentIdId', 'subDepartmentId')
    with open(p, 'w') as f: f.write(text)

def fix_emp_activity():
    p = 'backend/src/models/employee-activity.model.ts'
    with open(p, 'r') as f: text = f.read()
    text = text.replace('subDepartment?: string;', 'subDepartmentId?: mongoose.Types.ObjectId;')
    text = text.replace('subDepartment: { type: String },', 'subDepartmentId: { type: Schema.Types.ObjectId, ref: "SubDepartment" },')
    text = text.replace('import mongoose, { Schema', 'import mongoose, { Schema')
    with open(p, 'w') as f: f.write(text)

def fix_emp_workspace():
    p = 'backend/src/routes/employee-workspace.ts'
    with open(p, 'r') as f: text = f.read()
    text = text.replace('subDepartmentIdId', 'subDepartmentId')
    with open(p, 'w') as f: f.write(text)

def fix_hr_reg():
    p = 'backend/src/routes/hr-registration.ts'
    with open(p, 'r') as f: text = f.read()
    text = text.replace('import Admin from "../models/admin.model";', 'import Admin from "../models/admin.model";\nimport HR from "../models/hr.model";')
    with open(p, 'w') as f: f.write(text)

def fix_hr():
    p = 'backend/src/routes/hr.ts'
    with open(p, 'r') as f: text = f.read()
    text = text.replace('subDepartmentIdId', 'subDepartmentId')
    text = text.replace('.subDepartmentId.toLowerCase()', '.subDepartmentId.toString().toLowerCase()')
    with open(p, 'w') as f: f.write(text)

fix_db()
fix_emp_reg()
fix_emp_activity()
fix_emp_workspace()
fix_hr_reg()
fix_hr()
print("Fixed2!")
