const fs = require('fs');
let c = fs.readFileSync('apps/admin/app/dashboard/delivery/DeliverySettingsClient.tsx', 'utf8');

c = c.replace(/Param\ufffdtres/g, 'Paramètres')
     .replace(/Param\ufffd/g, 'Paramètres')
     .replace(/Avanc\ufffds/g, 'Avancés')
     .replace(/G\ufffdrez/g, 'Gérez')
     .replace(/r\ufffdgles/g, 'règles')
     .replace(/R\ufffdgles/g, 'Règles')
     .replace(/G\ufffdn\ufffdral/g, 'Général')
     .replace(/G\ufffdn\ufffdraux/g, 'Généraux')
     .replace(/D\ufffdsactiver/g, 'Désactiver')
     .replace(/configur\ufffd/g, 'configuré')
     .replace(/compl\ufffdte/g, 'complète')
     .replace(/T\ufffdl\ufffdphone/g, 'Téléphone')
     .replace(/donn\ufffdes/g, 'données')
     .replace(/g\ufffdn\ufffdrer/g, 'générer')
     .replace(/mis \ufffd jour/g, 'mis à jour')
     .replace(/appliqu\ufffde/g, 'appliquée')
     .replace(/D\ufffdlai estim\ufffd/g, 'Délai estimé')
     .replace(/Paiement \ufffd la livraison/g, 'Paiement à la livraison')
     .replace(/cr\ufffder/g, 'créer')
     .replace(/T\ufffdl\ufffdcharger/g, 'Télécharger')
     .replace(/R\ufffdf\ufffdrence/g, 'Référence')
     .replace(/GÃ©nÃ©ral/g, 'Général')
     .replace(/mis Ã  jour/g, 'mis à jour')
     .replace(/Ã /g, 'à')
     .replace(/Ã¨/g, 'è')
     .replace(/Ã©/g, 'é');

fs.writeFileSync('apps/admin/app/dashboard/delivery/DeliverySettingsClient.tsx', c, 'utf8');
