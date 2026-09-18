import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  Search,
  Download,
  ShieldCheck,
  Activity,
  UserCheck,
  Lock,
  Filter,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
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
import { useStore } from "@/lib/store";
import { useAuditLogs } from "@/services/useApiData";

export const Route = createFileRoute("/_espace/journaux")({
  head: () => ({
    meta: [
      { title: "Journaux d'Audit — GDS Facture" },
      {
        name: "description",
        content:
          "Historique inaltérable des actions utilisateurs et de la conformité fiscale eTVA.",
      },
    ],
  }),
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const store = useStore();
  const { data: apiLogs, loading } = useAuditLogs([]);
  const auditLogs = apiLogs.length > 0 ? apiLogs : store.audit ?? [];

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.target ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesAction =
      actionFilter === "all" ||
      (actionFilter === "facture" && log.action.toLowerCase().includes("facture")) ||
      (actionFilter === "etva" && log.action.toLowerCase().includes("etva")) ||
      (actionFilter === "user" && log.action.toLowerCase().includes("utilisateur"));

    return matchesSearch && matchesAction;
  });

  function handleExportCsv() {
    toast.info("Génération du rapport CSV du journal d'audit...");
    const header = "ID;Date_Heure;Utilisateur;Action;Cible_Details;Resultat\n";
    const body = filteredLogs
      .map(
        (l) =>
          `${l.id};${new Date(l.at).toLocaleString("fr-FR")};"${l.user}";"${l.action}";"${l.target ?? ""}";"${l.result}"`,
      )
      .join("\n");

    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `journal_audit_gds_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Rapport d'audit téléchargé avec succès.");
  }

  return (
    <div>
      <PageHeader
        title="Journaux d'Audit & Sécurité"
        description="Traçabilité continue et inaltérable de l'ensemble des opérations effectuées sur la plateforme."
        actions={
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="mr-2 size-4" />
            Exporter CSV
          </Button>
        }
      />

      {/* Security Banner */}
      <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
            <Lock className="size-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-emerald-900 dark:text-emerald-200">
              Journalisation Securisée eTVA DGI
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Chaque suppression, création ou transmission génère un enregistrement horodaté
              infalsifiable.
            </p>
          </div>
        </div>
        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
          <ShieldCheck className="mr-1 size-3.5" /> Conforme DGI
        </Badge>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total Événements Audit
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{auditLogs.length}</p>
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
                Actions sur Factures
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {
                  auditLogs.filter(
                    (l) =>
                      l.action.toLowerCase().includes("facture") ||
                      l.action.toLowerCase().includes("avoir"),
                  ).length
                }
              </p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <FileText className="size-5" />
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Opérations Utilisateurs
              </p>
              <p className="mt-2 text-2xl font-bold text-purple-600">
                {auditLogs.filter((l) => l.action.toLowerCase().includes("utilisateur")).length}
              </p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <UserCheck className="size-5" />
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher action, utilisateur, pièce..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <Filter className="size-4 text-muted-foreground mr-1 shrink-0" />
            {(["all", "facture", "etva", "user"] as const).map((af) => (
              <Badge
                key={af}
                variant={actionFilter === af ? "default" : "outline"}
                className="cursor-pointer text-xs px-2.5 py-1"
                onClick={() => setActionFilter(af)}
              >
                {af === "all"
                  ? "Toutes les actions"
                  : af === "facture"
                    ? "Factures & Avoirs"
                    : af === "etva"
                      ? "Transmissions eTVA"
                      : "Utilisateurs"}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            Registre Horodaté ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Heure</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Action Exécutée</TableHead>
                  <TableHead>Cible / Détails</TableHead>
                  <TableHead className="text-right">Horodatage ISO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground text-sm"
                    >
                      Aucun événement d'audit enregistré.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.at).toLocaleString("fr-FR")}
                      </TableCell>
                      <TableCell className="font-semibold text-sm">{log.user}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            log.action.includes("eTVA")
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : log.action.includes("Création")
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                          }
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.target ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-[11px] text-muted-foreground">
                        {log.at}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
