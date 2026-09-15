import { defineRouteConfig } from "@medusajs/admin-sdk"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { Container, Heading, Text, Table } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/config" // usually medusa client is used or fetch

export default function SearchAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["search-analytics"],
    queryFn: () => fetch("/admin/search-analytics", {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("medusa-admin-token") || ""}` // Fallback, usually admin dashboard handles auth cookies automatically for /admin routes
      }
    }).then((res) => res.json())
  })

  const logs = data?.search_logs || []

  return (
    <Container>
      <div className="flex flex-col gap-4">
        <Heading level="h1">Analyse des Recherches</Heading>
        <Text className="text-ui-fg-subtle">
          Consultez les termes les plus recherchés par vos clients via la barre de recherche intelligente.
        </Text>
        
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Terme recherché</Table.HeaderCell>
              <Table.HeaderCell>Résultats trouvés</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading && (
              <Table.Row>
                <Table.Cell colSpan={3}>Chargement...</Table.Cell>
              </Table.Row>
            )}
            {!isLoading && logs.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={3}>Aucune donnée de recherche pour le moment.</Table.Cell>
              </Table.Row>
            )}
            {logs.map((log: any) => (
              <Table.Row key={log.id}>
                <Table.Cell className="font-semibold">{log.term}</Table.Cell>
                <Table.Cell>{log.results_count}</Table.Cell>
                <Table.Cell>{new Date(log.created_at).toLocaleString("fr-FR")}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Recherches",
  icon: MagnifyingGlassIcon,
})
