import { Modules } from "@medusajs/framework/utils"

export default async function updateRegion({ container }) {
  const regionModule = container.resolve(Modules.REGION)

  let regions = await regionModule.listRegions();
  if (regions.length > 0) {
    let region = regions[0];
    console.log("Updating region currency to XOF...");
    await regionModule.updateRegions({
      id: region.id,
      currency_code: "XOF"
    });
    console.log("Success!");
  } else {
    console.log("No regions found.");
  }
}
