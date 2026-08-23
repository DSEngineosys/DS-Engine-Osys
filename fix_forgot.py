import os

p = 'backend/src/routes/auth.ts'
with open(p, 'r', encoding='utf-8') as f:
    content = f.read()

# I will inject a helper function `findUserForAuth`
helper = """
async function findUserForAuth(input: string) {
  let user = await Employee.findOne({ $or: [{ email: input.toLowerCase() }, { employeeId: input }] });
  if (user) return { user, model: Employee, isEmployee: true };
  
  user = await DSEngineer.findOne({ email: input.toLowerCase() });
  if (user) return { user, model: DSEngineer, isEmployee: false };
  
  user = await HR.findOne({ $or: [{ email: input.toLowerCase() }, { hrId: input }] });
  if (user) return { user, model: HR, isEmployee: false };
  
  user = await Admin.findOne({ email: input.toLowerCase() });
  if (user) return { user, model: Admin, isEmployee: false };
  
  return null;
}
"""

if "async function findUserForAuth" not in content:
    content = content.replace("function formatUser", helper + "\nfunction formatUser")

# Now update request-otp
old_request = """  const user = await Admin.findOne({
    $or: [{ email: input.toLowerCase() }, { hrId: input }, { mobile: input }, { mobile: { $regex: input } }],
  });"""
new_request = """  const found = await findUserForAuth(input);
  if (!found) {
    res.status(404).json({
      error: "User not found",
      message: "No registered account found with provided email or ID.",
    });
    return;
  }
  const { user } = found;"""
content = content.replace(old_request, new_request)

# Remove the next `if (!user)` block since we handled it
old_if_not_user = """  if (!user) {
    res.status(404).json({
      error: "User not found",
      message: "No registered DS Engineer found with provided email or mobile number.",
    });
    return;
  }"""
content = content.replace(old_if_not_user, "")

# Update verify-otp
old_verify = """  const user = await Admin.findOne({ email });"""
new_verify = """  const found = await findUserForAuth(email);
  const user = found?.user;"""
content = content.replace(old_verify, new_verify)

# Update reset-password
old_reset = """  const user = await Admin.findOne({ email });"""
content = content.replace(old_reset, new_verify)

with open(p, 'w', encoding='utf-8') as f:
    f.write(content)
print("Auth forgot-password logic fixed!")
