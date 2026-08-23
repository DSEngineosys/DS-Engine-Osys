import os
import re

def fix_db():
    p = 'backend/src/lib/db.ts'
    with open(p, 'r') as f: text = f.read()
    text = text.replace('User.countDocuments', 'Admin.countDocuments')
    text = text.replace('User.create', 'Admin.create')
    with open(p, 'w') as f: f.write(text)

def fix_auth():
    p = 'backend/src/routes/auth.ts'
    with open(p, 'r') as f: text = f.read()
    text = text.replace('User.findOne', 'Admin.findOne')
    text = text.replace('User.updateOne', 'Admin.updateOne')
    text = text.replace('User.findById', 'Admin.findById')
    # auth.ts line 266: property role doesn't exist on employee
    # change `user.role` to `(user as any).role`
    text = text.replace('user.role', '(user as any).role')
    text = text.replace('const targetUser = await User.', 'const targetUser = await Admin.')
    with open(p, 'w') as f: f.write(text)

def fix_emp_reg():
    p = 'backend/src/routes/employee-registration.ts'
    with open(p, 'r') as f: text = f.read()
    text = text.replace('User.findOne', 'Admin.findOne')
    text = text.replace('subDepartment,', 'subDepartmentId: subDepartment,')
    with open(p, 'w') as f: f.write(text)

def fix_emp_workspace():
    p = 'backend/src/routes/employee-workspace.ts'
    with open(p, 'r') as f: text = f.read()
    text = text.replace('subDepartment', 'subDepartmentId')
    with open(p, 'w') as f: f.write(text)

def fix_hr_reg():
    p = 'backend/src/routes/hr-registration.ts'
    with open(p, 'r') as f: text = f.read()
    text = text.replace('User.findOne', 'HR.findOne')
    text = text.replace('User.create', 'HR.create')
    text = text.replace('User.findById', 'HR.findById')
    text = text.replace('User.findByIdAndDelete', 'HR.findByIdAndDelete')
    with open(p, 'w') as f: f.write(text)

def fix_hr():
    p = 'backend/src/routes/hr.ts'
    with open(p, 'r') as f: text = f.read()
    text = text.replace('import User from "../models/user.model";', 'import HR from "../models/hr.model";')
    text = text.replace('emp.subDepartment', 'emp.subDepartmentId')
    text = text.replace('hrUser.subDepartment', 'hrUser.subDepartmentId')
    text = text.replace('const hrUser = await User.', 'const hrUser = await HR.')
    with open(p, 'w') as f: f.write(text)

fix_db()
fix_auth()
fix_emp_reg()
fix_emp_workspace()
fix_hr_reg()
fix_hr()
print("Fixed!")
