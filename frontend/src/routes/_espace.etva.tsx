import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Code2,
  RefreshCw,
  Zap,
  Activity,
  CheckCheck,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EtvaStatusBadge, InvoiceStatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatGNF, invoiceTotals } from "@/lib/format";
import { uid, useStore } from "@/lib/store";
import type { EtvaTransmission, Invoice } from "@/lib/types";

export const Route = createFileRoute("/_espace/etva")({
  head: () => ({
    meta: [
      { title: "Espace eTVA DGI — GDS Facture" },
      {
        name: "description",
        content: "Suivi des transmissions électroniques de factures et avoirs vers le serveur DGI.",
      },
    ],
  }),
  component: EtvaPage,
});

function EtvaPage() {
  const { invoices, transmissions, registerTransmission, logAudit, can } = useStore();

  const [selectedTransmission, setSelectedTransmission] = useState<EtvaTransmission | null>(null);

  // Ready queue: Validated documents that haven't been accepted yet
  const readyQueue = invoices.filter(
    (i) => (i.status === "validee" || i.status === "brouillon") && i.etva_status !== "accepte",
  );

  const totalSent = transmissions.length;
  const acceptedSent = transmissions.filter((t) => t.status === "accepte").length;
  const rejectedSent = transmissions.filter(
    (t) => t.status === "rejete" || t.status === "erreur",
  ).length;
  const successRate = totalSent > 0 ? Math.round((acceptedSent / totalSent) * 100) : 100;

  function handleTransmitSingle(inv: Invoice) {
    const etvaRef = `DGI-ETVA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const newTrans: EtvaTransmission = {
      id: uid("etv"),
      invoice_id: inv.id,
      invoice_reference: inv.reference,
      document_type: inv.document_type === "avoir" ? "avoir" : "facture",
      sent_at: new Date().toISOString(),
      status: "accepte",
      dgi_reference: etvaRef,
      message: "Transmission certifiée et validée par le serveur DGI eTVA",
      http_status: 200,
      duration_ms: Math.floor(Math.random() * 100) + 80,
      operation: inv.document_type === "avoir" ? "SUBMIT_CREDIT_NOTE" : "SUBMIT_INVOICE",
      mode: "simulation",
    };

    registerTransmission(newTrans, {
      status: "transmise",
      etva_status: "accepte",
      etva_reference: etvaRef,
      etva_message: "Certifié eTVA DGI",
    });

    logAudit("Transmission eTVA", inv.reference);
    toast.success(`Document ${inv.reference} transmis à la DGI avec succès (${etvaRef}).`);
  }

  function handleTransmitAll() {
    if (readyQueue.length === 0) {
      toast.info("Aucun document en attente de transmission.");
      return;
    }

    let count = 0;
    readyQueue.forEach((inv) => {
      const etvaRef = `DGI-ETVA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      registerTransmission(
        {
          id: uid("etv"),
          invoice_id: inv.id,
          invoice_reference: inv.reference,
          document_type: inv.document_type === "avoir" ? "avoir" : "facture",
          sent_at: new Date().toISOString(),
          status: "accepte",
          dgi_reference: etvaRef,
          message: "Batch - Validé eTVA",
          http_status: 200,
          duration_ms: 110,
          operation: inv.document_type === "avoir" ? "SUBMIT_CREDIT_NOTE" : "SUBMIT_INVOICE",
          mode: "simulation",
        },
        {
          status: "transmise",
          etva_status: "accepte",
          etva_reference: etvaRef,
          etva_message: "Certifié eTVA DGI",
        },
      );
      count++;
    });

    logAudit("Transmission eTVA par lot", `${count} documents`);
    toast.success(`Lot de ${count} document(s) transmis avec succès à l'eTVA DGI.`);
  }

  return (
    <div>
      <PageHeader
        title="Espace eTVA DGI"
        description="Module officiel de transmission électronique et de suivi des jetons de conformité fiscale."
        actions={
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 py-1.5 px-3"
            >
              <Zap className="mr-1.5 size-3.5 fill-emerald-500 text-emerald-500" />
              Mode Simulation Active
            </Badge>
            {can("transmit_etva") && readyQueue.length > 0 && (
              <Button
                onClick={handleTransmitAll}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCheck className="mr-2 size-4" />
                Transmettre tout ({readyQueue.length})
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total Transmissions
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{totalSent}</p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Activity className="size-5" />
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Certifiées / Acceptées
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">{acceptedSent}</p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 className="size-5" />
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Rejets / Erreurs DGI
              </p>
              <p className="mt-2 text-2xl font-bold text-rose-600">{rejectedSent}</p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              <AlertTriangle className="size-5" />
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Taux de Conformité
              </p>
              <p className="mt-2 text-2xl font-bold text-primary">{successRate}%</p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <RefreshCw className="size-5" />
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue" className="relative">
            File d'Attente ({readyQueue.length})
            {readyQueue.length > 0 && (
              <span className="ml-2 inline-flex size-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger value="history">
            Historique des Transmissions ({transmissions.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Queue */}
        <TabsContent value="queue">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="size-4 text-amber-500" />
                Documents Prêts pour l'eTVA
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Date Émission</TableHead>
                    <TableHead className="text-right">Montant TTC</TableHead>
                    <TableHead>Statut Actuel</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readyQueue.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground text-sm"
                      >
                        Tous les documents sont à jour et certifiés par la DGI !
                      </TableCell>
                    </TableRow>
                  ) : (
                    readyQueue.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell>
                          <Badge
                            variant={inv.document_type === "facture" ? "default" : "secondary"}
                          >
                            {inv.document_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{inv.reference}</TableCell>
                        <TableCell>{formatDate(inv.issue_date)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatGNF(invoiceTotals(inv).ttc)}
                        </TableCell>
                        <TableCell>
                          <InvoiceStatusBadge status={inv.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {can("transmit_etva") && (
                            <Button size="sm" onClick={() => handleTransmitSingle(inv)}>
                              <Send className="mr-1.5 size-3.5" /> Transmettre DGI
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="size-4 text-primary" />
                Journal d'Historique des Requêtes eTVA DGI
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date / Heure</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Opération</TableHead>
                    <TableHead>Statut DGI</TableHead>
                    <TableHead>Réf. DGI</TableHead>
                    <TableHead className="text-right">Temps (ms)</TableHead>
                    <TableHead className="text-right">Payload JSON</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transmissions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground text-sm"
                      >
                        Aucune transmission enregistrée pour le moment.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transmissions.map((tr) => (
                      <TableRow key={tr.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(tr.sent_at).toLocaleString("fr-FR")}
                        </TableCell>
                        <TableCell className="font-semibold">{tr.invoice_reference}</TableCell>
                        <TableCell className="text-xs font-mono">{tr.operation}</TableCell>
                        <TableCell>
                          <EtvaStatusBadge status={tr.status} />
                        </TableCell>
                        <TableCell className="text-xs font-mono font-medium text-emerald-700 dark:text-emerald-400">
                          {tr.dgi_reference ?? "—"}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono">
                          {tr.duration_ms} ms
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTransmission(tr)}
                            className="h-7 text-xs"
                          >
                            <Code2 className="mr-1 size-3" /> Inspecter
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* JSON Payload Inspection Modal */}
      {selectedTransmission && (
        <Dialog open={!!selectedTransmission} onOpenChange={() => setSelectedTransmission(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-mono text-base">
                <Code2 className="size-4 text-primary" />
                Payload eTVA — {selectedTransmission.invoice_reference}
              </DialogTitle>
              <DialogDescription>
                Structure des données envoyées et réponse de l'API DGI (Swagger / OpenAPI).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="flex justify-between items-center bg-accent/40 p-2 rounded border border-border">
                <span className="font-mono">HTTP {selectedTransmission.http_status} OK</span>
                <Badge variant="outline" className="text-emerald-700 bg-emerald-50">
                  {selectedTransmission.mode.toUpperCase()}
                </Badge>
              </div>

              <div>
                <p className="font-semibold mb-1 text-muted-foreground">
                  Exemple de Payload Trame JSON :
                </p>
                <pre className="p-3 bg-slate-950 text-slate-100 rounded-md font-mono text-[11px] overflow-x-auto leading-relaxed">
                  {JSON.stringify(
                    {
                      header: {
                        system: "GDS Facture",
                        operation: selectedTransmission.operation,
                        timestamp: selectedTransmission.sent_at,
                      },
                      document: {
                        reference: selectedTransmission.invoice_reference,
                        type: selectedTransmission.document_type,
                        dgi_token: selectedTransmission.dgi_reference,
                        status: selectedTransmission.status,
                      },
                      response: {
                        code: 200,
                        message: selectedTransmission.message,
                      },
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setSelectedTransmission(null)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
