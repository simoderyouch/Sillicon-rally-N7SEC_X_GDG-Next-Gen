# Phishing Detective

Niveau débutant : messages courts en français, adresses faciles à comparer et indices directs (paiement inattendu, code SMS demandé, programme .exe à la place d’un document). Les 12 défis et le calcul du score sur 100 sont conservés. Un rappel des trois réflexes accompagne le joueur sans révéler les réponses.

Mission à enregistrer et publier par le responsable plateforme :

- **Slug :** `cyber-awareness-hub`
- **Titre :** Phishing Detective — Can You Spot the Threat?
- **Description :** Analysez 12 e-mails, URL et pages de connexion. Inspectez les détails, identifiez les tentatives de phishing et consultez votre rapport personnalisé.
- **Score maximum :** 100

Découverte automatique via `index.tsx`. Aucun changement du registre, des routes, du backend ou des autres jeux. Le score passe exclusivement par `onComplete`, après consultation du bilan et clic sur « Transmettre mon score ». En cas d’erreur signalée par le runner, le joueur peut réactiver explicitement l’envoi du même résultat.

Les 6 captures d’e-mails et 3 pages de connexion sont des images SVG autonomes produites par `visuals.ts`, sans téléchargement ni police distante. Le texte reste lisible au zoom. Les liens et en-têtes complets sont consultables dans l’inspecteur et les transcriptions sont accessibles. Aucun lien ne navigue et aucun formulaire ne collecte d’identifiants. Tous les domaines malveillants sont sous `.example`. L’université, la banque et les fournisseurs sont fictifs ; leur domaine de référence est fourni dans le contexte.

Ordre aléatoire dans chaque catégorie, choix verrouillé à la validation, aucun corrigé avant le bilan, score = arrondi(bonnes réponses / 12 × 100), avec 6 e-mails, 3 URL et 3 pages de connexion. Les justifications pédagogiques sont locales au client : ce jeu de sensibilisation ne fournit pas de protection contre l’inspection du code source. Il ne contient aucun secret ni identifiant d’événement.

Validation : `npm test` et `npm run build` depuis `frontend`, puis `scripts/check.sh` dans un environnement disposant de shell POSIX, Node et Maven.

Aperçu sans enregistrement de mission : lancez `npm run dev` depuis `frontend`, puis ouvrez `http://localhost:5173/src/games/cyber-awareness-hub/preview.html`. Ce mode local affiche le résultat sans requête de score ; il n’est pas inclus dans l’entrée de production.
