import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Users, UserPlus, Search, Phone, Mail, MapPin,
  CheckCircle2, XCircle, MoreVertical, Trash2, Edit,
  UserCheck, UserX, CreditCard, Loader2, AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { formatGNF } from "@/lib/format";
import { useStore } from "@/lib/store";
import { customersService, invoicesService } from "@/services/resources.service";
import { useCustomers } from "@/services/useApiData";
import type { Customer } from "@/lib/types";

export const Route = createFileRoute("/_espace/clients")({
  head: () => ({
    meta: [
      { title: "Gestion des Clients — GDS Facture" },
      { name: "description", content: "Gérez votre portefeuille clients, numéros NIFp et coordonnées de facturation." },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const store = useStore();
  const { data: customers, loading, error, reload } = useCustomers([]);
  const { invoices } = useStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openModal, setOpenModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const [clientKind, setClientKind] = useState<"entreprise" | "particulier">("entreprise");
  const [name, setName] = useState("");
  const [nifp, setNifp] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Conakry");

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      (c.nifp || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.contact_name || "").toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "all" || (statusFilter === "active" ? c.is_active : !c.is_active);
    return matchesSearch && matchesStatus;
  });

  function handleOpenCreate() {
    setEditingCustomer(null);
    setClientKind("entreprise");
    setName(""); setNifp(""); setContactName(""); setPhone(""); setEmail(""); setAddress(""); setCity("Conakry");
    setOpenModal(true);
  }

  function handleOpenEdit(c: Customer) {
    setEditingCustomer(c);
    setClientKind(c.contact_name ? "entreprise" : "particulier");
    setName(c.name); setNifp(c.nifp || ""); setContactName(c.contact_name || "");
    setPhone(c.phone || ""); setEmail(c.email || ""); setAddress(c.address || ""); setCity(c.city || "Conakry");
    setOpenModal(true);
  }

  const handleSaveCustomer = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(clientKind === "entreprise" ? "Veuillez indiquer la raison sociale de l'entreprise." : "Veuillez indiquer le nom complet du client.");
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<Customer> = {
        name: name.trim(),
        nifp: nifp.trim(),
        contact_name: clientKind === "entreprise" ? contactName.trim() : "",
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim() || "Conakry",
      };
      if (editingCustomer) {
        await customersService.update(editingCustomer.id, payload);
      } else {
        await customersService.create(payload);
      }
      reload();
      store.logAudit(editingCustomer ? "Modification Client" : "Création Client", name.trim());
      toast.success(`Client ${name.trim()} (${clientKind === "entreprise" ? "Entreprise" : "Particulier"}) ${editingCustomer ? "mis à jour" : "créé"} avec succès.`);
      setOpenModal(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }, [name, nifp, contactName, phone, email, address, city, clientKind, editingCustomer, store, reload]);

  const handleToggleActive = useCallback(async (c: Customer) => {
    try {
      await customersService.update(c.id, { is_active: !c.is_active });
      reload();
      store.logAudit(!c.is_active ? "Activation Client" : "Désactivation Client", c.name);
      toast.success(`Client ${c.name} ${!c.is_active ? "activé" : "désactivé"}.`);
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur.");
    }
  }, [store, reload]);

  const handleDelete = useCallback(async (c: Customer) => {
    try {
      await customersService.remove(c.id);
      reload();
      store.logAudit("Suppression Client", c.name);
      toast.success(`Client ${c.name} supprimé.`);
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur suppression.");
    }
  }, [store, reload]);

  const totalFacture = invoices.reduce((s, inv) => {
    const ht = inv.lines?.reduce((a, l) => a + (l.quantity * l.unit_price), 0) ?? 0;
    return s + ht * 1.18;
  }, 0);

  return (
    <div>
      <PageHeader
        title="Portefeuille Clients"
        description="Gérez les fiches de vos clients (Entreprises et Particuliers), leurs NIFp et coordonnées légales."
        actions={store.can("manage_customers") ? (
          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate}><UserPlus className="mr-2 size-4" />Nouveau Client</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6">
              <DialogHeader className="pb-2 border-b border-border">
                <DialogTitle>{editingCustomer ? "Modifier la fiche client" : "Nouveau Client"}</DialogTitle>
                <DialogDescription>Choisissez le type de client et renseignez ses coordonnées légales et fiscales.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveCustomer} className="space-y-3 pt-3">
                {/* Sélecteur de type de client */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type de Client *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={clientKind === "entreprise" ? "default" : "outline"}
                      className="justify-center h-9"
                      onClick={() => setClientKind("entreprise")}
                    >
                      🏢 Entreprise
                    </Button>
                    <Button
                      type="button"
                      variant={clientKind === "particulier" ? "default" : "outline"}
                      className="justify-center h-9"
                      onClick={() => setClientKind("particulier")}
                    >
                      👤 Particulier
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="cust_name">{clientKind === "entreprise" ? "Raison Sociale *" : "Nom et Prénom *"}</Label>
                    <Input
                      id="cust_name"
                      placeholder={clientKind === "entreprise" ? "ex: Société KALOUM SARL" : "ex: M. Mamadou Diallo"}
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="nifp">
                      {clientKind === "entreprise" ? "NIF permanent (NIFp)" : "NIFp (Optionnel)"}
                    </Label>
                    <Input id="nifp" placeholder="ex: 123456789P" value={nifp} onChange={e => setNifp(e.target.value)} className="font-mono" />
                  </div>

                  {clientKind === "entreprise" ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="contact">Contact principal</Label>
                      <Input id="contact" placeholder="ex: M. Camara" value={contactName} onChange={e => setContactName(e.target.value)} />
                    </div>
                  ) : null}

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" placeholder="+224 620 00 00 00" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="contact@client.gn" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="city">Ville</Label>
                    <Input id="city" value={city} onChange={e => setCity(e.target.value)} />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="address">Adresse géographique</Label>
                    <Input id="address" placeholder="ex: Kaloum, Immeuble Almamya" value={address} onChange={e => setAddress(e.target.value)} />
                  </div>
                </div>

                <DialogFooter className="pt-3 border-t border-border mt-2">
                  <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>Annuler</Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
                    {editingCustomer ? "Enregistrer" : "Créer le client"}
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
          <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Clients</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{customers.length}</p></div>
          <span className="flex size-10 items-center justify-center rounded-md bg-blue-100 text-blue-700"><Users className="size-5" /></span>
        </CardContent></Card>
        <Card><CardContent className="flex items-center justify-between pt-6">
          <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Clients Actifs</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{customers.filter(c => c.is_active).length}</p></div>
          <span className="flex size-10 items-center justify-center rounded-md bg-emerald-100 text-emerald-700"><CheckCircle2 className="size-5" /></span>
        </CardContent></Card>
        <Card><CardContent className="flex items-center justify-between pt-6">
          <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Facturé (TTC)</p>
          <p className="mt-2 text-xl font-bold text-primary">{formatGNF(totalFacture)}</p></div>
          <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary"><CreditCard className="size-5" /></span>
        </CardContent></Card>
      </div>

      {/* Search */}
      <Card className="mb-6"><CardContent className="pt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input placeholder="Rechercher par nom, NIFp, email..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(["all", "active", "inactive"] as const).map(st => (
            <Badge key={st} variant={statusFilter === st ? "default" : "outline"} className="cursor-pointer text-xs px-2.5 py-1" onClick={() => setStatusFilter(st)}>
              {st === "all" ? "Tous" : st === "active" ? "Actifs" : "Inactifs"}
            </Badge>
          ))}
        </div>
      </CardContent></Card>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2">
          <Users className="size-4 text-primary" />
          Liste des Clients ({filteredCustomers.length})
          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground ml-2" />}
          {error && <span className="text-xs text-rose-500 flex items-center gap-1"><AlertCircle className="size-3" />{error}</span>}
        </CardTitle></CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Raison Sociale / Nom</TableHead><TableHead>NIFp</TableHead>
                  <TableHead>Contact</TableHead><TableHead>Téléphone & Email</TableHead>
                  <TableHead>Ville</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                    <Loader2 className="size-5 animate-spin inline mr-2" />Chargement depuis le serveur…
                  </TableCell></TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                    Aucun client trouvé.
                  </TableCell></TableRow>
                ) : filteredCustomers.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold text-foreground">{c.name}</TableCell>
                    <TableCell><Badge variant="outline" className="font-mono text-xs">{c.nifp || "Sans NIFp"}</Badge></TableCell>
                    <TableCell className="text-sm">{c.contact_name || "—"}</TableCell>
                    <TableCell className="text-xs space-y-0.5">
                      {c.phone && <div className="flex items-center gap-1 text-muted-foreground"><Phone className="size-3" />{c.phone}</div>}
                      {c.email && <div className="flex items-center gap-1 text-muted-foreground"><Mail className="size-3" />{c.email}</div>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground"><div className="flex items-center gap-1"><MapPin className="size-3" />{c.city || "Conakry"}</div></TableCell>
                    <TableCell>
                      {c.is_active
                        ? <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-300"><CheckCircle2 className="mr-1 size-3 text-emerald-600" />Actif</Badge>
                        : <Badge variant="outline" className="text-rose-700 bg-rose-50 border-rose-300"><XCircle className="mr-1 size-3 text-rose-600" />Inactif</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {store.can("manage_customers") && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8"><MoreVertical className="size-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(c)}><Edit className="mr-2 size-4 text-blue-600" />Modifier</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(c)}>
                              {c.is_active ? <><UserX className="mr-2 size-4 text-amber-600" />Désactiver</> : <><UserCheck className="mr-2 size-4 text-emerald-600" />Activer</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCustomerToDelete(c)} className="text-rose-600"><Trash2 className="mr-2 size-4" />Supprimer</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {customerToDelete && (
        <AlertDialog open={!!customerToDelete} onOpenChange={open => { if (!open) setCustomerToDelete(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Voulez-vous vraiment supprimer ce client ?</AlertDialogTitle>
              <AlertDialogDescription>Voulez-vous vraiment supprimer le client <strong>{customerToDelete.name}</strong> ?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Annuler</AlertDialogCancel>
              <AlertDialogAction className="bg-rose-600 hover:bg-rose-700 text-white" onClick={() => { handleDelete(customerToDelete); setCustomerToDelete(null); }}>
                Oui, supprimer le client
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
