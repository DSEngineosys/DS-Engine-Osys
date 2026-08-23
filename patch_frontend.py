import os

def patch_frontend():
    files = [
        'frontend/src/pages/hr/register.tsx',
        'frontend/src/pages/employee/register.tsx',
        'frontend/src/pages/employee/login.tsx'
    ]
    
    for p in files:
        if not os.path.exists(p):
            print(f"Skipping {p}, not found")
            continue
            
        with open(p, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Replace the availableSubDepts line
        old_line = "const availableSubDepts = departments.filter((d) => d.parentId === departmentId);"
        old_line_emp = "const availableSubDepts = departments.filter((d) => d.parentId === department);"
        
        new_line = "const availableSubDepts = selectedDeptObj?.subDepartments || [];"
        
        content = content.replace(old_line, new_line)
        content = content.replace(old_line_emp, new_line)
        
        with open(p, 'w', encoding='utf-8') as f:
            f.write(content)

patch_frontend()
print("Frontend patched!")
