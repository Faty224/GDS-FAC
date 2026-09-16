import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Search,
  Shield,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { uid, useStore, ROLE_LABELS } from "@/lib/store";
import type { Role, User } from "@/lib/types";

export const Route = createFileRoute("/_espace/utilisateurs")({
  head: () => ({
    meta: [
      { title: "Gestion des Utilisateurs — GDS Facture" },
      {
        name: "description",
        content: "Gestion des comptes utilisateurs, des rôles et des autorisations d'accès.",
      },
    ],
  }),
  component: UtilisateursPage,
});

function UtilisateursPage() {
  const { company, users, saveUser, deleteUser, logAudit, can, currentUser } = useStore();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [openModal, setOpenModal] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("facturier");

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const newUser: User = {
      id: uid("usr"),
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      role,
      company_id: company.id,
      is_active: true,
    };

    saveUser(newUser);
    logAudit("Création Utilisateur", newUser.email);
    toast.success(`Utilisateur ${newUser.full_name} créé avec succès.`);
    setOpenModal(false);
    setFullName("");
    setEmail("");
    setRole("facturier");
  }

  function handleToggleActive(u: User) {
    if (u.id === currentUser?.id) {
      toast.error("Vous ne pouvez pas désactiver votre propre compte.");
      return;
    }
    const updated = { ...u, is_active: !u.is_active };
    saveUser(updated);
    logAudit(updated.is_active ? "Activation Utilisateur" : "Désactivation Utilisateur", u.email);
    toast.success(`Compte de ${u.full_name} ${updated.is_active ? "activé" : "désactivé"}.`);
  }

  function handleDelete(u: User) {
    if (u.id === currentUser?.id) {
      toast.error("Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }
    deleteUser(u.id);
    logAudit("Suppression Utilisateur", u.email);
    toast.success(`Utilisateur ${u.full_name} supprimé.`);
  }

  return (
    <div>
      <PageHeader
        title="Gestion des Utilisateurs"
        description="Contrôlez les accès à votre espace de facturation et attribuez les rôles."
        actions={
          can("manage_users") ? (
            <Dialog open={openModal} onOpenChange={setOpenModal}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 size-4" />
                  Nouvel Utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Ajouter un utilisateur</DialogTitle>
                  <DialogDescription>
                    Créez un nouveau compte pour vos collaborateurs.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateUser} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullname">Nom Complet</Label>
                    <Input
                      id="fullname"
                      placeholder="ex: Mamadou Diallo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usr_email">Adresse Email</Label>
                    <Input
                      id="usr_email"
                      type="email"
                      placeholder="m.diallo@entreprise.gn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Rôle & Privilèges</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrateur (Accès complet)</SelectItem>
                        <SelectItem value="facturier">Facturier (Factures & eTVA)</SelectItem>
                        <SelectItem value="consultation">Consultation (Lecture seule)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>
                      Annuler
                    </Button>
                    <Button type="submit">Créer le compte</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      {/* Role explanation cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card className="bg-slate-50 border-slate-200 dark:bg-slate-900/40">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Shield className="size-4 text-purple-600" />
              Administrateur
            </div>
            <p className="text-xs text-muted-foreground">
              Gestion des utilisateurs, des paramètres de l'entreprise, des factures et
              transmissions eTVA.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200 dark:bg-slate-900/40">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Shield className="size-4 text-blue-600" />
              Facturier
            </div>
            <p className="text-xs text-muted-foreground">
              Création, édition, validation des factures/avoirs et envoi des déclarations eTVA DGI.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200 dark:bg-slate-900/40">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Shield className="size-4 text-amber-600" />
              Consultation
            </div>
            <p className="text-xs text-muted-foreground">
              Consultation en lecture seule des pièces comptables, sans pouvoir d'édition ou de
              transmission.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un utilisateur..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {(["all", "admin", "facturier", "consultation"] as const).map((r) => (
              <Badge
                key={r}
                variant={roleFilter === r ? "default" : "outline"}
                className="cursor-pointer text-xs px-2.5 py-1"
                onClick={() => setRoleFilter(r)}
              >
                {r === "all" ? "Tous les rôles" : ROLE_LABELS[r]}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4 text-primary" />
            Liste des Collaborateurs ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom & Prénom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                    Aucun utilisateur trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      {u.full_name}
                      {u.id === currentUser?.id && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-primary/10 text-primary border-primary/20"
                        >
                          Vous
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                            : u.role === "facturier"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }
                      >
                        {ROLE_LABELS[u.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.is_active ? (
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
                      {can("manage_users") && u.id !== currentUser?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggleActive(u)}>
                              {u.is_active ? (
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
                              onClick={() => handleDelete(u)}
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
        </CardContent>
      </Card>
    </div>
  );
}
