const fs = require('fs');
const files = [
  'apps/admin/app/dashboard/delivery/DeliverySettingsClient.tsx',
  'apps/admin/components/DeliveryAnalytics.tsx'
];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/Param.tres/g, 'Paramètres')
                   .replace(/Avanc.s/g, 'Avancés')
                   .replace(/G.rez/g, 'Gérez')
                   .replace(/G.n.ral/g, 'Général')
                   .replace(/R.gles/g, 'Règles')
                   .replace(/D.sactiver/g, 'Désactiver')
                   .replace(/configur. /g, 'configuré ')
                   .replace(/compl.te/g, 'complète')
                   .replace(/T.l.phone/g, 'Téléphone')
                   .replace(/donn.es/g, 'données')
                   .replace(/g.n.rer/g, 'générer')
                   .replace(/mis . jour/g, 'mis à jour')
                   .replace(/appliqu.e/g, 'appliquée')
                   .replace(/D.lai estim./g, 'Délai estimé')
                   .replace(/Paiement . la livraison/g, 'Paiement à la livraison')
                   .replace(/Ã©/g, 'é')
                   .replace(/Ã¨/g, 'è')
                   .replace(/Ã /g, 'à');
  fs.writeFileSync(file, content);
});

