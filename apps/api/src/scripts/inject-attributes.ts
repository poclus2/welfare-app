import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"

export default async function injectAttributes({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const productModule = container.resolve(Modules.PRODUCT)

  logger.info("📦 Chargement des produits depuis Medusa...")
  const products = await productModule.listProducts({}, { relations: ["variants"] })
  logger.info(`✅ ${products.length} produits chargés.`)

  const csvPath = path.resolve(process.cwd(), "../storefront/scanned_products_rows (3).csv")
  logger.info(`📂 Lecture du fichier CSV : ${csvPath}`)
  
  const csvContent = fs.readFileSync(csvPath, "utf8")
  const records = parse(csvContent, { columns: true, skip_empty_lines: true })
  logger.info(`✅ ${records.length} lignes CSV chargées.`)

  let successCount = 0
  let notFoundCount = 0

  for (const record of records) {
    const row: any = record;
    const ean = row.ean_code?.trim()
    if (!ean) continue

    // Find the product by EAN (barcode)
    const product = products.find(p => p.variants?.some(v => v.barcode === ean))
    
    if (!product) {
      notFoundCount++
      continue
    }

    try {
      let attributes: any = {}
      if (row.attributes) {
        try {
          attributes = JSON.parse(row.attributes)
        } catch (e) {}
      }

      const skinTypes = Array.isArray(attributes.skin_type) ? attributes.skin_type : []
      const skinConcerns = Array.isArray(attributes.skin_concern) ? attributes.skin_concern : []
      const rawInci = row.raw_inci?.trim() || ""

      // Merge new data into existing metadata
      const currentMeta = product.metadata || {}
      
      const newMeta: Record<string, any> = {
        ...currentMeta,
        skin_types: skinTypes,
        skin_concerns: skinConcerns,
      }
      
      if (rawInci) {
         newMeta.raw_inci = rawInci
      }

      await productModule.updateProducts(product.id, {
        metadata: newMeta
      })
      
      successCount++
      if (successCount % 50 === 0) {
        logger.info(`⏳ Progression : ${successCount} produits mis à jour...`)
      }
    } catch (err: any) {
      logger.error(`❌ Erreur sur ${product.title} : ${err.message}`)
    }
  }

  logger.info("===============================================")
  logger.info(`✅ Mise à jour terminée avec succès !`)
  logger.info(`   - Modifiés : ${successCount}`)
  logger.info(`   - Non trouvés dans Medusa : ${notFoundCount}`)
  logger.info("===============================================")
}
