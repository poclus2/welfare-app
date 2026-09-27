const fs = require('fs');
let c = fs.readFileSync('apps/storefront/app/checkout/page.tsx', 'utf8');

// The file was likely saved as UTF-16 by Powershell.
if (c.charCodeAt(0) === 0xFEFF || c.charCodeAt(1) === 0) {
    c = fs.readFileSync('apps/storefront/app/checkout/page.tsx', 'utf16le');
}

c = c.replace(/IdentityForm/g, 'IdentityForm')
     .replace(/Identity/g, 'Identity')
     .replace(/IdentitǸ/g, 'Identité')
     .replace(/Identit.y/g, 'Identity')
     .replace(/Identit/g, 'Identité')
     .replace(/Identit%/g, 'IDENTITÉ')
     .replace(/YaoundǸ/g, 'Yaoundé')
     .replace(/SǸcurisǸ/g, 'Sécurisé')
     .replace(/NgaoundǸrǸ/g, 'Ngaoundéré')
     .replace(/EdǸa/g, 'Edéa')
     .replace(/dǸtails/g, 'détails')
     .replace(/sǸlectionner/g, 'sélectionner')
     .replace(/mǸthode/g, 'méthode')
     .replace(/initialisǸ/g, 'initialisé')
     .replace(/entrǸe/g, 'entrée')
     .replace(/latǸrale/g, 'latérale');

fs.writeFileSync('apps/storefront/app/checkout/page.tsx', c, 'utf8');
