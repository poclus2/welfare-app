import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Table } from "@medusajs/ui"
import { useEffect, useState } from "react"

const fetchScans = async () => {
  const response = await fetch("/admin/skin-scans", {
    headers: { "Content-Type": "application/json" }
  })
  return response.json()
}

export default function SkinScansPage() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchScans().then(res => {
      setData(res)
      setIsLoading(false)
    })
  }, [])

  return (
    <Container className="p-8">
      <Heading className="mb-6">Skin Coach Scans</Heading>
      
      {isLoading ? (
        <div>Loading...</div>
      ) : (
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
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Skin Scans",
  icon: "Sparkles",
})
