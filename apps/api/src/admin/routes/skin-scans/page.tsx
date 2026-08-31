import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Table, Button } from "@medusajs/ui"
import { useEffect, useState } from "react"

const fetchScans = async (limit: number, offset: number) => {
  const response = await fetch(`/admin/skin-scans?limit=${limit}&offset=${offset}`, {
    headers: { "Content-Type": "application/json" }
  })
  return response.json()
}

export default function SkinScansPage() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const limit = 20

  useEffect(() => {
    setIsLoading(true)
    fetchScans(limit, page * limit).then(res => {
      setData(res)
      setIsLoading(false)
    })
  }, [page])

  const totalPages = data ? Math.ceil(data.count / limit) : 0

  return (
    <Container className="p-8">
      <Heading className="mb-6">Skin Coach Scans</Heading>
      
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="flex flex-col gap-4">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>ID</Table.HeaderCell>
                <Table.HeaderCell>Type de Peau</Table.HeaderCell>
                <Table.HeaderCell>Âge Estimé</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data?.skin_scans?.map((scan: any) => (
                <Table.Row key={scan.id}>
                  <Table.Cell className="text-gray-500 font-mono text-xs">{scan.id}</Table.Cell>
                  <Table.Cell>{scan.final_skin_type}</Table.Cell>
                  <Table.Cell>{scan.estimated_skin_age}</Table.Cell>
                  <Table.Cell>{new Date(scan.created_at).toLocaleDateString()}</Table.Cell>
                  <Table.Cell>
                    <a href={`/app/skin-scans/${scan.id}`} className="text-blue-500 hover:underline">
                      Détails
                    </a>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-500">
              Affichage {page * limit + 1} à {Math.min((page + 1) * limit, data?.count || 0)} sur {data?.count || 0}
            </span>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Précédent
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Suivant
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Skin Scans",
  icon: "Sparkles",
})
