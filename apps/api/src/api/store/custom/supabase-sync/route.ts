import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createProductsWorkflow, createCollectionsWorkflow, createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const secret = req.headers["x-supabase-signature"]
  // In a real scenario, you'd verify this signature against SUPABASE_WEBHOOK_SECRET
  // For now, we accept it if it's present (or just bypass for the POC).
  if (secret !== "secret-webhook-key" && process.env.NODE_ENV !== "development") {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { product_name, brand, category, ean_code, markdown_content } = req.body as any
  
  if (!product_name) {
    return res.status(400).json({ error: "product_name is required" })
  }

  const productModule = req.scope.resolve(Modules.PRODUCT)
  const salesChannelModule = req.scope.resolve(Modules.SALES_CHANNEL)
  const fulfillmentModule = req.scope.resolve(Modules.FULFILLMENT)

  try {
    // 1. Get default sales channel
    const [salesChannels] = await salesChannelModule.listSalesChannels()
    const defaultSalesChannelId = salesChannels?.[0]?.id

    // 2. Get default shipping profile
    let defaultShippingProfileId
    try {
      const [shippingProfiles] = await fulfillmentModule.listShippingProfiles()
      defaultShippingProfileId = shippingProfiles?.[0]?.id
    } catch (e) {}

    // 3. Resolve Collection
    let collectionId
    if (brand) {
      const collections = await productModule.listProductCollections({ title: brand })
      if (collections.length > 0) {
        collectionId = collections[0].id
      } else {
        const cRes = await createCollectionsWorkflow(req.scope).run({
          input: { collections: [{ title: brand }] }
        })
        collectionId = cRes.result[0].id
      }
    }

    // 4. Resolve Category
    let categoryId
    if (category) {
      const categories = await productModule.listProductCategories({ name: category })
      if (categories.length > 0) {
        categoryId = categories[0].id
      } else {
        const catRes = await createProductCategoriesWorkflow(req.scope).run({
          input: { product_categories: [{ name: category }] }
        })
        categoryId = catRes.result[0].id
      }
    }

    // 5. Create Product
    const payload: any = {
      title: product_name,
      description: markdown_content || "",
      status: "published",
      collection_id: collectionId,
      category_ids: categoryId ? [categoryId] : [],
      options: [{ title: "Default Option", values: ["Default Variant"] }],
      variants: [{
        title: "Default Variant",
        barcode: ean_code || undefined,
        manage_inventory: true,
        options: { "Default Option": "Default Variant" },
        prices: [{
          currency_code: "xof",
          amount: 0
        }],
        inventory_items: [{
          required_quantity: 1,
        }]
      }]
    }

    if (defaultSalesChannelId) {
      payload.sales_channels = [{ id: defaultSalesChannelId }]
    }
    if (defaultShippingProfileId) {
      payload.shipping_profile_id = defaultShippingProfileId
    }

    const result = await createProductsWorkflow(req.scope).run({
      input: { products: [payload] }
    })

    return res.status(200).json({ success: true, product: result.result[0] })
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
}
