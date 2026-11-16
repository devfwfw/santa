# Santa Magica

Application Secret Santa pour l'équipe. Chaque collègue reçoit un lien personnel : le Père Noël arrive en courant, annonce que son ami secret est tout proche, puis la magie opère dans un tourbillon de neige scintillante qui révèle la photo et le nom de la personne à qui offrir un cadeau.

Prototype : tout est contenu dans les liens, aucun serveur ni base de données.

## Utilisation

1. Ouvrir l'atelier (la page sans lien personnel).
2. Coller la carte des duos, une ligne par duo : `Celui qui offre > Celui qui reçoit`.
3. Facultatif : ajouter les règles du jeu (affichées au clic sur le bouton « i ») et la photo de chaque personne qui reçoit.
4. Copier le lien de chaque collègue et le lui envoyer en privé.

Chaque lien ne révèle que la personne à offrir.

## Lancer en local

```bash
npm install
npm run build      # produit dist/index.html (un seul fichier autonome)
npm start          # build puis http://localhost:8080
```

Pour figer l'adresse utilisée dans les liens (par exemple l'adresse d'hébergement) : `node build.mjs https://mon-adresse/`. Sans argument, l'adresse est détectée au chargement.

## Structure

- `src/stage.js` : scène 3D (three.js) avec le Père Noël, la forêt, les étincelles et le tourbillon de neige.
- `src/main.js` : atelier de l'organisateur, encodage des liens, page de révélation, panneau des règles.
- `template.html` : styles (palette, Montserrat) et squelette de la page.
- `build.mjs` : assemble tout dans `dist/index.html`.

## Polices

- Montserrat (licence OFL) est intégrée automatiquement via le paquet `@fontsource/montserrat`.
- Les titres utilisent « Merry Christmas Star » de Måns Grebäck (Aring Typeface). Sa licence est « usage personnel uniquement » : le fichier n'est donc pas dans ce dépôt. Déposer `MerryChristmasStar.ttf` dans `fonts/` avant le build (il est ignoré par git). Sans ce fichier, une police script de secours s'affiche. Pour un usage en entreprise, acheter la licence : http://www.aringtypeface.com/license/

## Limites connues

- Les liens contiennent leurs données encodées : à envoyer en message privé. Avec une photo, un lien fait environ 5 000 caractères (mail ou Teams, pas SMS).
- Les photos sont réduites à 208 px, donc un peu douces à l'affichage.
- La carte des duos n'est pas sauvegardée : fermer l'atelier la fait disparaître.
- Hébergé dans un iframe qui ne garde que `#nom` dans l'adresse, les liens sont de la forme `#s-…` (lettres et chiffres uniquement).

## Idées pour la suite

- Stocker les duos côté serveur avec des liens courts, plus sûrs et sans limite de taille.
- Remplir les règles du jeu.
- Père Noël plus détaillé (modèle 3D libre de droits).
