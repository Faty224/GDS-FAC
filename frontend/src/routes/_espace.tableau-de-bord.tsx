import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, TrendingUp, CreditCard, AlertCircle, Clock, Loader2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/common/page-header";
import { EtvaStatusBadge, InvoiceStatusBadge, PaymentStatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatDate, formatGNF } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useInvoices, useCustomers, useDashboardStats } from "@/services/useApiData";

export const Route = createFileRoute("/_espace/tableau-de-bord")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — GDS Facture" },
      { name: "description", content: "Vue d'ensemble du chiffre d'affaires, de la TVA et des transmissions eTVA." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const store = useStore();

  // En mode réel : charger factures & statistiques depuis Django
  const { data: invoices, loading: invLoading } = useInvoices([]);
  const { data: customers } = useCustomers([]);
  const { data: stats, loading: statsLoading } = useDashboardStats({});

  const factures = invoices.filter(i => i.document_type === "facture");

  // Préférer les stats backend si disponibles ; recalculer sur factures réelles sinon
  const ca = stats?.chiffre_affaires_ht != null
    ? stats.chiffre_affaires_ht
    : factures.reduce((s, i) => s + (i.lines || []).reduce((a, l) => a + l.quantity * l.unit_price, 0), 0);

  const totalTtc = factures.reduce((s, i) => {
    const ht = (i.lines || []).reduce((a, l) => a + l.quantity * l.unit_price, 0);
    return s + ht * (1 + ((i.lines?.[0]?.vat_rate ?? 0.18)));
  }, 0);

  const totalEncaisse = stats?.total_encaisse != null
    ? stats.total_encaisse
    : factures.reduce((s, i) => s + (i.paid_amount ?? 0), 0);

  const resteARecouvrer = stats?.reste_a_recouvrer != null
    ? stats.reste_a_recouvrer
    : Math.max(0, totalTtc - totalEncaisse);

  const totalEnRetard = stats?.factures_en_retard != null
    ? stats.factures_en_retard
    : factures.filter(i => i.due_date && new Date(i.due_date) < new Date() && i.status !== "brouillon" && i.payment_status !== "payee").length;

  const recentes = [...invoices].sort((a, b) => (b.created_at || "").localeCompare(a.created_at || "")).slice(0, 6);

  // Calculer série mensuelle depuis les factures réelles (6 derniers mois)
  const revenueSeries = (() => {
    const months: Record<string, { ca: number; tva: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("fr-FR", { month: "short" });
      months[key] = { ca: 0, tva: 0 };
    }
    factures.forEach(inv => {
      if (!inv.issue_date) return;
      const d = new Date(inv.issue_date);
      const monthDiff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (monthDiff < 0 || monthDiff > 5) return;
      const key = d.toLocaleDateString("fr-FR", { month: "short" });
      if (months[key]) {
        const ht = (inv.lines || []).reduce((a, l) => a + l.quantity * l.unit_price, 0);
        const tva = ht * ((inv.lines?.[0]?.vat_rate ?? 0.18));
        months[key].ca += ht;
        months[key].tva += tva;
      }
    });
    return Object.entries(months).map(([month, v]) => ({ month, ...v }));
  })();

  const isLoading = invLoading || statsLoading;

  const kpis = [
    { label: "Chiffre d'affaires HT", value: formatGNF(ca), icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
    { label: "Total Encaissé", value: formatGNF(totalEncaisse), icon: CreditCard, color: "text-emerald-600 bg-emerald-50" },
    { label: "Reste à Recouvrer", value: formatGNF(resteARecouvrer), icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Factures en Retard", value: String(totalEnRetard), icon: AlertCircle, color: "text-rose-600 bg-rose-50" },
  ];

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre activité de facturation et encaissements."
        actions={
          <Button asChild>
            <Link to="/factures" search={{ new: true }}>
              <FileText className="mr-2 size-4" />Nouvelle facture
            </Link>
          </Button>
        }
      />

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Loader2 className="size-4 animate-spin" />Chargement des données en cours…
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="flex items-start justify-between gap-3 pt-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{k.value}</p>
              </div>
              <span className={`flex size-10 items-center justify-center rounded-lg ${k.color}`}>
                <k.icon className="size-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle className="text-base">Chiffre d'affaires et TVA (6 derniers mois)</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 0% / 0.06)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickFormatter={(v: number) => `${Math.round(v / 1_000_000)}M`} tickLine={false} axisLine={false} fontSize={12} width={40} />
                <Tooltip formatter={(v: number) => formatGNF(v)} />
                <Bar dataKey="ca" name="CA HT" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tva" name="TVA" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Suivi des Règlements</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(["payee", "partiellement_payee", "non_payee"] as const).map(status => (
              <div key={status} className="flex items-center justify-between pb-2 border-b border-border last:border-0">
                <PaymentStatusBadge status={status} />
                <span className="font-semibold text-sm">
                  {factures.filter(i => (i.payment_status || "non_payee") === status).length} factures
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Documents récents</CardTitle></CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead><TableHead>Client</TableHead>
                  <TableHead>Date</TableHead><TableHead className="text-right">TTC</TableHead>
                  <TableHead>Statut</TableHead><TableHead>eTVA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentes.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                    {isLoading ? <Loader2 className="size-4 animate-spin inline mr-2" /> : null}
                    {isLoading ? "Chargement…" : "Aucune facture trouvée."}
                  </TableCell></TableRow>
                ) : recentes.map(inv => {
                  const customerName = customers.find(c => String(c.id) === String(inv.customer_id))?.name ?? "—";
                  const ttc = (inv.lines || []).reduce((s, l) => s + l.quantity * l.unit_price * (1 + l.vat_rate), 0);
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.reference}</TableCell>
                      <TableCell>{customerName}</TableCell>
                      <TableCell>{formatDate(inv.issue_date)}</TableCell>
                      <TableCell className="text-right">{formatGNF(ttc)}</TableCell>
                      <TableCell><InvoiceStatusBadge status={inv.status} /></TableCell>
                      <TableCell><EtvaStatusBadge status={inv.etva_status} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
