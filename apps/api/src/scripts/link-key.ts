import { Modules } from "@medusajs/framework/utils"
import { linkSalesChannelsToApiKeyWorkflow } from "@medusajs/medusa/core-flows"

export default async function linkKey({ container }) {
  const apiKeyModule = container.resolve(Modules.API_KEY)
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)

  let apiKeys = await apiKeyModule.listApiKeys({ type: "publishable" });
  if (apiKeys.length === 0) return console.log("No API key");
  const apiKey = apiKeys[0];

  let channels = await salesChannelModule.listSalesChannels();
  if (channels.length === 0) return console.log("No Sales Channel");
  const channel = channels[0];

  console.log("Linking API Key", apiKey.id, "to Sales Channel", channel.id);
  
  try {
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: {
        id: apiKey.id,
        add: [channel.id]
      }
    });
    console.log("Linked successfully via workflow.");
  } catch (e) {
    console.error("Workflow failed:", e.message);
  }
}
