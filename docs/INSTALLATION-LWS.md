# Installation sur LWS

## Fichier à téléverser

`livraison/global-solutions-lws.zip` contient la version statique du projet GLOBAL SOLUTIONS. Aucune installation Node.js, compilation Vite ou commande npm n'est nécessaire sur LWS. `index.html` se trouve directement à la racine du ZIP, sans sous-dossier intermédiaire.

## Dans le gestionnaire de fichiers de votre capture

1. Sauvegardez d'abord le contenu actuel de `public_html` (téléchargez une archive de sauvegarde). Il peut appartenir à un autre site.
2. Ouvrez `public_html`, puis cliquez sur **Téléverser** et envoyez `global-solutions-lws.zip`.
3. Sélectionnez cette archive, puis cliquez sur **Extraire**. Choisissez le dossier `public_html` lui-même comme destination, pas `public_html/public_html`.
4. Confirmez le remplacement des fichiers seulement après la sauvegarde. Vérifiez que `index.html`, `assets`, `css` et `js` sont directement dans `public_html`. Activez l'affichage des fichiers cachés pour vérifier aussi `.htaccess`.
5. Ouvrez votre nom de domaine en HTTPS, puis actualisez sans cache ou utilisez une fenêtre privée. Vérifiez les pages, les images, le menu mobile et `/admin.html`.
6. Après vérification, retirez du dossier public les ZIP (y compris les anciennes archives visibles sur votre capture), les anciennes sources inutilisées et les sauvegardes : ils ne doivent pas rester téléchargeables. Conservez vos sauvegardes hors du dossier public. Ne supprimez pas de fichiers d'autres applications sans les identifier.

Le ZIP n'efface pas les anciens fichiers : il ajoute ou remplace uniquement ses propres fichiers. Ce paquet concerne GLOBAL SOLUTIONS, pas les archives « saint-graal » visibles sur la capture.

## Prérequis et services externes

- Le domaine doit pointer vers cet hébergement et son certificat SSL doit être actif : `.htaccess` force HTTPS. Ce paquet cible Apache, utilisé sur les hébergements mutualisés compatibles LWS.
- La configuration Supabase publique existante est incluse dans `js/supabase-config.js`. Le ZIP ne crée ni tables, ni comptes administrateurs, ni règles d'accès. L'administration et les formulaires nécessitent un projet Supabase opérationnel avec les migrations et règles prévues dans le dépôt. Ne placez jamais de clé `service_role` sur l'hébergement.
- Les ressources externes du site nécessitent une connexion Internet. Le paquet ne rend pas le site entièrement hors ligne.
- En cas d'erreur 500 après extraction, consultez les journaux LWS : certaines offres restreignent des directives `.htaccess`. Conservez une copie avant toute modification.

## Régénérer le paquet après une modification

Depuis la racine du dépôt :

```sh
python3 scripts/package_lws.py
```

Le script inclut les pages HTML à la racine, `assets/`, `css/`, `js/`, `.htaccess`, `robots.txt` et `sitemap.xml`. Il exclut les secrets d'environnement, Git, les tests, les scripts, la documentation et les migrations SQL.
