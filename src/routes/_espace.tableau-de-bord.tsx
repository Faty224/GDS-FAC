import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { FileText, Send, TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/common/page-header";
import { EtvaStatusBadge, InvoiceStatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { demoRevenueSeries } from "@/lib/demo-data";
import { formatDate, formatGNF, invoiceTotals } from "@/lib/format";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_espace/tableau-de-bord")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — GDS Facture" },
      {
        name: "description",
        content: "Vue d'ensemble du chiffre d'affaires, de la TVA et des transmissions eTVA.",
      },
      { property: "og:title", content: "Tableau de bord — GDS Facture" },
      {
        property: "og:description",
        content: "Chiffre d'affaires, TVA collectée et suivi des transmissions.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { invoices, customers } = useStore();
  const factures = invoices.filter((i) => i.document_type === "facture");
  const ca = factures.reduce((s, i) => s + invoiceTotals(i).ht, 0);
  const tva = factures.reduce((s, i) => s + invoiceTotals(i).vat, 0);
  const aTransmettre = invoices.filter(
    (i) => i.etva_status === "non_transmis" && i.status !== "brouillon",
  ).length;
  const recentes = [...invoices]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 6);

  const kpis = [
    { label: "Chiffre d'affaires HT", value: formatGNF(ca), icon: TrendingUp },
    { label: "TVA collectée", value: formatGNF(tva), icon: FileText },
    { label: "À transmettre", value: String(aTransmettre), icon: Send },
    {
      label: "Clients actifs",
      value: String(customers.filter((c) => c.is_active).length),
      icon: Users,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre activité de facturation."
        actions={
          <Button onClick={() => toast.info("Module de facturation en cours d'intégration.")}>
            <FileText className="mr-2 size-4" />
            Nouvelle facture
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="flex items-start justify-between gap-3 pt-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {k.label}
                </p>
                <p className="mt-2 text-xl font-semibold text-foreground">{k.value}</p>
              </div>
              <span className="flex size-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <k.icon className="size-4" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Chiffre d'affaires et TVA (6 derniers mois)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demoRevenueSeries}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(0 0% 0% / 0.06)"
                  vertical={false}
                />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  tickFormatter={(v: number) => `${Math.round(v / 1_000_000)}M`}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  width={40}
                />
                <Tooltip formatter={(v: number) => formatGNF(v)} />
                <Bar dataKey="ca" name="CA HT" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tva" name="TVA" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition par statut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(["brouillon", "validee", "acceptee", "rejetee"] as const).map((status) => {
              const count = invoices.filter((i) => i.status === status).length;
              return (
                <div key={status} className="flex items-center justify-between">
                  <InvoiceStatusBadge status={status} />
                  <span className="text-sm font-medium text-foreground">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Documents récents</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>eTVA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentes.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.reference}</TableCell>
                    <TableCell>
                      {customers.find((c) => c.id === inv.customer_id)?.name ?? "—"}
                    </TableCell>
                    <TableCell>{formatDate(inv.issue_date)}</TableCell>
                    <TableCell className="text-right">
                      {formatGNF(invoiceTotals(inv).ttc)}
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell>
                      <EtvaStatusBadge status={inv.etva_status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
