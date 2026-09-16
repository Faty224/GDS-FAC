import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  FileCode,
  Plus,
  Search,
  Eye,
  MoreVertical,
  Printer,
  X,
  ArrowRightLeft,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatDate, formatGNF, invoiceTotals } from "@/lib/format";
import { uid, useStore } from "@/lib/store";
import type { Invoice } from "@/lib/types";

export const Route = createFileRoute("/_espace/devis")({
  head: () => ({
    meta: [
      { title: "Devis & Proforma — GDS Facture" },
      {
        name: "description",
        content: "Gestion des devis et factures proforma avec conversion en facture.",
      },
    ],
  }),
  component: DevisPage,
});

function DevisPage() {
  const { invoices, customers, products, company, billingSettings, saveInvoice, logAudit } = useStore();

  const devisOnly = invoices.filter((i) => i.document_type === "devis");

  const [search, setSearch] = useState("");
  const [selectedDevis, setSelectedDevis] = useState<Invoice | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [convertModalDevis, setConvertModalDevis] = useState<Invoice | null>(null);

  // Form states
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Array<{ product_id: string; description: string; quantity: number; unit_price: number; vat_rate: number }>>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);

  const filteredDevis = devisOnly.filter((dev) => {
    const cust = customers.find((c) => c.id === dev.customer_id);
    const term = search.toLowerCase();
    return (
      dev.reference.toLowerCase().includes(term) ||
      (cust && cust.name.toLowerCase().includes(term))
    );
  });

  function handleAddLine() {
    if (!selectedProduct) {
      toast.error("Veuillez sélectionner un article.");
      return;
    }
    const prod = products.find((p) => p.id === selectedProduct);
    if (!prod) return;

    setLines((prev) => [
      ...prev,
      {
        product_id: prod.id,
        description: prod.label,
        quantity,
        unit_price: prod.unit_price,
        vat_rate: prod.vat_rate,
      },
    ]);

    setSelectedProduct("");
    setQuantity(1);
  }

  function handleCreateDevis(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) {
      toast.error("Veuillez choisir un client.");
      return;
    }
    if (lines.length === 0) {
      toast.error("Ajoutez au moins une ligne au devis.");
      return;
    }

    const count = devisOnly.length + 1;
    const refStr = `DEV-2026-${String(count).padStart(4, "0")}`;

    const newDevis: Invoice = {
      id: uid("dev"),
      company_id: company.id,
      document_type: "devis",
      parent_invoice_id: null,
      reference: refStr,
      internal_reference: `INT-${refStr}`,
      customer_id: customerId,
      billing_setting_id: billingSettings[0]?.id || "",
      issue_date: new Date().toISOString().split("T")[0],
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      status: "validee",
      etva_status: "non_transmis",
      etva_reference: null,
      etva_message: null,
      payment_status: "non_payee",
      paid_amount: 0,
      execution_note: notes,
      lines: lines.map((l) => ({ ...l, id: uid("line") })),
      history: [
        {
          id: uid("h"),
          label: "Création du devis",
          at: new Date().toISOString(),
          user: "Opérateur",
        },
      ],
      created_at: new Date().toISOString(),
    };

    saveInvoice(newDevis);
    logAudit("Création Devis", `Devis ${refStr} créé`);
    toast.success(`Devis ${refStr} créé avec succès !`);

    setOpenModal(false);
    setCustomerId("");
    setNotes("");
    setLines([]);
  }

  function handleConvertToInvoice(dev: Invoice) {
    const countFac = invoices.filter((i) => i.document_type === "facture").length + 1;
    const facRef = `FAC-2026-${String(countFac).padStart(4, "0")}`;

    const updated: Invoice = {
      ...dev,
      document_type: "facture",
      reference: facRef,
      status: "validee",
      history: [
        ...dev.history,
        {
          id: uid("h"),
          label: `Converti en facture (${facRef})`,
          at: new Date().toISOString(),
          user: "Opérateur",
        },
      ],
    };

    saveInvoice(updated);
    logAudit("Conversion Devis", `Devis ${dev.reference} converti en Facture ${facRef}`);
    toast.success(`Le devis ${dev.reference} a été converti en Facture ${facRef} !`);
    setConvertModalDevis(null);
  }

  return (
    <div>
      <PageHeader
        title="Devis & Factures Proforma"
        description="Créez des devis clients et convertissez-les en factures en un clic."
        actions={
          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 size-4" />
                Nouveau Devis
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un Devis / Facture Proforma</DialogTitle>
                <DialogDescription>
                  Sélectionnez le client et composez les lignes de votre devis.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateDevis} className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.nifp || "Sans NIF"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border border-border rounded-md p-3 space-y-3 bg-muted/20">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Ajouter des articles
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-1">
                      <Label htmlFor="prod" className="text-xs">Article / Service</Label>
                      <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                        <SelectTrigger>
                          <SelectValue placeholder="Article..." />
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
                    <div className="space-y-1">
                      <Label htmlFor="qty" className="text-xs">Qté</Label>
                      <Input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                    </div>
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={handleAddLine} className="w-full">
                    <Plus className="mr-2 size-3" /> Ajouter la ligne
                  </Button>
                </div>

                {lines.length > 0 && (
                  <div className="border border-border rounded-md p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Lignes ajoutées ({lines.length})
                    </p>
                    {lines.map((l, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-border last:border-0">
                        <span>{l.description} x{l.quantity}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono">{formatGNF(l.quantity * l.unit_price * 1.18)} TTC</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-6 text-rose-500 hover:text-rose-700"
                            onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="notes" className="text-xs">Conditions particulières / Valable 30 jours</Label>
                  <Input
                    placeholder="Ex: Modalités de paiement 30% acompte..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Créer le devis
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="mb-6">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par référence ou client..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Total : <span className="font-bold text-foreground">{filteredDevis.length}</span> devis enregistrés
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liste des Devis & Proformas</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date Émission</TableHead>
                <TableHead>Date Échéance</TableHead>
                <TableHead className="text-right">Total TTC</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevis.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun devis trouvé. Cliquez sur "Nouveau Devis" pour en créer un.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDevis.map((dev) => {
                  const cust = customers.find((c) => c.id === dev.customer_id);
                  const totals = invoiceTotals(dev);

                  return (
                    <TableRow key={dev.id}>
                      <TableCell className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {dev.reference}
                      </TableCell>
                      <TableCell className="font-medium">{cust?.name || "—"}</TableCell>
                      <TableCell>{formatDate(dev.issue_date)}</TableCell>
                      <TableCell>{dev.due_date ? formatDate(dev.due_date) : "—"}</TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatGNF(totals.ttc)}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          Devis Validé
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedDevis(dev)}>
                              <Eye className="mr-2 size-4" /> Aperçu A4
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setConvertModalDevis(dev)}
                              className="text-emerald-600 dark:text-emerald-400 font-semibold"
                            >
                              <ArrowRightLeft className="mr-2 size-4 text-emerald-600" />
                              Convertir en Facture
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Printable A4 Devis Preview Modal */}
      {selectedDevis && (() => {
        const cust = customers.find((c) => c.id === selectedDevis.customer_id);
        const totals = invoiceTotals(selectedDevis);

        return (
          <Dialog
            open={!!selectedDevis}
            onOpenChange={(open) => {
              if (!open) setSelectedDevis(null);
            }}
          >
            <DialogContent hideClose={true} className="max-w-4xl w-full max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-900/40 backdrop-blur-xs">
              <div className="no-print flex items-center justify-between border-b border-border bg-card px-6 py-4 shrink-0">
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <FileCode className="size-5 text-blue-600" />
                  Devis Officiel {selectedDevis.reference}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="mr-2 size-4" /> Imprimer le Devis
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => setSelectedDevis(null)}>
                    <X className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="p-8 overflow-y-auto bg-slate-100 dark:bg-slate-950 flex-1">
                <div className="mx-auto max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-sm text-xs font-sans space-y-8">
                  {/* Header */}
                  <div className="flex justify-between items-start border-b-2 border-blue-600 pb-6">
                    <div>
                      <h1 className="text-2xl font-black text-blue-900 uppercase tracking-wide">
                        {company.name}
                      </h1>
                      <p className="text-slate-600 mt-1">{company.address}</p>
                      <p className="text-slate-500 mt-0.5">
                        NIF : <span className="font-mono font-semibold">{company.nif}</span> | RCCM :{" "}
                        <span className="font-mono font-semibold">{company.rccm}</span>
                      </p>
                      <p className="text-slate-500">
                        Tél : {company.phone} | Email : {company.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="inline-block bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded font-bold text-sm uppercase">
                        DEVIS / FACTURE PROFORMA
                      </div>
                      <p className="text-slate-600 font-mono font-bold mt-2 text-sm">
                        {selectedDevis.reference}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        Date : {formatDate(selectedDevis.issue_date)}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        Validité : 30 jours
                      </p>
                    </div>
                  </div>

                  {/* Customer Block */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Destinataire du Devis :
                    </p>
                    <p className="text-sm font-bold text-slate-900">{cust?.name || "Client inconnu"}</p>
                    <p className="text-slate-600">{cust?.address || "Adresse non renseignée"}</p>
                    <p className="text-slate-500 font-mono text-[11px] mt-1">
                      NIF : {cust?.nifp || "Non renseigné"} | Tél : {cust?.phone || "—"}
                    </p>
                  </div>

                  {/* Lines Table */}
                  <div className="overflow-hidden rounded-md border border-slate-200">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-blue-900 text-white font-semibold text-[11px]">
                          <th className="py-2.5 px-3">Désignation / Description</th>
                          <th className="py-2.5 px-3 text-center">Qté</th>
                          <th className="py-2.5 px-3 text-right">P.U HT (GNF)</th>
                          <th className="py-2.5 px-3 text-center">TVA</th>
                          <th className="py-2.5 px-3 text-right">Total HT (GNF)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedDevis.lines.map((l) => (
                          <tr key={l.id}>
                            <td className="py-2.5 px-3 font-medium text-slate-900">{l.description}</td>
                            <td className="py-2.5 px-3 text-center font-mono">{l.quantity}</td>
                            <td className="py-2.5 px-3 text-right font-mono">{formatGNF(l.unit_price)}</td>
                            <td className="py-2.5 px-3 text-center font-mono">{l.vat_rate}%</td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold">
                              {formatGNF(l.quantity * l.unit_price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Total HT :</span>
                        <span className="font-semibold font-mono text-slate-900">{formatGNF(totals.ht)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>TVA (18%) :</span>
                        <span className="font-semibold font-mono text-slate-900">{formatGNF(totals.vat)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-300">
                        <span>Total TTC (GNF) :</span>
                        <span className="text-blue-700 font-mono text-base">{formatGNF(totals.ttc)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-200 text-slate-500 text-[11px] space-y-1">
                    <p className="font-semibold text-slate-700">Conditions de règlement :</p>
                    <p>{selectedDevis.execution_note || "Offre valable 30 jours à compter de la date d'émission. Règlement selon modalités convenues."}</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Convert to Invoice Confirmation Dialog */}
      {convertModalDevis && (
        <AlertDialog
          open={!!convertModalDevis}
          onOpenChange={(open) => {
            if (!open) setConvertModalDevis(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Voulez-vous vraiment convertir ce devis en facture ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action va générer automatiquement une facture définitive pour le devis{" "}
                <span className="font-mono font-bold">{convertModalDevis.reference}</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConvertModalDevis(null)}>
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleConvertToInvoice(convertModalDevis)}
              >
                Oui, convertir en Facture
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
