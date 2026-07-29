import { ExecArgs } from "@medusajs/framework/types"
import { updateProductsWorkflow, createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"

export default async function fixCategories({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const productModule = container.resolve(Modules.PRODUCT)

  logger.info("📦 Chargement des produits et catégories...")
  const products = await productModule.listProducts({}, { relations: ["variants", "categories"], take: 2000 })
  
  const existingCategories = await productModule.listProductCategories({}, { take: 1000 })
  const categoryMap = new Map(existingCategories.map(c => [(c.name || "").toLowerCase().trim(), c.id]))

  const csvPath = path.resolve(process.cwd(), "../storefront/scanned_products_rows (3).csv")
  logger.info(`📂 Lecture du fichier CSV : ${csvPath}`)
  
  const csvContent = fs.readFileSync(csvPath, "utf8")
  const records = parse(csvContent, { columns: true, skip_empty_lines: true })

  let successCount = 0
  let categoryCreatedCount = 0

  for (const record of records) {
    const row: any = record
    const ean = row.ean_code?.trim()
    const categoryName = row.category?.trim()
    
    if (!ean || !categoryName) continue

    // Find product in DB
    const product = products.find(p => p.variants?.some(v => v.barcode === ean))
    if (!product) continue

    // If it already has categories, we skip it
    if (product.categories && product.categories.length > 0) {
      continue
    }

    let categoryId = categoryMap.get(categoryName.toLowerCase())

    // If category doesn't exist, create it
    if (!categoryId) {
      try {
        const res = await createProductCategoriesWorkflow(container).run({
          input: { product_categories: [{ name: categoryName }] }
        })
        categoryId = res.result[0].id
        categoryMap.set(categoryName.toLowerCase(), categoryId)
        categoryCreatedCount++
        logger.info(`✅ Catégorie créée: ${categoryName}`)
      } catch (e: any) {
        logger.error(`❌ Impossible de créer la catégorie ${categoryName}: ${e.message}`)
        continue
      }
    }

    if (categoryId) {
      try {
        await updateProductsWorkflow(container).run({
          input: {
            products: [{
              id: product.id,
              category_ids: [categoryId]
            }]
          }
        })
        successCount++
        if (successCount % 10 === 0) {
          logger.info(`⏳ Progression : ${successCount} produits mis à jour...`)
        }
      } catch (err: any) {
        logger.error(`❌ Erreur mise à jour ${product.title} : ${err.message}`)
      }
    }
  }

  logger.info("===============================================")
  logger.info(`✅ Mise à jour des catégories terminée !`)
  logger.info(`   - Nouvelles catégories créées : ${categoryCreatedCount}`)
  logger.info(`   - Produits mis à jour : ${successCount}`)
  logger.info("===============================================")
}
