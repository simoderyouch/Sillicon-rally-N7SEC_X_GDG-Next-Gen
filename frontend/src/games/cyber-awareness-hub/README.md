# Phishing Detective

Niveau débutant : messages courts en français, adresses faciles à comparer et indices directs (paiement inattendu, code SMS demandé, programme .exe à la place d’un document). Les 12 défis et le calcul du score sur 100 sont conservés.

Mission à enregistrer et publier par le responsable plateforme :

- **Slug :** `cyber-awareness-hub`
- **Titre :** Phishing Detective — Can You Spot the Threat?
- **Description :** Analysez 12 e-mails, URL et pages de connexion. Inspectez les détails, identifiez les tentatives de phishing et obtenez votre score final.
- **Score maximum :** 100

Découverte automatique via `index.tsx`. Aucun changement du registre, des routes partagées ou des autres jeux. Un endpoint privé est ajouté uniquement dans le package backend de ce jeu. Le score passe exclusivement par `onComplete`, après affichage du score final et clic sur « Transmettre mon score ». Aucun corrigé, réponse correcte ou bouton de réactivation/rejeu n’est affiché à la fin.

Les 6 captures d’e-mails et 3 pages de connexion sont des images SVG autonomes produites par `visuals.ts`, sans téléchargement ni police distante. Le texte reste lisible au zoom. Les liens et en-têtes complets sont consultables dans l’inspecteur et les transcriptions sont accessibles. Aucun lien ne navigue et aucun formulaire ne collecte d’identifiants. Tous les domaines malveillants sont sous `.example`. L’université, la banque et les fournisseurs sont fictifs ; leur domaine de référence est fourni dans le contexte.

Ordre aléatoire dans chaque catégorie, choix verrouillé à la validation, aucun corrigé affiché, score = arrondi(bonnes réponses / 12 × 100), avec 6 e-mails, 3 URL et 3 pages de connexion. Les justifications pédagogiques sont locales au client : ce jeu de sensibilisation ne fournit pas de protection contre l’inspection du code source. Il ne contient aucun secret ni identifiant d’événement.

Validation : `npm test` et `npm run build` depuis `frontend`, puis `scripts/check.sh` dans un environnement disposant de shell POSIX, Node et Maven.

Aperçu sans enregistrement de mission : lancez `npm run dev` depuis `frontend`, puis ouvrez `http://localhost:5173/src/games/cyber-awareness-hub/preview.html`. Ce mode local affiche le résultat sans requête de score ; il n’est pas inclus dans l’entrée de production.

## Une participation par équipe après transmission

Le serveur résout la session existante avec `SessionTokenService`, puis utilise les UUID réels de mission et d’équipe. `GET /api/v1/games/cyber-awareness-hub/completion` reconnaît les scores déjà enregistrés en base et les réservations Redis. `POST` sur cette même route réserve atomiquement une seule transmission avec SET NX, sans expiration automatique. Cet endpoint ne crée aucun score et ne modifie pas la logique commune du classement : le premier appel autorisé déclenche toujours `onComplete`.

Une équipe ayant transmis retrouve uniquement son score, même après rechargement, reconnexion avec un autre token de la même équipe, changement de navigateur ou ouverture d’un autre onglet. Le serveur reste nécessaire pour jouer depuis la plateforme ; l’aperçu sans session reste un outil local indépendant. Les actions d’autres équipes restent isolées. Les scores enregistrés avant cette mise à jour verrouillent aussi la participation.

La réservation précède le callback : une interruption réseau entre ces étapes peut nécessiter une intervention de l’organisateur, car le jeu ne réémet pas une transmission réservée. L’idempotence et la confirmation de livraison de bout en bout restent du ressort du GameRunner commun. Les correctifs ne rendent pas le endpoint de score partagé résistant aux appels forgés ; cette évolution bloque le rejeu dans le parcours normal du jeu.
