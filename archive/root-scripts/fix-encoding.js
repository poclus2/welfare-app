const fs = require('fs');
const files = [
  'apps/admin/app/dashboard/delivery/DeliverySettingsClient.tsx',
  'apps/admin/components/DeliveryAnalytics.tsx'
];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/√©/g, 'È')
                   .replace(/√®/g, 'Ë')
                   .replace(/√/g, '‡')
                   .replace(/‡ /g, '‡ ')
                   .replace(/Param√®tres|Paramatres|Param√¢tres|Paramatres/g, 'ParamËtres')
                   .replace(/Avanc√©s|Avancas/g, 'AvancÈs')
                   .replace(/G√©n√©ral|Ganaral/g, 'GÈnÈral')
                   .replace(/R√®gles|Ragles/g, 'RËgles')
                   .replace(/G√©rez|Garez/g, 'GÈrez')
                   .replace(/donn√©es/g, 'donnÈes')
                   .replace(/g√©n√©rer/g, 'gÈnÈrer')
                   .replace(/mis √† jour/g, 'mis ‡ jour')
                   .replace(/√† la livraison/g, '‡ la livraison')
                   .replace(/appliqu√©e/g, 'appliquÈe')
                   .replace(/D√©lai/g, 'DÈlai')
                   .replace(/estim√©/g, 'estimÈ')
                   .replace(/D√©sactiver/g, 'DÈsactiver')
                   .replace(/configur√©/g, 'configurÈ')
                   .replace(/compl√®te/g, 'complËte')
                   .replace(/T√©l√©phone/g, 'TÈlÈphone');
  fs.writeFileSync(file, content);
});

