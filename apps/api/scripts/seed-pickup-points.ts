// @ts-nocheck
import { ExecArgs } from '@medusajs/framework/types';
export default async function seedPickupPoints({ container }: ExecArgs) {
  const welfareDeliveryModuleService = container.resolve('welfare_delivery');
  console.log('Seeding pickup points...');
  
  const points = [
    { name: 'Boutique Hippodrome', address: 'Hippodrome, Yaoundé', city: 'Yaoundé', opening_hours: 'Lun-Sam: 9h-19h', price: 0 },
    { name: 'Boutique PlaYce', address: 'PlaYce Yaoundé, Warda', city: 'Yaoundé', opening_hours: 'Lun-Dim: 9h-20h', price: 0 }
  ];

  for (const p of points) {
    const existing = await welfareDeliveryModuleService.listPickupPoints({ name: p.name });
    if (existing.length === 0) {
      await welfareDeliveryModuleService.createPickupPoints(p);
      console.log('Created pickup point:', p.name);
    }
  }
  console.log('Pickup points seeded.');
}
