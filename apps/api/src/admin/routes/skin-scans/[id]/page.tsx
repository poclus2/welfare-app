import { Container, Heading, Text, Badge, Button } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { PhotoIcon, MagnifyingGlassPlusIcon, XMarkIcon } from "@heroicons/react/24/outline"

const fetchScan = async (id: string) => {
  const response = await fetch(`/admin/skin-scans/${id}`, {
    headers: { "Content-Type": "application/json" }
  })
  return response.json()
}

export default function SkinScanDetailsPage() {
  const id = typeof window !== "undefined" ? window.location.pathname.split('/').pop() : ""
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchScan(id!).then(res => {
        setData(res)
        setIsLoading(false)
      })
    }
  }, [id])

  if (isLoading) return <Container className="p-8">Loading...</Container>

  const scan = data?.skin_scan

  return (
    <Container className="p-8 relative">
      <div className="flex items-center gap-4 mb-6">
        <a href="/app/skin-scans" className="text-gray-500 hover:text-black">← Retour</a>
        <Heading>Détails du Scan</Heading>
        <Badge>{new Date(scan?.created_at).toLocaleString()}</Badge>
      </div>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-5xl max-h-screen w-full h-full flex items-center justify-center">
            <button 
              className="absolute top-4 right-4 bg-white rounded-full p-2 text-black hover:bg-gray-200"
              onClick={() => setZoomedImage(null)}
            >
              Fermer
            </button>
            <img 
              src={zoomedImage} 
              alt="Zoomed" 
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <div>
            <Text weight="plus" className="mb-2">Diagnostic Principal</Text>
            <div className="bg-gray-50 p-4 rounded-xl border">
              <Text className="text-lg font-medium">{scan?.final_skin_type}</Text>
              <Text className="text-gray-500">Âge cutané estimé : {scan?.estimated_skin_age} ans</Text>
            </div>
          </div>

          <div>
            <Text weight="plus" className="mb-2">Métriques Visuelles (Qwen)</Text>
            <div className="bg-gray-50 p-4 rounded-xl border flex flex-col gap-2">
              <Text>Niveau de Sébum: {scan?.metrics?.sebum_level_percentage}%</Text>
              <Text>Sévérité Acné: {scan?.metrics?.acne_severity_percentage}%</Text>
              <Text>Barrière Hydratation: {scan?.metrics?.hydration_barrier_percentage}%</Text>
              <Text>Visibilité Pores: {scan?.metrics?.pore_visibility_percentage}%</Text>
              <Text>Fatigue Contour des Yeux: {scan?.metrics?.eye_contour_fatigue_percentage}%</Text>
            </div>
          </div>

          <div>
            <Text weight="plus" className="mb-2">Photos du Scan</Text>
            <div className="flex gap-4">
              {scan?.images && Object.entries(scan.images).map(([angle, url]) => (
                <div key={angle} className="relative group cursor-pointer border rounded-lg overflow-hidden" onClick={() => setZoomedImage(url as string)}>
                  <img src={url as string} alt={angle} className="w-32 h-32 object-cover" />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 font-medium capitalize bg-black/50 px-2 py-1 rounded">
                      {angle}
                    </span>
                  </div>
                </div>
              ))}
              {!scan?.images && <Text className="text-gray-500 text-sm">Aucune photo trouvée.</Text>}
            </div>
          </div>
        </div>

        <div>
          <Text weight="plus" className="mb-2">Routine Recommandée (Claude)</Text>
          <div className="flex flex-col gap-3">
            {scan?.routine?.map((step: any, index: number) => (
              <div key={index} className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <Text weight="plus" className="text-blue-900">Étape {step.step_number || index + 1} : {step.step_name || step.category}</Text>
                
                {step.product_name && (
                  <div className="mt-2 mb-2 p-2 bg-white rounded border border-blue-100 flex justify-between items-center">
                    <Text className="text-sm font-medium">{step.product_name}</Text>
                    {step.medusa_product_id && (
                      <a href={`/app/products/${step.medusa_product_id}`} target="_blank" className="text-xs text-blue-600 hover:underline">
                        Voir produit
                      </a>
                    )}
                  </div>
                )}

                <Text className="text-sm text-gray-700 mt-2">{step.explanation_for_client || step.explanation}</Text>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  )
}
