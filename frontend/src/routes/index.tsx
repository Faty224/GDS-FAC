import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStore } from "@/lib/store";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("Service indisponible") || msg.includes("Network Error") || msg.includes("failed")) {
        setError("Impossible de contacter le serveur Django sur http://127.0.0.1:8000. Assurez-vous d'avoir lancé 'python manage.py runserver' dans le backend.");
      } else {
        setError(msg || "Connexion impossible.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2 bg-background overflow-hidden relative">
      {/* LEFT SECTION - BRANDING */}
      <section className="relative hidden flex-col justify-between p-12 text-primary-foreground lg:flex overflow-hidden bg-primary">
        {/* Dynamic Abstract Background */}
        <div className="absolute inset-0 bg-linear-to-br from-primary via-[#213543] to-[#1a2831] opacity-90 z-0" />
        <div className="absolute -top-40 -right-40 size-96 bg-accent/20 blur-[100px] rounded-full z-0 animate-pulse-slow" />
        <div className="absolute top-1/3 -left-20 size-72 bg-blue-500/20 blur-[80px] rounded-full z-0 animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-40 left-1/4 size-128 bg-emerald-500/20 blur-[120px] rounded-full z-0" />

        <div className="relative z-10 flex items-center gap-4 animate-fade-in-down" style={{ animationDuration: '0.8s' }}>
          <div className="flex size-14 items-center justify-center rounded-2xl bg-white/10 p-2 shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-md ring-1 ring-white/20 shrink-0">
            <img src="/logo.png" alt="GDS Facture Logo" className="size-full object-contain filter drop-shadow-md" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">GDS Facture</p>
            <p className="text-sm font-medium text-white/80">Facturation électronique & conformité</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md my-auto animate-fade-in-right" style={{ animationDuration: '1s', animationDelay: '0.2s', animationFillMode: 'both' }}>
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white">
            Gérez vos finances avec <br/> 
            <span className="text-accent drop-shadow-[0_0_15px_rgba(221,251,239,0.3)]">excellence</span> et <span className="text-accent drop-shadow-[0_0_15px_rgba(221,251,239,0.3)]">sérénité</span>.
          </h2>
          <p className="mt-4 text-base text-white/85 leading-relaxed">
            Une plateforme unifiée pour émettre, valider et transmettre vos factures en toute simplicité, conforme aux normes de la DGI.
          </p>
          
          <div className="mt-10 grid gap-6 relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-white/20" />
            
            <div className="flex gap-5 relative group">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/20 backdrop-blur-sm z-10 group-hover:scale-110 transition-transform">
                <div className="size-2 rounded-full bg-accent shadow-[0_0_10px_rgba(221,251,239,0.8)]" />
              </div>
              <div>
                <p className="font-semibold text-white text-base">Création intuitive</p>
                <p className="text-sm text-white/70 mt-0.5">Factures, avoirs et devis professionnels</p>
              </div>
            </div>
            
            <div className="flex gap-5 relative group">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/20 backdrop-blur-sm z-10 group-hover:scale-110 transition-transform">
                <div className="size-2 rounded-full bg-accent shadow-[0_0_10px_rgba(221,251,239,0.8)]" />
              </div>
              <div>
                <p className="font-semibold text-white text-base">Transmission eTVA</p>
                <p className="text-sm text-white/70 mt-0.5">Connecté en temps réel au serveur DGI</p>
              </div>
            </div>
          </div>
        </div>
        <p className="relative z-10 text-sm text-white/60 font-medium animate-fade-in-up" style={{ animationDuration: '1s', animationDelay: '0.4s', animationFillMode: 'both'}}>
          © {new Date().getFullYear()} GDS Guinée SARL. <span className="opacity-75 hidden sm:inline">Tous droits réservés.</span>
        </p>
      </section>

      {/* RIGHT SECTION - LOGIN FORM */}
      <section className="flex items-center justify-center px-4 sm:px-6 py-14 relative z-10 bg-background/50">
        <div className="w-full max-w-[420px] animate-fade-in-up" style={{ animationDuration: '0.6s' }}>
          <div className="bg-card border border-border shadow-2xl shadow-primary/5 rounded-2xl p-8 sm:p-10 relative overflow-hidden">
            
            <div className="absolute top-0 inset-x-0 h-1.5 bg-primary" />
            
            <div className="mb-8 flex flex-col items-center sm:items-start sm:flex-row gap-4 text-center sm:text-left">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/5 p-2 border border-primary/10 shadow-sm shrink-0 lg:hidden">
                <img src="/logo.png" alt="GDS Facture Logo" className="size-full object-contain" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Connexion</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">Bon retour sur votre espace GDS Facture.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-semibold">Identifiant ou Adresse email</Label>
                <Input
                  id="email"
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-muted/40 hover:bg-muted/60 focus:bg-background transition-colors text-[15px]"
                  placeholder="STHF ou admin@gds.gn"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-semibold">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 bg-muted/40 hover:bg-muted/60 focus:bg-background transition-colors pr-12 text-[15px]"
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-transparent rounded-lg"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                    <span className="sr-only">
                      {showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    </span>
                  </Button>
                </div>
                <div className="text-right pt-1">
                  <a href="#" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors hover:underline hover:underline-offset-4">
                    Mot de passe oublié ?
                  </a>
                </div>
              </div>

              {error ? (
                <Alert variant="destructive" className="animate-shake">
                  <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
                </Alert>
              ) : null}

              <Button 
                type="submit" 
                className="w-full h-12 text-[15px] font-semibold mt-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200" 
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 size-5 animate-spin" /> : null}
                {loading ? "Connexion en cours..." : "Accéder à l'espace"}
              </Button>
            </form>
          </div>
          
          <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
            <p className="text-sm text-muted-foreground">
              Besoin d'aide ou problème d'accès ? <br/>
              <a href="#" className="text-primary font-semibold hover:underline decoration-primary/30 underline-offset-4">Contacter le support technique</a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
