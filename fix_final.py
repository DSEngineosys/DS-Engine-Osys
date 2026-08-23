import os
import re

def fix_all():
    # db.ts
    with open('backend/src/lib/db.ts', 'r') as f: text = f.read()
    text = text.replace('User.', 'Admin.')
    with open('backend/src/lib/db.ts', 'w') as f: f.write(text)

    # employee-registration.ts
    with open('backend/src/routes/employee-registration.ts', 'r') as f: text = f.read()
    text = text.replace('subDepartment', 'subDepartmentId')
    text = text.replace('subDepartmentIdId', 'subDepartmentId')
    with open('backend/src/routes/employee-registration.ts', 'w') as f: f.write(text)

    # employee-workspace.ts
    with open('backend/src/routes/employee-workspace.ts', 'r') as f: text = f.read()
    text = text.replace('subDepartment?: string', 'subDepartmentId?: string')
    with open('backend/src/routes/employee-workspace.ts', 'w') as f: f.write(text)

    # hr-registration.ts
    with open('backend/src/routes/hr-registration.ts', 'r') as f: text = f.read()
    text = text.replace('subDepartment', 'subDepartmentId')
    text = text.replace('subDepartmentIdId', 'subDepartmentId')
    text = text.replace('HR.create', 'HR.create as any')
    with open('backend/src/routes/hr-registration.ts', 'w') as f: f.write(text)

    # hr.ts
    with open('backend/src/routes/hr.ts', 'r') as f: text = f.read()
    text = text.replace('.toLowerCase()', ' as any')
    with open('backend/src/routes/hr.ts', 'w') as f: f.write(text)

fix_all()
