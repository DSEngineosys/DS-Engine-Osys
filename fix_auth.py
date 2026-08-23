import os

p = 'backend/src/routes/auth.ts'
with open(p, 'r') as f: text = f.read()

# Fix /auth/me
text = text.replace(
    '  const user = await Admin.findById(session.userId);',
    '''  let user = await DSEngineer.findById(session.userId);
  if (!user) user = await HR.findById(session.userId);
  if (!user) user = await Admin.findById(session.userId);'''
)

# Fix /auth/avatar
text = text.replace(
    '''  const updated = await Admin.findByIdAndUpdate(
    session.userId,
    { avatarUrl: parsed.data.avatarUrl },
    { new: true }
  );''',
    '''  let updated = await DSEngineer.findByIdAndUpdate(session.userId, { avatarUrl: parsed.data.avatarUrl }, { new: true });
  if (!updated) updated = await HR.findByIdAndUpdate(session.userId, { avatarUrl: parsed.data.avatarUrl }, { new: true });
  if (!updated) updated = await Admin.findByIdAndUpdate(session.userId, { avatarUrl: parsed.data.avatarUrl }, { new: true });'''
)

# Fix /auth/profile
text = text.replace(
    '''  const updated = await Admin.findByIdAndUpdate(
    session.userId,
    { name: parsed.data.name, mobile: parsed.data.mobile },
    { new: true }
  );''',
    '''  let updated = await DSEngineer.findByIdAndUpdate(session.userId, { name: parsed.data.name, mobile: parsed.data.mobile }, { new: true });
  if (!updated) updated = await HR.findByIdAndUpdate(session.userId, { name: parsed.data.name, mobile: parsed.data.mobile }, { new: true });
  if (!updated) updated = await Admin.findByIdAndUpdate(session.userId, { name: parsed.data.name, mobile: parsed.data.mobile }, { new: true });'''
)

with open(p, 'w') as f: f.write(text)

print("auth.ts patched!")
