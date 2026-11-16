# Mystère de Noël — Team RH Colas

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
- `template.html` : styles (bleu nuit, palette Père Noël, polices) et squelette de la page.
- `build.mjs` : assemble tout dans `dist/index.html`.

## Polices

Toutes les polices sont libres de droits, y compris pour un usage en entreprise, et sont intégrées automatiquement au build par les paquets `@fontsource` :

- Montserrat (texte) : licence SIL OFL 1.1.
- Norican (titres, nom révélé, logo) : licence SIL OFL 1.1.

Pour rester proche d'un rendu « script » même si la police ne se charge pas, les titres ont comme polices de secours des polices installées avec Windows et Office (Brush Script MT, Freestyle Script, Segoe Script). Elles ne sont pas intégrées au fichier : Microsoft vend une licence séparée pour les redistribuer dans un site ou une application. Pour les utiliser dans Word, Norican s'installe comme n'importe quelle police (fichier gratuit sur Google Fonts).

## Limites connues

- Les liens contiennent leurs données encodées (base 62) : à envoyer en message privé. Avec une photo, un lien fait de 3 000 à 6 000 caractères selon la qualité choisie (mail ou Teams, pas SMS). Les anciens liens `#s-…` restent lisibles.
- La qualité des photos se règle dans l'atelier (léger 176 px, standard 240 px, fin 320 px) : plus la photo est fine, plus le lien est long.
- L'atelier (duos, règles, photos, adresse) est enregistré dans le navigateur de l'organisateur, sur cet appareil seulement. Le bouton « Tout effacer » le vide.
- Les liens sont de la forme `#t-…` (lettres et chiffres uniquement), ce qui reste lisible même dans un iframe qui ne garde que `#nom` dans l'adresse.

## Idées pour la suite

- Stocker les duos côté serveur avec des liens courts, plus sûrs et sans limite de taille.
- Remplir les règles du jeu.
- Père Noël plus détaillé (modèle 3D libre de droits).
