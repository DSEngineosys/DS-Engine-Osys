import fetch from "node-fetch";

async function testLogin() {
  const res = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "hr@admin.com", password: "GENHR@100" })
  });
  console.log("HR Login:", res.status, await res.text());
}
testLogin();
