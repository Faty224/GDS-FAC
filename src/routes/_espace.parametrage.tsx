import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, Save, FileText, CreditCard, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_espace/parametrage")({
  head: () => ({
    meta: [
      { title: "Paramétrage & Entreprise — GDS Facture" },
      {
        name: "description",
        content:
          "Configuration des informations légales de l'entreprise, mentions eTVA et identités bancaires.",
      },
    ],
  }),
  component: ParametragePage,
});

function ParametragePage() {
  const { company, billingSettings, updateCompany, saveBillingSetting, logAudit, can } = useStore();

  const [companyForm, setCompanyForm] = useState({ ...company });
  const primarySetting = billingSettings[0] ?? {
    id: "set-1",
    company_id: company.id,
    reference: "FAC",
    label: "Paramètres Généraux",
    legal_mentions:
      "Facture établie en conformité avec la réglementation eTVA de la Direction Générale des Impôts (DGI) de Guinée.",
    payment_instructions: "Règlement par virement bancaire sous 30 jours.",
    is_active: true,
  };

  const [billingForm, setBillingForm] = useState({ ...primarySetting });

  function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault();
    updateCompany(companyForm);
    logAudit("Mise à jour Entreprise", companyForm.name);
    toast.success("Informations de l'entreprise mises à jour avec succès.");
  }

  function handleSaveBilling(e: React.FormEvent) {
    e.preventDefault();
    saveBillingSetting(billingForm);
    logAudit("Mise à jour Paramètres Facturation", billingForm.reference);
    toast.success("Paramètres et mentions de facturation enregistrés.");
  }

  return (
    <div>
      <PageHeader
        title="Paramétrage & Configuration"
        description="Gérez les coordonnées légales de votre entreprise, votre NIF et vos mentions financières."
      />

      <Tabs defaultValue="entreprise" className="space-y-6">
        <TabsList>
          <TabsTrigger value="entreprise" className="flex items-center gap-2">
            <Building2 className="size-4" />
            Profil Entreprise
          </TabsTrigger>
          <TabsTrigger value="facturation" className="flex items-center gap-2">
            <FileText className="size-4" />
            Mentions & Facturation
          </TabsTrigger>
          <TabsTrigger value="banque" className="flex items-center gap-2">
            <CreditCard className="size-4" />
            Coordonnées Bancaires
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Company Profile */}
        <TabsContent value="entreprise">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                Informations Légales & Fiscales
              </CardTitle>
              <CardDescription>
                Ces informations figureront sur les en-têtes de vos factures officielles et
                transmissions eTVA.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveCompany} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Raison Sociale</Label>
                    <Input
                      id="name"
                      value={companyForm.name}
                      onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="legal_form">Forme Juridique</Label>
                    <Input
                      id="legal_form"
                      value={companyForm.legal_form}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, legal_form: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nif">Numéro d'Identification Fiscale (NIF)</Label>
                    <Input
                      id="nif"
                      value={companyForm.nif}
                      onChange={(e) => setCompanyForm({ ...companyForm, nif: e.target.value })}
                      required
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rccm">Numéro RCCM</Label>
                    <Input
                      id="rccm"
                      value={companyForm.rccm}
                      onChange={(e) => setCompanyForm({ ...companyForm, rccm: e.target.value })}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone Contact</Label>
                    <Input
                      id="phone"
                      value={companyForm.phone}
                      onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Officiel</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companyForm.email}
                      onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="address">Adresse du Siège Social</Label>
                    <Input
                      id="address"
                      value={companyForm.address}
                      onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                    />
                  </div>
                </div>

                {can("manage_company") && (
                  <div className="flex justify-end pt-4 border-t border-border">
                    <Button type="submit">
                      <Save className="mr-2 size-4" />
                      Enregistrer les modifications
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Billing Mentions */}
        <TabsContent value="facturation">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600" />
                Mentions Légales & Réglementation eTVA
              </CardTitle>
              <CardDescription>
                Textes imprimés au bas de vos factures pour se conformer aux exigences de la DGI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveBilling} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ref_prefix">Préfixe de Numérotation</Label>
                  <Input
                    id="ref_prefix"
                    value={billingForm.reference}
                    onChange={(e) => setBillingForm({ ...billingForm, reference: e.target.value })}
                    className="w-full sm:w-48 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legal_mentions">Mentions Légales eTVA</Label>
                  <Textarea
                    id="legal_mentions"
                    rows={4}
                    value={billingForm.legal_mentions}
                    onChange={(e) =>
                      setBillingForm({ ...billingForm, legal_mentions: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_instructions">Instructions de Règlement</Label>
                  <Textarea
                    id="payment_instructions"
                    rows={3}
                    value={billingForm.payment_instructions}
                    onChange={(e) =>
                      setBillingForm({ ...billingForm, payment_instructions: e.target.value })
                    }
                  />
                </div>

                {can("manage_settings") && (
                  <div className="flex justify-end pt-4 border-t border-border">
                    <Button type="submit">
                      <Save className="mr-2 size-4" />
                      Sauvegarder le paramétrage
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Banking Info */}
        <TabsContent value="banque">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="size-4 text-blue-600" />
                Coordonnées Bancaires
              </CardTitle>
              <CardDescription>
                RIB et informations de virement affichés sur les factures émises.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveCompany} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Nom de la Banque</Label>
                    <Input
                      id="bank_name"
                      value={companyForm.bank_name}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, bank_name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bank_account">Numéro de Compte (RIB / IBAN)</Label>
                    <Input
                      id="bank_account"
                      value={companyForm.bank_account}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, bank_account: e.target.value })
                      }
                      className="font-mono"
                    />
                  </div>
                </div>

                {can("manage_company") && (
                  <div className="flex justify-end pt-4 border-t border-border">
                    <Button type="submit">
                      <Save className="mr-2 size-4" />
                      Mettre à jour le RIB
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
