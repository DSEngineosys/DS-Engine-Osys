import os

p = 'backend/src/routes/auth.ts'
with open(p, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the typescript error by typing user as any
old_return_1 = "if (user) return { user, model: Employee, isEmployee: true };"
new_return_1 = "if (user) return { user: user as any, model: Employee, isEmployee: true };"

old_return_2 = "if (user) return { user, model: DSEngineer, isEmployee: false };"
new_return_2 = "if (user) return { user: user as any, model: DSEngineer, isEmployee: false };"

old_return_3 = "if (user) return { user, model: HR, isEmployee: false };"
new_return_3 = "if (user) return { user: user as any, model: HR, isEmployee: false };"

old_return_4 = "if (user) return { user, model: Admin, isEmployee: false };"
new_return_4 = "if (user) return { user: user as any, model: Admin, isEmployee: false };"

content = content.replace(old_return_1, new_return_1)
content = content.replace(old_return_2, new_return_2)
content = content.replace(old_return_3, new_return_3)
content = content.replace(old_return_4, new_return_4)

with open(p, 'w', encoding='utf-8') as f:
    f.write(content)

print("TS any applied")
