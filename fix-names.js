const fs = require('fs');
let content = fs.readFileSync('apps/storefront/app/checkout/page.tsx', 'utf8');

content = content.replace(/Identit.Form/g, 'IdentityForm')
                 .replace(/setIdentit./g, 'setIdentity')
                 .replace(/validateIdentit./g, 'validateIdentity')
                 .replace(/identit./g, 'identite')
                 .replace(/Identit./g, 'Identité')
                 .replace(/S.curis./g, 'Sécurisé')
                 .replace(/Yaound./g, 'Yaoundé')
                 .replace(/Ed.a/g, 'Edéa')
                 .replace(/Ngaound.r./g, 'Ngaoundéré')
                 .replace(/m.thode/g, 'méthode')
                 .replace(/s.lectionner/g, 'sélectionner')
                 .replace(/d.tails/g, 'détails')
                 .replace(/cr.er/g, 'créer');

fs.writeFileSync('apps/storefront/app/checkout/page.tsx', content, 'utf8');

