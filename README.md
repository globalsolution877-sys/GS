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
├── js/
│   ├── supabase-config.js  URL + clé anon (publique) — jamais la clé service_role
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
| `site_settings` | Paramètres (e-mail, téléphones) |

Configuration front : `js/supabase-config.js` contient l'URL publique et la clé **anon** (sécurisée pour le navigateur). La clé `service_role` n'est **jamais** exposée côté client.

### Ajouter une réalisation (sans toucher au code)

Dans Supabase → Table Editor → `realisations` → Insert :

- `titre`, `description`, `localisation`, `categorie` (`batiments`, `hydraulique`, `forages`, `aeps`, `amenagements`, `solaire`, `genie-civil`, `metal`), `annee`, `image_url` (URL hébergée ou bucket Storage), `statut='publie'`.

La galerie se met à jour automatiquement (fallback local si aucune ligne publiée).

### Ajouter une actualité

Table `actualites` : `titre`, `extrait`, `contenu`, `image_url`, `date_publication`, `statut='publie'`.

### Consulter les demandes de contact

Table `contact_messages` (Supabase Dashboard). Pensez à activer les notifications e-mail / Edge Function pour l'envoi automatique vers `info@globalsolutions.one`.

## Personnalisation

- **Textes / photos / actualités** : via Supabase (voir ci-dessus) — aucun code à modifier.
- **Logo** : remplacer `assets/logos/logo.jpg`.
- **Couleurs / typographies** : variables CSS en tête de `css/style.css` (`--navy`, `--blue`, `--orange`…).
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
