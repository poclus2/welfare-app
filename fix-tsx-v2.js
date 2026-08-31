const fs = require('fs');
let c = fs.readFileSync('apps/storefront/app/checkout/page.tsx', 'utf8');

const lines = c.split('\n');
const newLines = [];
let skipNext = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const [identity, setIdentit') && lines[i].includes('useState<IdentityForm>({')) {
    continue; // Skip the duplicated one
  }
  newLines.push(lines[i]);
}

fs.writeFileSync('apps/storefront/app/checkout/page.tsx', newLines.join('\n'), 'utf8');

