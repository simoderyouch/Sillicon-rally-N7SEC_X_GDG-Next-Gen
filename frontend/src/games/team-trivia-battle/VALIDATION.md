# Validation locale

- Tests dédiés frontend : **7 réussis**.
- Tests dédiés backend : **8 réussis** (banque/moteur/persistance et contrôleur).
- Suite backend complète : **21 tests réussis** via Maven 3.9.9 et Java 17.
- Suite frontend complète : **42 tests réussis** avec `npm.cmd test -- --maxWorkers=1 --minWorkers=1 --testTimeout=15000`.
- Compilation TypeScript et Vite : réussie.
- Structure des jeux : validation réussie via le script du dépôt.
- Contrôle visuel navigateur : cartes et question vérifiées avec une fixture temporaire ; les fichiers de fixture ont été retirés.

`scripts/check.sh` a été exécuté. Avec son délai Vitest par défaut de cinq secondes, un test existant de `code-breaker` (« advances after missed rounds… ») dépasse le délai sur cette machine. La suite passe avec un worker et quinze secondes autorisées par test. Aucun fichier ni test de cet autre jeu n'a été modifié. La CI devra confirmer le contrôle standard sur sa propre machine.

Le test de la pile Docker réelle a été interrompu pendant le téléchargement très lent des images, avant le démarrage des services. Les tests serveur utilisent une simulation Redis pour les contrôles de persistance ; ils ne remplacent pas un essai de bout en bout avec PostgreSQL, Redis, une mission publiée et le GameRunner. Cet essai reste à effectuer dans la plateforme complète. Le package privé n'écrit jamais au classement ; le contrat `onComplete` et les requêtes privées sont vérifiés par les tests.
