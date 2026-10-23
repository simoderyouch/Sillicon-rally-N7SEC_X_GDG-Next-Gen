# Cyber Word Scramble

Mission à enregistrer et publier par le responsable plateforme :

- Slug : `word-scramble`
- Titre : Cyber Word Scramble
- Description : Retrouvez 10 mots anglais de la cybersécurité avec seulement 3 indices partagés entre tous les mots.
- Score maximum : **100**

Le jeu est découvert automatiquement via son export `game`. Les autres jeux, le registre, les routes et le backend ne sont pas modifiés. Le bouton final utilise exclusivement `onComplete({ score, completed, details })`. Le runner de la plateforme enregistre le score de l’équipe connectée, après publication de la mission.

Les dix mots et leurs indices sont ceux du brief. L’ordre des mots et leurs lettres sont mélangés à chaque nouvelle partie ; aucun mélange n’est identique au mot attendu. Les réponses ignorent la casse et les espaces de début/fin. Aucun passage de mot n’est possible sans réponse correcte.

Un mot vaut 10 points sans erreur/indice, 7 avec indice seul, 5 avec erreur(s) seule(s), 3 avec les deux. Plusieurs erreurs n’ajoutent pas de déduction. L’indice ne peut être consommé qu’une fois par mot et seuls trois mots peuvent en bénéficier. Le score est calculé à partir des mots résolus.

La partie (ordre, erreurs, indices et état d’envoi) est conservée dans `localStorage`, par mission et session d’équipe. Un rafraîchissement ou une sortie/retour ne restitue pas les indices. Les actions relisent la sauvegarde avant modification et les onglets reçoivent les changements via l’événement `storage`. Une nouvelle partie explicitement confirmée remet la progression, le score et les indices à zéro. Si le stockage est indisponible, le jeu affiche une erreur au lieu de continuer sans sauvegarde.

Le callback est déclenché au maximum une fois par partie, y compris après un rechargement. L’état envoyé est enregistré avant le callback ; cela empêche un second envoi depuis le jeu, mais ne confirme pas la réussite réseau. Le runner affiche les éventuelles erreurs serveur. Le jeu n’ajoute pas de requête de score indépendante.

Cette persistance protège contre les rechargements ordinaires, pas contre une modification/effacement volontaire du stockage, un changement de navigateur ou des actions parfaitement simultanées dans plusieurs onglets. Le jeu pédagogique ne contient pas de secret ; une validation compétitive inviolable nécessiterait un état côté serveur et un contrat d’envoi idempotent géré par la plateforme.

## Essayer en local

Depuis `frontend` :

```powershell
npm.cmd run dev
```

Ouvrir `http://localhost:5173/src/games/word-scramble/preview.html`. L’aperçu sauvegarde la partie localement, affiche le résultat final, et n’envoie aucun score au serveur. Utiliser « Nouvelle partie » pour repartir avec 3 indices. L’entrée d’aperçu n’est pas incluse dans la production.

## Vérification

Depuis `frontend` :

```powershell
npm.cmd test -- src/games/word-scramble/Game.test.tsx
npm.cmd run build
```

Le contrôle complet du dépôt est `scripts/check.sh` dans un environnement POSIX avec Node et Maven.
