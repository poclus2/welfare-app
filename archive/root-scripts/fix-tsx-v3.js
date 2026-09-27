const fs = require('fs');
let c = fs.readFileSync('apps/storefront/app/checkout/page.tsx', 'utf8');

c = c.replace(/Identit..yForm/g, 'IdentityForm')
     .replace(/Identit.yForm/g, 'IdentityForm')
     .replace(/setIdentit..y/g, 'setIdentity')
     .replace(/setIdentit.y/g, 'setIdentity')
     .replace(/validateIdentit..y/g, 'validateIdentity')
     .replace(/validateIdentit.y/g, 'validateIdentity')
     .replace(/Identit..y/g, 'Identity')
     .replace(/Identit.y/g, 'Identity');

fs.writeFileSync('apps/storefront/app/checkout/page.tsx', c, 'utf8');

