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
  X,
  CreditCard,
  Wallet,
  FileSpreadsheet,
  AlertTriangle,
  Trash2,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import {
  EtvaStatusBadge,
  InvoiceStatusBadge,
  PaymentStatusBadge,
} from "@/components/common/status-badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { downloadInvoicePdfDocument, printInvoiceDocument } from "@/lib/pdf";
import { uid, useStore } from "@/lib/store";
import { useInvoices, useCustomers, useProducts } from "@/services/useApiData";
import { invoicesService } from "@/services/resources.service";
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
  const store = useStore();
  const { company, billingSettings, registerPayment, payments, logAudit, can, currentUser } = store;
  
  const { data: invoices, loading, error, reload } = useInvoices([]);
  const { data: customers } = useCustomers([]);
  const { data: products } = useProducts([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openModal, setOpenModal] = useState(Boolean(searchParams.new));
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "validate" | "send_etva" | "delete";
    invoice: Invoice;
  } | null>(null);

  // Payment registration modal state
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"virement" | "cheque" | "orange_money" | "mtn_momo" | "especes">("virement");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  // Form state for creation
  const [customerId, setCustomerId] = useState("");
  const [dueDate, setDueDate] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState<number | "">("");
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

  function handleProductSelect(prodId: string) {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setCustomPrice(prod.unit_price);
    }
  }

  function handleAddItem() {
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) {
      toast.error("Veuillez sélectionner un produit ou service.");
      return;
    }
    const priceToUse = customPrice !== "" ? Number(customPrice) : prod.unit_price;
    setLines((prev) => [
      ...prev,
      {
        id: uid("line"),
        product_id: prod.id,
        description: prod.label,
        quantity: Number(quantity),
        unit_price: priceToUse,
        vat_rate: prod.vat_rate <= 1 ? prod.vat_rate : prod.vat_rate / 100,
      },
    ]);
    setSelectedProductId("");
    setQuantity(1);
    setCustomPrice("");
  }

  function handleRemoveLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  const creationSubtotalHT = lines.reduce((acc, l) => acc + l.quantity * l.unit_price, 0);
  const creationVat = creationSubtotalHT * 0.18;
  const creationTotalTTC = creationSubtotalHT + creationVat;

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) {
      toast.error("Veuillez choisir un client.");
      return;
    }
    if (lines.length === 0) {
      toast.error("Veuillez ajouter au moins une ligne d'article.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: Partial<Invoice> = {
        customer_id: customerId,
        document_type: "facture",
        due_date: dueDate || undefined,
        lines,
        execution_note: "Facture générée via GDS Facture",
      };
      await invoicesService.create(payload);
      reload();
      store.logAudit("Création Facture", "Facture");
      toast.success("Facture créée avec succès dans la base de données PostgreSQL.");
      setOpenModal(false);
      setCustomerId("");
      setDueDate("");
      setLines([]);
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de la création de la facture.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteInvoice(inv: Invoice) {
    try {
      await invoicesService.remove(inv.id);
      reload();
      store.logAudit("Suppression Brouillon", inv.reference);
      toast.success(`Facture brouillon ${inv.reference} supprimée avec succès.`);
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de la suppression de la facture.");
    }
  }

  async function handleValidate(inv: Invoice) {
    try {
      await invoicesService.validate(inv.id);
      reload();
      store.logAudit("Validation Facture", inv.reference);
      toast.success(`Facture ${inv.reference} validée avec succès.`);
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de la validation.");
    }
  }

  async function handleSendEtva(inv: Invoice) {
    try {
      await invoicesService.transmitEtva(inv.id);
      reload();
      store.logAudit("Transmission eTVA", inv.reference);
      toast.success(`Facture ${inv.reference} transmise à l'eTVA DGI.`);
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de la transmission eTVA.");
    }
  }

  async function handleDownloadPdfFile(inv: Invoice) {
    try {
      const blob = await invoicesService.downloadPdf(inv.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${inv.reference}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      const cust = customers.find((c) => c.id === inv.customer_id);
      await downloadInvoicePdfDocument(inv, company, cust);
    }
  }

  function handlePrintInvoice(inv: Invoice) {
    const cust = customers.find((c) => c.id === inv.customer_id);
    printInvoiceDocument(inv, company, cust);
  }

  function handleOpenPaymentModal(inv: Invoice) {
    const totals = invoiceTotals(inv);
    const paid = inv.paid_amount ?? 0;
    const remaining = Math.max(0, totals.ttc - paid);

    setPaymentModalInvoice(inv);
    setPaymentAmount(remaining);
    setPaymentMethod("virement");
    setPaymentRef("");
    setPaymentNote("");
  }

  function handleSubmitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentModalInvoice) return;

    const totals = invoiceTotals(paymentModalInvoice);
    if (paymentAmount <= 0) {
      toast.error("Le montant du règlement doit être supérieur à 0 GNF.");
      return;
    }

    const newPayment = {
      id: uid("pay"),
      invoice_id: paymentModalInvoice.id,
      amount: Number(paymentAmount),
      payment_date: new Date().toISOString().split("T")[0],
      method: paymentMethod,
      reference: paymentRef,
      note: paymentNote,
      created_at: new Date().toISOString(),
    };

    registerPayment(newPayment, totals.ttc);
    logAudit("Saisie de Règlement", `${paymentModalInvoice.reference} (${formatGNF(paymentAmount)})`);
    toast.success(`Règlement de ${formatGNF(paymentAmount)} enregistré sur la facture ${paymentModalInvoice.reference}.`);
    setPaymentModalInvoice(null);
  }

  const [reminderInvoice, setReminderInvoice] = useState<Invoice | null>(null);

  function handleExportCSV() {
    const headers = [
      "Référence",
      "Client",
      "Date Émission",
      "Date Échéance",
      "Total HT (GNF)",
      "TVA 18% (GNF)",
      "Total TTC (GNF)",
      "Déjà Payé (GNF)",
      "Reste à Payer (GNF)",
      "Statut Facture",
      "Statut Règlement",
      "Statut eTVA",
    ];

    const rows = facturesOnly.map((inv) => {
      const cust = customers.find((c) => c.id === inv.customer_id);
      const totals = invoiceTotals(inv);
      const paid = inv.paid_amount ?? 0;
      const remaining = Math.max(0, totals.ttc - paid);
      return [
        inv.reference,
        `"${cust?.name ?? ""}"`,
        inv.issue_date,
        inv.due_date ?? "",
        totals.ht,
        totals.vat,
        totals.ttc,
        paid,
        remaining,
        inv.status,
        inv.payment_status ?? "non_payee",
        inv.etva_status,
      ].join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `journal_ventes_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Journal des ventes exporté au format CSV !");
  }

  return (
    <div>
      <PageHeader
        title="Gestion des Factures"
        description="Consultez, créez et transmettez vos factures électroniques."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <FileSpreadsheet className="mr-2 size-4 text-emerald-600" />
              Exporter Journal (CSV)
            </Button>
            {can("manage_invoices") && (
              <Dialog open={openModal} onOpenChange={setOpenModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 size-4" />
                    Nouvelle Facture
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle facture</DialogTitle>
                  <DialogDescription>
                    Renseignez le client et ajoutez des articles au catalogue.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateInvoice} className="space-y-4 py-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="client">Client *</Label>
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

                    <div className="space-y-2">
                      <Label htmlFor="due_date">Date d'échéance de paiement</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="border border-border rounded-md p-3 space-y-3 bg-accent/20">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Ajouter une ligne d'article au catalogue
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-6">
                        <Label htmlFor="prod" className="text-xs">
                          Article / Prestation *
                        </Label>
                        <Select value={selectedProductId} onValueChange={handleProductSelect}>
                          <SelectTrigger id="prod">
                            <SelectValue placeholder="Choisir un article" />
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
                      <div className="sm:col-span-3">
                        <Label htmlFor="price_custom" className="text-xs">
                          Prix Unit. HT (GNF)
                        </Label>
                        <Input
                          id="price_custom"
                          type="number"
                          placeholder="Prix unitaire"
                          value={customPrice}
                          onChange={(e) => setCustomPrice(e.target.value ? Number(e.target.value) : "")}
                        />
                      </div>
                      <div className="sm:col-span-3">
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
                    <div className="border border-border rounded-md p-3 space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-semibold text-muted-foreground">
                          Lignes de facture ({lines.length})
                        </p>
                      </div>
                      <div className="divide-y divide-border">
                        {lines.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-sm py-2"
                          >
                            <div>
                              <p className="font-medium text-foreground">{it.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {it.quantity} x {formatGNF(it.unit_price)} (TVA 18%)
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold font-mono">
                                {formatGNF(it.unit_price * it.quantity)}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-7 text-rose-600 hover:text-rose-700"
                                onClick={() => handleRemoveLine(idx)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Financial summary during creation */}
                      <div className="pt-2 border-t border-border bg-slate-50 dark:bg-slate-900 p-3 rounded text-xs space-y-1">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Total HT :</span>
                          <span className="font-mono">{formatGNF(creationSubtotalHT)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>TVA DGI (18%) :</span>
                          <span className="font-mono">{formatGNF(creationVat)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-sm text-foreground pt-1 border-t border-border">
                          <span>Total TTC à payer :</span>
                          <span className="font-mono text-primary">{formatGNF(creationTotalTTC)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpenModal(false)} disabled={isSubmitting}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Création en cours...
                        </>
                      ) : (
                        "Créer la facture"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
          </div>
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
                  <TableHead>Règlement</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
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
                        <TableCell>
                          <PaymentStatusBadge status={inv.payment_status} dueDate={inv.due_date} />
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
                              {inv.status !== "brouillon" && can("manage_invoices") && (
                                <DropdownMenuItem onClick={() => handleOpenPaymentModal(inv)}>
                                  <CreditCard className="mr-2 size-4 text-emerald-600" /> Saisir un règlement
                                </DropdownMenuItem>
                              )}
                              {inv.status === "brouillon" && can("manage_invoices") && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => setConfirmAction({ type: "validate", invoice: inv })}
                                  >
                                    <CheckCircle2 className="mr-2 size-4 text-emerald-600" /> Valider
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setConfirmAction({ type: "delete", invoice: inv })}
                                    className="text-rose-600 focus:text-rose-600"
                                  >
                                    <Trash2 className="mr-2 size-4 text-rose-600" /> Supprimer le brouillon
                                  </DropdownMenuItem>
                                </>
                              )}
                              {inv.status !== "brouillon" && inv.payment_status !== "payee" && (
                                <DropdownMenuItem onClick={() => setReminderInvoice(inv)}>
                                  <AlertTriangle className="mr-2 size-4 text-amber-600" /> Relancer le client
                                </DropdownMenuItem>
                              )}
                              {inv.status === "validee" &&
                                inv.etva_status === "non_transmis" &&
                                can("transmit_etva") && (
                                  <DropdownMenuItem
                                    onClick={() => setConfirmAction({ type: "send_etva", invoice: inv })}
                                  >
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
        <Dialog
          open={!!selectedInvoice}
          onOpenChange={(open) => {
            if (!open) setSelectedInvoice(null);
          }}
        >
          <DialogContent hideClose={true} className="max-w-4xl w-full max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-900/40 backdrop-blur-xs">
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
                  onClick={() => handlePrintInvoice(selectedInvoice)}
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

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedInvoice(null)}
                  className="size-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 ml-2 cursor-pointer"
                  title="Fermer (Échap)"
                >
                  <X className="size-5" />
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
                      const paid = selectedInvoice.paid_amount ?? 0;
                      const remaining = Math.max(0, totals.ttc - paid);

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

                          {selectedInvoice.status !== "brouillon" && (
                            <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                              <div className="flex justify-between text-emerald-700 font-medium">
                                <span>Déjà réglé :</span>
                                <span className="font-mono">{formatGNF(paid)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                                <span>Reste à payer :</span>
                                <span className={remaining > 0 ? "text-rose-600 font-mono" : "text-emerald-600 font-mono"}>
                                  {formatGNF(remaining)}
                                </span>
                              </div>
                            </div>
                          )}
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

      {/* Payment Registration Modal */}
      {paymentModalInvoice && (() => {
        const totals = invoiceTotals(paymentModalInvoice);
        const paid = paymentModalInvoice.paid_amount ?? 0;
        const remaining = Math.max(0, totals.ttc - paid);

        return (
          <Dialog
            open={!!paymentModalInvoice}
            onOpenChange={(open) => {
              if (!open) setPaymentModalInvoice(null);
            }}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <CreditCard className="size-5 text-emerald-600" />
                  Saisir un Règlement
                </DialogTitle>
                <DialogDescription>
                  Facture <span className="font-mono font-bold">{paymentModalInvoice.reference}</span>
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmitPayment} className="space-y-4 py-2">
                {/* Financial Summary Box */}
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Facture TTC :</span>
                    <span className="font-mono font-bold">{formatGNF(totals.ttc)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Déjà encaissé :</span>
                    <span className="font-mono text-emerald-600 font-medium">{formatGNF(paid)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800 text-sm font-bold">
                    <span>Reste à régler :</span>
                    <span className="font-mono text-rose-600">{formatGNF(remaining)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Montant du Règlement (GNF)</label>
                  <Input
                    type="number"
                    min="1"
                    max={remaining}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Mode de Règlement</label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(val) =>
                      setPaymentMethod(val as any)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="virement">Virement Bancaire</SelectItem>
                      <SelectItem value="cheque">Chèque Bancaire</SelectItem>
                      <SelectItem value="orange_money">Orange Money</SelectItem>
                      <SelectItem value="mtn_momo">MTN Mobile Money</SelectItem>
                      <SelectItem value="especes">Espèces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Référence / Numéro de Chèque / N° Transaction</label>
                  <Input
                    placeholder="Ex: CHQ-98420 / OMY-20260916"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Note / Remarque (optionnel)</label>
                  <Input
                    placeholder="Ex: Acompte sur commande"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPaymentModalInvoice(null)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Enregistrer le Règlement
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Printable Reminder Letter Modal */}
      {reminderInvoice && (() => {
        const cust = customers.find((c) => c.id === reminderInvoice.customer_id);
        const totals = invoiceTotals(reminderInvoice);
        const paid = reminderInvoice.paid_amount ?? 0;
        const remaining = Math.max(0, totals.ttc - paid);

        return (
          <Dialog
            open={!!reminderInvoice}
            onOpenChange={(open) => {
              if (!open) setReminderInvoice(null);
            }}
          >
            <DialogContent hideClose={true} className="max-w-3xl w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-card">
              <div className="no-print flex items-center justify-between border-b border-border px-6 py-4 bg-muted/40">
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <AlertTriangle className="size-5 text-amber-600" />
                  Lettre de Relance Client — Facture {reminderInvoice.reference}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="mr-2 size-4" /> Imprimer la relance
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => setReminderInvoice(null)}>
                    <X className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto text-slate-800 text-sm font-sans bg-white leading-relaxed">
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{company.name}</h3>
                    <p className="text-xs text-slate-500">{company.address}</p>
                    <p className="text-xs text-slate-500">NIF : {company.nif} | RCCM : {company.rccm}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Date : {new Date().toLocaleDateString("fr-FR")}</p>
                    <p className="text-xs text-slate-500">Conakry, République de Guinée</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded border border-slate-200 text-xs space-y-1">
                  <p className="font-bold text-slate-900">Destinataire :</p>
                  <p className="font-semibold text-slate-800">{cust?.name}</p>
                  <p className="text-slate-600">{cust?.address || "Adresse non renseignée"}</p>
                  <p className="text-slate-600">Email: {cust?.email} | Tél: {cust?.phone}</p>
                </div>

                <div className="space-y-3">
                  <p className="font-bold uppercase text-xs tracking-wider text-slate-700">
                    OBJET : RAPPEL DE RÈGLEMENT — FACTURE N° {reminderInvoice.reference}
                  </p>
                  <p>Sauf erreur ou omission de notre part, nous constatons que le règlement de la facture citée en référence n'a pas encore été crédité sur notre compte bancaire.</p>
                  
                  <div className="my-4 border border-slate-200 rounded overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold">
                        <tr>
                          <th className="p-2.5">Facture</th>
                          <th className="p-2.5">Date Émission</th>
                          <th className="p-2.5">Échéance</th>
                          <th className="p-2.5 text-right">Montant TTC</th>
                          <th className="p-2.5 text-right">Acompte</th>
                          <th className="p-2.5 text-right">Reste à payer</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-slate-200 font-mono">
                          <td className="p-2.5 font-bold">{reminderInvoice.reference}</td>
                          <td className="p-2.5">{formatDate(reminderInvoice.issue_date)}</td>
                          <td className="p-2.5 text-rose-600 font-bold">{reminderInvoice.due_date ? formatDate(reminderInvoice.due_date) : "Immédiat"}</td>
                          <td className="p-2.5 text-right">{formatGNF(totals.ttc)}</td>
                          <td className="p-2.5 text-right text-emerald-600">{formatGNF(paid)}</td>
                          <td className="p-2.5 text-right font-bold text-rose-600">{formatGNF(remaining)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p>Nous vous prions de bien vouloir procéder à son règlement d'un montant de <strong className="font-mono text-rose-700">{formatGNF(remaining)}</strong> dans les meilleurs délais, par virement bancaire sur le compte ci-dessous :</p>
                  
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded text-xs text-blue-900 font-mono">
                    <p><strong>Banque :</strong> {company.bank_name}</p>
                    <p><strong>N° Compte / RIB :</strong> {company.bank_account}</p>
                  </div>

                  <p className="text-xs text-slate-500 pt-2">Si votre règlement nous a été envoyé entre-temps, nous vous prions de ne pas tenir compte de la présente relance.</p>
                </div>

                <div className="pt-8 flex justify-between items-end text-xs">
                  <div className="text-slate-400">GDS Facture - Module Relance Client</div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">Le Service Comptabilité</p>
                    <p className="text-slate-500">{company.name}</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Action Confirmation Modal */}
      {confirmAction && (
        <AlertDialog
          open={!!confirmAction}
          onOpenChange={(open) => {
            if (!open) setConfirmAction(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmAction.type === "validate"
                  ? "Voulez-vous vraiment valider cette facture ?"
                  : confirmAction.type === "send_etva"
                  ? "Voulez-vous vraiment transmettre cette facture à l'eTVA ?"
                  : "Voulez-vous vraiment supprimer ce brouillon ?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction.type === "validate"
                  ? `Voulez-vous vraiment valider la facture ${confirmAction.invoice.reference} ? Une fois validée, la facture devient définitive et ne pourra plus être modifiée.`
                  : confirmAction.type === "send_etva"
                  ? `Voulez-vous vraiment transmettre la facture ${confirmAction.invoice.reference} à la Direction Générale des Impôts (eTVA DGI) ?`
                  : `Cette action supprimera définitivement la facture brouillon ${confirmAction.invoice.reference} de la base de données.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmAction(null)}>
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                className={confirmAction.type === "delete" ? "bg-rose-600 hover:bg-rose-700 text-white" : ""}
                onClick={() => {
                  if (confirmAction.type === "validate") {
                    handleValidate(confirmAction.invoice);
                  } else if (confirmAction.type === "send_etva") {
                    handleSendEtva(confirmAction.invoice);
                  } else if (confirmAction.type === "delete") {
                    handleDeleteInvoice(confirmAction.invoice);
                  }
                  setConfirmAction(null);
                }}
              >
                {confirmAction.type === "validate"
                  ? "Oui, valider la facture"
                  : confirmAction.type === "send_etva"
                  ? "Oui, transmettre à l'eTVA"
                  : "Oui, supprimer le brouillon"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
