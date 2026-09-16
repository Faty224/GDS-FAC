import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Trash2,
  Edit,
  UserCheck,
  UserX,
  CreditCard,
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
import { formatGNF, invoiceTotals } from "@/lib/format";
import { uid, useStore } from "@/lib/store";
import type { Customer } from "@/lib/types";

export const Route = createFileRoute("/_espace/clients")({
  head: () => ({
    meta: [
      { title: "Gestion des Clients — GDS Facture" },
      {
        name: "description",
        content: "Gérez votre portefeuille clients, numéros NIFp et coordonnées de facturation.",
      },
    ],
  }),
  component: ClientsPage,
});

function ClientsPage() {
  const { company, customers, invoices, saveCustomer, deleteCustomer, logAudit, can } = useStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openModal, setOpenModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [nifp, setNifp] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Conakry");

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.nifp.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || (statusFilter === "active" ? c.is_active : !c.is_active);
    return matchesSearch && matchesStatus;
  });

  function handleOpenCreate() {
    setEditingCustomer(null);
    setName("");
    setNifp("");
    setContactName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setCity("Conakry");
    setOpenModal(true);
  }

  function handleOpenEdit(c: Customer) {
    setEditingCustomer(c);
    setName(c.name);
    setNifp(c.nifp);
    setContactName(c.contact_name);
    setPhone(c.phone);
    setEmail(c.email);
    setAddress(c.address);
    setCity(c.city);
    setOpenModal(true);
  }

  function handleSaveCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Veuillez indiquer le nom ou la raison sociale du client.");
      return;
    }

    const customerData: Customer = {
      id: editingCustomer ? editingCustomer.id : uid("cust"),
      company_id: company.id,
      name: name.trim(),
      nifp: nifp.trim(),
      contact_name: contactName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim() || "Conakry",
      is_active: editingCustomer ? editingCustomer.is_active : true,
      created_at: editingCustomer ? editingCustomer.created_at : new Date().toISOString(),
    };

    saveCustomer(customerData);
    logAudit(editingCustomer ? "Modification Client" : "Création Client", customerData.name);
    toast.success(
      `Client ${customerData.name} ${editingCustomer ? "mis à jour" : "créé avec succès"}.`,
    );
    setOpenModal(false);
  }

  function handleToggleActive(c: Customer) {
    const updated = { ...c, is_active: !c.is_active };
    saveCustomer(updated);
    logAudit(updated.is_active ? "Activation Client" : "Désactivation Client", c.name);
    toast.success(`Client ${c.name} ${updated.is_active ? "activé" : "désactivé"}.`);
  }

  function handleDelete(c: Customer) {
    deleteCustomer(c.id);
    logAudit("Suppression Client", c.name);
    toast.success(`Client ${c.name} supprimé.`);
  }

  return (
    <div>
      <PageHeader
        title="Portefeuille Clients"
        description="Gérez les fiches de vos clients, leurs numéros NIFp et leurs historiques."
        actions={
          can("manage_customers") ? (
            <Dialog open={openModal} onOpenChange={setOpenModal}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenCreate}>
                  <UserPlus className="mr-2 size-4" />
                  Nouveau Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingCustomer ? "Modifier le client" : "Ajouter un nouveau client"}
                  </DialogTitle>
                  <DialogDescription>
                    Renseignez les coordonnées légales et fiscales du client.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSaveCustomer} className="space-y-4 py-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-2">
                      <Label htmlFor="cust_name">Nom / Raison Sociale *</Label>
                      <Input
                        id="cust_name"
                        placeholder="ex: Sociéte Guinée SARL"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nifp">NIF permanent (NIFp)</Label>
                      <Input
                        id="nifp"
                        placeholder="ex: 123456789P"
                        value={nifp}
                        onChange={(e) => setNifp(e.target.value)}
                        className="font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact">Nom du Contact</Label>
                      <Input
                        id="contact"
                        placeholder="ex: M. Camara"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        placeholder="+224 620 00 00 00"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="contact@client.gn"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">Ville</Label>
                      <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <Label htmlFor="address">Adresse géographique</Label>
                      <Input
                        id="address"
                        placeholder="ex: Kaloum, Immeuble Almamya"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">
                      {editingCustomer ? "Enregistrer" : "Créer le client"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total Clients
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">{customers.length}</p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Users className="size-5" />
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Clients Actifs
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {customers.filter((c) => c.is_active).length}
              </p>
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
                Total Facturé (TTC)
              </p>
              <p className="mt-2 text-xl font-bold text-primary">
                {formatGNF(invoices.reduce((sum, inv) => sum + invoiceTotals(inv).ttc, 0))}
              </p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <CreditCard className="size-5" />
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, NIFp, email..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {(["all", "active", "inactive"] as const).map((st) => (
              <Badge
                key={st}
                variant={statusFilter === st ? "default" : "outline"}
                className="cursor-pointer text-xs px-2.5 py-1"
                onClick={() => setStatusFilter(st)}
              >
                {st === "all" ? "Tous" : st === "active" ? "Actifs" : "Inactifs"}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4 text-primary" />
            Liste des Clients ({filteredCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Raison Sociale / Nom</TableHead>
                  <TableHead>NIFp</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Téléphone & Email</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground text-sm"
                    >
                      Aucun client trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-semibold text-foreground">{c.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {c.nifp || "Sans NIFp"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{c.contact_name || "—"}</TableCell>
                      <TableCell className="text-xs space-y-0.5">
                        {c.phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="size-3" /> {c.phone}
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="size-3" /> {c.email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="size-3" /> {c.city || "Conakry"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {c.is_active ? (
                          <Badge
                            variant="outline"
                            className="text-emerald-700 bg-emerald-50 border-emerald-300"
                          >
                            <CheckCircle2 className="mr-1 size-3 text-emerald-600" /> Actif
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-rose-700 bg-rose-50 border-rose-300"
                          >
                            <XCircle className="mr-1 size-3 text-rose-600" /> Inactif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {can("manage_customers") && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEdit(c)}>
                                <Edit className="mr-2 size-4 text-blue-600" /> Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(c)}>
                                {c.is_active ? (
                                  <>
                                    <UserX className="mr-2 size-4 text-amber-600" /> Désactiver
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 size-4 text-emerald-600" /> Activer
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(c)}
                                className="text-rose-600"
                              >
                                <Trash2 className="mr-2 size-4" /> Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
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
