import os

def fix_db():
    p = 'backend/src/lib/db.ts'
    with open(p, 'r') as f: text = f.read()
    text = text.replace('User.countDocuments', 'Admin.countDocuments')
    with open(p, 'w') as f: f.write(text)

def fix_emp_reg():
    p = 'backend/src/routes/employee-registration.ts'
    with open(p, 'r') as f: text = f.read()
    text = text.replace('subDepartment:', 'subDepartmentId:')
    text = text.replace('subDepartment =', 'subDepartmentId =')
    text = text.replace('{ subDepartment }', '{ subDepartmentId }')
    text = text.replace('subDepartment}', 'subDepartmentId}')
    text = text.replace('subDepartmentIdId', 'subDepartmentId')
    with open(p, 'w') as f: f.write(text)

def fix_emp_workspace():
    p = 'backend/src/routes/employee-workspace.ts'
    with open(p, 'r') as f: text = f.read()
    text = text.replace('subDepartment:', 'subDepartmentId:')
    with open(p, 'w') as f: f.write(text)

def fix_hr_reg():
    p = 'backend/src/routes/hr-registration.ts'
    with open(p, 'r') as f: text = f.read()
    text = text.replace('subDepartment:', 'subDepartmentId:')
    with open(p, 'w') as f: f.write(text)

def fix_hr():
    p = 'backend/src/routes/hr.ts'
    with open(p, 'r') as f: text = f.read()
    text = text.replace('emp.subDepartmentId.toLowerCase()', '(emp.subDepartmentId?.toString() || "").toLowerCase()')
    with open(p, 'w') as f: f.write(text)

fix_db()
fix_emp_reg()
fix_emp_workspace()
fix_hr_reg()
fix_hr()
print("Fixed3!")
