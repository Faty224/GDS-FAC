# GDS Invoice Flow

GDS FACTURE — PROMPT DE DÉVELOPPEMENT COMPLET

Tu es un développeur logiciel senior spécialisé dans les applications SaaS métier, la facturation électronique, les interfaces administratives modernes et les architectures frontend/backend.

Je veux construire une application web professionnelle appelée GDS Facture.

Il ne s'agit PAS d'une simple landing page ni d'une maquette statique.

Je veux construire une véritable application de facturation électronique, pensée pour être connectée à un backend Django REST Framework et à l'API eTVA de la DGI.

Le projet doit respecter le cahier des charges fonctionnel et le plan technique fournis.

1. OBJECTIF DU PROJET

GDS Facture est un logiciel permettant de gérer le cycle complet de facturation électronique :

Utilisateur
↓
Entreprise
↓
Clients
↓
Produits / Services
↓
Paramétrage de facturation
↓
Création facture
↓
Calcul HT / TVA / TTC
↓
Validation
↓
Génération PDF
↓
Transmission eTVA
↓
Réponse API DGI
↓
Mise à jour du statut
↓
Historique / Logs / Audit

L'application doit également gérer les factures d'avoir.

Le parcours doit pouvoir être réalisé de bout en bout sans intervention manuelle dans la base de données.

2. STACK TECHNIQUE

FRONTEND

Utiliser obligatoirement :

React

Vite

TypeScript

Tailwind CSS

React Router

Axios

Lucide React

Recharts pour les graphiques

Ne pas utiliser Bootstrap comme framework principal.

Le frontend doit être structuré comme une vraie application métier moderne.

BACKEND

Le backend cible est :

Python

Django

Django REST Framework

PostgreSQL

ReportLab pour la génération PDF

Architecture backend prévue :

config/
accounts/
companies/
clients/
products/
billing/
credit_notes/
pdf/
dashboard/
etva/
audit/

Le frontend React communiquera avec le backend uniquement via des API REST.

3. IMPORTANT : NE PAS INVENTER L'API eTVA

L'intégration eTVA est une partie critique du projet.

Ne jamais inventer :

endpoint ;

URL ;

méthode ;

structure JSON ;

nom de champ ;

code retour ;

mécanisme d'authentification ;

token ;

certificat.

Les éléments exacts de l'API eTVA devront être récupérés à partir de la documentation officielle / Swagger DGI fournie ultérieurement.

En attendant, créer une architecture propre permettant de brancher facilement l'API réelle.

Si une simulation est nécessaire pour le développement frontend, elle doit être clairement identifiée comme :

MODE SIMULATION / DEMO

Elle ne doit jamais être présentée comme une transmission réelle à la DGI.

4. IDENTITÉ VISUELLE

L'application doit avoir une identité professionnelle, sobre et moderne.

Couleurs principales

Slate Ocean

#2F4858

Utilisation :

sidebar ;

navigation ;

boutons principaux ;

titres importants ;

éléments actifs ;

certains graphiques ;

éléments de branding.

Cloud Mint

#DDFBEF

Utilisation :

backgrounds secondaires ;

badges positifs ;

zones d'information ;

éléments de mise en avant ;

hover doux ;

statistiques secondaires.

Utiliser principalement du blanc pour conserver une interface claire.

Éviter un design trop coloré.

Le résultat doit avoir un aspect :

professionnel ;

administratif ;

moderne ;

fiable ;

propre ;

élégant ;

facile à utiliser.

Éviter absolument l'apparence "AI generated", les gradients excessifs, les effets 3D inutiles et les animations extravagantes.

5. PRINCIPES UX

L'application est destinée à des utilisateurs professionnels.

L'interface doit donc être :

simple ;

intuitive ;

rapide ;

cohérente ;

responsive ;

accessible ;

orientée productivité.

Ne pas surcharger les écrans.

Les informations importantes doivent être visibles immédiatement.

Les actions principales doivent être clairement identifiables.

Chaque formulaire doit avoir :

labels clairs ;

champs obligatoires identifiables ;

messages d'erreur ;

validation ;

états loading ;

confirmation de succès ;

possibilité d'annulation.

6. STRUCTURE GLOBALE DE L'APPLICATION

Créer un layout principal avec :

Sidebar

Dashboard

Factures

Avoirs

Clients

Produits & Services

Paramétrage

Entreprise

eTVA

Utilisateurs

Journal d'activité

Paramètres

Header

Afficher :

nom de l'utilisateur ;

rôle ;

notifications ;

menu profil ;

déconnexion.

Sur mobile, transformer la sidebar en menu responsive.

7. AUTHENTIFICATION

Créer les écrans :

Connexion

Champs :

identifiant / email ;

mot de passe.

Actions :

Se connecter ;

Mot de passe oublié.

Mot de passe oublié

Permettre la demande de réinitialisation.

Protection des routes

Les pages privées ne doivent pas être accessibles sans authentification.

Préparer la structure pour une authentification via Django REST Framework.

Ne jamais stocker de secret sensible en clair dans le frontend.

8. GESTION DES RÔLES

Prévoir trois rôles :

Administrateur

Peut :

gérer les utilisateurs ;

gérer l'entreprise ;

gérer les paramètres ;

consulter l'ensemble des données ;

consulter les journaux.

Facturier

Peut :

gérer les clients ;

gérer les produits/services ;

créer les factures ;

gérer les avoirs ;

consulter les factures ;

effectuer les actions liées à la facturation.

Consultation

Accès en lecture seule aux données autorisées.

L'interface doit adapter automatiquement les actions disponibles selon le rôle.

Exemple :

Un utilisateur Consultation ne doit pas voir un bouton "Modifier" ou "Supprimer" lorsqu'il n'a pas cette permission.

9. DASHBOARD

Créer un dashboard professionnel.

Afficher notamment :

chiffre d'affaires ;

nombre de factures ;

factures en attente ;

factures transmises ;

factures acceptées ;

factures rejetées ;

avoirs ;

TVA ;

évolution de la facturation.

Ajouter des graphiques avec Recharts.

Prévoir par exemple :

Évolution du chiffre d'affaires

Graphique par période.

Répartition des factures

Brouillon

Validée

En transmission

Transmise

Acceptée

Rejetée

Activité récente

Afficher les dernières actions :

facture créée ;

facture validée ;

facture transmise ;

facture acceptée ;

avoir créé ;

client ajouté ;

produit ajouté.

Les données doivent être structurées pour pouvoir être remplacées facilement par de vraies données API.

10. GESTION DE L'ENTREPRISE

Créer une page Entreprise.

Prévoir les informations nécessaires à l'entreprise, notamment selon les données qui seront définies côté backend.

La page doit permettre :

consultation ;

modification ;

sauvegarde.

Prévoir notamment les informations fiscales nécessaires lorsque celles-ci sont disponibles dans le modèle backend.

L'interface doit être prête à gérer le NIF / NIFp lorsque nécessaire.

11. GESTION DES CLIENTS

Créer un module complet Clients.

Liste

Afficher :

nom / raison sociale ;

NIFp ;

téléphone ;

email ;

statut ;

date de création ;

actions.

Actions :

rechercher ;

filtrer ;

ajouter ;

consulter ;

modifier ;

supprimer selon permissions.

Ajouter un client

Créer un formulaire propre.

Le champ NIFp doit être clairement identifiable puisqu'il est important pour la facturation électronique.

Fiche client

Afficher :

informations générales ;

historique des factures ;

historique des avoirs ;

montant facturé ;

dernière facture.

12. PRODUITS & SERVICES

Créer un module permettant de gérer :

produits ;

services.

Liste avec :

référence ;

désignation ;

type ;

prix ;

TVA ;

statut ;

actions.

Fonctionnalités :

ajout ;

modification ;

suppression ;

recherche ;

filtrage.

Lors de la création d'une facture, les produits/services doivent pouvoir être sélectionnés facilement.

13. PARAMÉTRAGE DE FACTURATION

Créer une page dédiée au Paramétrage de facturation.

Une configuration doit notamment permettre de définir :

Référence ;

Libellé ;

Mentions légales ;

Instructions de paiement.

Prévoir :

création ;

modification ;

suppression ;

activation/désactivation ;

sélection lors de la création d'une facture.

Créer une interface simple sous forme de liste + formulaire.

14. MODULE FACTURES

Créer le module principal Factures.

Liste des factures

Colonnes :

numéro/référence ;

client ;

date ;

échéance ;

HT ;

TVA ;

TTC ;

statut ;

statut eTVA ;

actions.

Fonctionnalités :

recherche ;

filtres ;

tri ;

pagination ;

consultation ;

modification selon statut ;

téléchargement PDF ;

transmission eTVA.

15. CRÉATION D'UNE FACTURE

Créer une interface de création de facture professionnelle.

Le parcours doit être clair et organisé en sections.

Informations client

Prévoir :

NIFp ;

raison sociale / client.

Permettre la sélection d'un client existant.

Paramétrage

Sélectionner le paramétrage de facturation.

Référence interne

Prévoir :

référence facture interne.

Échéance

Permettre de définir la date d'échéance.

Facturation

Prévoir :

date de facturation.

Réalisation

Prévoir les informations liées à la réalisation lorsque nécessaires.

Lignes de facture

Permettre d'ajouter dynamiquement plusieurs lignes.

Chaque ligne doit pouvoir contenir :

produit/service ;

description ;

quantité ;

prix unitaire ;

taux TVA ;

montant.

Actions :

ajouter une ligne ;

supprimer une ligne ;

modifier une ligne.

16. CALCUL AUTOMATIQUE

Les montants doivent être calculés automatiquement.

Pour chaque ligne :

Montant HT = Quantité × Prix unitaire

Puis :

TVA = Montant HT × Taux TVA

Puis :

TTC = HT + TVA

Afficher clairement :

Total HT ;

Total TVA ;

Total TTC.

Prévoir la possibilité de gérer les règles spécifiques définies par le backend.

IMPORTANT :

Les calculs affichés dans React servent à l'expérience utilisateur.

Les calculs définitifs doivent être recalculés et validés côté backend afin d'éviter toute manipulation côté client.

17. MENTIONS LÉGALES

Prévoir une section permettant d'afficher / utiliser :

mentions légales ;

instructions de paiement.

Ces informations doivent pouvoir provenir du paramétrage sélectionné.

18. VALIDATION DE FACTURE

Avant validation, afficher un récapitulatif :

Client

Nom / raison sociale / NIFp

Facture

Référence / date / échéance

Détails

Toutes les lignes.

Totaux

HT / TVA / TTC

Mentions

Mentions légales / instructions de paiement.

Prévoir une confirmation avant validation définitive.

19. FICHE DÉTAIL FACTURE

Créer une page détaillée professionnelle.

Afficher :

référence ;

client ;

NIFp ;

dates ;

lignes ;

HT ;

TVA ;

TTC ;

mentions ;

statut ;

informations eTVA ;

historique des actions.

Actions :

Télécharger PDF ;

Imprimer ;

Transmettre à eTVA ;

Consulter les détails de transmission ;

Créer un avoir lorsque possible.

20. STATUTS DES FACTURES

Prévoir un système de badges cohérents.

Exemples :

Brouillon

Validée

En transmission

Transmise

Acceptée

Rejetée

Erreur

Les statuts doivent être facilement compréhensibles.

Afficher un message explicatif lorsqu'une facture est rejetée ou en erreur.

21. GÉNÉRATION PDF

Prévoir un bouton :

Télécharger le PDF

Le PDF sera généré côté backend avec ReportLab.

Le frontend ne doit pas générer lui-même le PDF final.

Prévoir une interface permettant de :

demander la génération ;

afficher le loading ;

télécharger le fichier ;

gérer les erreurs.

Le PDF devra reprendre les informations de la facture.

22. FACTURES D'AVOIR

Créer un module complet Avoirs.

Permettre la création d'un avoir à partir d'une facture parent.

Le formulaire doit notamment prévoir :

facture parent ;

NIFp client ;

paramétrage ;

référence interne ;

échéance ;

date de facturation ;

mentions légales ;

instructions de paiement.

Afficher clairement le lien entre l'avoir et la facture d'origine.

Prévoir :

création ;

consultation ;

PDF ;

transmission eTVA ;

statut ;

historique.

23. eTVA

Créer un espace eTVA.

Afficher :

nombre de transmissions ;

transmissions réussies ;

transmissions rejetées ;

transmissions en erreur ;

dernières transmissions.

Créer une page d'historique.

Colonnes :

facture ;

date ;

statut ;

référence DGI ;

réponse ;

date de transmission ;

actions.

24. TRANSMISSION eTVA

Lorsqu'un utilisateur clique sur :

Transmettre à eTVA

afficher une confirmation.

Puis :

Facture validée
↓
Préparation des données
↓
Validation
↓
Transmission
↓
Réponse DGI
↓
Enregistrement
↓
Mise à jour du statut

Pendant la transmission, afficher un état :

Transmission en cours...

Après réponse :

Succès

Afficher :

transmission réussie ;

référence reçue ;

date ;

statut.

Rejet

Afficher :

facture rejetée ;

motif ;

réponse API ;

possibilité de consulter les détails.

Erreur technique

Afficher :

erreur de communication ;

timeout ;

API indisponible ;

erreur inattendue.

Ne jamais masquer l'erreur.

25. IDÉMPOTENCE ET DOUBLONS

Prévoir une logique permettant d'éviter la transmission accidentelle d'une même facture plusieurs fois.

Avant transmission :

vérifier le statut ;

vérifier si une transmission existe déjà ;

empêcher une double transmission lorsque cela est nécessaire.

Cette logique définitive doit être gérée côté backend.

Le frontend doit refléter correctement l'état.

26. JOURNAUX API

Créer une interface Logs API / eTVA.

Afficher :

date ;

facture ;

type d'opération ;

statut HTTP ;

résultat ;

durée ;

message.

Ne jamais afficher de :

mot de passe ;

clé API ;

secret ;

token sensible ;

certificat privé.

Les informations sensibles doivent être masquées.

27. JOURNAL D'AUDIT

Créer un module permettant de consulter les actions importantes.

Exemples :

Fatima a créé une facture
Fatima a modifié un client
Admin a créé un utilisateur
Facture XXX transmise à eTVA
Facture XXX rejetée
Avoir XXX créé

Afficher :

utilisateur ;

action ;

objet ;

date ;

résultat.

28. NOTIFICATIONS

Créer un système de notifications.

Exemples :

facture créée ;

facture validée ;

transmission réussie ;

transmission rejetée ;

erreur eTVA ;

avoir créé.

Prévoir :

toast ;

notifications persistantes si nécessaire.

29. RECHERCHE ET FILTRES

Les modules principaux doivent avoir une recherche.

Factures :

référence ;

client ;

statut ;

date.

Clients :

nom ;

NIFp ;

téléphone.

Produits :

référence ;

désignation.

eTVA :

facture ;

statut ;

référence DGI ;

date.

30. RESPONSIVE DESIGN

L'application doit être parfaitement utilisable :

ordinateur ;

tablette ;

mobile.

Desktop :

Sidebar fixe.

Mobile :

Sidebar transformée en menu mobile.

Les tableaux doivent rester utilisables sur petits écrans.

Les formulaires doivent être adaptés aux mobiles.

31. ÉTATS UI

Prévoir systématiquement :

Loading

Skeleton loaders ou indicateurs élégants.

Empty state

Exemple :

"Aucune facture pour le moment."

Avec une action :

"Créer une facture"

Error state

Message clair et action de récupération.

Success state

Confirmation claire.

Ne jamais laisser un écran vide sans explication.

32. COMPOSANTS RÉUTILISABLES

Créer un véritable design system.

Composants :

Button ;

Input ;

Select ;

DatePicker ;

Modal ;

Drawer ;

Card ;

Badge ;

Table ;

Pagination ;

Tabs ;

Dropdown ;

Toast ;

Alert ;

Tooltip ;

Skeleton ;

EmptyState ;

ErrorState ;

ConfirmDialog.

Ne pas répéter inutilement le même code.

33. ARCHITECTURE REACT

Organiser le frontend de façon propre :

src/
├── assets/
├── components/
│ ├── ui/
│ ├── layout/
│ ├── dashboard/
│ ├── invoices/
│ ├── customers/
│ ├── products/
│ └── etva/
│
├── pages/
│ ├── auth/
│ ├── dashboard/
│ ├── customers/
│ ├── products/
│ ├── invoices/
│ ├── credit-notes/
│ ├── company/
│ ├── billing-settings/
│ ├── users/
│ ├── etva/
│ └── audit/
│
├── layouts/
├── services/
├── hooks/
├── types/
├── utils/
├── routes/
└── App.tsx

Centraliser les appels API dans services/.

Préparer Axios pour :

base URL ;

headers ;

authentification ;

gestion des erreurs ;

interceptors.

34. API FRONTEND

Préparer les services :

auth.service.ts
company.service.ts
customers.service.ts
products.service.ts
billing.service.ts
invoices.service.ts
credit-notes.service.ts
etva.service.ts
dashboard.service.ts
audit.service.ts

Le code doit être prêt à remplacer les données mockées par les vraies API Django.

35. VARIABLES D'ENVIRONNEMENT

Prévoir une configuration du type :

VITE_API_URL=

Ne jamais hardcoder des secrets.

Ne jamais placer de credentials DGI dans le frontend.

36. SÉCURITÉ

Respecter les principes suivants :

routes protégées ;

contrôle des permissions ;

validation frontend ;

validation backend attendue ;

protection contre XSS ;

protection CSRF côté backend ;

absence de secrets dans le code frontend ;

absence de secrets dans les logs ;

contrôle des accès entre entreprises ;

téléchargement sécurisé des fichiers.

Le frontend ne doit jamais être considéré comme une source de confiance.

37. MULTI-ENTREPRISE / ISOLATION DES DONNÉES

Préparer l'architecture pour que les données soient correctement liées à l'entreprise de l'utilisateur.

Un utilisateur d'une entreprise ne doit jamais pouvoir consulter ou modifier les données d'une autre entreprise.

Cette sécurité doit être appliquée côté backend.

38. DONNÉES DE DÉMONSTRATION

Pour permettre de visualiser l'application avant connexion au backend, utiliser des données fictives réalistes.

Créer quelques exemples :

entreprises ;

clients ;

produits ;

factures ;

avoirs ;

transmissions eTVA.

IMPORTANT :

Ces données doivent être clairement des données de démonstration.

Ne pas simuler silencieusement une vraie transmission DGI.

39. DASHBOARD — EXEMPLE DE DONNÉES

Utiliser des données suffisamment réalistes pour rendre le dashboard crédible.

Exemple :

Chiffre d'affaires
125 450 000 GNF

Factures
248

Acceptées
221

En attente
12

Rejetées
15

Ces valeurs sont uniquement des données de démonstration.

40. UX DE CRÉATION DE FACTURE

La création de facture est l'une des fonctionnalités les plus importantes.

Elle doit être particulièrement soignée.

Je veux une expérience fluide :

1. Client
2. Paramétrage
3. Informations facture
4. Lignes
5. Totaux
6. Mentions
7. Récapitulatif
8. Validation

Éviter un formulaire interminable.

Organiser intelligemment les informations.

41. CONFIRMATIONS

Pour les actions sensibles :

suppression ;

validation ;

transmission eTVA ;

création d'avoir ;

afficher une confirmation.

Exemple :

"Êtes-vous sûr de vouloir transmettre cette facture à eTVA ?"

Afficher ensuite l'état de traitement.

42. DESIGN DES TABLEAUX

Les tableaux doivent être professionnels.

Prévoir :

en-têtes clairs ;

pagination ;

recherche ;

filtres ;

actions ;

hover léger ;

responsive.

Éviter les tableaux trop chargés.

43. DESIGN DES FORMULAIRES

Les formulaires doivent utiliser :

labels au-dessus des champs ;

placeholders utiles ;

messages d'erreur sous les champs ;

indication des champs obligatoires ;

regroupement logique.

Ne pas utiliser uniquement des placeholders comme labels.

44. ACCESSIBILITÉ

Prévoir :

contrastes suffisants ;

labels ;

navigation clavier lorsque possible ;

boutons compréhensibles ;

messages d'erreur explicites.

45. ANIMATIONS

Utiliser des animations très légères uniquement lorsqu'elles améliorent l'expérience :

apparition de pages ;

ouverture de modal ;

toast ;

changement d'état.

Pas d'animations excessives.

46. CE QUE JE NE VEUX PAS

NE PAS produire :

une simple landing page ;

une maquette sans logique ;

un dashboard générique ;

des boutons qui ne font rien ;

des formulaires décoratifs ;

une fausse intégration DGI présentée comme réelle ;

des endpoints eTVA inventés ;

des données DGI inventées ;

des secrets dans le frontend ;

du Bootstrap comme framework principal ;

un design rempli de gradients ;

une interface qui ressemble à un template généré automatiquement.

47. CE QUE JE VEUX

Je veux une application qui donne immédiatement l'impression d'un logiciel professionnel réellement destiné à une entreprise.

Elle doit être :

simple + moderne + fiable + professionnelle + claire + évolutive.

Chaque fonctionnalité doit être pensée pour être réellement connectée au backend Django.

48. PRÉPARATION DU BACKEND

Même si Lovable commence par le frontend, l'architecture doit être pensée dès le départ pour Django REST Framework.

Les pages et composants doivent être construits de manière à recevoir plus tard :

GET
POST
PUT/PATCH
DELETE

depuis l'API Django.

Ne pas coupler l'application à des données statiques.

49. ENVIRONNEMENTS

Prévoir la séparation :

LOCAL
↓
TEST / PRÉPRODUCTION
↓
SANDBOX DGI
↓
HOMOLOGATION
↓
PRODUCTION

Les URLs et credentials devront être configurables selon l'environnement.

50. TESTS

Préparer le projet pour tester :

Authentification

connexion valide ;

connexion invalide ;

route protégée.

Permissions

Admin ;

Facturier ;

Consultation.

Factures

création ;

modification ;

validation ;

calcul HT/TVA/TTC ;

PDF ;

avoir.

eTVA

authentification valide ;

authentification invalide ;

facture valide ;

JSON invalide ;

token expiré ;

API indisponible ;

timeout ;

réponse inattendue.

Sécurité

Tester notamment :

accès non authentifié ;

accès avec mauvais rôle ;

accès aux données d'une autre entreprise ;

XSS ;

CSRF ;

exposition de secrets.

51. ORDRE DE DÉVELOPPEMENT

Ne pas essayer de tout construire en une seule étape.

Suivre cet ordre :

PHASE 1 — UI / DESIGN SYSTEM

Créer :

thème ;

couleurs ;

layout ;

sidebar ;

header ;

composants ;

responsive.

PHASE 2 — AUTHENTIFICATION

Créer :

connexion ;

protection des routes ;

rôles ;

profil.

PHASE 3 — DASHBOARD

Créer :

KPIs ;

graphiques ;

activité.

PHASE 4 — DONNÉES MÉTIER

Créer :

entreprise ;

clients ;

produits/services ;

paramétrage.

PHASE 5 — FACTURATION

Créer :

liste factures ;

création ;

calculs ;

détail ;

statuts ;

PDF.

PHASE 6 — AVOIRS

Créer :

liste ;

création ;

détail ;

PDF ;

statut.

PHASE 7 — eTVA

Créer :

dashboard eTVA ;

transmission ;

historique ;

erreurs ;

logs.

PHASE 8 — AUDIT

Créer :

journal d'activité ;

logs API.

PHASE 9 — CONNEXION DJANGO

Connecter les services React aux API Django REST Framework.

PHASE 10 — eTVA RÉELLE

Une fois la documentation officielle DGI/Swagger disponible :

intégrer les endpoints réels ;

intégrer le schéma JSON officiel ;

intégrer l'authentification officielle ;

tester en sandbox ;

préparer l'homologation.

52. CRITÈRE FINAL DE RÉUSSITE

Le produit final doit permettre de réaliser ce parcours :

Créer utilisateur
↓
Configurer entreprise
↓
Créer client
↓
Créer produit
↓
Créer paramétrage
↓
Créer facture
↓
Calculer HT
↓
Calculer TVA
↓
Calculer TTC
↓
Valider facture
↓
Générer PDF
↓
Transmettre eTVA
↓
Recevoir réponse
↓
Enregistrer référence
↓
Mettre à jour statut
↓
Conserver les logs
↓
Afficher le résultat dans le dashboard

Et également :

Facture existante
↓
Créer avoir
↓
Générer PDF
↓
Transmettre eTVA
↓
Enregistrer réponse
↓
Historique

53. RÈGLE FINALE POUR LOVABLE

Construis GDS Facture comme un véritable produit logiciel, pas comme une démonstration visuelle.

Priorité :

Fonctionnalité

Architecture

UX

Sécurité

Cohérence visuelle

Le frontend doit être en :

React + Vite + TypeScript + Tailwind CSS

Le backend cible est :

Django + Django REST Framework + PostgreSQL

L'intégration eTVA doit être conçue pour être branchée sur l'API officielle DGI dès que le Swagger et les informations techniques officielles sont disponibles.

Ne jamais inventer les informations techniques de l'API eTVA.

Utiliser les couleurs :

Slate Ocean — #2F4858

Cloud Mint — #DDFBEF

Le résultat doit être professionnel, sobre, moderne, responsive et suffisamment structuré pour évoluer vers une application de production.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6ad37722-569c-4c41-88e3-aac23349e296).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
