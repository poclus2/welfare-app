const fs = require('fs'); const path = require('path');
function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('route.ts')) {
      let c = fs.readFileSync(p, 'utf8');
      c = c.replace(/req\.scope\.resolve\("welfare_delivery"\)/g, 'req.scope.resolve<any>("welfare_delivery")');
      c = c.replace(/req\.scope\.resolve\("welfare_delivery_provider"\)/g, 'req.scope.resolve<any>("welfare_delivery_provider")');
      fs.writeFileSync(p, c, 'utf8');
    }
  }
}
walk('apps/api/src/api/admin/delivery');
walk('apps/api/src/api/store/delivery');
