import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { uid, useStore } from "@/lib/store";
import type { Customer } from "@/lib/types";

export const Route = createFileRoute("/_espace/clients")({
  head: () => ({
    meta: [
      { title: "Clients — GDS Facture" },
      {
        name: "description",
        content: "Gérez le référentiel clients : NIFp, contacts et coordonnées.",
      },
      { property: "og:title", content: "Clients — GDS Facture" },
      { property: "og:description", content: "Référentiel clients de votre entreprise." },
    ],
  }),
  component: CustomersPage,
});

const empty = (company_id: string): Customer => ({
  id: uid("cus"),
  company_id,
  name: "",
  nifp: "",
  contact_name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  is_active: true,
  created_at: new Date().toISOString(),
});

function CustomersPage() {
  const { customers, company, saveCustomer, deleteCustomer, can, logAudit } = useStore();
  const editable = can("manage_customers");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Customer | null>(null);

  const filtered = customers.filter((c) =>
    [c.name, c.nifp, c.city, c.email].join(" ").toLowerCase().includes(search.toLowerCase()),
  );

  function submit() {
    if (!draft) return;
    if (!draft.name.trim() || !draft.nifp.trim()) {
      toast.error("Le nom et le NIFp sont obligatoires.");
      return;
    }
    saveCustomer(draft);
    logAudit("Enregistrement client", draft.name);
    toast.success("Client enregistré.");
    setDraft(null);
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Référentiel des clients facturés par votre entreprise."
        actions={
          editable ? (
            <Button onClick={() => setDraft(empty(company.id))}>
              <Plus className="mr-2 size-4" />
              Nouveau client
            </Button>
          ) : null
        }
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <Input
            placeholder="Rechercher un client, un NIFp, une ville…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />

          {filtered.length === 0 ? (
            <EmptyState
              title="Aucun client"
              description="Aucun client ne correspond à votre recherche."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>NIFp</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.nifp}</TableCell>
                      <TableCell>
                        <div className="text-sm">{c.contact_name}</div>
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                      </TableCell>
                      <TableCell>{c.city}</TableCell>
                      <TableCell>
                        <Badge variant={c.is_active ? "secondary" : "outline"}>
                          {c.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {editable ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDraft({ ...c })}
                              aria-label="Modifier"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <ConfirmDialog
                              trigger={
                                <Button variant="ghost" size="icon" aria-label="Supprimer">
                                  <Trash2 className="size-4 text-destructive" />
                                </Button>
                              }
                              title="Supprimer ce client ?"
                              description={`${c.name} sera retiré du référentiel. Cette action est irréversible.`}
                              destructive
                              confirmLabel="Supprimer"
                              onConfirm={() => {
                                deleteCustomer(c.id);
                                logAudit("Suppression client", c.name);
                                toast.success("Client supprimé.");
                              }}
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Lecture seule</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={draft !== null} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {draft && customers.some((c) => c.id === draft.id)
                ? "Modifier le client"
                : "Nouveau client"}
            </DialogTitle>
            <DialogDescription>Le NIFp est requis pour la transmission eTVA.</DialogDescription>
          </DialogHeader>
          {draft ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Raison sociale"
                value={draft.name}
                onChange={(v) => setDraft({ ...draft, name: v })}
              />
              <Field
                label="NIFp"
                value={draft.nifp}
                onChange={(v) => setDraft({ ...draft, nifp: v })}
              />
              <Field
                label="Contact"
                value={draft.contact_name}
                onChange={(v) => setDraft({ ...draft, contact_name: v })}
              />
              <Field
                label="Téléphone"
                value={draft.phone}
                onChange={(v) => setDraft({ ...draft, phone: v })}
              />
              <Field
                label="Email"
                value={draft.email}
                onChange={(v) => setDraft({ ...draft, email: v })}
              />
              <Field
                label="Ville"
                value={draft.city}
                onChange={(v) => setDraft({ ...draft, city: v })}
              />
              <div className="sm:col-span-2">
                <Field
                  label="Adresse"
                  value={draft.address}
                  onChange={(v) => setDraft({ ...draft, address: v })}
                />
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <Switch
                  id="active"
                  checked={draft.is_active}
                  onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
                />
                <Label htmlFor="active">Client actif</Label>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Annuler
            </Button>
            <Button onClick={submit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
