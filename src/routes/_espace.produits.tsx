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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatGNF } from "@/lib/format";
import { uid, useStore } from "@/lib/store";
import type { Product, ProductKind } from "@/lib/types";

export const Route = createFileRoute("/_espace/produits")({
  head: () => ({
    meta: [
      { title: "Produits & services — GDS Facture" },
      {
        name: "description",
        content: "Catalogue des produits et services facturables avec prix et taux de TVA.",
      },
      { property: "og:title", content: "Produits & services — GDS Facture" },
      {
        property: "og:description",
        content: "Catalogue facturable : références, prix unitaires et TVA.",
      },
    ],
  }),
  component: ProductsPage,
});

const empty = (company_id: string): Product => ({
  id: uid("prd"),
  company_id,
  reference: "",
  label: "",
  kind: "service",
  unit_price: 0,
  vat_rate: 18,
  unit: "unité",
  is_active: true,
});

function ProductsPage() {
  const { products, company, saveProduct, deleteProduct, can, logAudit } = useStore();
  const editable = can("manage_products");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Product | null>(null);

  const filtered = products.filter((p) =>
    [p.reference, p.label].join(" ").toLowerCase().includes(search.toLowerCase()),
  );

  function submit() {
    if (!draft) return;
    if (!draft.reference.trim() || !draft.label.trim()) {
      toast.error("La référence et le libellé sont obligatoires.");
      return;
    }
    saveProduct(draft);
    logAudit("Enregistrement produit", draft.reference);
    toast.success("Élément enregistré.");
    setDraft(null);
  }

  return (
    <div>
      <PageHeader
        title="Produits & services"
        description="Catalogue utilisé pour composer vos lignes de facture."
        actions={
          editable ? (
            <Button onClick={() => setDraft(empty(company.id))}>
              <Plus className="mr-2 size-4" />
              Nouvel élément
            </Button>
          ) : null
        }
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <Input
            placeholder="Rechercher une référence ou un libellé…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />

          {filtered.length === 0 ? (
            <EmptyState
              title="Aucun élément"
              description="Aucun produit ou service ne correspond."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Prix unitaire HT</TableHead>
                    <TableHead className="text-right">TVA</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.reference}</TableCell>
                      <TableCell>{p.label}</TableCell>
                      <TableCell className="capitalize">{p.kind}</TableCell>
                      <TableCell className="text-right">{formatGNF(p.unit_price)}</TableCell>
                      <TableCell className="text-right">{p.vat_rate} %</TableCell>
                      <TableCell>
                        <Badge variant={p.is_active ? "secondary" : "outline"}>
                          {p.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {editable ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDraft({ ...p })}
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
                              title="Supprimer cet élément ?"
                              description={`${p.label} sera retiré du catalogue.`}
                              destructive
                              confirmLabel="Supprimer"
                              onConfirm={() => {
                                deleteProduct(p.id);
                                logAudit("Suppression produit", p.reference);
                                toast.success("Élément supprimé.");
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {draft && products.some((p) => p.id === draft.id)
                ? "Modifier l'élément"
                : "Nouvel élément"}
            </DialogTitle>
            <DialogDescription>
              Les montants sont exprimés en francs guinéens (GNF).
            </DialogDescription>
          </DialogHeader>
          {draft ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Référence</Label>
                <Input
                  value={draft.reference}
                  onChange={(e) => setDraft({ ...draft, reference: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={draft.kind}
                  onValueChange={(v) => setDraft({ ...draft, kind: v as ProductKind })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="produit">Produit</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Libellé</Label>
                <Input
                  value={draft.label}
                  onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Prix unitaire HT</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.unit_price}
                  onChange={(e) => setDraft({ ...draft, unit_price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Taux de TVA (%)</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.vat_rate}
                  onChange={(e) => setDraft({ ...draft, vat_rate: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unité</Label>
                <Input
                  value={draft.unit}
                  onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="prd-active"
                  checked={draft.is_active}
                  onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
                />
                <Label htmlFor="prd-active">Actif</Label>
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
