import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { updateProductsWorkflow, uploadFilesWorkflow } from "@medusajs/medusa/core-flows"

const SERPAPI_KEY = "ba0533cb71b82a107c6d0dce800f1b91c9f87c62e2aa36ca883cab96a8e57fc6"
const PHOTOROOM_KEY = "sk_pr_welfare_38d687460716149330cba2ea6c431b4b78e36a54"

export default async function imagePipeline({ container }: ExecArgs) {
  const productModule = container.resolve(Modules.PRODUCT)
  const fileModule = container.resolve(Modules.FILE)

  console.log("Fetching products...")
  
  // We need products with collections to get the brand.
  const products = await productModule.listProducts({}, { 
    take: 1000, 
    relations: ["images", "collection"] 
  })

  const productsToProcess = products.filter(p => !p.images || p.images.length === 0).slice(0, 500)

  console.log(`Found ${productsToProcess.length} products to process.`)

  for (const product of productsToProcess) {
    console.log(`\n--- Processing: ${product.title} ---`)
    try {
      const brand = product.collection?.title || ""
      const query = `${brand} ${product.title} packaging cosmétique blanc`
      console.log(`Search Query: ${query}`)

      // 1. SerpApi
      const serpUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&tbm=isch&api_key=${SERPAPI_KEY}`
      const serpRes = await fetch(serpUrl)
      const serpData = await serpRes.json() as any

      const imageUrl = serpData.images_results?.[0]?.original
      if (!imageUrl) {
        console.log(`Échec pour le produit ${product.id} : Aucune image trouvée`)
        continue
      }
      console.log(`Found original image: ${imageUrl}`)

      // 2. Photoroom API (requires actual image file upload)
      const imageDownloadRes = await fetch(imageUrl)
      const originalImageBuffer = await imageDownloadRes.arrayBuffer()

      const form = new FormData()
      form.append('image_file', new Blob([originalImageBuffer]), 'image.jpg')

      const photoRoomUrl = `https://sdk.photoroom.com/v1/segment`
      const photoRes = await fetch(photoRoomUrl, {
        method: 'POST',
        headers: { "x-api-key": PHOTOROOM_KEY },
        body: form as any
      })

      if (!photoRes.ok) {
        const errorText = await photoRes.text()
        console.log(`Échec Photoroom pour le produit ${product.id} : ${photoRes.statusText} - ${errorText}`)
        continue
      }

      const imageBuffer = await photoRes.arrayBuffer()
      const base64Content = Buffer.from(imageBuffer).toString("base64")

      // 3. Upload to Medusa via Workflow
      console.log(`Uploading to Medusa File Service...`)
      const { result: uploadResult } = await uploadFilesWorkflow(container).run({
        input: {
          files: [{
            filename: `${product.id}.png`,
            mimeType: "image/png",
            content: base64Content,
            access: "public"
          }]
        }
      })

      const uploadedUrl = uploadResult[0]?.url

      if (!uploadedUrl) {
         console.log(`Échec upload File Service`)
         continue
      }

      console.log(`Uploaded URL: ${uploadedUrl}`)

      // 4. Update Product
      await updateProductsWorkflow(container).run({
        input: {
          products: [{
            id: product.id,
            images: [{ url: uploadedUrl }],
            thumbnail: uploadedUrl
          }]
        }
      })

      console.log(`✅ Successfully updated ${product.title} with image ${uploadedUrl}`)
      
      // Delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 3000))

    } catch (error) {
      console.error(`Error processing ${product.title}:`, error)
    }
  }

  console.log("\nPipeline finished.")
}
