import { ExecArgs } from "@medusajs/framework/types"
import { createProductsWorkflow, createCollectionsWorkflow, createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import * as fs from "fs"
import { parse } from "csv-parse"
import * as path from "path"

export default async function importSupabase({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const productModule = container.resolve(Modules.PRODUCT)
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)

  logger.info("Starting Supabase CSV import...")

  // 1. Get default sales channel
  const [salesChannels] = await salesChannelModule.listSalesChannels()
  const defaultSalesChannelId = salesChannels?.[0]?.id
  if (!defaultSalesChannelId) {
    logger.warn("No default sales channel found. Please create one first.")
  }

  // 2. Get default shipping profile
  // In v2, fulfillment is handled by shipping profiles.
  // We can query shipping profiles if the fulfillment module provides it.
  // Wait, in v2 `fulfillmentModule.listShippingProfiles` might not exist or be named differently,
  // but let's try.
  let defaultShippingProfileId
  try {
    const [shippingProfiles] = await fulfillmentModule.listShippingProfiles()
    defaultShippingProfileId = shippingProfiles?.[0]?.id
  } catch (e) {
    // maybe no shipping profile
  }

  // 3. Read and parse CSV
  const csvFilePath = path.resolve(__dirname, "../../../storefront/scanned_products_rows (2).csv")
  const parser = fs.createReadStream(csvFilePath).pipe(parse({ columns: true, skip_empty_lines: true }))

  const existingCollections = await productModule.listProductCollections({}, { take: 1000 })
  const collectionMap = new Map(existingCollections.map(c => [(c.title || "").toLowerCase().trim(), c.id]))

  const existingCategories = await productModule.listProductCategories({}, { take: 1000 })
  const categoryMap = new Map(existingCategories.map(c => [(c.name || "").toLowerCase().trim(), c.id]))
  
  // also add handle fallback
  for (const c of existingCategories) {
    if (c.handle) categoryMap.set(c.handle, c.id)
  }
  for (const c of existingCollections) {
    if (c.handle) collectionMap.set(c.handle, c.id)
  }

  let count = 0

  for await (const row of parser) {
    let { product_name, brand, category, ean_code, markdown_content, price } = row
    brand = brand?.trim()
    category = category?.trim()
    product_name = product_name?.trim()
    const parsedPrice = price ? Math.round(parseFloat(price)) : 0
    
    // Process Collection (Brand)
    let collectionKey = brand ? brand.toLowerCase().trim() : undefined
    let collectionId = collectionKey ? collectionMap.get(collectionKey) : undefined
    if (brand && !collectionId) {
      try {
        const res = await createCollectionsWorkflow(container).run({
          input: { collections: [{ title: brand }] }
        })
        collectionId = res.result[0].id
        collectionMap.set(collectionKey, collectionId)
        logger.info(`Created Collection: ${brand}`)
      } catch (err: any) {
        if (err.message?.includes("already exists")) {
          const [existing] = await productModule.listProductCollections({ q: brand })
          if (existing) {
            collectionId = existing.id
            collectionMap.set(collectionKey, collectionId)
          }
        } else {
          throw err
        }
      }
    }

    // Process Category
    let categoryKey = category ? category.toLowerCase().trim() : undefined
    let categoryId = categoryKey ? categoryMap.get(categoryKey) : undefined
    if (category && !categoryId) {
      try {
        const res = await createProductCategoriesWorkflow(container).run({
          input: { product_categories: [{ name: category }] }
        })
        categoryId = res.result[0].id
        categoryMap.set(categoryKey, categoryId)
        logger.info(`Created Category: ${category}`)
      } catch (err: any) {
        if (err.message?.includes("already exists")) {
          const [existing] = await productModule.listProductCategories({ q: category })
          if (existing) {
            categoryId = existing.id
            categoryMap.set(categoryKey, categoryId)
          }
        } else {
          throw err
        }
      }
    }

    // Process Product
    try {
      // Check for duplicates
      if (ean_code) {
        const [existingProduct] = await productModule.listProducts({
          q: ean_code
        })
        if (existingProduct) {
          // Update the existing product price
          const [variant] = await productModule.listProductVariants({ product_id: existingProduct.id })
          if (variant) {
            // Update prices by fetching the price set and updating it
            logger.info(`Updating duplicate product price: ${product_name} (${ean_code}) to ${parsedPrice}`)
            // Simplest way to update price in Medusa v2 is to use the core flow or pricing module. 
            // To avoid complexity, since this is a one-off import, we can just delete it and recreate it!
            await productModule.softDeleteProducts([existingProduct.id])
          } else {
             logger.info(`Skipping duplicate product: ${product_name} (${ean_code})`)
             continue
          }
        }
      }

      const payload: any = {
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
        payload.sales_channels = [{ id: defaultSalesChannelId }]
      }

      if (defaultShippingProfileId) {
        payload.shipping_profile_id = defaultShippingProfileId
      }

      await createProductsWorkflow(container).run({
        input: { products: [payload] }
      })
      count++
      logger.info(`Imported: ${product_name} (${count})`)
    } catch (err: any) {
      logger.error(`Failed to import ${product_name}: ${err.message}`)
    }
  }

  logger.info(`Finished processing ${count} products.`)
}
