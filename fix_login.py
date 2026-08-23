import os

p = 'backend/src/routes/auth.ts'
if not os.path.exists(p):
    print("Not found")
    exit()

with open(p, 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = """  // If not found, check Employee collection
  user = await Employee.findOne({ email });
  if (!user) {
    user = await DSEngineer.findOne({ email });
  }
  if (!user) {
    user = await HR.findOne({ email });
  }
  if (!user) {
    user = await Admin.findOne({ email });
  }
  isEmployee = !!(await Employee.findOne({ email }));"""

new_logic = """  // If not found, check Employee collection
  user = await Employee.findOne({ $or: [{ email }, { employeeId: email }] });
  if (user) {
    isEmployee = true;
  } else {
    user = await DSEngineer.findOne({ email });
    if (!user) {
      user = await HR.findOne({ $or: [{ email }, { hrId: email }] });
    }
    if (!user) {
      user = await Admin.findOne({ email });
    }
  }"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed login logic!")
else:
    print("Old logic not found! Please check file manually.")

