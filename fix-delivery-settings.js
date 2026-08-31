const fs = require('fs');
let c = fs.readFileSync('apps/admin/app/dashboard/delivery/DeliverySettingsClient.tsx', 'utf8');

c = c.replace(/Param.tres de Livraison Avanc.s/g, 'Paramètres de Livraison Avancés')
     .replace(/G.rez vos villes, quartiers, points relais, r.gles de poids et analysez vos livraisons./g, 'Gérez vos villes, quartiers, points relais, règles de poids et analysez vos livraisons.')
     .replace(/G.n.ral & COD/g, 'Général & COD')
     .replace(/R.gles de Poids/g, 'Règles de Poids')
     .replace(/D.sactiver la livraison /g, 'Désactiver la livraison ')
     .replace(/Montant configur./g, 'Montant configuré')
     .replace(/D.lai estim./g, 'Délai estimé')
     .replace(/Paiement . la livraison/g, 'Paiement à la livraison')
     .replace(/T.l.charger/g, 'Télécharger')
     .replace(/cr.er/g, 'créer')
     .replace(/mis . jour/g, 'mis à jour')
     .replace(/appliqu.e/g, 'appliquée')
     .replace(/\uFFFD/g, ''); // Remove the black diamond

fs.writeFileSync('apps/admin/app/dashboard/delivery/DeliverySettingsClient.tsx', c, 'utf8');
