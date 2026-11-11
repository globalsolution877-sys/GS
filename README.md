# GLOBAL SOLUTIONS — Site institutionnel premium

Site multipage statique (HTML5 / CSS3 / JavaScript ES6+) pour **GLOBAL SOLUTIONS SARL**, entreprise nigérienne de BTP, hydraulique et génie civil (Niamey, Niger — depuis 2017).

## Architecture

```
/global-solutions
├── index.html            Accueil (hero, stats, expertises, pourquoi, approche, CTA)
├── a-propos.html         Histoire, identité, vision, mission, valeurs, organisation
├── expertises.html       9 expertises détaillées avec prestations et secteurs
├── realisations.html     Galerie filtrable (Supabase + fallback local « À compléter »)
├── equipe.html           Direction (4 dirigeants, portraits à compléter)
├── actualites.html       Actualités (Supabase + emplacements éditoriaux)
├── contact.html          Formulaire de devis + carte Niamey + appels/WhatsApp
├── 404.html              Page 404 personnalisée
├── assets/
│   ├── logos/logo.jpg    Logo officiel GLOBAL SOLUTIONS
│   ├── images/           (images distantes Unsplash optimisées)
│   └── icons/
├── css/
│   ├── style.css         Design system (bleu nuit #10243A, orange #E99A35…)
│   ├── responsive.css    Mobile First (smartphone → grand écran)
│   └── animations.css    Animations discrètes, respect prefers-reduced-motion
├── admin.html            ESPACE D'ADMINISTRATION (connexion + gestion des contenus)
├── js/
│   ├── supabase-config.js  URL + clé anon (publique) — jamais la clé service_role
│   ├── gs-data.js          Couche de données : Supabase REST + cache + fallbacks
│   ├── gs-components.js    Rendu dynamique : expertises, équipe, stats, actus, réalisations
│   ├── admin.js            Authentification et CRUD de l'administration
│   ├── main.js             Reveal, parallaxe, lightbox, back-to-top
│   ├── navigation.js       Menu mobile + lien actif
│   ├── gallery.js          Filtres réalisations + chargement Supabase
│   └── contact.js          Validation + envoi Supabase (fallback mailto)
├── supabase/migrations.sql Schéma de référence
├── robots.txt
├── sitemap.xml
└── README.md
```

## Installation & lancement local

Aucun build requis. Servir le dossier avec n'importe quel serveur statique :

```bash
# Python
python3 -m http.server 8000
# ou Node
npx serve .
```

Puis ouvrir http://localhost:8000

## Déploiement

Déposer l'ensemble du dossier sur tout hébergeur statique (Netlify, Vercel, GitHub Pages, hébergeur mutualisé) en HTTPS. Mettre à jour les URLs canoniques (`https://globalsolutions.one/`) si le domaine diffère.

## Backend Supabase

Projet : **global-solutions** (`jaxnlwtqpyjykjrnuxis`, région eu-west-1).

Tables créées (RLS activé) :

| Table | Usage |
|---|---|
| `contact_messages` | Réception des demandes de devis (insert public) |
| `realisations` | Projets publiés (select `statut='publie'`) |
| `actualites` | Articles publiés (select `statut='publie'`) |
| `site_settings` | Paramètres (e-mail, téléphones, WhatsApp, réseaux) |
| `expertises` | Les 9 domaines (éditables, ordre, activation) |
| `equipe` | Les dirigeants (nom, fonction, bio, photo) |
| `stats` | Les 4 indicateurs de l'accueil |
| `pages_contenu` | Tous les textes du site (clé/valeur, par page) |
| `admins` | Comptes autorisés (créés avec le code d'invitation) |
| `app_config` | Réglages sensibles (code d'invitation) |

Configuration front : `js/supabase-config.js` contient l'URL publique et la clé **anon** (sécurisée pour le navigateur). La clé `service_role` n'est **jamais** exposée côté client. L'écriture est contrôlée **côté base** par les policies RLS et la fonction `public.is_admin()`.

---

## 🔐 Espace d'administration (`/admin.html`)

Le site est **entièrement piloté par la base de données** : tout ce qui est modifié dans l'administration apparaît immédiatement sur le site public.

### Accès discret depuis le site

| Geste | Effet |
|---|---|
| **Double-clic sur le logo** (en haut de page) | Ouvre `admin.html` |
| **Ctrl + clic** (ou Cmd + clic) sur le logo | Ouvre `admin.html` |
| **Appui long** (700 ms) sur le logo, sur mobile | Ouvre `admin.html` |
| Simple clic sur le logo | Ramène à l'accueil (comportement normal) |

Un liseré « Double-clic : administration » apparaît au survol du logo pour vous le rappeler. Aucun lien d'administration n'apparaît dans le menu public.

### Première connexion

| Champ | Valeur |
|---|---|
| URL | `https://votre-domaine/admin.html` |
| E-mail | le compte administrateur créé dans Supabase (Authentication → Users) |
| Mot de passe | défini lors de la création ou de la réinitialisation du compte |

> ⚠️ **Aucun mot de passe n'est écrit dans ce dépôt.** Pour créer ou réinitialiser un accès : Dashboard Supabase → **Authentication** → **Users** → *Add user* (ou *Reset password*). Le compte doit également figurer dans la table `admins` (voir « Créer d'autres accès »).

### Créer d'autres accès

Onglet « Première inscription » de la page admin. Le **code d'invitation** est obligatoire : il est vérifié côté base par le trigger `handle_new_user`, qui rejette toute création dont le code ne correspond pas.

Le code se lit et se change dans la table `app_config` (clé `invite_code`) :

```sql
select valeur from public.app_config where cle = 'invite_code';
update public.app_config set valeur = 'NOUVEAU-CODE' where cle = 'invite_code';
```

> 🔐 **Changez ce code** s'il a pu être communiqué à des tiers : il permet de créer un compte administrateur. Si la clé `invite_code` est supprimée ou vide, l'inscription est **libre** — à éviter en production.

### Ce que l'administration permet de gérer

| Section | Actions |
|---|---|
| **Tableau de bord** | Nombre de demandes neuves, contenus publiés, accès rapides |
| **Demandes** | Lire les messages du formulaire, marquer traité, répondre par e-mail, supprimer |
| **Réalisations** | Créer une fiche en **téléversant les photos depuis la galerie de l'appareil**, ajouter/retirer des photos, choisir la couverture, publier / dépublier / supprimer |
| **Actualités** | Rédiger, publier, dépublier, supprimer (lecture en modale sur le site) |
| **Expertises** | Ajouter, modifier, réordonner, masquer |
| **Équipe** | Ajouter un membre en **téléversant son portrait depuis la galerie**, remplacer ou retirer une photo, modifier la fiche (nom, fonction, bio, ordre), masquer |
| **Textes du site** | Modifier tous les titres/paragraphes éditoriaux (héro, sections, CTA…) |
| **Indicateurs** | Modifier les 4 chiffres de l'accueil |
| **Réglages** | E-mail, téléphones, WhatsApp, adresse, réseaux sociaux |

### Sécurité

- Le JWT est stocké en `sessionStorage` (effacé à la fermeture de l'onglet).
- Même si la clé anon est publique, **les policies RLS refusent toute écriture** à un visiteur non administrateur (vérifié : un `anon` qui tente un `UPDATE` modifie 0 ligne).
- Le trigger d'inscription bloque toute création de compte sans code d'invitation.
- `robots.txt` exclut `admin.html` et `noindex` est présent sur la page.

### Fonctionnement du dynamique

1. `js/gs-data.js` interroge l'API REST Supabase avec un cache de 5 minutes (`sessionStorage`).
2. `js/gs-components.js` remplace les sections dès que les données arrivent.
3. **Si la base est vide ou injoignable, le HTML statique reste affiché** : aucune page blanche, aucun contenu inventé.
4. Les textes utilisent l'attribut `data-content="page.cle"` ; les images `data-content-src="page.cle"`.

### Ajouter une réalisation — avec ses photographies

Via `/admin.html` → **Réalisations**. Le formulaire permet de **choisir les photos directement depuis la galerie du téléphone ou de l'ordinateur** (aucun hébergeur externe n'est nécessaire) :

1. Renseignez le titre, la catégorie (`batiments`, `hydraulique`, `forages`, `aeps`, `amenagements`, `solaire`, `genie-civil`, `metal`), la localisation, l'année et la description.
2. Cliquez sur **« Choisir les photos »** (ou glissez-déposez les fichiers). Plusieurs photos sont acceptées d'un coup, JPG / PNG / WEBP / AVIF, 10 Mo maximum par image.
3. Les vignettes s'affichent ; la **première devient la couverture** du catalogue. Utilisez × pour retirer une photo avant l'envoi.
4. **Enregistrer** : les images sont compressées puis téléversées, la fiche est créée et publiée.

Pour modifier une fiche existante : **Réalisations → « Photos / fiche »**. Vous pouvez y ajouter des photos, en retirer, mettre n'importe quelle photo en couverture (★), et modifier la présentation (titre, catégorie, année, statut, description).

| Élément | Détail technique |
|---|---|
| Stockage | Bucket public `realisations` (Supabase Storage) |
| Compression | Dans le navigateur, plus grand côté ramené à 1 800 px, JPEG qualité 0,82 — une photo de téléphone de 8 Mo descend souvent sous 400 Ko |
| Envoi | 2 photos en parallèle, avec compteur de progression sur le bouton |
| Colonnes | `image_url` (couverture), `galerie` (tableau d'URL, toutes les photos), `ordre` |
| Sécurité | Écriture réservée aux administrateurs (`public.is_admin()`), lecture publique |
| Suppression | Supprimer une fiche supprime aussi ses fichiers du bucket |

Côté public, `/realisations.html` affiche les fiches publiées avec un badge du nombre de photos ; un clic ouvre une **présentation détaillée** (visiteuse d'images avec vignettes, flèches et navigation clavier, fiche technique et appel à l'action).

### Ajouter ou remplacer le portrait d'un membre de l'équipe

Via `/admin.html` → **Équipe** :

1. **Nouveau membre** : renseignez nom, fonction, initiales, ordre et biographie, puis cliquez sur **« Choisir le portrait »** (galerie du téléphone ou de l'ordinateur, ou glisser-déposer).
2. **Membre existant** : bouton **« Photos / fiche »**. La modale affiche le portrait actuel, permet de le **remplacer**, de le **retirer** (retour à l'avatar avec initiales) et de modifier toute la présentation.
3. À l'enregistrement, l'ancien fichier est supprimé du stockage : aucun orphelin ne s'accumule.

| Élément | Détail technique |
|---|---|
| Stockage | Bucket public `equipe` (10 Mo max, formats image) |
| Compression | Même traitement que le catalogue (1 800 px, JPEG 0,82) |
| Colonne | `equipe.photo_url` |
| Affichage | Sur `/equipe.html` : portrait rond ; sans photo, avatar dégradé avec les initiales |
| Sécurité | Écriture réservée aux administrateurs, lecture publique |

### Ajouter une actualité

Via `/admin.html` → Actualités : `titre`, `extrait`, `contenu` (paragraphes séparés par une ligne vide), `image_url`, `date_publication`, `statut='publie'`.

---

## 📧 Notifications e-mail des demandes de contact

La chaîne est **complète et testée de bout en bout** : formulaire → `contact_messages` → trigger `on_contact_message_created` → Edge Function `notify-contact` → journal `notifications`. Un envoi réel a été validé (`statut = envoye`, identifiant Resend retourné).

**État actuel :** `RESEND_API_KEY` est configurée et le destinataire est réglé sur `notify_email` (`globalsolution877@gmail.com`). L'expéditeur par défaut est `onboarding@resend.dev`, ce qui **n'autorise l'envoi que vers l'adresse du compte Resend**.

➡️ **Pour recevoir les demandes sur une adresse professionnelle** (`info@globalsolutions.one`), il faut vérifier le domaine chez Resend (étape 1 et 3 ci-dessous), puis mettre `MAIL_FROM=GLOBAL SOLUTIONS <notifications@globalsolutions.one>`.

### 1. Créer une clé chez Resend (recommandé, 3 000 e-mails/mois gratuits)

1. Créez un compte sur [resend.com](https://resend.com).
2. **API Keys** → *Create API Key* → copiez la clé (`re_…`).
3. **Domains** → ajoutez `globalsolutions.one` et suivez les 3 enregistrements DNS (SPF, DKIM, DMARC) chez votre hébergeur de domaine.

### 2. Ajouter la clé dans Supabase

Dashboard Supabase → **Edge Functions** → **Secrets** → *Add new secret* :

| Nom | Valeur |
|---|---|
| `RESEND_API_KEY` | `re_votre_cle…` |
| `MAIL_TO` | adresse de réception (déjà réglée sur `info@globalsolutions.one`) |
| `MAIL_FROM` | `GLOBAL SOLUTIONS <notifications@globalsolutions.one>` |

> Sans domaine vérifié, Resend n'autorise l'envoi que vers l'adresse du compte et depuis `onboarding@resend.dev`. Vérifiez le domaine avant la mise en production.

### 3. Alternative : Brevo

Créez une clé sur [brevo.com](https://www.brevo.com) (300 e-mails/jour gratuits) et enregistrez-la sous le nom `BREVO_API_KEY`. La fonction détecte automatiquement le fournisseur disponible (Resend prioritaire).

### Suivi et dépannage

L'onglet **Notifications** de l'administration affiche le journal des 50 derniers envois avec l'état :

| État | Signification |
|---|---|
| `Envoyé` | L'e-mail est parti chez le fournisseur |
| `Non configuré` | Chaîne OK, clé API absente |
| `Échec` | Clé refusée, domaine non vérifié ou quota atteint (détail enregistré) |
| `Erreur trigger` | Problème technique côté base |

> **Note sur le destinataire :** l'adresse d'envoi (`from`) et l'adresse de réception (`to`) sont deux choses différentes. Tant que le domaine n'est pas vérifié chez Resend, `to` doit être l'adresse du compte Resend (`globalsolution877@gmail.com`). Une fois `globalsolutions.one` vérifié, `to` peut devenir `info@globalsolutions.one`.

L'adresse de réception se change directement dans cet onglet (réglage `notify_email`).

> **Garantie :** un incident d'e-mail ne bloque jamais l'enregistrement d'une demande. Le trigger attrape l'erreur, la journalise, et le message reste consultable dans l'onglet Demandes.

### Photos des réalisations et portraits

Le plus simple : héberger les images sur un service gratuit (Cloudinary, Imgur, Supabase Storage public) et coller l'URL dans le champ prévu. Aucune modification de code nécessaire.

## 📄 Documentation technique du site

Deux versions du même document, tenues à jour ensemble :

| Fichier | Usage |
|---|---|
| `docs/fiche-technique-GLOBAL-SOLUTIONS.pdf` | **Version à envoyer au client** — 6 pages, A4, téléchargeable depuis la page |
| `docs/fiche-technique.md` | Version Markdown, source unique, lisible et modifiable dans le dépôt |
| `fiche-technique.html` | Page de consultation et de téléchargement (bouton « Télécharger le PDF », `Ctrl + P` possible) |
| `tools/generate-fiche-technique-pdf.py` | Régénère le PDF depuis le Markdown après toute modification |

Régénérer le PDF après avoir édité le Markdown :

```bash
pip install reportlab
python3 tools/generate-fiche-technique-pdf.py
```

Elle couvre : identification, périmètre livré, architecture, technologies, base de données, stockage, sécurité, notifications, accessibilité, SEO, dépendances, hébergement, sauvegarde, coûts et limites.

> Le document décrit **ce qui existe et comment cela fonctionne**, avec les chiffres relevés sur le système réel (tables, règles RLS, buckets, versions). Il ne relate pas l'historique de construction du site.

## Charte graphique (couleurs exactes du logo)

Les couleurs sont prélevées directement sur `assets/logos/logo.jpg` :

| Rôle | Couleur | Origine |
|---|---|---|
| Bleu ciel — accent, boutons, icônes | `#52C6F9` (`--sky`) | Lettres **G** et **S** + points du globe |
| Gris — texte secondaire, filets, anneau décoratif | `#7E7E7E` (`--grey-logo`) / `#D7D7D7` (`--line`) | Anneau, satellite et « Global Solutions » |
| Blanc | `#FFFFFF` | Fond du logo |
| Bleu nuit — titres, fonds sombres | `#04293B` (`--navy`) | Déclinaison sombre du bleu ciel (même teinte, H 198°) |
| Bleu profond — liens/eyebrows lisibles sur blanc (AA) | `#0A75A6` (`--sky-dark`) | Déclinaison du bleu ciel |
| Fonds très clairs | `#F3FBFF` (`--sky-mist`) / `#DCF4FE` (`--sky-soft`) | Déclinaisons du bleu ciel |
| Texte principal | `#1B1B1B` | Neutre |
| WhatsApp (officiel) | `#25D366` | Couleur de la plateforme |

Le bleu ciel du logo n'est jamais utilisé pour du texte fin sur blanc (contraste insuffisant) : il sert d'aplat, de bouton et d'accent, tandis que `#0A75A6` assure la lisibilité des liens.

## Personnalisation

- **Textes / photos / actualités** : via Supabase (voir ci-dessus) — aucun code à modifier.
- **Logo** : remplacer `assets/logos/logo.jpg`.
- **Couleurs / typographies** : variables CSS en tête de `css/style.css` (voir la charte ci-dessous).
- **SEO** : titres, meta descriptions, Open Graph et Schema.org dans chaque `<head>` ; `sitemap.xml` + `robots.txt` à la racine.

## Contenus à compléter (volontairement non inventés)

- **Réalisations** : photographies et fiches projets réelles (actuellement marquées « À compléter »).
- **Portraits dirigeants** : photographies officielles (initiales en attendant).
- **Actualités** : articles définitifs via Supabase.
- **Coordonnées GPS précises** : carte indicative centrée sur Niamey uniquement.

## Accessibilité & performance

- HTML sémantique, contrastes vérifiés, `prefers-reduced-motion` respecté.
- Images en `loading="lazy"` (sauf hero), `fetchpriority="high"` sur le hero.
- Aucun framework JS lourd ; zéro clé secrète exposée.

## Contact entreprise

GLOBAL SOLUTIONS SARL — Niamey, Niger (Quartier Koira Kano), BP 12052
info@globalsolutions.one · +227 99 54 83 49 · +227 98 33 61 91
RCCM : RCCM-NI-NIA-2017-B-003 · NIF : 40242/R
