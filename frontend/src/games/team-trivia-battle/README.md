# Team Trivia Battle

Mission à enregistrer et publier par le responsable plateforme :

| Champ | Valeur |
| --- | --- |
| Slug | `team-trivia-battle` |
| Titre | Team Trivia Battle |
| Description | Choisissez une catégorie et relevez 15 questions en difficulté progressive, avec 45 secondes par question. |
| Maximum | 100 |
| État | PUBLISHED |

Route officielle : `/games/team-trivia-battle`. Le jeu réutilise `teamToken` et `teamName` de la plateforme. Il n'ajoute ni authentification, ni création/sélection d'équipe, ni classement. Il est découvert automatiquement par le registre existant. Le backend et Redis sont nécessaires : le quiz ne dispose pas de mode autonome ni de banque de réponses dans le bundle navigateur.

## Contenu et règles

240 questions originales en français, exactement 40 par catégorie : IT, Cybersecurity, General Knowledge, Football, Countries, Movies. Chaque question a quatre options distinctes, une seule solution, une explication et un niveau. Chaque banque comporte 14 questions faciles, 13 intermédiaires et 13 plus difficiles. Le serveur tire cinq questions de chaque niveau, sans répétition, et mélange les réponses indépendamment. La catégorie Countries couvre capitales, drapeaux, géographie et monuments ; les résultats sportifs et cinématographiques sont datés pour éviter les réponses changeantes. Les sources de contrôle sont dans `SOURCES.md`.

Chaque bonne réponse rapporte 10 points bruts. Mauvaise réponse et expiration rapportent zéro. Score normalisé : `round(bonnes réponses × 100 / 15)` ; maximum brut 150. Les compteurs distinguent erreurs et expirations. Le temps affiché au bilan correspond à la somme des temps actifs de réponse, hors transitions. Le rang est une appréciation individuelle de performance, sans classement parallèle.

## Persistance et chronomètre

Le package serveur privé est `com.silliconrally.api.games.team_trivia_battle`. La session opaque existante est résolue par `SessionTokenService`. Le serveur vérifie que l'équipe est active, la mission publiée et, pour les actions explicites, l'événement ouvert avec classement déverrouillé.

Une partie Redis est identifiée par les UUID réels de mission et d'équipe, sans expiration automatique qui pourrait restituer une tentative. Reconnexion avec un nouveau token de la même équipe, onglets multiples, rafraîchissement et fermeture de page retrouvent la même partie. La catégorie et les questions restent verrouillées. Des écritures atomiques conditionnelles Redis évitent les doubles réponses et transmissions concurrentes. Aucune route de remise à zéro n'est exposée. Une nouvelle mission avec un autre UUID représente une nouvelle compétition ; l'archivage des clés anciennes relève de l'exploitation Redis.

Une question dispose de 45000 ms mesurées côté serveur. Après une réponse ou expiration, la transition dure 1800 ms. Le serveur conserve une échéance absolue. Les expirations sont rattrapées lors de la prochaine requête, y compris si les quinze délais se sont écoulés hors ligne. L'horloge visuelle est calibrée sur `serverNow`, puis utilise `performance.now()` ; la validation reste toujours côté serveur. Une perte de réseau ne suspend pas les délais. Une réponse identique répétée à une question déjà traitée ne rapporte aucun point supplémentaire.

Les seuls endpoints privés sont :

- `GET /api/v1/games/team-trivia-battle/state`
- `POST /api/v1/games/team-trivia-battle/start` avec `{ category }`
- `POST /api/v1/games/team-trivia-battle/answer` avec `{ questionId, optionIndex }`
- `POST /api/v1/games/team-trivia-battle/handoff`

Ils utilisent `X-Team-Token`. Aucun identifiant d'équipe fourni par le joueur n'est accepté. Le serveur ne transmet que la question active ; la correction est fournie après validation et la revue des quinze questions à la fin.

## Transmission au classement

Le bilan reste visible pour permettre la lecture des corrections. Le bouton « Transmettre mon score » réserve une transmission unique sur le serveur puis appelle `onComplete` avec le score normalisé et les compteurs réels. Le `GameRunner` existant enregistre le score puis revient à `/games`. Un lien « Return to Games » utilise le routeur de la plateforme ; revenir plus tard retrouve le bilan et permet la transmission si elle n'a pas été réservée.

Le package privé n'appelle aucun endpoint de score et ne persiste aucun score en base. Les fichiers partagés, migrations et autres jeux ne sont pas modifiés. Comme les autres callbacks du dépôt, une transmission au maximum une fois ne peut garantir une livraison réseau exactement une fois : si le navigateur se ferme entre la réservation et le callback, ou si le score est rejeté, le jeu ne réémet pas automatiquement. Il faut alors l'intervention de l'organisateur ; la plateforme doit fournir l'idempotence de bout en bout pour autoriser des reprises sûres. Le vérificateur de score partagé reste inchangé et n'est pas raccordé à cette partie privée ; aucune garantie anti-triche globale supplémentaire n'est revendiquée.

## Vérification

Depuis `frontend` : `npm.cmd test` puis `npm.cmd run build`.

Depuis `backend` : `mvn test` (Java 17). Les tests dédiés sont dans `backend/src/test/java/com/silliconrally/api/games/team_trivia_battle/`, dossier autorisé par la CI des branches de jeu.

`scripts/check.sh` lance les contrôles du dépôt dans un shell POSIX. Le jeu doit être essayé sur la plateforme complète après enregistrement de sa mission ; les aperçus `preview.html` des jeux précédents ne s'appliquent pas à ce quiz serveur.
