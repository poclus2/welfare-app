import { Container, Heading, Text, Badge } from "@medusajs/ui"
import { useEffect, useState } from "react"

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

  useEffect(() => {
    if (id) {
      fetchScan(id).then(res => {
        setData(res)
        setIsLoading(false)
      })
    }
  }, [id])

  if (isLoading) return <Container className="p-8">Loading...</Container>

  const scan = data?.skin_scan

  return (
    <Container className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <a href="/app/skin-scans" className="text-gray-500 hover:text-black">← Retour</a>
        <Heading>Détails du Scan</Heading>
        <Badge>{new Date(scan?.created_at).toLocaleString()}</Badge>
      </div>

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
        </div>

        <div>
          <Text weight="plus" className="mb-2">Routine Recommandée (Claude)</Text>
          <div className="flex flex-col gap-3">
            {scan?.routine?.map((step: any, index: number) => (
              <div key={index} className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <Text weight="plus" className="text-blue-900">Étape {step.step_number} : {step.category}</Text>
                <Text className="text-sm text-blue-700 font-medium mb-1">Cible : {step.target_concern}</Text>
                <Text className="text-sm text-gray-700">{step.explanation}</Text>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  )
}
