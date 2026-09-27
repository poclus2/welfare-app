const fs = require('fs');
let c = fs.readFileSync('apps/storefront/app/checkout/page.tsx', 'utf8');

c = c.replace('  const [identity, setIdentit?y] = useState<Identit?yForm>({\r\n  const [identity, setIdentit?y] = useState<IdentityForm>({\r\n', '  const [identity, setIdentit?y] = useState<Identit?yForm>({\r\n');
c = c.replace('  const [identity, setIdentit?y] = useState<Identit?yForm>({\n  const [identity, setIdentit?y] = useState<IdentityForm>({\n', '  const [identity, setIdentit?y] = useState<Identit?yForm>({\n');

fs.writeFileSync('apps/storefront/app/checkout/page.tsx', c, 'utf8');

