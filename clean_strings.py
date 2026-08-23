import os
import re

def clean_file(filepath):
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}, not found")
        return
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Replace instances of "DS Engineosys" in email subjects and bodies
    content = content.replace(' - DS Engineosys', '')
    content = content.replace('[DS Engineosys] ', '')
    content = content.replace('the DS Engineosys platform', 'our platform')
    content = content.replace('DS Engineosys account', 'account')
    
    # Specific to lib/email.ts
    content = content.replace('`"DS Engineosys" <${smtpUser}>`', '`"Company Portal" <${smtpUser}>`')
    
    # Specific to employee-workspace.ts
    content = content.replace('setting?.value || "DS Engineosys"', 'setting?.value || "Company Portal"')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

backend_files = [
    'backend/src/routes/auth.ts',
    'backend/src/routes/admin.ts',
    'backend/src/routes/hr.ts',
    'backend/src/routes/hr-registration.ts',
    'backend/src/routes/employee-registration.ts',
    'backend/src/routes/employee-workspace.ts',
    'backend/src/lib/email.ts',
    'backend/src/app.ts' # For the session secret
]

for file in backend_files:
    clean_file(file)

print("Strings cleaned!")
