# CAHIER DES CHARGES FONCTIONNEL ET TECHNIQUE
## Projet : LGLM Manager — Système de Gestion de Location de Véhicules
**Version du Document :** 1.0  
**Version Logicielle Cible :** v2.0.0  
**Client / Cible :** Agences de location de voitures (ex: LGLM Rent A Car)  
**Plateforme :** Application de bureau Windows native (.exe) & Application Web  

---

## 1. PRÉSENTATION DU PROJET & OBJECTIFS

### 1.1 Contexte
Les agences de location de véhicules font face à une gestion quotidienne complexe comprenant le suivi en temps réel de la flotte automobile, l'enregistrement des clients, la rédaction des contrats de location, le suivi des entretiens (vidanges), la facturation conforme aux normes fiscales, ainsi que la comptabilité générale (recettes, dépenses, gestion des collaborateurs/chauffeurs).

### 1.2 Objectif Principal
Développer une solution logicielle tout-en-un, autonome, rapide et intuitive nommée **LGLM Manager**, utilisable directement sous forme d'application de bureau Windows native (sans navigateur visible) et fonctionnant en mode déconnecté (offline) avec persistance locale sécurisée des données.

### 1.3 Bénéfices Attendus
- **Zéro perte de données :** Base de données locale persistante sur disque avec modules de sauvegarde/restauration.
- **Gain de temps opérationnel :** Édition et impression instantanées des contrats de location et factures en quelques clics.
- **Suivi précis de la flotte :** Alertes visuelles automatiques sur les vidanges et la disponibilité des voitures.
- **Maîtrise financière :** Visibilité en direct sur le chiffre d'affaires, les charges et la rentabilité nette.

---

## 2. PÉRIMÈTRE & ACTEURS DU SYSTÈME

### 2.1 Profils Utilisateurs
- **Administrateur / Gérant d'agence :** Accès complet à tous les modules (configuration, finances, suppression/modification, paramètres agence et sécurité).
- **Agent d'accueil / Opérateur de comptoir :** Création des réservations, remise et restitution des véhicules, génération des factures et contrats.

### 2.2 Modes de Fonctionnement
- **Mode Bureau Windows (Prioritaire) :** Exécutable indépendant avec barre de titre intégrée Windows 11 (réduire, agrandir, fermer, glisser-déplacer).
- **Mode Web / Réseau Local :** Accessible via navigateur web moderne (Chrome, Edge) pour des postes secondaires.

---

## 3. SPÉCIFICATIONS FONCTIONNELLES DÉTAILLÉES

### Module 1 : Tableau de Bord & Indicateurs Clés (Dashboard)
- **KPIs en temps réel :**
  - Nombre total de véhicules dans le parc et taux de disponibilité.
  - Nombre de locations actives, réservations en attente et terminées.
  - Chiffre d'affaires mensuel et dépenses globales.
- **Système d'alertes préventives :**
  - Alerte vidange proactive basée sur le kilométrage actuel vs le kilométrage de la dernière vidange (seuil paramétrable).
  - Alertes sur les retours prévus dans la journée.
- **Raccourcis d'actions rapides :** Accès direct à la création de réservation ou à l'émission d'une facture.

---

### Module 2 : Gestion de la Flotte Automobile (Parc Véhicules)
- **Fiche Véhicule complète :**
  - Immatriculation (identifiant unique), Marque, Modèle, Année, Couleur.
  - Type de transmission (Manuelle / Automatique) et catégorie (SUV, Berline, 4x4, Citadine).
  - Kilométrage actuel et kilométrage de dernière vidange.
  - Tarif de location journalier par défaut (en DT / devise locale).
  - Photo du véhicule.
- **Statut dynamique :**
  - *Disponible* (vert) : prêt pour une nouvelle attribution.
  - *Louée* (rouge/ambre) : actuellement en contrat actif.
- **Recherche et filtres multicritères :** Par marque, immatriculation ou disponibilité.

---

### Module 3 : Gestion des Clients & Conducteurs
- **Base Clients :**
  - Identité complète : Nom & Prénom, CIN / Passeport, Téléphone, Adresse, Email, Nationalité.
  - Permis de conduire : Numéro et Date de délivrance.
- **Deuxième Conducteur :**
  - Prise en charge d'un conducteur secondaire au contrat (Nom, CIN, Téléphone).
- **Historique Client :** Historique des locations passées et cumul des règlements.

---

### Module 4 : Gestion des Réservations & Contrats de Location
- **Cycle de vie de la location :**
  - *Réservation En attente* -> *Confirmée* -> *Location En cours* -> *Terminée* (ou *Annulée*).
- **Calculateur de location intelligent :**
  - Détermination automatique du nombre de jours entre date/heure de prise en charge et de retour.
  - Calcul automatique du montant total, de l'acompte (avance versée) et du solde restant dû.
  - Gestion de la caution (dépôt de garantie).
  - Relevé des kilométrages : Départ et Retour.
- **Génération & Impression du Contrat de Location :**
  - Modèle officiel professionnel prêt pour impression directe (A4) ou export PDF.
  - Conditions générales, mentions légales, signatures client et gérant.
- **Prolongation de contrat :**
  - Possibilité d'étendre la durée avec recalcul du montant et inscription automatique du supplément dans les recettes.

---

### Module 5 : Facturation & Devis Professionnels (Billing)
- **Deux modes de création :**
  1. *Depuis Contrat existant :* Récupération automatique de toutes les informations du contrat et du client avec choix d'application de la TVA.
  2. *Création Libre / Devis estimatif :* Formulaire polyvalent pour émettre une facture sans contrat préalable ou un devis valable 15 jours.
- **Calculs fiscaux précis :**
  - Prise en compte du taux de TVA de l'agence (ex: 19% ou 20%).
  - Calcul automatique ou saisie directe du Montant HT, Montant TVA et Montant Total TTC.
  - Mentions légales de paiement et matricule fiscal client/société.
- **Historique & Cycle de vie des pièces :**
  - Numérotation séquentielle normalisée (`FACT-YYYY-XXXX` ou `DEV-YYYY-XXXX`).
  - Recherche instantanée par numéro, nom client, immatriculation.
  - **Modification :** Rechargement complet d'une pièce dans l'éditeur pour correction et réémission.
  - **Suppression :** Suppression sécurisée avec confirmation et mise à jour de l'état du contrat associé.
- **Export & Impression :**
  - Aperçu avant impression aux normes bureautiques.
  - Bouton d'impression directe (masquage automatique de l'interface via CSS print).
  - Export de la pièce au format JSON structuré.

---

### Module 6 : Gestion Financière & Trésorerie (Finance)
- **Suivi des Recettes :**
  - Recettes générées automatiquement par les locations.
  - Enregistrement de recettes annexes (frais supplémentaires, transferts, etc.).
- **Suivi des Dépenses par Catégorie :**
  - Carburant, Entretien & Réparations, Assurance, Impôts & Taxes, Salaires, Autres charges.
  - Saisie de la date, du montant et de la description.
- **Bilan Financier & Trésorerie :**
  - Calcul en direct du Chiffre d'Affaires total, du Total des charges et du Bénéfice Net.
  - Exportation des états financiers pour l'expert-comptable.

---

### Module 7 : Chauffeurs & Collaborateurs
- **Annuaire des chauffeurs affiliés :** Nom, coordonnées, observations.
- **Attribution d'un véhicule dédié :** Liaison avec une voiture du parc.
- **Registre des Paiements Collaborateurs :**
  - Suivi des règlements mensuels effectués aux chauffeurs avec mois, année, montant et motif.

---

### Module 8 : Paramètres de l'Agence & Sécurité
- **Identité de l'Agence :**
  - Raison sociale, logo, adresse du siège, téléphones, WhatsApp, email, texte de signature commerciale, taux de TVA par défaut.
- **Sécurité & Contrôle d'Accès :**
  - Écran de verrouillage à code PIN (Passcode) activable / désactivable.
  - Déconnexion manuelle ou automatique pour sécuriser le poste en agence.
- **Sauvegarde & Restauration (Data Protection) :**
  - Exportation complète de la base de données en JSON ou Excel (.xlsx).
  - Importation / Restauration intégrale depuis une sauvegarde JSON.
  - Réinitialisation complète avec sauvegarde automatique de précaution.
- **Personnalisation Visuelle :**
  - Thème Clair / Thème Sombre (Dark Mode) avec persistance de la préférence.

---

## 4. ARCHITECTURE TECHNIQUE & STACK LOGICIELLE

| Composant | Technologie retenue | Rôle |
|---|---|---|
| **Langage Principal** | TypeScript (v5.8) | Typage statique strict, robustesse logicielle |
| **Framework UI** | React 19 | Interface réactive, composants modulaires |
| **Bundler & Build** | Vite 6 | Compilation ultra-rapide, HMR, bundling optimisé |
| **Styling** | Vanilla CSS + Tailwind CSS 4 | Design moderne, responsive, animations fluides, styles d'impression |
| **Packager Bureau** | Electron 31 + Electron-Builder | Runtime desktop Windows, exécutable autonome |
| **Installeur Windows** | NSIS (One-Click) | Génération du programme d'installation `Setup 1.7.8.exe` |
| **Persistance des Données** | LocalStorage + IPC File System (`lglm_database.json`) | Fonctionnement 100% hors-ligne avec réplication sur le disque utilisateur |
| **Génération Documents** | SheetJS (XLSX) + CSS Print Media | Export Excel et impression vectorielle haute définition |

---

## 5. EXIGENCES NON FONCTIONNELLES

### 5.1 Ergonomie & Design (UI/UX)
- Interface inspirée des standards Windows 11 avec palette de couleurs institutionnelles (Bleu Nuit `#0F2C59`, Or/Jaune, Émeraude).
- Boutons d'actions clairement identifiés avec micro-interactions et icônes explicites (Lucide Icons).
- Adaptation stricte pour les impressions papier (masquage des menus et barres de navigation lors du lancement de l'impression).

### 5.2 Performance & Disponibilité
- Démarrage de l'application en moins de 2 secondes.
- Opérations de recherche et de filtrage instantanées (temps de réponse < 100 ms).
- Fonctionnement autonome sans connexion Internet requise.

### 5.3 Sécurité & Intégrité
- Aucune fuite de données vers des serveurs tiers non autorisés.
- Validation des saisies (champs requis, formats de dates, montants positifs).
- Boîtes de dialogue de confirmation avant toute action critique (suppression de document, réinitialisation de base).

---

## 6. LIVRABLES DU PROJET

1. **Exécutable d'installation :** `dist_desktop/LGLM Manager Setup 2.0.0.exe` prêt à être distribué sur les PC Windows.
2. **Code source complet :** Projet modulaire documenté en TypeScript/React avec scripts de build (`npm run build`, `npm run electron:build`).
3. **Manuel de configuration :** Fiche de prise en main pour le paramétrage initial de l'agence et la sauvegarde des données.
