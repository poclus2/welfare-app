import { MedusaContainer } from "@medusajs/framework/types"

export default async function myScript({
  container,
}: {
  container: MedusaContainer
}) {
  const query = container.resolve("query")
  
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "description",
      "thumbnail",
      "handle",
      "collection.title",
      "variants.sku",
      "variants.prices.amount",
      "metadata"
    ],
    pagination: {
      take: 1000,
    }
  })
  
  console.log(`Found ${products.length} products to manually index to Meilisearch...`)
  
  const documents = products.map((p: any) => {
    const brand = p.collection?.title;
    const formattedTitle = brand ? `${brand} - ${p.title}` : p.title;
    const price = p.variants?.[0]?.prices?.[0]?.amount || 0;
    
    return {
      id: p.id,
      title: formattedTitle,
      description: p.metadata?.search_tagline || p.description || "",
      thumbnail: p.thumbnail,
      handle: p.handle,
      variant_sku: p.variants?.[0]?.sku,
      price: price
    }
  })
  
  const res = await fetch("http://localhost:7700/indexes/products/documents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer meilisearch_super_secret"
    },
    body: JSON.stringify(documents)
  })
  
  console.log("Meilisearch Response:", await res.json())
}
