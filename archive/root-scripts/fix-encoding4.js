const fs = require('fs');
const files = [
  'apps/admin/app/dashboard/delivery/DeliverySettingsClient.tsx',
  'apps/admin/components/DeliveryAnalytics.tsx'
];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/Param(.)tres|Param..tres/g, 'Paramètres')
                   .replace(/Avanc(.)s|Avanc..s/g, 'Avancés')
                   .replace(/G(.)rez|G..rez/g, 'Gérez')
                   .replace(/G(.)n(.)ral|G..n..ral/g, 'Général')
                   .replace(/R(.)gles|R..gles/g, 'Règles')
                   .replace(/r(.)gles|r..gles/g, 'règles')
                   .replace(/D(.)sactiver|D..sactiver/g, 'Désactiver')
                   .replace(/configur(.) |configur.. /g, 'configuré ')
                   .replace(/compl(.)te|compl..te/g, 'complète')
                   .replace(/T(.)l(.)phone|T..l..phone/g, 'Téléphone')
                   .replace(/donn(.)es|donn..es/g, 'données')
                   .replace(/g(.)n(.)rer|g..n..rer/g, 'générer')
                   .replace(/mis (.) jour|mis .. jour/g, 'mis à jour')
                   .replace(/appliqu(.)e|appliqu..e/g, 'appliquée')
                   .replace(/D(.)lai estim(.)|D..lai estim../g, 'Délai estimé')
                   .replace(/Paiement (.) la livraison|Paiement .. la livraison/g, 'Paiement à la livraison')
                   .replace(/cr(.)er|cr..er/g, 'créer')
                   .replace(/T(.)l(.)charger|T..l..charger/g, 'Télécharger');
  fs.writeFileSync(file, content, 'utf8');
});

