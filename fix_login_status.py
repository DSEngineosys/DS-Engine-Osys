import os

p = 'backend/src/routes/auth.ts'
with open(p, 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = """  if (!user || !user.password || user.password !== password) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
    return;
  }

  if (!isEmployee) {
    if (user.status === "pending") {
      res.status(403).json({ error: "Pending", message: "Your account is awaiting Admin approval." });
      return;
    }
    if (user.status === "denied") {
      res.status(403).json({ error: "Denied", message: "Admin has denied your access to the platform." });
      return;
    }
  } else {
    // Check employee account status
    if ((user as any).accountStatus === "Inactive") {
      res.status(403).json({ error: "Inactive", message: "Your account is inactive." });
      return;
    }
  }"""

new_logic = """  if (!user) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
    return;
  }

  if (!isEmployee) {
    if (user.status === "pending") {
      res.status(403).json({ error: "Pending", message: "Your account is awaiting Admin approval." });
      return;
    }
    if (user.status === "denied") {
      res.status(403).json({ error: "Denied", message: "Admin has denied your access to the platform." });
      return;
    }
  } else {
    // Check employee account status
    if ((user as any).accountStatus === "Inactive") {
      res.status(403).json({ error: "Inactive", message: "Your account is inactive." });
      return;
    }
  }

  if (!user.password || user.password !== password) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
    return;
  }"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Login status order fixed!")
else:
    print("Old logic not found! Please check file manually.")
