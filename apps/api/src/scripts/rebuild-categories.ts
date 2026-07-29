import { ExecArgs } from "@medusajs/framework/types"
import { updateProductsWorkflow, createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"

export default async function rebuildCategories({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const productModule = container.resolve(Modules.PRODUCT)

  const csvPath = path.resolve(process.cwd(), "../storefront/scanned_products_rows (3).csv")
  logger.info(`📂 Lecture du fichier CSV : ${csvPath}`)
  const csvContent = fs.readFileSync(csvPath, "utf8")
  const records = parse(csvContent, { columns: true, skip_empty_lines: true })

  logger.info("📦 Chargement des produits...")
  const products = await productModule.listProducts({}, { relations: ["variants", "categories"], take: 2000 })

  // Clean existing categories in script instead of SQL for safety (soft delete)
  // But doing it via workflows is safer. Let's just create new ones and ignore the old ones for now, 
  // or we can just create them if they don't exist by name.
  // Actually, to avoid conflicts, let's prefix or ensure they are distinct.
  // The new categories are English like "Face Care" vs old French "Sérums".

  // We will cache created categories by name
  const categoryMap = new Map<string, any>()

  // Helper to create or get category
  async function getOrCreateCategory(name: string, parentId?: string) {
    const key = parentId ? `${parentId}-${name}` : name
    if (categoryMap.has(key)) return categoryMap.get(key)
    
    // Check if it already exists in DB
    const query: any = { name }
    if (parentId) query.parent_category_id = parentId
    
    const [existing] = await productModule.listProductCategories(query, { take: 1 })
    
    if (existing) {
      categoryMap.set(key, existing)
      return existing
    }

    // Create it
    try {
      const payload: any = { name }
      if (parentId) payload.parent_category_id = parentId
      
      const res = await createProductCategoriesWorkflow(container).run({
        input: { product_categories: [payload] }
      })
      const newCat = res.result[0]
      categoryMap.set(key, newCat)
      logger.info(`✅ Catégorie créée: ${name}`)
      return newCat
    } catch (e: any) {
      logger.error(`❌ Erreur création catégorie ${name}: ${e.message}`)
      return null
    }
  }

  let successCount = 0

  for (const record of records) {
    const row: any = record
    const ean = row.ean_code?.trim()
    const mainCategoryName = row.main_category?.trim()
    const subCategoryName = row.sub_category?.trim()
    
    if (!ean || !mainCategoryName) continue

    // Find product in DB
    const product = products.find(p => p.variants?.some(v => v.barcode === ean))
    if (!product) continue

    // 1. Get or create Main Category
    const mainCat = await getOrCreateCategory(mainCategoryName)
    if (!mainCat) continue

    // 2. Get or create Sub Category
    let categoryIdToAssign = mainCat.id
    if (subCategoryName) {
      const subCat = await getOrCreateCategory(subCategoryName, mainCat.id)
      if (subCat) {
        categoryIdToAssign = subCat.id
      }
    }

    // 3. Assign category to product (we overwrite existing categories)
    try {
      await updateProductsWorkflow(container).run({
        input: {
          products: [{
            id: product.id,
            category_ids: [categoryIdToAssign] // Assigns to subcategory (or main if no sub)
          }]
        }
      })
      successCount++
      if (successCount % 50 === 0) {
        logger.info(`⏳ Progression : ${successCount} produits mis à jour...`)
      }
    } catch (err: any) {
      logger.error(`❌ Erreur mise à jour ${product.title} : ${err.message}`)
    }
  }

  logger.info("===============================================")
  logger.info(`✅ Re-hiérarchisation terminée !`)
  logger.info(`   - Produits liés à leurs sous-catégories : ${successCount}`)
  logger.info("===============================================")
}
