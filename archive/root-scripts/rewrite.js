const fs = require('fs');
let c = fs.readFileSync('apps/storefront/app/checkout/page.tsx', 'utf8');

c = c.replace(/Identit/g, 'Identité');
c = c.replace(/Identit?/g, 'Identité');
c = c.replace(/Yaound?/g, 'Yaoundé');
c = c.replace(/S?curis?/g, 'Sécurisé');
c = c.replace(/Ngaound?r?/g, 'Ngaoundéré');
c = c.replace(/Ed?a/g, 'Edéa');
c = c.replace(/d?tails/g, 'détails');
c = c.replace(/s?lectionner/g, 'sélectionner');
c = c.replace(/m?thode/g, 'méthode');
c = c.replace(/initialis?/g, 'initialisé');
c = c.replace(/entr?e/g, 'entrée');
c = c.replace(/lat?rale/g, 'latérale');
c = c.replace(/ /g, 'à ');

fs.writeFileSync('apps/storefront/app/checkout/page.tsx', c, 'utf8');

