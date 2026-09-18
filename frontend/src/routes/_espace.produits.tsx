import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Package, Plus, Search, CheckCircle2, XCircle, MoreVertical,
  Trash2, Edit, Tag, Briefcase, Layers, Loader2, AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatGNF } from "@/lib/format";
import { useStore } from "@/lib/store";
import { productsService } from "@/services/resources.service";
import { useProducts } from "@/services/useApiData";
import type { Product, ProductKind } from "@/lib/types";

export const Route = createFileRoute("/_espace/produits")({
  head: () => ({
    meta: [
      { title: "Catalogue Produits & Services — GDS Facture" },
      { name: "description", content: "Gérez votre catalogue de biens et prestations de services avec tarification et taux de TVA." },
    ],
  }),
  component: ProduitsPage,
});

function ProduitsPage() {
  const store = useStore();
  const { data: products, loading, error, reload } = useProducts([]);

  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [openModal, setOpenModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [reference, setReference] = useState("");
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<ProductKind>("produit");
  const [unitPrice, setUnitPrice] = useState<number>(100000);
  const [vatRate, setVatRate] = useState<number>(18);
  const [unit, setUnit] = useState("U");

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = p.label.toLowerCase().includes(q) || (p.reference || "").toLowerCase().includes(q);
    const matchesKind = kindFilter === "all" || p.kind === kindFilter;
    return matchesSearch && matchesKind;
  });

  function handleOpenCreate() {
    setEditingProduct(null);
    setReference(`REF-${String(products.length + 1).padStart(3, "0")}`);
    setLabel(""); setKind("produit"); setUnitPrice(100000); setVatRate(18); setUnit("U");
    setOpenModal(true);
  }

  function handleOpenEdit(p: Product) {
    setEditingProduct(p);
    const rawVat = Number(p.vat_rate || 18);
    const normalizedVat = rawVat <= 1 ? rawVat * 100 : rawVat;
    setReference(p.reference || ""); setLabel(p.label); setKind(p.kind);
    setUnitPrice(p.unit_price); setVatRate(normalizedVat); setUnit(p.unit || "U");
    setOpenModal(true);
  }

  const handleSaveProduct = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) { toast.error("Veuillez indiquer la désignation du produit ou service."); return; }
    setSaving(true);
    try {
      const payload: Partial<Product> = {
        reference: reference.trim(), label: label.trim(), kind,
        unit_price: Number(unitPrice), vat_rate: Number(vatRate), unit: unit.trim() || "U",
      };
      if (editingProduct) { await productsService.update(editingProduct.id, payload); }
      else { await productsService.create(payload); }
      reload();
      store.logAudit(editingProduct ? "Modification Produit" : "Création Produit", label.trim());
      toast.success(`Article ${label.trim()} ${editingProduct ? "mis à jour" : "créé"} avec succès.`);
      setOpenModal(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }, [label, reference, kind, unitPrice, vatRate, unit, editingProduct, store, reload]);

  const handleToggleActive = useCallback(async (p: Product) => {
    try {
      await productsService.update(p.id, { is_active: !p.is_active }); reload();
      store.logAudit(!p.is_active ? "Activation Produit" : "Désactivation Produit", p.label);
      toast.success(`Article ${p.label} ${!p.is_active ? "activé" : "désactivé"}.`);
    } catch (e: any) { toast.error(e?.message ?? "Erreur."); }
  }, [store, reload]);

  const handleDelete = useCallback(async (p: Product) => {
    try {
      await productsService.remove(p.id); reload();
      store.logAudit("Suppression Produit", p.label);
      toast.success(`Article ${p.label} supprimé.`);
    } catch (e: any) { toast.error(e?.message ?? "Erreur suppression."); }
  }, [store, reload]);

  return (
    <div>
      <PageHeader
        title="Catalogue Produits & Services"
        description="Consultez et administrez votre référentiel d'articles et tarifs de facturation."
        actions={store.can("manage_products") ? (
          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate}><Plus className="mr-2 size-4" />Nouveau Produit / Service</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Modifier l'article" : "Ajouter un nouvel article"}</DialogTitle>
                <DialogDescription>Définissez la référence, la catégorie, le prix et le taux de TVA.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveProduct} className="space-y-4 py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ref">Référence *</Label>
                    <Input id="ref" value={reference} onChange={e => setReference(e.target.value)} className="font-mono" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kind">Type d'article</Label>
                    <Select value={kind} onValueChange={v => setKind(v as ProductKind)}>
                      <SelectTrigger id="kind"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="produit">Bien / Produit Physique</SelectItem>
                        <SelectItem value="service">Prestation de Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="lbl">Désignation / Libellé *</Label>
                    <Input id="lbl" placeholder="ex: Licences Logiciel GDS Facture Pro" value={label} onChange={e => setLabel(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Prix Unitaire HT (GNF) *</Label>
                    <Input id="price" type="number" min="0" step="1000" value={unitPrice} onChange={e => setUnitPrice(parseFloat(e.target.value) || 0)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vat">Taux de TVA (%)</Label>
                    <Select value={String(vatRate)} onValueChange={v => setVatRate(parseFloat(v))}>
                      <SelectTrigger id="vat"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18">18% (Taux Standard Guinée)</SelectItem>
                        <SelectItem value="0">0% (Exonéré / Export)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unité de mesure</Label>
                    <Input id="unit" placeholder="U, Heure, Jour, Forfait..." value={unit} onChange={e => setUnit(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>Annuler</Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                    {editingProduct ? "Enregistrer" : "Créer l'article"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card><CardContent className="flex items-center justify-between pt-6">
          <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Catalogue</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{products.length}</p></div>
          <span className="flex size-10 items-center justify-center rounded-md bg-blue-100 text-blue-700"><Layers className="size-5" /></span>
        </CardContent></Card>
        <Card><CardContent className="flex items-center justify-between pt-6">
          <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Produits Physiques</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{products.filter(p => p.kind === "produit").length}</p></div>
          <span className="flex size-10 items-center justify-center rounded-md bg-emerald-100 text-emerald-700"><Package className="size-5" /></span>
        </CardContent></Card>
        <Card><CardContent className="flex items-center justify-between pt-6">
          <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Services & Prestations</p>
          <p className="mt-2 text-2xl font-bold text-purple-600">{products.filter(p => p.kind === "service").length}</p></div>
          <span className="flex size-10 items-center justify-center rounded-md bg-purple-100 text-purple-700"><Briefcase className="size-5" /></span>
        </CardContent></Card>
      </div>

      {/* Search */}
      <Card className="mb-6"><CardContent className="pt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input placeholder="Rechercher par référence, libellé..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(["all", "produit", "service"] as const).map(k => (
            <Badge key={k} variant={kindFilter === k ? "default" : "outline"} className="cursor-pointer text-xs px-2.5 py-1" onClick={() => setKindFilter(k)}>
              {k === "all" ? "Tous" : k === "produit" ? "Produits" : "Services"}
            </Badge>
          ))}
        </div>
      </CardContent></Card>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2">
          <Tag className="size-4 text-primary" />
          Articles du Catalogue ({filteredProducts.length})
          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground ml-2" />}
          {error && <span className="text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="size-3" />{error}</span>}
        </CardTitle></CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead><TableHead>Désignation</TableHead><TableHead>Type</TableHead>
                  <TableHead className="text-right">Prix Unitaire HT</TableHead><TableHead className="text-right">TVA (%)</TableHead>
                  <TableHead>Unité</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                    <Loader2 className="size-5 animate-spin inline mr-2" />Chargement depuis le serveur…
                  </TableCell></TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">Aucun produit ou service trouvé.</TableCell></TableRow>
                ) : filteredProducts.map(p => {
                  const displayVat = Number(p.vat_rate) <= 1 ? Number(p.vat_rate) * 100 : Number(p.vat_rate);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs font-semibold">{p.reference}</TableCell>
                      <TableCell className="font-medium text-foreground">{p.label}</TableCell>
                      <TableCell>
                        {p.kind === "produit"
                          ? <Badge variant="secondary" className="bg-emerald-100 text-emerald-800"><Package className="mr-1 size-3" />Produit</Badge>
                          : <Badge variant="secondary" className="bg-purple-100 text-purple-800"><Briefcase className="mr-1 size-3" />Service</Badge>}
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatGNF(p.unit_price)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{displayVat.toFixed(0)}%</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.unit}</TableCell>
                      <TableCell>
                        {p.is_active
                          ? <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-300"><CheckCircle2 className="mr-1 size-3 text-emerald-600" />Actif</Badge>
                          : <Badge variant="outline" className="text-rose-700 bg-rose-50 border-rose-300"><XCircle className="mr-1 size-3 text-rose-600" />Inactif</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        {store.can("manage_products") && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8"><MoreVertical className="size-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEdit(p)}><Edit className="mr-2 size-4 text-blue-600" />Modifier</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(p)}>
                                {p.is_active ? <><XCircle className="mr-2 size-4 text-amber-600" />Désactiver</> : <><CheckCircle2 className="mr-2 size-4 text-emerald-600" />Activer</>}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(p)} className="text-rose-600"><Trash2 className="mr-2 size-4" />Supprimer</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
