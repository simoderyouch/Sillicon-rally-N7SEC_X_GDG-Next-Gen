# Cyber Word Scramble

Mission : `word-scramble`, titre **Cyber Word Scramble**, maximum **100 points**, état **PUBLISHED**. Route officielle : `/games/word-scramble`.

## Règles

Les dix mots du brief sont mélangés à chaque première partie. Les réponses ignorent la casse et les espaces de début/fin. Une réponse vide ne consomme aucun essai.

- Trois essais maximum par mot : la troisième réponse incorrecte termine ce mot avec zéro point et passe automatiquement au suivant, sans révéler le mot attendu.
- Une bonne réponse rapporte 10 points sans erreur/indice, 7 avec indice seul, 5 après une ou deux erreurs sans indice, 3 avec indice et erreur(s).
- Trois indices partagés entre tous les mots, au maximum un par mot. Aucun indice n'est restitué lorsqu'un mot échoue.
- Les mots réussis et échoués comptent tous dans les dix mots à traiter. Le score maximum reste 100. Le jeu se termine même si les dix mots ont échoué.
- L'écran final affiche seulement le score et le bouton de transmission : aucune liste de solutions, aucun bilan détaillé et aucun bouton pour recommencer.

## Persistance et blocage après transmission

Les essais, indices et mots déjà traités sont conservés dans `localStorage`, par mission et session. Les sauvegardes existantes restent lisibles ; un ancien mot non résolu avec au moins trois erreurs devient un mot échoué. Les résultats déjà transmis ne sont pas recalculés.

La plateforme vérifie la participation via un endpoint privé dans le package `com.silliconrally.api.games.word_scramble` :

- `GET /api/v1/games/word-scramble/completion`
- `POST /api/v1/games/word-scramble/completion` avec `{ score }`

Le token existant `X-Team-Token` est résolu en véritable équipe. Les UUID de mission et d'équipe identifient un verrou Redis permanent, réservé atomiquement avec SET NX. Les scores déjà présents dans `game_scores` verrouillent aussi la mission, y compris les participations antérieures à cette mise à jour. Les lectures en base servent uniquement à vérifier le statut : l'endpoint privé ne crée ni ne modifie de score.

Une équipe ayant réservé/transmis son résultat retrouve son score après rechargement, renouvellement de session ou changement de navigateur. Aucun bouton de rejeu, de remise à zéro ou de réactivation d'envoi n'est exposé. La vérification périodique synchronise les autres onglets. Un jeu déjà soumis dans la sauvegarde locale est également bloqué.

Le premier appel autorisé utilise toujours `onComplete`. Le `GameRunner` commun enregistre le résultat et gère la navigation. Les détails comprennent `wordsSolved`, `wordsFailed`, `hintsUsed`, `incorrectAttempts` et `rawScore`. Aucun appel direct au endpoint commun de score n'est ajouté.

Comme pour les transmissions à usage unique du projet, une interruption réseau entre la réservation privée et le callback peut nécessiter une intervention de l'organisateur. Une reprise avec garantie de livraison exactement une fois nécessiterait l'idempotence du système de score partagé. Ce verrou empêche le rejeu dans le parcours normal ; le calcul des réponses reste côté navigateur et le endpoint de score partagé n'est pas modifié pour bloquer les appels forgés.

Le backend et Redis doivent être relancés avec cette mise à jour pour jouer sur la plateforme. Les essais en cours restent sauvegardés localement ; leur stockage n'est pas un mécanisme anti-triche inviolable avant transmission.

## Aperçu et vérification

Depuis `frontend`, `npm.cmd run dev`, puis `http://localhost:5173/src/games/word-scramble/preview.html`. Sans session, cet aperçu n'enregistre aucun score réel ; il conserve sa partie locale et ne propose pas de remise à zéro.

Tests frontend : `npm.cmd test -- src/games/word-scramble/Game.test.tsx`, puis `npm.cmd run build`.

Tests backend : `mvn test`. Tests dédiés dans `backend/src/test/java/com/silliconrally/api/games/word_scramble/`, dossier autorisé par la CI.
