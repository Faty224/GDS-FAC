import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Search,
  Send,
  CheckCircle2,
  Download,
  Eye,
  MoreVertical,
  Filter,
  Printer,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EtvaStatusBadge, InvoiceStatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatGNF, invoiceTotals } from "@/lib/format";
import { uid, useStore } from "@/lib/store";
import type { Invoice, InvoiceLine } from "@/lib/types";

export const Route = createFileRoute("/_espace/factures")({
  validateSearch: (search: Record<string, unknown>) => ({
    new: search.new === true || search.new === "true" || search.new === 1,
  }),
  head: () => ({
    meta: [
      { title: "Gestion des Factures — GDS Facture" },
      {
        name: "description",
        content:
          "Créez, validez et transmettez vos factures électroniques en conformité avec la DGI.",
      },
    ],
  }),
  component: FacturesPage,
});

function FacturesPage() {
  const searchParams = Route.useSearch();
  const {
    company,
    invoices,
    customers,
    products,
    billingSettings,
    saveInvoice,
    validateInvoice,
    registerTransmission,
    logAudit,
    can,
    currentUser,
  } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openModal, setOpenModal] = useState(Boolean(searchParams.new));
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Form state for creation
  const [customerId, setCustomerId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [lines, setLines] = useState<InvoiceLine[]>([]);

  const facturesOnly = invoices.filter((i) => i.document_type === "facture");

  const filteredInvoices = facturesOnly.filter((inv) => {
    const customer = customers.find((c) => c.id === inv.customer_id);
    const matchesSearch =
      inv.reference.toLowerCase().includes(search.toLowerCase()) ||
      (customer?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function handleAddItem() {
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) {
      toast.error("Veuillez sélectionner un produit.");
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        id: uid("line"),
        product_id: prod.id,
        description: prod.label,
        quantity: Number(quantity),
        unit_price: prod.unit_price,
        vat_rate: prod.vat_rate,
      },
    ]);
    setSelectedProductId("");
    setQuantity(1);
  }

  function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) {
      toast.error("Veuillez choisir un client.");
      return;
    }
    if (lines.length === 0) {
      toast.error("Veuillez ajouter au moins une ligne d'article.");
      return;
    }

    const defaultSetting = billingSettings[0];
    const refNumber = String(facturesOnly.length + 1).padStart(4, "0");
    const today = new Date().toISOString().split("T")[0]!;
    const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]!;

    const newInv: Invoice = {
      id: uid("inv"),
      company_id: company.id,
      document_type: "facture",
      parent_invoice_id: null,
      reference: `FAC-2026-${refNumber}`,
      internal_reference: `INT-${refNumber}`,
      customer_id: customerId,
      billing_setting_id: defaultSetting?.id ?? "",
      issue_date: today,
      due_date: dueDate,
      execution_note: "Facture générée via GDS Facture",
      lines,
      status: "brouillon",
      etva_status: "non_transmis",
      etva_reference: null,
      etva_message: null,
      created_at: new Date().toISOString(),
      history: [
        {
          id: uid("h"),
          label: "Création de la facture (Brouillon)",
          at: new Date().toISOString(),
          user: currentUser?.full_name ?? "Utilisateur",
        },
      ],
    };

    saveInvoice(newInv);
    logAudit("Création Facture", newInv.reference);
    toast.success(`Facture ${newInv.reference} créée avec succès (Brouillon).`);
    setOpenModal(false);
    setCustomerId("");
    setLines([]);
  }

  function handleValidate(inv: Invoice) {
    validateInvoice(inv.id);
    logAudit("Validation Facture", inv.reference);
    toast.success(`Facture ${inv.reference} validée.`);
  }

  function handleSendEtva(inv: Invoice) {
    const etvaRef = `DGI-ETVA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    registerTransmission(
      {
        id: uid("etv"),
        invoice_id: inv.id,
        invoice_reference: inv.reference,
        document_type: "facture",
        sent_at: new Date().toISOString(),
        status: "accepte",
        dgi_reference: etvaRef,
        message: "Transmission acceptée par le serveur eTVA DGI",
        http_status: 200,
        duration_ms: 145,
        operation: "SUBMIT_INVOICE",
        mode: "simulation",
      },
      {
        status: "transmise",
        etva_status: "accepte",
        etva_reference: etvaRef,
        etva_message: "Validé par eTVA DGI",
      },
    );
    logAudit("Transmission eTVA", inv.reference);
    toast.success(`Facture ${inv.reference} transmise à l'eTVA DGI (${etvaRef}).`);
  }

  function handleDownloadPdf(inv: Invoice) {
    setSelectedInvoice(inv);
  }

  return (
    <div>
      <PageHeader
        title="Gestion des Factures"
        description="Consultez, créez et transmettez vos factures électroniques."
        actions={
          can("manage_invoices") ? (
            <Dialog open={openModal} onOpenChange={setOpenModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 size-4" />
                  Nouvelle Facture
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle facture</DialogTitle>
                  <DialogDescription>
                    Renseignez le client et ajoutez des articles au catalogue.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateInvoice} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="client">Client</Label>
                    <Select value={customerId} onValueChange={setCustomerId}>
                      <SelectTrigger id="client">
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.nifp || "Sans NIFp"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border border-border rounded-md p-3 space-y-3 bg-accent/20">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Ajouter une ligne d'article
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <Label htmlFor="prod" className="text-xs">
                          Produit / Service
                        </Label>
                        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                          <SelectTrigger id="prod">
                            <SelectValue placeholder="Choisir un produit" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.label} ({formatGNF(p.unit_price)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="qty" className="text-xs">
                          Quantité
                        </Label>
                        <Input
                          id="qty"
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddItem}
                      className="w-full"
                    >
                      <Plus className="mr-2 size-3" /> Ajouter la ligne
                    </Button>
                  </div>

                  {lines.length > 0 && (
                    <div className="border border-border rounded-md p-3 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Lignes ajoutées ({lines.length})
                      </p>
                      {lines.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-sm py-1 border-b last:border-0 border-border"
                        >
                          <span>
                            {it.description} x{it.quantity}
                          </span>
                          <span className="font-medium">
                            {formatGNF(it.unit_price * it.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">Créer la facture</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      {/* Filters & Search */}
      <Card className="mb-6">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par réf. ou client..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <Filter className="size-4 text-muted-foreground mr-1 shrink-0" />
            {(["all", "brouillon", "validee", "transmise", "rejetee"] as const).map((st) => (
              <Badge
                key={st}
                variant={statusFilter === st ? "default" : "outline"}
                className="cursor-pointer capitalize text-xs px-2.5 py-1"
                onClick={() => setStatusFilter(st)}
              >
                {st === "all" ? "Toutes" : st}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            Liste des Factures ({filteredInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total HT</TableHead>
                  <TableHead className="text-right">TVA (18%)</TableHead>
                  <TableHead className="text-right">Total TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>eTVA</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground text-sm"
                    >
                      Aucune facture trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((inv) => {
                    const totals = invoiceTotals(inv);
                    const cust = customers.find((c) => c.id === inv.customer_id);
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-semibold">{inv.reference}</TableCell>
                        <TableCell>{cust?.name ?? "—"}</TableCell>
                        <TableCell>{formatDate(inv.issue_date)}</TableCell>
                        <TableCell className="text-right">{formatGNF(totals.ht)}</TableCell>
                        <TableCell className="text-right">{formatGNF(totals.vat)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatGNF(totals.ttc)}
                        </TableCell>
                        <TableCell>
                          <InvoiceStatusBadge status={inv.status} />
                        </TableCell>
                        <TableCell>
                          <EtvaStatusBadge status={inv.etva_status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedInvoice(inv)}>
                                <Eye className="mr-2 size-4" /> Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPdf(inv)}>
                                <Download className="mr-2 size-4" /> Télécharger PDF
                              </DropdownMenuItem>
                              {inv.status === "brouillon" && can("manage_invoices") && (
                                <DropdownMenuItem onClick={() => handleValidate(inv)}>
                                  <CheckCircle2 className="mr-2 size-4 text-emerald-600" /> Valider
                                </DropdownMenuItem>
                              )}
                              {inv.status === "validee" &&
                                inv.etva_status === "non_transmis" &&
                                can("transmit_etva") && (
                                  <DropdownMenuItem onClick={() => handleSendEtva(inv)}>
                                    <Send className="mr-2 size-4 text-blue-600" /> Transmettre eTVA
                                  </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Facture {selectedInvoice.reference}</DialogTitle>
              <DialogDescription>Détails du document et calculs légaux eTVA.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Client :</span>
                <span className="font-medium">
                  {customers.find((c) => c.id === selectedInvoice.customer_id)?.name}
                </span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Statut Document :</span>
                <InvoiceStatusBadge status={selectedInvoice.status} />
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Statut eTVA :</span>
                <EtvaStatusBadge status={selectedInvoice.etva_status} />
              </div>
              <div className="bg-accent/30 p-3 rounded-md space-y-1">
                <div className="flex justify-between">
                  <span>Total HT :</span>
                  <span>{formatGNF(invoiceTotals(selectedInvoice).ht)}</span>
                </div>
                <div className="flex justify-between">
                  <span>TVA (18%) :</span>
                  <span>{formatGNF(invoiceTotals(selectedInvoice).vat)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
                  <span>Total TTC :</span>
                  <span className="text-primary">
                    {formatGNF(invoiceTotals(selectedInvoice).ttc)}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter className="flex justify-between items-center w-full">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 size-4" />
                Imprimer / Exporter PDF
              </Button>
              <Button onClick={() => setSelectedInvoice(null)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
