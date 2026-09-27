const fs = require('fs');
let file = 'apps/storefront/app/checkout/page.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/Identit(.)|Identit../g, 'Identité')
                 .replace(/S(.)curis(.)|S..curis../g, 'Sécurisé')
                 .replace(/Yaound(.)|Yaound../g, 'Yaoundé')
                 .replace(/Ed(.)a|Ed..a/g, 'Edéa')
                 .replace(/Ngaound(.)r(.)|Ngaound..r../g, 'Ngaoundéré')
                 .replace(/m(.)thode/g, 'méthode')
                 .replace(/s(.)lectionner/g, 'sélectionner')
                 .replace(/Paiement (.) la livraison/g, 'Paiement à la livraison')
                 .replace(/Retrait en magasin/g, 'Retrait en magasin')
                 .replace(/d.tails/g, 'détails')
                 .replace(/cr.er/g, 'créer');
fs.writeFileSync(file, content, 'utf8');

