# GDS Facture — Spécifications Techniques & Architecture Fonctionnelle

**GDS Facture** est une application SaaS professionnelle de gestion de facturation électronique, conçue pour répondre aux exigences de la conformité fiscale et de la transmission eTVA auprès de la Direction Générale des Impôts (DGI) en Guinée.

---

## 1. Objectif & Vue d'Ensemble du Projet

GDS Facture permet d'assurer le cycle complet de facturation électronique pour les entreprises :

```
Utilisateur -> Entreprise -> Clients -> Produits / Services -> Paramétrage
  -> Création Facture -> Calcul HT / TVA / TTC -> Validation -> Génération PDF
  -> Transmission eTVA -> Réponse API DGI -> Mise à jour du Statut -> Historique & Audit
```

L'application prend également en charge la gestion intégrée des factures d'avoir et le suivi complet des opérations.

---

## 2. Stack Technique

### Frontend
- **Framework** : React 19, TypeScript, Vite 8
- **Routing & SSR** : TanStack Router, TanStack Start
- **Design System & UI** : Tailwind CSS v4, Radix UI, Lucide React Icons
- **Visualisation de Données** : Recharts
- **Communication API** : Axios, TanStack Query

### Backend Cible
- **Langage & Framework** : Python, Django, Django REST Framework (DRF)
- **Base de Données** : PostgreSQL
- **Génération PDF** : ReportLab

---

## 3. Conformité & API eTVA DGI

L'intégration eTVA est une partie centrale du système. 

- Les appels d'API s'appuient sur les spécifications officielles OpenAPI / Swagger fournies par la DGI.
- En environnement de développement ou de test, l'application utilise un **Mode Simulation / Démo** clairement identifié.
- L'architecture isole les adapteurs eTVA pour permettre la bascule transparente entre le mode simulation et le serveur réel de la DGI.

---

## 4. Charte Graphique & Design System

L'interface adopte une identité sobre, professionnelle et moderne.

- **Slate Ocean (`#2F4858`)** : Utilisé pour la navigation (sidebar), les en-têtes, les boutons principaux et les éléments de branding.
- **Cloud Mint (`#DDFBEF`)** : Utilisé pour les badges de statut positifs, les mises en avant et les arrière-plans secondaires.
- **Fond clair & Cartes** : Structure épurée maximisant la lisibilité des tableaux et des formulaires financiers.

---

## 5. Modèles de Données & Entités

L'architecture repose sur les entités métier suivantes :

- **Company (Entreprise)** : Raison sociale, NIF, adresse, logo, coordonnées bancaires.
- **User (Utilisateurs & Rôles)** : Administrateur, Facturier, Agent de lecture.
- **Customer (Clients)** : Raison sociale, NIFp, adresse, contact, email, statut actif.
- **Product (Catalogue)** : Référence, libellé, prix unitaire HT, taux de TVA, unité.
- **Invoice (Factures)** : Référence unique, client, dates (émission/échéance), statut (`brouillon`, `validee`, `transmise`, `acceptee`, `rejetee`), statut eTVA, montants HT/TVA/TTC.
- **InvoiceLine (Lignes de facture)** : Produit associé, description, quantité, prix unitaire, taux de TVA, total HT.
- **CreditNote (Avoirs)** : Facture d'origine liée, motif, montants réajustés.
- **EtvaTransmission (Transmissions eTVA)** : Payload JSON, réponse API, code retour, horodatage, jeton de validation.
- **AuditLog (Journaux d'activité)** : Horodatage, utilisateur, action effectuée, cible et résultat.

---

## 6. Modules Fonctionnels

1. **Tableau de Bord** : Indicateurs clés (CA HT, TVA collectée, factures à transmettre, clients actifs) et graphiques d'évolution.
2. **Gestion des Clients** : Référentiel complet avec recherche et validation du NIFp.
3. **Catalogue Produits & Services** : Gestion du prix et des règles de TVA applicables.
4. **Édition de Factures** : Calcul automatique des totaux HT/TVA/TTC en temps réel et édition dynamique des lignes.
5. **Gestion des Avoirs** : Annulation partielle ou totale de factures avec référence croisée.
6. **Espace eTVA** : File d'attente de transmission, simulation/envoi à la DGI et journal des retours API.
7. **Gestion des Utilisateurs & Audit** : Contrôle d'accès basé sur les rôles (RBAC) et traçabilité des opérations.

---

## 7. Structure du Code Frontend

```text
gds-facture/
├── public/                # Assets statiques (logo.png, favicon.png)
├── src/
│   ├── components/        # Composants UI (ui/) et composants réutilisables (common/)
│   ├── lib/               # Modèles de données, helpers de formatage et store React
│   ├── routes/            # Pages & routes TanStack Router (__root, _espace, index)
│   ├── services/          # Client API HTTP et connecteur eTVA
│   └── vite-env.d.ts      # Déclarations ambiantes Vite
├── vite.config.ts         # Configuration Vite + TanStack Start
├── tsconfig.json          # Configuration TypeScript
└── package.json           # Dépendances du projet
```

---

## 8. Installation & Commandes

```bash
# Installation des dépendances
npm install

# Lancement du serveur de développement
npm run dev

# Contrôle du linter
npm run lint

# Vérification du typage TypeScript
npx tsc --noEmit

# Compilation pour la production
npm run build
```

---

Tous droits réservés © GDS Guinée SARL.
