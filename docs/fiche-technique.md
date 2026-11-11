# FICHE TECHNIQUE — SITE INSTITUTIONNEL GLOBAL SOLUTIONS

**Document destiné au client** · Édition du 11 novembre 2026

---

## 1. Identification

| Rubrique | Valeur |
|---|---|
| Titulaire | GLOBAL SOLUTIONS SARL — Niamey, Niger (Quartier Koira Kano, BP 12052) |
| Immatriculation | RCCM-NI-NIA-2017-B-003 · NIF 40242/R |
| Objet | Site institutionnel multipage avec espace d'administration |
| Adresse de production | `https://jwc9.vercel.app` |
| Nom de domaine prévu | `globalsolutions.one` (non encore rattaché — voir § 12) |
| Dépôt du code | `github.com/globalsolution877-sys/GS` |
| Version de la fiche | 1.0 — 11/11/2026 |

---

## 2. Périmètre livré

### 2.1 Pages publiques (8)

| Page | Fichier | Contenu |
|---|---|---|
| Accueil | `index.html` | Héro, indicateurs, expertises, atouts, méthode, appel à l'action |
| À propos | `a-propos.html` | Identité, histoire, mission, valeurs, organisation |
| Nos expertises | `expertises.html` | 9 domaines détaillés, prestations et secteurs |
| Nos réalisations | `realisations.html` | Catalogue filtrable des projets, présentation détaillée par fiche |
| Notre équipe | `equipe.html` | Direction, portraits, fonctions |
| Actualités | `actualites.html` | Articles publiés, lecture en fenêtre modale |
| Contact | `contact.html` | Formulaire de devis, coordonnées, carte |
| Erreur 404 | `404.html` | Page de renvoi personnalisée |

### 2.2 Espace d'administration (1 page protégée)

`admin.html` — accès discret par double-clic (ou Ctrl + clic, ou appui long sur mobile) sur le logo du site. Dix sections : tableau de bord, demandes, réalisations, actualités, expertises, équipe, textes du site, indicateurs, notifications, réglages.

### 2.3 Volumétrie du code

| Élément | Mesure |
|---|---|
| Pages HTML | 9 fichiers (606 lignes de balisage) |
| Feuilles de style | 4 fichiers CSS (504 lignes) |
| Scripts | 8 fichiers JavaScript (2 165 lignes) |
| Ressources graphiques | 5 fichiers (logos, favicons, carte de partage) |
| Bibliothèques tierces | **aucune** — aucun framework, aucun gestionnaire de paquets |

---

## 3. Architecture technique

Le site repose sur une séparation nette entre **présentation** et **données** :

```
   Navigateur du visiteur
            │
            │  HTTPS
            ▼
   ┌─────────────────────┐
   │  Hébergement statique│   HTML + CSS + JavaScript
   │  (Vercel)            │   aucun serveur applicatif
   └─────────┬───────────┘
             │  API REST / API Auth / API Storage (HTTPS)
             ▼
   ┌─────────────────────┐
   │  Supabase            │   PostgreSQL 17 · authentification
   │  (eu-west-1)         │   stockage de fichiers · Edge Function
   └─────────┬───────────┘
             │  appel HTTP sortant
             ▼
   ┌─────────────────────┐
   │  Service d'e-mail    │   notification des demandes de contact
   │  (Resend)            │
   └─────────────────────┘
```

**Conséquences de ce choix d'architecture :**

- Aucun serveur d'application à maintenir, à surveiller ni à corriger (pas de PHP, pas de Node côté serveur).
- Aucun contenu n'est écrit en dur : les textes, chiffres, expertises, membres, projets et actualités proviennent de la base et s'affichent à la demande.
- Si la base est momentanément injoignable, les pages restent lisibles : le balisage statique sert de repli, aucune page blanche.
- Les fichiers sont servis avec mise en cache HTTP, sans traitement côté serveur.

---

## 4. Technologies mises en œuvre

| Couche | Technologie | Version / norme |
|---|---|---|
| Balisage | HTML5 sémantique | — |
| Présentation | CSS3 (variables, grille, Flexbox) | — |
| Comportement | JavaScript ES6+ | modules natifs, sans transpilation |
| Base de données | PostgreSQL | 17 (canal GA) |
| Plateforme de données | Supabase | région `eu-west-1` (Irlande) |
| Traitement e-mail | Edge Function Deno | `notify-contact`, version 11 |
| Envoi d'e-mail | Resend (API REST) | fournisseur principal |
| Envoi d'e-mail (secours) | Brevo (API REST) | fournisseur de repli, détecté automatiquement |
| Hébergement | Vercel | CDN mondial, HTTPS automatique |
| Typographie | Google Fonts — Inter, Manrope | — |
| Cartographie | OpenStreetMap | — |

**Exigence client :** aucun navigateur obsolète n'est ciblé. Le site fonctionne sur les versions actuelles de Chrome, Edge, Firefox, Safari (ordinateur et mobile), y compris en connexion lente.

---

## 5. Base de données

11 tables, 20 règles de sécurité (RLS) au niveau ligne, 3 fonctions SQL, isolation stricte entre lecture publique et écriture administrative.

| Table | Rôle | Lignes indicatives |
|---|---|---|
| `pages_contenu` | Tous les textes éditoriaux, par page et par clé | 11 |
| `site_settings` | Coordonnées, WhatsApp, réseaux sociaux, adresse de notification | 8 |
| `expertises` | Les 9 domaines d'intervention (ordre, activation) | 9 |
| `equipe` | Membres de la direction (fonction, bio, portrait, ordre) | 4 |
| `stats` | Indicateurs chiffrés de l'accueil | 4 |
| `realisations` | Projets du catalogue : fiche, couverture, galerie, ordre, statut | 0 |
| `actualites` | Articles : titre, extrait, contenu, image, date, statut | 0 |
| `contact_messages` | Demandes reçues par le formulaire | 0 |
| `notifications` | Journal des envois d'e-mail (statut, fournisseur, détail) | — |
| `admins` | Comptes autorisés à administrer | 2 |
| `app_config` | Réglages sensibles (code d'invitation, URL du projet) | 2 |

### 5.1 Modèle de données du catalogue

La table `realisations` porte deux champs dédiés aux images :

- `image_url` — photographie de couverture ;
- `galerie` — tableau d'URL contenant toutes les photographies du projet (la première sert de couverture) ;
- `ordre` — rang d'affichage manuel dans le catalogue.

### 5.2 Fraîcheur des données

Les contenus lus par le site public sont mis en cache dans le navigateur pendant **5 minutes**. Une modification faite dans l'administration apparaît donc immédiatement pour l'administrateur connecté, et dans les 5 minutes au plus pour un visiteur déjà venu sur le site.

---

## 6. Stockage de fichiers

| Bucket | Usage | Accès public | Limite par fichier | Formats acceptés |
|---|---|---|---|---|
| `realisations` | Photographies des projets | Lecture seule | 10 Mo | JPEG, PNG, WEBP, AVIF, GIF |
| `equipe` | Portraits des membres | Lecture seule | 10 Mo | JPEG, PNG, WEBP, AVIF, GIF |

Huit règles de sécurité encadrent ces deux buckets : lecture ouverte à tous, écriture, modification et suppression **strictement réservées aux comptes administrateurs**.

**Réduction automatique à l'envoi.** Toute photographie est redimensionnée dans le navigateur avant l'envoi : plus grand côté ramené à 1 800 pixels, encodage JPEG à 82 % de qualité. Une photo de téléphone de 8 Mo descend généralement sous 400 Ko. Ce traitement garantit un envoi fiable en connexion mobile et n'altère pas la qualité perçue à l'écran.

---

## 7. Sécurité

| Contrôle | Mise en œuvre |
|---|---|
| Authentification | Supabase Auth, e-mail et mot de passe ; jeton JWT d'une heure |
| Session | Conservée en `sessionStorage` — effacée à la fermeture de l'onglet |
| Autorisation en écriture | Fonction `public.is_admin()` vérifiée **en base** à chaque écriture, jamais dans le navigateur |
| Isolation par ligne | RLS active sur les 11 tables ; lecture publique limitée aux contenus publiés |
| Lecture publique | `realisations` et `actualites` ne sont visibles que si `statut = 'publie'` ; `expertises`, `equipe`, `stats` que si `actif = true` |
| Messages de contact | Écriture anonyme autorisée en insertion uniquement ; lecture, modification et suppression réservées aux administrateurs |
| Réglages sensibles | La table `app_config` n'expose **aucune** règle d'accès : elle n'est lisible que par les fonctions internes |
| Inscription | Soumise à un code d'invitation vérifié en base ; toute création sans code valide est rejetée |
| Clé exposée | Seule la clé publique `anon` figure dans le code ; la clé `service_role` n'est **jamais** transmise au navigateur |
| Référencement | `admin.html` exclu par `robots.txt` et balise `noindex` |
| Transport | HTTPS obligatoire de bout en bout |

**Vérification effectuée :** une requête d'écriture émise sans compte administrateur est rejetée par la base (violation de règle RLS), quel que soit le contenu du code côté navigateur.

---

## 8. Notification des demandes de contact

Chaîne complète, chaque maillon journalisé :

```
Formulaire du site
   └─► insertion dans contact_messages
          └─► trigger PostgreSQL on_contact_message_created
                 └─► Edge Function notify-contact
                        └─► Resend (ou Brevo)
                               └─► boîte de réception
                                      + journal dans la table notifications
```

| État journalisé | Signification |
|---|---|
| `envoye` | Message transmis au fournisseur, identifiant d'envoi enregistré |
| `non_configure` | Chaîne fonctionnelle, clé d'API absente |
| `echec` | Fournisseur en erreur (domaine non vérifié, quota, clé refusée) — motif conservé |
| `erreur_trigger` | Incident technique côté base |

**Garantie de continuité :** un incident d'envoi n'empêche jamais l'enregistrement de la demande. Le message reste consultable dans l'onglet « Demandes » de l'administration, quel que soit l'état de la notification.

---

## 9. Accessibilité et performance

| Point | État |
|---|---|
| Structure sémantique | HTML5 : `header`, `nav`, `main`, `section`, `article`, `footer` |
| Alternatives textuelles | 51 attributs `alt` renseignés |
| Navigation au clavier | Menus, filtres, fiches projets et visionneuses utilisables sans souris ; fermeture par `Échap` |
| Animations | Respect de `prefers-reduced-motion` : animations désactivées si le système le demande |
| Chargement différé | 35 images en `loading="lazy"` ; image d'accueil prioritaire |
| Poids des pages | 3 à 19 Ko de balisage par page, hors images |
| Dépendances | Aucun framework JavaScript ; aucune bibliothèque à charger |
| Compatibilité mobile | Mise en page adaptative du smartphone au grand écran |

---

## 10. Référencement (SEO)

- Balises `title` et `description` propres à chaque page.
- URL canoniques déclarées.
- Open Graph et Twitter Card pour le partage social, avec carte de partage dédiée (1 200 × 630).
- Données structurées `application/ld+json` (Schema.org) sur l'accueil, la page « À propos » et la page « Contact ».
- `sitemap.xml` et `robots.txt` à la racine.
- Favicons multi-résolutions et icône Apple.

---

## 11. Dépendances externes

| Service | Rôle | Criticité | Comportement en cas d'indisponibilité |
|---|---|---|---|
| Supabase | Données, authentification, stockage | **Critique** | Contenus statiques conservés ; administration indisponible |
| Vercel | Hébergement des fichiers | **Critique** | Site inaccessible jusqu'au rétablissement |
| Resend / Brevo | Notification e-mail | Importante | Demande enregistrée, notification rejouable |
| Google Fonts | Typographie | Faible | Police de substitution système |
| OpenStreetMap | Carte de la page Contact | Faible | Carte non affichée |
| Unsplash | Visuels de démonstration | Nulle | Emplacements provisoires uniquement |

---

## 12. Hébergement, déploiement et points à finaliser

### 12.1 État actuel

| Élément | État |
|---|---|
| Site en ligne | **Oui** — `https://jwc9.vercel.app` |
| HTTPS | **Oui** — certificat automatique |
| Nom de domaine `globalsolutions.one` | **Non rattaché** — les URL canoniques, `sitemap.xml` et `robots.txt` le mentionnent déjà |
| Déploiement continu | **Oui** — chaque fusion sur la branche `main` redéploie le site |

### 12.2 Points à finaliser

| # | Point | Incidence |
|---|---|---|
| 1 | Rattacher le domaine `globalsolutions.one` chez Vercel (enregistrements DNS) | Le référencement ne portera ses fruits qu'avec le domaine définitif |
| 2 | Vérifier le domaine chez Resend (SPF, DKIM, DMARC) | Sans cela, les notifications ne peuvent être adressées qu'à l'adresse du compte Resend |
| 3 | Aligner l'adresse de contact affichée | Le site affiche `globalsolution877@gmail.com` ; le code prévoit `info@globalsolutions.one` |
| 4 | Renseigner les réalisations | Le catalogue affiche 9 emplacements « À compléter » tant qu'aucun projet n'est publié |
| 5 | Fournir les portraits officiels | Les membres s'affichent avec leurs initiales |
| 6 | Rédiger les actualités | Section vide à ce jour |
| 7 | Épingler les coordonnées GPS exactes | Carte indicative centrée sur Niamey |
| 8 | Définir la politique de sauvegarde | Voir § 13 |

---

## 13. Sauvegarde et exploitation

| Opération | Procédure | Responsable |
|---|---|---|
| Sauvegarde de la base | Sauvegardes automatiques de la plateforme Supabase ; export SQL possible à tout moment | Prestataire / client |
| Sauvegarde des fichiers | Buckets `realisations` et `equipe` — copie de sécurité à planifier | Prestataire |
| Gestion des accès | Ajout ou réinitialisation d'un compte : Supabase → Authentication → Users | Client |
| Retrait d'un accès | Suppression du compte **et** de sa ligne dans la table `admins` | Client |
| Changement du code d'invitation | Requête sur la table `app_config`, clé `invite_code` | Prestataire / client |
| Publication d'un projet | Administration → Réalisations | Client |
| Suivi des demandes | Administration → Demandes ; alertes par e-mail | Client |
| Journal des e-mails | Administration → Notifications (50 derniers envois) | Client |
| Retour arrière sur le code | Restauration d'une version antérieure depuis le dépôt | Prestataire |

### 13.1 Recommandations de sécurité à la mise en service

1. Créer un mot de passe robuste et unique pour chaque compte administrateur.
2. Modifier le code d'invitation s'il a été communiqué à des tiers.
3. Restreindre l'accès au dépôt de code si celui-ci doit rester privé.
4. Activer la double authentification sur les comptes Supabase, Vercel et Resend.
5. Programmer une vérification trimestrielle des comptes administrateurs actifs.

---

## 14. Coûts de fonctionnement

| Service | Formule | Coût mensuel |
|---|---|---|
| Vercel | Offre gratuite (usage institutionnel) | 0 |
| Supabase | Offre gratuite | 0 |
| Resend | Offre gratuite — 3 000 e-mails par mois | 0 |
| Nom de domaine | Enregistrement annuel | selon registraire |

Les offres gratuites comportent des limites d'usage (volume de données, bande passante, nombre d'envois). Une montée en charge ou une exigence de disponibilité renforcée nécessitera un passage aux offres payantes.

---

## 15. Garanties et limites

**Ce qui est garanti par la conception**

- Aucune donnée client n'est accessible en écriture à un visiteur non authentifié.
- Aucune clé secrète n'est exposée dans le code livré au navigateur.
- Un incident d'e-mail ne bloque jamais l'enregistrement d'une demande.
- Une indisponibilité de la base ne provoque pas de page blanche.

**Ce qui n'est pas couvert**

- La disponibilité des services tiers (Supabase, Vercel, Resend) relève de leurs propres engagements.
- Le contenu publié (textes, photographies, références de chantiers) relève de la responsabilité du client.
- Aucune prestation de référencement actif, de publicité en ligne ou de rédaction de contenu n'est incluse.

---

## 16. Intervention et support

| Nature | Contact |
|---|---|
| Incident bloquant le site ou l'administration | Prestataire — intervention prioritaire |
| Ajout ou retrait d'un compte administrateur | Client (procédure § 13) ou prestataire |
| Modification de la structure du site | Prestataire — nouvelle commande |

---

*Fin de la fiche technique. Document établi à partir de l'état effectif du système vérifié le 11 novembre 2026 : base de données, stockage, fonctions déployées et fichiers du dépôt.*
