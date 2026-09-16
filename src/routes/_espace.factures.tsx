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

  async function handleDownloadPdfFile(inv: Invoice) {
    const el = document.getElementById(`printable-invoice-${inv.id}`);
    if (!el) {
      toast.error("Impossible de trouver le document de la facture.");
      return;
    }
    toast.info(`Préparation du fichier PDF pour la facture ${inv.reference}...`);
    try {
      // @ts-ignore html2pdf.js untyped module
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default || html2pdfModule;
      const opt = {
        margin: [8, 8, 8, 8] as [number, number, number, number],
        filename: `Facture_${inv.reference}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
      };
      await html2pdf().set(opt).from(el).save();
      toast.success(`Le fichier PDF ${inv.reference}.pdf a été téléchargé avec succès !`);
    } catch (err) {
      console.error("Erreur html2pdf:", err);
      toast.error(
        "Échec du téléchargement PDF. Utilisez l'option Imprimer > Enregistrer au format PDF.",
      );
    }
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

      {/* Invoice Details & Official Printable Preview Modal */}
      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-4xl w-full max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-900/40 backdrop-blur-xs">
            {/* Modal Control Header (no-print) */}
            <div className="no-print flex items-center justify-between border-b border-border bg-card px-6 py-4 shrink-0">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <FileText className="size-5 text-primary" />
                  Facture Officielle {selectedInvoice.reference}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Aperçu conforme aux exigences de la Direction Générale des Impôts (eTVA DGI).
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-1.5 border-slate-300 dark:border-slate-700"
                >
                  <Printer className="size-4 text-slate-700 dark:text-slate-200" />
                  Imprimer la facture
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleDownloadPdfFile(selectedInvoice)}
                  className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                >
                  <Download className="size-4" />
                  Télécharger en PDF
                </Button>

                <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(null)}>
                  Fermer
                </Button>
              </div>
            </div>

            {/* Printable A4 Document Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950">
              <div
                id={`printable-invoice-${selectedInvoice.id}`}
                className="print-document mx-auto max-w-3xl bg-white text-slate-900 p-8 sm:p-10 rounded-lg shadow-md border border-slate-200 text-sm space-y-8"
              >
                {/* Header Logo & Enterprise Info */}
                <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex size-14 items-center justify-center rounded-lg bg-white p-1 border border-slate-200 shadow-xs shrink-0">
                        <img
                          src="/logo.png"
                          alt="Logo GDS Facture"
                          className="size-full object-contain"
                        />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                          {company.name}
                        </h2>
                        <p className="text-xs text-slate-500">
                          Facturation & Services Électroniques
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                      <p>
                        <span className="font-semibold text-slate-800">NIF :</span> {company.nif} |{" "}
                        <span className="font-semibold text-slate-800">RCCM :</span> {company.rccm}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">Adresse :</span>{" "}
                        {company.address}, {company.city}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-800">Tél :</span> {company.phone}{" "}
                        | <span className="font-semibold text-slate-800">Email :</span>{" "}
                        {company.email}
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:w-auto w-full border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
                    <div className="inline-block px-3 py-1 rounded bg-primary/10 text-primary font-bold text-lg uppercase tracking-wider mb-2">
                      FACTURE
                    </div>
                    <p className="font-mono text-base font-bold text-slate-900">
                      {selectedInvoice.reference}
                    </p>
                    <p className="text-xs text-slate-500">
                      Date d'émission :{" "}
                      <span className="font-medium text-slate-800">
                        {formatDate(selectedInvoice.issue_date)}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Date d'échéance :{" "}
                      <span className="font-medium text-slate-800">
                        {formatDate(selectedInvoice.due_date)}
                      </span>
                    </p>

                    <div className="mt-3 flex justify-end gap-1.5">
                      <InvoiceStatusBadge status={selectedInvoice.status} />
                      <EtvaStatusBadge status={selectedInvoice.etva_status} />
                    </div>
                  </div>
                </div>

                {/* Client & Billing Info Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 text-primary">
                      Émetteur / Vendeur
                    </p>
                    <p className="font-semibold text-slate-900 text-sm">{company.name}</p>
                    <p className="text-slate-600">
                      {company.address}, {company.city}
                    </p>
                    <p className="text-slate-600">NIF : {company.nif}</p>
                    <p className="text-slate-600">RCCM : {company.rccm}</p>
                  </div>

                  {(() => {
                    const cust = customers.find((c) => c.id === selectedInvoice.customer_id);
                    return (
                      <div>
                        <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2 text-primary">
                          Facturé à / Client
                        </p>
                        <p className="font-bold text-slate-900 text-sm">
                          {cust?.name || "Client Inconnu"}
                        </p>
                        {cust?.nifp && (
                          <p className="text-slate-700 font-mono mt-0.5">
                            <span className="font-semibold">NIFp :</span> {cust.nifp}
                          </p>
                        )}
                        {cust?.contact_name && (
                          <p className="text-slate-600">Contact : {cust.contact_name}</p>
                        )}
                        {cust?.phone && <p className="text-slate-600">Tél : {cust.phone}</p>}
                        {cust?.email && <p className="text-slate-600">Email : {cust.email}</p>}
                        {cust?.address && (
                          <p className="text-slate-600">
                            Adresse : {cust.address}, {cust.city}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Items Table */}
                <div className="overflow-hidden border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <th className="p-3 w-8 text-center">#</th>
                        <th className="p-3">Désignation des biens / services</th>
                        <th className="p-3 text-center w-16">Qté</th>
                        <th className="p-3 text-right">P.U HT (GNF)</th>
                        <th className="p-3 text-center w-20">TVA</th>
                        <th className="p-3 text-right">Total HT (GNF)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {selectedInvoice.lines.map((line, idx) => (
                        <tr key={line.id || idx} className="hover:bg-slate-50/50">
                          <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-3 font-medium text-slate-900">{line.description}</td>
                          <td className="p-3 text-center font-semibold">{line.quantity}</td>
                          <td className="p-3 text-right font-mono">{formatGNF(line.unit_price)}</td>
                          <td className="p-3 text-center font-mono">
                            {(line.vat_rate * 100).toFixed(0)}%
                          </td>
                          <td className="p-3 text-right font-semibold font-mono">
                            {formatGNF(line.quantity * line.unit_price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals & RIB Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
                  <div className="space-y-3 sm:w-1/2 text-xs">
                    {company.bank_name && (
                      <div className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1">
                        <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                          Coordonnées Bancaires (RIB)
                        </p>
                        <p className="text-slate-600">
                          <span className="font-semibold">Banque :</span> {company.bank_name}
                        </p>
                        <p className="font-mono text-slate-800 text-[11px]">
                          <span className="font-semibold font-sans">N° Compte / RIB :</span>{" "}
                          {company.bank_account}
                        </p>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-500 italic">
                      Arrêté la présente facture à la somme TTC enregistrée auprès du système
                      d'information de l'administration fiscale.
                    </p>
                  </div>

                  <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 text-xs">
                    {(() => {
                      const totals = invoiceTotals(selectedInvoice);
                      return (
                        <>
                          <div className="flex justify-between text-slate-600">
                            <span>Total HT :</span>
                            <span className="font-semibold font-mono text-slate-900">
                              {formatGNF(totals.ht)}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>TVA (18%) :</span>
                            <span className="font-semibold font-mono text-slate-900">
                              {formatGNF(totals.vat)}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-300">
                            <span>Total TTC (GNF) :</span>
                            <span className="text-primary font-mono text-base">
                              {formatGNF(totals.ttc)}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* eTVA DGI Stamp & Signature Box */}
                <div className="border-t-2 border-dashed border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
                  <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
                    <CheckCircle2 className="size-8 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-xs uppercase tracking-wide">
                        Certification eTVA DGI Guinée
                      </p>
                      <p className="font-mono text-[11px] text-emerald-700">
                        {selectedInvoice.etva_reference ||
                          `DGI-SIMULATED-${selectedInvoice.reference}`}
                      </p>
                      <p className="text-[10px] text-emerald-600">
                        Conforme à la loi de finances - République de Guinée
                      </p>
                    </div>
                  </div>

                  <div className="text-center sm:text-right text-slate-500 text-[11px]">
                    <p className="font-semibold text-slate-700">
                      La Direction Générale de l'Entreprise
                    </p>
                    <p className="mt-8 text-slate-400 font-mono text-[10px]">
                      [ Timbre et Signature Électronique ]
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
