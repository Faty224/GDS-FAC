import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Users,
  Package,
  Settings2,
  FileText,
  Undo2,
  Send,
  UserCog,
  ScrollText,
  Menu,
  LogOut,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { ROLE_LABELS, useStore, type Permission } from "@/lib/store";
import { authService } from "@/services/resources.service";

export const Route = createFileRoute("/_espace")({
  component: EspaceLayout,
});

const NAV: { to: string; label: string; icon: typeof BarChart3; permission?: Permission }[] = [
  { to: "/tableau-de-bord", label: "Tableau de bord", icon: BarChart3 },
  { to: "/devis", label: "Devis & Proforma", icon: FileCode },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/produits", label: "Produits & services", icon: Package },
  { to: "/parametrage", label: "Paramétrage", icon: Settings2 },
  { to: "/factures", label: "Factures", icon: FileText },
  { to: "/avoirs", label: "Avoirs", icon: Undo2 },
  { to: "/etva", label: "Espace eTVA", icon: Send },
  { to: "/utilisateurs", label: "Utilisateurs", icon: UserCog, permission: "manage_users" },
  { to: "/journaux", label: "Journaux", icon: ScrollText, permission: "view_audit" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { can } = useStore();
  return (
    <nav className="space-y-1">
      {NAV.filter((item) => !item.permission || can(item.permission)).map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-primary-foreground/75 transition-colors hover:bg-white/10 hover:text-primary-foreground"
          activeProps={{ className: "bg-white/15 text-primary-foreground font-medium" }}
        >
          <item.icon className="size-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function EspaceLayout() {
  const { currentUser, isReady, logout } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isReady && !currentUser) navigate({ to: "/", replace: true });
  }, [isReady, currentUser, navigate]);

  useEffect(() => {
    if (currentUser) {
      authService.me().catch(() => {
        logout();
        navigate({ to: "/", replace: true });
      });
    }
  }, [currentUser, logout, navigate]);

  if (!isReady || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-primary p-4 text-primary-foreground">
      <div className="flex items-center gap-3 px-2 py-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-white p-1 shadow-xs shrink-0">
          <img src="/logo.png" alt="GDS Facture" className="size-full object-contain" />
        </div>
        <div>
          <p className="text-base font-semibold tracking-tight leading-tight">GDS Facture</p>
          <p className="text-xs opacity-75">Facturation électronique</p>
        </div>
      </div>
      <div className="mt-4 flex-1 overflow-y-auto">
        <NavLinks onNavigate={() => setOpen(false)} />
      </div>
      </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 lg:block h-full border-r border-sidebar-border">
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col h-full overflow-y-auto">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card/95 backdrop-blur-xs px-4 py-3">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Ouvrir le menu"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 border-0 p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                {sidebar}
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2 lg:hidden">
              <img
                src="/logo.png"
                alt="GDS Facture"
                className="size-7 rounded object-contain bg-white p-0.5 border border-border"
              />
              <span className="text-sm font-medium text-foreground">GDS Facture</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-tight text-foreground">
                {currentUser.full_name}
              </p>
              <p className="text-xs text-muted-foreground">{ROLE_LABELS[currentUser.role]}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                navigate({ to: "/", replace: true });
              }}
            >
              <LogOut className="mr-2 size-4" />
              Déconnexion
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
