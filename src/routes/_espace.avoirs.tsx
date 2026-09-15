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

  function handleDownloadPdf(av: Invoice) {
    toast.info(`Téléchargement du PDF d'avoir ${av.reference}...`);
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
                                <Eye className="mr-2 size-4" /> Détails
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPdf(av)}>
                                <Download className="mr-2 size-4" /> Télécharger PDF
                              </DropdownMenuItem>
                              {av.status === "brouillon" && can("manage_invoices") && (
                                <DropdownMenuItem onClick={() => handleValidate(av)}>
                                  <CheckCircle2 className="mr-2 size-4 text-emerald-600" /> Valider
                                </DropdownMenuItem>
                              )}
                              {av.status === "validee" &&
                                av.etva_status === "non_transmis" &&
                                can("transmit_etva") && (
                                  <DropdownMenuItem onClick={() => handleSendEtva(av)}>
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

      {/* Avoir Details Modal */}
      {selectedAvoir && (
        <Dialog open={!!selectedAvoir} onOpenChange={() => setSelectedAvoir(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Avoir {selectedAvoir.reference}</DialogTitle>
              <DialogDescription>Note d'annulation liée à la facture d'origine.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Facture Annulée :</span>
                <span className="font-mono font-medium">
                  {invoices.find((i) => i.id === selectedAvoir.parent_invoice_id)?.reference}
                </span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Client :</span>
                <span className="font-medium">
                  {customers.find((c) => c.id === selectedAvoir.customer_id)?.name}
                </span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Note / Motif :</span>
                <span className="italic">{selectedAvoir.execution_note}</span>
              </div>
              <div className="bg-rose-50 border border-rose-200 dark:bg-rose-950/30 p-3 rounded-md space-y-1">
                <div className="flex justify-between text-rose-800 dark:text-rose-300">
                  <span>Avoir HT :</span>
                  <span>-{formatGNF(invoiceTotals(selectedAvoir).ht)}</span>
                </div>
                <div className="flex justify-between text-rose-800 dark:text-rose-300">
                  <span>Avoir TVA (18%) :</span>
                  <span>-{formatGNF(invoiceTotals(selectedAvoir).vat)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1 border-t border-rose-200 text-rose-900 dark:text-rose-200">
                  <span>Total Avoir TTC :</span>
                  <span>-{formatGNF(invoiceTotals(selectedAvoir).ttc)}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedAvoir(null)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
