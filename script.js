const fs = require('fs');
let content = fs.readFileSync('apps/storefront/app/checkout/page.tsx', 'utf8');

content = content.replace(/https:\/\/admin\.thewelfare\.store\/store\/delivery/g, 'https://api.thewelfare.store/store/delivery');

fs.writeFileSync('apps/storefront/app/checkout/page.tsx', content);

