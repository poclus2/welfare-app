import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { 
  createProductsWorkflow, 
  createCollectionsWorkflow, 
  createProductCategoriesWorkflow 
} from "@medusajs/medusa/core-flows"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const payload = req.body as any
  const container = req.scope

  // Assuming Supabase webhook sends the new row in `record` object
  const record = payload.record || payload
  let { product_name, brand, category, ean_code, markdown_content, price } = record

  brand = brand?.trim()
  category = category?.trim()
  product_name = product_name?.trim()
  const parsedPrice = price ? Math.round(parseFloat(price)) : 0

  if (!ean_code) {
    res.status(400).json({ message: "EAN code is required" })
    return
  }

  const productModule = container.resolve(Modules.PRODUCT)

  // 1. Check for duplicates
  const [existingProduct] = await productModule.listProducts({
    q: ean_code
  })

  if (existingProduct) {
    res.status(200).json({ message: "Product already exists", product: existingProduct })
    return
  }

  // 2. Fetch or Create Collection
  let collectionId: string | undefined
  if (brand) {
    const brandKey = brand.toLowerCase().trim()
    const [existingCollection] = await productModule.listProductCollections({ q: brand })
    if (existingCollection) {
      collectionId = existingCollection.id
    } else {
      try {
        const collectionRes = await createCollectionsWorkflow(container).run({
          input: { collections: [{ title: brand }] }
        })
        collectionId = collectionRes.result[0].id
      } catch (e: any) {
         if (e.message?.includes("already exists")) {
            const [retryExisting] = await productModule.listProductCollections({ q: brand })
            if (retryExisting) collectionId = retryExisting.id
         } else {
            throw e
         }
      }
    }
  }

  // 3. Fetch or Create Category
  let categoryId: string | undefined
  if (category) {
    const categoryKey = category.toLowerCase().trim()
    const [existingCategory] = await productModule.listProductCategories({ q: category })
    if (existingCategory) {
      categoryId = existingCategory.id
    } else {
      try {
        const categoryRes = await createProductCategoriesWorkflow(container).run({
          input: { product_categories: [{ name: category }] }
        })
        categoryId = categoryRes.result[0].id
      } catch (e: any) {
         if (e.message?.includes("already exists")) {
            const [retryExisting] = await productModule.listProductCategories({ q: category })
            if (retryExisting) categoryId = retryExisting.id
         } else {
            throw e
         }
      }
    }
  }

  // 4. Get Default Sales Channel and Shipping Profile
  const storeModule = container.resolve(Modules.STORE)
  const stores = await storeModule.listStores({}, { relations: ["default_sales_channel"] })
  const defaultSalesChannelId = stores[0]?.default_sales_channel_id;

  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  const shippingProfiles = await fulfillmentModule.listShippingProfiles()
  const defaultShippingProfileId = shippingProfiles.find(p => p.type === "default")?.id || shippingProfiles[0]?.id

  // 5. Create Product
  const productPayload: any = {
    title: product_name || "Sans Nom",
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
        amount: parsedPrice || 0
      }]
    }]
  }

  if (defaultSalesChannelId) {
    productPayload.sales_channels = [{ id: defaultSalesChannelId }]
  }

  if (defaultShippingProfileId) {
    productPayload.shipping_profile_id = defaultShippingProfileId
  }

  const result = await createProductsWorkflow(container).run({
    input: { products: [productPayload] }
  })

  res.status(200).json({ message: "Product synced successfully", product: result.result[0] })
}
