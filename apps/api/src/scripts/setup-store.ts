import { Modules } from "@medusajs/framework/utils"

export default async function setupStore({ container }) {
  const apiKeyModule = container.resolve(Modules.API_KEY)
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)
  const regionModule = container.resolve(Modules.REGION)
  const storeModule = container.resolve(Modules.STORE)
  const remoteLink = container.resolve("remoteLink")

  console.log("Setting up Storefront connection...");

  // 1. Get or create publishable API key
  let apiKeys = await apiKeyModule.listApiKeys({ type: "publishable" });
  let apiKey;
  if (apiKeys.length === 0) {
    console.log("Creating new publishable API key...");
    apiKey = await apiKeyModule.createApiKeys({
      title: "Storefront Key",
      type: "publishable",
      created_by: "system"
    });
  } else {
    apiKey = apiKeys[0];
    console.log("Found existing publishable API key.");
  }
  console.log("Publishable API Key:", apiKey.token);

  // 2. Get the default sales channel
  let channels = await salesChannelModule.listSalesChannels();
  let channel;
  if (channels.length === 0) {
    channel = await salesChannelModule.createSalesChannels({
      name: "Default Sales Channel",
      description: "Created automatically"
    });
  } else {
    channel = channels[0];
  }

  // 3. Link API key to Sales Channel
  console.log("Linking API Key to Sales Channel:", channel.id);
  try {
    await remoteLink.create({
      [Modules.API_KEY]: {
        publishable_api_key_id: apiKey.id
      },
      [Modules.SALES_CHANNEL]: {
        sales_channel_id: channel.id
      }
    });
  } catch (e) {
    console.log("Link already exists or error:", e.message);
  }

  // 4. Get the default Region
  let regions = await regionModule.listRegions();
  let region;
  if (regions.length === 0) {
    console.log("Creating default region FCFA...");
    region = await regionModule.createRegions({
      name: "Afrique",
      currency_code: "XAF",
      countries: ["CM", "CI", "SN"], // Cameroon, Ivory Coast, Senegal
    });
  } else {
    region = regions[0];
  }

  // 5. Get the store and link default region and sales channel
  let stores = await storeModule.listStores();
  if (stores.length > 0) {
    let store = stores[0];
    
    // In Medusa v2, default_region_id and default_sales_channel_id might be set directly or via store module
    await storeModule.updateStores({
      id: store.id,
      default_region_id: region.id,
      default_sales_channel_id: channel.id
    });
  }

  console.log("Setup complete! Use this token in your Storefront .env.local:");
  console.log("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=" + apiKey.token);
}
