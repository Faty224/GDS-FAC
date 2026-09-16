import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStore } from "@/lib/store";
import { IS_DEMO_MODE } from "@/services/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Connexion — GDS Facture" },
      {
        name: "description",
        content: "Connectez-vous à votre espace de facturation électronique GDS Facture.",
      },
      { property: "og:title", content: "Connexion — GDS Facture" },
      {
        property: "og:description",
        content: "Accédez à vos factures, avoirs et transmissions eTVA.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, currentUser, isReady, logAudit } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@gds.gn");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && currentUser) navigate({ to: "/tableau-de-bord", replace: true });
  }, [isReady, currentUser, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      logAudit("Connexion", user.email);
      toast.success(`Bienvenue, ${user.full_name}`);
      navigate({ to: "/tableau-de-bord", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-white p-1.5 shadow-md shrink-0">
            <img src="/logo.png" alt="GDS Facture Logo" className="size-full object-contain" />
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight">GDS Facture</p>
            <p className="text-xs opacity-80">Facturation électronique &amp; conformité fiscale</p>
          </div>
        </div>
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">
            Émettez, validez et transmettez vos factures en toute sérénité.
          </h2>
          <ul className="mt-8 space-y-3 text-sm opacity-85">
            <li>• Clients, produits et paramétrages de facturation centralisés</li>
            <li>• Factures et avoirs avec cycle de vie complet</li>
            <li>• Espace eTVA et historique des transmissions</li>
            <li>• Rôles, permissions et journaux d'activité</li>
          </ul>
        </div>
        <p className="text-xs opacity-60">© {new Date().getFullYear()} GDS Guinée SARL</p>
      </section>

      <section className="flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-white p-1 border border-border shadow-xs shrink-0">
              <img src="/logo.png" alt="GDS Facture Logo" className="size-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Connexion</h1>
              <p className="text-xs text-muted-foreground">Accédez à votre espace GDS Facture.</p>
            </div>
          </div>

          {IS_DEMO_MODE ? (
            <Alert className="mb-6 border-accent bg-accent/60">
              <ShieldCheck className="size-4" />
              <AlertDescription className="text-xs text-accent-foreground">
                Mode démonstration : données fictives enregistrées dans ce navigateur. Comptes :
                admin@gds.gn, facturier@gds.gn, lecture@gds.gn — mot de passe libre (4 caractères
                min.).
              </AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Se connecter
            </Button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground">
            Mot de passe oublié ? Contactez l'administrateur de votre entreprise.
          </p>
        </div>
      </section>
    </main>
  );
}
