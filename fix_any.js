const fs = require('fs');

function fixAny(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/availableSubDepts\.map\(\(sd\)/g, 'availableSubDepts.map((sd: any)');
  fs.writeFileSync(file, content);
}

fixAny('frontend/src/pages/employee/register.tsx');
fixAny('frontend/src/pages/hr/register.tsx');
console.log('Fixed implicitly any!');
