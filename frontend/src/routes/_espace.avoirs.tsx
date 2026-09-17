import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  FileDiff,
  Plus,
  Search,
  Send,
  CheckCircle2,
  Download,
  Eye,
  MoreVertical,
  Filter,
  Printer,
  FileText,
  X,
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
import type { Invoice } from "@/lib/types";

export const Route = createFileRoute("/_espace/avoirs")({
  head: () => ({
    meta: [
      { title: "Factures d'Avoir — GDS Facture" },
      {
        name: "description",
        content: "Gérez vos notes d'avoir et réajustements de facturation transmis à l'eTVA.",
      },
    ],
  }),
  component: AvoirsPage,
});

function AvoirsPage() {
  const {
    company,
    invoices,
    customers,
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
  const [openModal, setOpenModal] = useState(false);
  const [selectedAvoir, setSelectedAvoir] = useState<Invoice | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "validate" | "send_etva";
    avoir: Invoice;
  } | null>(null);

  // Form state
  const [parentInvoiceId, setParentInvoiceId] = useState("");
  const [reason, setReason] = useState("Erreur de facturation");

  const avoirsOnly = invoices.filter((i) => i.document_type === "avoir");
  const validatedFactures = invoices.filter(
    (i) => i.document_type === "facture" && (i.status === "validee" || i.status === "transmise"),
  );

  const filteredAvoirs = avoirsOnly.filter((av) => {
    const customer = customers.find((c) => c.id === av.customer_id);
    const parentInv = invoices.find((i) => i.id === av.parent_invoice_id);
    const matchesSearch =
      av.reference.toLowerCase().includes(search.toLowerCase()) ||
      (customer?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (parentInv?.reference ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || av.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function handleCreateAvoir(e: React.FormEvent) {
    e.preventDefault();
    const parentInv = invoices.find((i) => i.id === parentInvoiceId);
    if (!parentInv) {
      toast.error("Veuillez sélectionner une facture d'origine validée.");
      return;
    }

    const defaultSetting = billingSettings[0];
    const refNumber = String(avoirsOnly.length + 1).padStart(4, "0");
    const today = new Date().toISOString().split("T")[0]!;

    const newAvoir: Invoice = {
      id: uid("av"),
      company_id: company.id,
      document_type: "avoir",
      parent_invoice_id: parentInv.id,
      reference: `AV-2026-${refNumber}`,
      internal_reference: `INT-AV-${refNumber}`,
      customer_id: parentInv.customer_id,
      billing_setting_id: defaultSetting?.id ?? "",
      issue_date: today,
      due_date: today,
      execution_note: `Avoir sur facture ${parentInv.reference} — Motif: ${reason}`,
      lines: parentInv.lines.map((l) => ({ ...l, id: uid("line") })),
      status: "brouillon",
      etva_status: "non_transmis",
      etva_reference: null,
      etva_message: null,
      created_at: new Date().toISOString(),
      history: [
        {
          id: uid("h"),
          label: `Création de l'avoir sur ${parentInv.reference}`,
          at: new Date().toISOString(),
          user: currentUser?.full_name ?? "Utilisateur",
        },
      ],
    };

    saveInvoice(newAvoir);
    logAudit("Création Avoir", newAvoir.reference);
    toast.success(`Facture d'avoir ${newAvoir.reference} créée (Brouillon).`);
    setOpenModal(false);
    setParentInvoiceId("");
  }

  function handleValidate(av: Invoice) {
    validateInvoice(av.id);
    logAudit("Validation Avoir", av.reference);
    toast.success(`Avoir ${av.reference} validé.`);
  }

  function handleSendEtva(av: Invoice) {
    const etvaRef = `DGI-AVOIR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    registerTransmission(
      {
        id: uid("etv"),
        invoice_id: av.id,
        invoice_reference: av.reference,
        document_type: "avoir",
        sent_at: new Date().toISOString(),
        status: "accepte",
        dgi_reference: etvaRef,
        message: "Avoir enregistré par le serveur eTVA DGI",
        http_status: 200,
        duration_ms: 130,
        operation: "SUBMIT_CREDIT_NOTE",
        mode: "simulation",
      },
      {
        status: "transmise",
        etva_status: "accepte",
        etva_reference: etvaRef,
        etva_message: "Avoir validé par eTVA DGI",
      },
    );
    logAudit("Transmission eTVA Avoir", av.reference);
    toast.success(`Avoir ${av.reference} transmis à l'eTVA DGI (${etvaRef}).`);
  }

  async function handleDownloadPdfFile(av: Invoice) {
    const cust = customers.find((c) => c.id === av.customer_id);
    await downloadInvoicePdfDocument(av, company, cust);
  }

  function handlePrintInvoice(av: Invoice) {
    const cust = customers.find((c) => c.id === av.customer_id);
    printInvoiceDocument(av, company, cust);
  }

  return (
    <div>
      <PageHeader
        title="Factures d'Avoir"
        description="Gérez les annulations et rectifications de facturation liées aux factures validées."
        actions={
          can("manage_invoices") ? (
            <Dialog open={openModal} onOpenChange={setOpenModal}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 size-4" />
                  Nouvel Avoir
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Créer une facture d'avoir</DialogTitle>
                  <DialogDescription>
                    Sélectionnez la facture d'origine à annuler ou rectifier.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateAvoir} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="parent">Facture d'origine</Label>
                    <Select value={parentInvoiceId} onValueChange={setParentInvoiceId}>
                      <SelectTrigger id="parent">
                        <SelectValue placeholder="Choisir une facture validée" />
                      </SelectTrigger>
                      <SelectContent>
                        {validatedFactures.map((f) => {
                          const cust = customers.find((c) => c.id === f.customer_id);
                          return (
                            <SelectItem key={f.id} value={f.id}>
                              {f.reference} — {cust?.name} ({formatGNF(invoiceTotals(f).ttc)})
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Motif de l'avoir</Label>
                    <Select value={reason} onValueChange={setReason}>
                      <SelectTrigger id="reason">
                        <SelectValue placeholder="Choisir un motif" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Erreur de facturation">Erreur de facturation</SelectItem>
                        <SelectItem value="Retour marchandise">
                          Retour marchandise / prestation non exécutée
                        </SelectItem>
                        <SelectItem value="Remise commerciale">
                          Remise commerciale ultérieure
                        </SelectItem>
                        <SelectItem value="Autre motif légal">Autre motif légal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">Générer l'avoir</Button>
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
              placeholder="Rechercher par réf., client, motif..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <Filter className="size-4 text-muted-foreground mr-1 shrink-0" />
            {(["all", "brouillon", "validee", "transmise"] as const).map((st) => (
              <Badge
                key={st}
                variant={statusFilter === st ? "default" : "outline"}
                className="cursor-pointer capitalize text-xs px-2.5 py-1"
                onClick={() => setStatusFilter(st)}
              >
                {st === "all" ? "Tous" : st}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Avoirs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileDiff className="size-4 text-amber-600" />
            Liste des Notes d'Avoir ({filteredAvoirs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Réf. Avoir</TableHead>
                  <TableHead>Facture d'origine</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Montant TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>eTVA</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAvoirs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground text-sm"
                    >
                      Aucune note d'avoir enregistrée.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAvoirs.map((av) => {
                    const totals = invoiceTotals(av);
                    const cust = customers.find((c) => c.id === av.customer_id);
                    const parent = invoices.find((i) => i.id === av.parent_invoice_id);
                    return (
                      <TableRow key={av.id}>
                        <TableCell className="font-semibold text-amber-700">
                          {av.reference}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {parent?.reference ?? "—"}
                        </TableCell>
                        <TableCell>{cust?.name ?? "—"}</TableCell>
                        <TableCell>{formatDate(av.issue_date)}</TableCell>
                        <TableCell className="text-right font-semibold text-rose-600">
                          -{formatGNF(totals.ttc)}
                        </TableCell>
                        <TableCell>
                          <InvoiceStatusBadge status={av.status} />
                        </TableCell>
                        <TableCell>
                          <EtvaStatusBadge status={av.etva_status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedAvoir(av)}>
                                <Eye className="mr-2 size-4" /> Voir détails
                              </DropdownMenuItem>
                              {av.status === "brouillon" && can("manage_invoices") && (
                                <DropdownMenuItem
                                  onClick={() => setConfirmAction({ type: "validate", avoir: av })}
                                >
                                  <CheckCircle2 className="mr-2 size-4 text-emerald-600" /> Valider
                                </DropdownMenuItem>
                              )}
                              {av.status === "validee" &&
                                av.etva_status === "non_transmis" &&
                                can("transmit_etva") && (
                                  <DropdownMenuItem
                                    onClick={() => setConfirmAction({ type: "send_etva", avoir: av })}
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

      {/* Avoir Details & Official Printable Preview Modal */}
      {selectedAvoir && (() => {
        const customer = customers.find((c) => c.id === selectedAvoir.customer_id);
        const parentInv = invoices.find((i) => i.id === selectedAvoir.parent_invoice_id);
        const totals = invoiceTotals(selectedAvoir);

        return (
          <Dialog
            open={!!selectedAvoir}
            onOpenChange={(open) => {
              if (!open) setSelectedAvoir(null);
            }}
          >
            <DialogContent hideClose={true} className="max-w-4xl w-full max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-900/40 backdrop-blur-xs">
              {/* Modal Control Header (no-print) */}
              <div className="no-print flex items-center justify-between border-b border-border bg-card px-6 py-4 shrink-0">
                <div>
                  <DialogTitle className="text-lg font-bold flex items-center gap-2">
                    <FileText className="size-5 text-rose-600" />
                    Avoir Officiel {selectedAvoir.reference}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Note d'annulation / rectification conforme aux exigences de la Direction Générale des Impôts (eTVA DGI).
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrintInvoice(selectedAvoir)}
                    className="gap-1.5 border-slate-300 dark:border-slate-700"
                  >
                    <Printer className="size-4 text-slate-700 dark:text-slate-200" />
                    Imprimer l'avoir
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleDownloadPdfFile(selectedAvoir)}
                    className="gap-1.5 bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
                  >
                    <Download className="size-4" />
                    Télécharger en PDF
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedAvoir(null)}
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
                  id={`printable-invoice-${selectedAvoir.id}`}
                  className="print-document mx-auto max-w-3xl bg-white text-slate-900 p-8 sm:p-10 rounded-lg shadow-md border border-slate-200 text-sm space-y-8"
                >
                  {/* Company Header & Document Meta */}
                  <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-6">
                    <div className="flex items-start gap-4">
                      <img
                        src="/logo.png"
                        alt="Logo Entreprise"
                        className="h-16 w-auto object-contain rounded"
                      />
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">{company.name}</h2>
                        <p className="text-xs text-slate-500 font-medium">
                          Facturation & Services Électroniques
                        </p>
                        <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                          <p>
                            <span className="font-semibold">NIF :</span> {company.nif} |{" "}
                            <span className="font-semibold">RCCM :</span> {company.rccm}
                          </p>
                          <p>
                            {company.address}, {company.city}
                          </p>
                          <p>
                            Tél : {company.phone} | Email : {company.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right space-y-1">
                      <span className="inline-block px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded uppercase tracking-wider">
                        NOTE D'AVOIR
                      </span>
                      <h3 className="text-lg font-mono font-bold text-slate-900">
                        {selectedAvoir.reference}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Date d'émission :{" "}
                        <span className="font-medium text-slate-700">
                          {formatDate(selectedAvoir.issue_date)}
                        </span>
                      </p>
                      {parentInv && (
                        <p className="text-xs text-rose-700 font-medium">
                          Annulation de la Facture : <span className="font-mono">{parentInv.reference}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Billing Information Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                    <div>
                      <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                        Émetteur / Vendeur
                      </p>
                      <p className="font-bold text-slate-900 text-sm">{company.name}</p>
                      <p>{company.address}</p>
                      <p>{company.city}, Guinée</p>
                      <p className="mt-1 text-slate-500">NIF : {company.nif}</p>
                    </div>

                    <div>
                      <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                        Avoir Destiné à / Client
                      </p>
                      <p className="font-bold text-slate-900 text-sm">
                        {customer?.name || "Client non spécifié"}
                      </p>
                      {customer?.nifp && (
                        <p className="font-mono text-slate-700">
                          <span className="font-semibold">NIFp :</span> {customer.nifp}
                        </p>
                      )}
                      {customer?.contact_name && <p>Contact : {customer.contact_name}</p>}
                      {customer?.phone && <p>Tél : {customer.phone}</p>}
                      {customer?.email && <p>Email : {customer.email}</p>}
                    </div>
                  </div>

                  {/* Execution Note / Reason */}
                  {selectedAvoir.execution_note && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded text-xs">
                      <span className="font-bold">Motif de l'Avoir : </span>
                      {selectedAvoir.execution_note}
                    </div>
                  )}

                  {/* Invoice Lines Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-700 border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                          <th className="p-2.5 text-center">#</th>
                          <th className="p-2.5">Désignation / Article</th>
                          <th className="p-2.5 text-center">Quantité</th>
                          <th className="p-2.5 text-right">Prix Unitaire HT</th>
                          <th className="p-2.5 text-center">TVA (%)</th>
                          <th className="p-2.5 text-right">Montant HT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedAvoir.lines.map((line, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 text-center text-slate-400 font-mono">
                              {idx + 1}
                            </td>
                            <td className="p-2.5 font-medium text-slate-900">
                              {line.description}
                            </td>
                            <td className="p-2.5 text-center font-semibold">{line.quantity}</td>
                            <td className="p-2.5 text-right font-mono">
                              {formatGNF(line.unit_price)}
                            </td>
                            <td className="p-2.5 text-center font-mono">
                              {(line.vat_rate * 100).toFixed(0)}%
                            </td>
                            <td className="p-2.5 text-right font-semibold font-mono text-rose-700">
                              -{formatGNF(line.quantity * line.unit_price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals Section */}
                  <div className="flex flex-col sm:flex-row justify-between items-start pt-2 gap-4">
                    <div className="text-xs text-slate-500 max-w-sm space-y-1">
                      <p className="font-semibold text-slate-700">Information d'Annulation :</p>
                      <p>
                        Cet avoir vient en déduction du montant dû sur la facture initiale{" "}
                        {parentInv?.reference || ""}.
                      </p>
                    </div>

                    <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Total Avoir HT :</span>
                        <span className="font-mono font-medium text-rose-700">
                          -{formatGNF(totals.ht)}
                        </span>
                      </div>

                      <div className="flex justify-between text-slate-600">
                        <span>TVA Avoir (18%) :</span>
                        <span className="font-mono font-medium text-rose-700">
                          -{formatGNF(totals.vat)}
                        </span>
                      </div>

                      <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-300">
                        <span>Total Avoir TTC :</span>
                        <span className="font-mono text-rose-700">-{formatGNF(totals.ttc)}</span>
                      </div>
                    </div>
                  </div>

                  {/* eTVA Legal Compliance Footer */}
                  <div className="border-t-2 border-dashed border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs gap-4">
                    <div className="flex items-center gap-3 bg-emerald-50 text-emerald-900 p-3 rounded-md border border-emerald-200">
                      <div className="bg-emerald-600 text-white p-2 rounded-full font-bold text-[10px]">
                        eTVA
                      </div>
                      <div>
                        <p className="font-bold text-[11px]">
                          Certification eTVA DGI Guinée
                        </p>
                        <p className="font-mono text-[11px] text-emerald-700">
                          {selectedAvoir.etva_reference ||
                            `DGI-SIMULATED-${selectedAvoir.reference}`}
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
                  ? "Voulez-vous vraiment valider cet avoir ?"
                  : "Voulez-vous vraiment transmettre cet avoir à l'eTVA ?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction.type === "validate"
                  ? `Voulez-vous vraiment valider l'avoir ${confirmAction.avoir.reference} ? Une fois validé, il devient définitif.`
                  : `Voulez-vous vraiment transmettre l'avoir ${confirmAction.avoir.reference} à la Direction Générale des Impôts (eTVA DGI) ?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmAction(null)}>
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (confirmAction.type === "validate") {
                    handleValidate(confirmAction.avoir);
                  } else {
                    handleSendEtva(confirmAction.avoir);
                  }
                  setConfirmAction(null);
                }}
              >
                {confirmAction.type === "validate"
                  ? "Oui, valider l'avoir"
                  : "Oui, transmettre à l'eTVA"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
