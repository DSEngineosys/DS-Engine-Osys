import os

def fix_ts_any():
    files = [
        'frontend/src/pages/hr/register.tsx',
        'frontend/src/pages/employee/register.tsx',
        'frontend/src/pages/employee/login.tsx'
    ]
    
    for p in files:
        if not os.path.exists(p):
            continue
            
        with open(p, 'r', encoding='utf-8') as f:
            content = f.read()
            
        content = content.replace('availableSubDepts.map((sd) => (', 'availableSubDepts.map((sd: any) => (')
        
        with open(p, 'w', encoding='utf-8') as f:
            f.write(content)

fix_ts_any()
print("Fixed TS any!")
