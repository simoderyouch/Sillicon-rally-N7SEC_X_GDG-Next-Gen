package com.silliconrally.api.games.team_trivia_battle;

import java.util.*;

/** Educational content stays on the server; only the active question is sent before completion. */
public final class QuestionBank {
  public record Question(String id, String category, String difficulty, String text, List<String> options, String explanation) { }
  public static final List<String> CATEGORIES = List.of("it", "cybersecurity", "general", "football", "countries", "movies");
  private final Map<String, Question> questions = new LinkedHashMap<>();
  public QuestionBank() {
    add("it", IT); add("cybersecurity", CYBER); add("general", GENERAL);
    add("football", FOOTBALL); add("countries", COUNTRIES); add("movies", MOVIES);
  }
  private void add(String category, String data) {
    List<String> lines = data.strip().lines().toList();
    if (lines.size() != 40) throw new IllegalStateException(category + " needs 40 questions");
    for (int i = 0; i < lines.size(); i++) {
      String[] fields = lines.get(i).split("\\|", -1);
      if (fields.length != 6 || Arrays.stream(fields).anyMatch(String::isBlank) || new HashSet<>(List.of(fields[1], fields[2], fields[3], fields[4])).size() != 4) throw new IllegalStateException("Invalid question: " + category + i);
      String id = category + "-" + (i + 1);
      questions.put(id, new Question(id, category, i < 14 ? "easy" : i < 27 ? "medium" : "challenging", fields[0], List.of(fields[1], fields[2], fields[3], fields[4]), fields[5]));
    }
    if (questions.values().stream().map(Question::text).distinct().count() != questions.size()) throw new IllegalStateException("Duplicate question");
  }
  public Question get(String id) { return Objects.requireNonNull(questions.get(id), "Unknown question"); }
  public List<Question> all() { return List.copyOf(questions.values()); }
  public List<Question> draw(String category) {
    List<Question> selected = new ArrayList<>();
    for (String difficulty : List.of("easy", "medium", "challenging")) {
      List<Question> pool = new ArrayList<>(questions.values().stream().filter(q -> q.category().equals(category) && q.difficulty().equals(difficulty)).toList());
      Collections.shuffle(pool); selected.addAll(pool.subList(0, 5));
    }
    return List.copyOf(selected);
  }
  private static final String IT = """
Quel composant exécute les instructions d'un ordinateur ?|Le processeur|Le clavier|Le moniteur|Le haut-parleur|Le processeur, ou CPU, exécute les instructions des programmes.
Quel périphérique permet de saisir du texte ?|Le clavier|Le moniteur|L'imprimante|Le projecteur|Les touches du clavier servent à saisir du texte.
Quel logiciel sert à consulter les sites web ?|Un navigateur|Un tableur|Un pilote audio|Un défragmenteur|Un navigateur affiche les pages et applications web.
Quel appareil affiche les images d'un ordinateur ?|Un écran|Un microphone|Un clavier|Un scanner|Un écran est un périphérique de sortie visuelle.
Quel périphérique numérise un document papier ?|Un scanner|Un routeur|Une imprimante seule|Une enceinte|Un scanner convertit un document physique en image numérique.
Quel logiciel gère les ressources et applications du PC ?|Le système d'exploitation|Le navigateur uniquement|Le traitement de texte|Le logiciel de dessin|Le système d'exploitation gère notamment la mémoire et les processus.
Lequel est un système d'exploitation ?|Linux|HTML|USB|JPEG|Linux est le noyau utilisé par de nombreux systèmes d'exploitation.
Quel composant conserve normalement des fichiers sans alimentation ?|Un SSD|La RAM volatile|Le cache CPU volatile|Un registre CPU|Un SSD utilise une mémoire non volatile.
Quel service sert à envoyer des messages électroniques ?|L'e-mail|Le GPS|Le Bluetooth audio|La calculatrice|Le courrier électronique transporte des messages entre adresses.
Quel appareil relie généralement plusieurs réseaux IP ?|Un routeur|Un écran|Une souris|Un microphone|Un routeur transmet des paquets entre réseaux.
Que désigne le matériel informatique ?|Les composants physiques|Uniquement les applications|Les noms de domaines|Les mots de passe|Le matériel regroupe les éléments physiques d'un ordinateur.
Quel langage structure une page web ?|HTML|CSS|SQL|PNG|HTML décrit la structure et le sens du contenu web.
Quel langage définit principalement la présentation d'une page web ?|CSS|HTML|SQL|CSV|CSS définit notamment les couleurs, tailles et dispositions.
Quel format représente couramment une image photographique compressée ?|JPEG|TXT|CSV|WAV|JPEG est un format d'image utilisant généralement une compression avec pertes.
Que devient normalement la RAM volatile quand le PC s'éteint ?|Son contenu est perdu|Elle archive les fichiers|Elle devient un SSD|Elle imprime son contenu|La RAM volatile nécessite une alimentation pour conserver ses données.
Combien de valeurs distinctes un bit peut-il représenter ?|2|8|10|16|Un bit prend l'une de deux valeurs, généralement 0 ou 1.
Combien de bits contient un octet ?|8|2|10|16|Un octet correspond par définition à huit bits.
À quoi sert DNS ?|Associer des noms à des enregistrements réseau|Dessiner des icônes|Compresser des vidéos|Alimenter les ordinateurs|DNS permet notamment de résoudre un nom de domaine en adresse IP.
Que signifie télécharger un fichier depuis un serveur ?|Le recevoir sur son appareil|L'imprimer|Le supprimer du serveur|Le renommer uniquement|Le téléchargement entrant transfère le fichier du serveur vers le client.
Quelle technologie désigne une liaison réseau locale sans fil ?|Wi-Fi|HDMI|SATA|DVI|Wi-Fi sert aux réseaux locaux sans fil.
Quel format est conçu pour des données tabulaires en texte ?|CSV|MP3|PNG|MP4|CSV représente des lignes et colonnes à l'aide de séparateurs.
À quoi sert principalement Git ?|Gérer les versions de fichiers|Réparer un écran|Compresser le son|Remplacer la RAM|Git conserve l'historique des modifications et facilite la collaboration.
Quelle commande SQL lit des données ?|SELECT|DELETE|DROP|UPDATE|SELECT sert à interroger les données d'une base relationnelle.
Quelle structure répète des instructions ?|Une boucle|Un commentaire|Une constante seule|Un nom de fichier|Les boucles répètent un bloc selon une condition ou une séquence.
Dans une fonction, à quoi servent les paramètres ?|À recevoir des valeurs d'entrée|À fixer la couleur de l'écran|À arrêter Internet|À créer forcément un fichier|Les paramètres permettent de transmettre des données à une fonction.
Quel protocole transporte les pages web dans sa version non chiffrée ?|HTTP|FTP|SMTP|SSH|HTTP est le protocole applicatif du Web ; HTTPS ajoute la protection TLS.
Quel langage est couramment exécuté dans les navigateurs pour rendre une page interactive ?|JavaScript|SQL|Bash|Assembly x86 natif|JavaScript permet de programmer des comportements interactifs dans les pages.
Quelle est la valeur décimale du nombre binaire 1010 ?|10|8|12|14|1010 en base 2 vaut 8 + 2, donc 10 en base 10.
Quel code HTTP signifie généralement qu'une ressource est introuvable ?|404|200|301|500|404 signifie Not Found ; il indique une ressource non trouvée.
Quel code HTTP indique une redirection permanente classique ?|301|200|403|503|301 signifie Moved Permanently.
Quelle méthode HTTP est destinée à lire une ressource ?|GET|DELETE|PATCH|POST|GET demande une représentation de la ressource sans intention de la modifier.
Quelle structure suit le principe dernier entré, premier sorti ?|Une pile|Une file FIFO|Un ensemble non ordonné|Une table de routage|Une pile applique le principe LIFO.
Quelle structure suit le principe premier entré, premier sorti ?|Une file FIFO|Une pile LIFO|Un arbre binaire seul|Une constante|Une file FIFO retire d'abord l'élément arrivé le plus tôt.
Combien de valeurs différentes peut représenter un octet ?|256|8|128|512|Huit bits produisent 2 puissance 8, soit 256 combinaisons.
Que garantit principalement TCP entre applications ?|Un flux ordonné avec retransmission|Le chiffrement automatique|La confidentialité des noms DNS|L'absence de toute latence|TCP fournit un transport fiable et ordonné, sans chiffrer à lui seul les données.
Quelle longueur possède une adresse IPv4 ?|32 bits|16 bits|64 bits|128 bits|IPv4 utilise des adresses de 32 bits ; IPv6 utilise 128 bits.
Quelle longueur possède une adresse IPv6 ?|128 bits|32 bits|48 bits|256 bits|Une adresse IPv6 comporte 128 bits.
Que mesure principalement la complexité O(n) ?|Une croissance linéaire avec l'entrée|Une durée toujours égale à une seconde|Une mémoire forcément nulle|Une croissance toujours exponentielle|O(n) décrit une borne asymptotique linéaire selon la taille n.
À quoi sert une clé primaire en base relationnelle ?|Identifier une ligne de façon unique|Chiffrer tous les fichiers|Trier toujours les lignes par date|Créer un utilisateur système|Une clé primaire impose une identification unique et non nulle des lignes.
Pourquoi utiliser une transaction de base de données ?|Regrouper des opérations en une unité cohérente|Éviter toute requête SQL|Remplacer les sauvegardes|Garantir une interface graphique|Une transaction permet de valider ou annuler ensemble un groupe d'opérations.
""";
  private static final String CYBER = """
Quel choix protège mieux un compte ?|Un mot de passe long et unique|Le même mot de passe partout|Le prénom seul|123456|Un secret long et unique limite la réutilisation d'identifiants compromis.
Que désigne le phishing ?|Une tromperie pour obtenir des données ou actions|Une sauvegarde locale|Une mise à jour officielle|Une compression d'image|Le phishing imite une source fiable pour manipuler la victime.
À quoi sert un antivirus ?|Détecter et bloquer des logiciels malveillants|Augmenter la taille de l'écran|Créer des mots de passe publics|Remplacer une sauvegarde|Un antivirus aide à détecter et bloquer certaines menaces logicielles.
Pourquoi faire une sauvegarde ?|Pouvoir restaurer des données perdues|Publier ses mots de passe|Désactiver les mises à jour|Supprimer le système|Une sauvegarde fournit une copie permettant la récupération.
Que faire d'une pièce jointe inattendue ?|Vérifier l'expéditeur par un autre canal|L'ouvrir immédiatement|La transférer à tout le monde|Désactiver l'antivirus|Un canal indépendant aide à confirmer l'origine et le besoin du fichier.
Que fait un ransomware ?|Bloque ou chiffre des données pour réclamer une rançon|Nettoie toujours le disque|Répare une connexion Wi-Fi|Organise les photos|Un rançongiciel cherche à extorquer une victime en bloquant ses ressources.
Que faut-il garder secret ?|Un code d'authentification à usage unique|Le nom public d'un site|La météo|Le titre d'un livre|Un code d'authentification peut permettre l'accès à un compte.
Quel outil aide à créer des secrets uniques ?|Un gestionnaire de mots de passe|Un document public|Une capture partagée|Un commentaire sur un forum|Un gestionnaire peut générer et stocker des mots de passe uniques.
Pourquoi installer les correctifs de sécurité ?|Corriger des vulnérabilités connues|Partager automatiquement ses secrets|Rendre tous les fichiers publics|Supprimer la nécessité de sauvegarder|Les correctifs réduisent l'exposition aux failles corrigées.
Que faire avant de quitter un poste partagé ?|Fermer sa session|Laisser sa messagerie ouverte|Afficher ses codes|Désactiver le verrouillage|Fermer sa session réduit les accès non autorisés après son départ.
Quel élément inspecter dans un lien reçu ?|Sa destination réelle|Uniquement sa couleur|Uniquement le logo voisin|Le nombre d'émojis|Le texte visible peut masquer une autre destination.
Que signifie malware ?|Logiciel malveillant|Matériel très ancien|Document imprimé|Réseau sans fil|Malware est un terme général pour les logiciels malveillants.
Quel comportement limite les risques d'une clé USB inconnue ?|Ne pas la brancher et la signaler|La brancher sur tous les PC|Lancer tous ses fichiers|Désactiver les protections|Une clé inconnue peut présenter un risque logiciel ou matériel.
Quelle information est une donnée personnelle ?|Une adresse e-mail identifiant une personne|Une formule mathématique seule|La hauteur d'une montagne|Le code public d'une couleur|Une donnée personnelle permet d'identifier une personne directement ou indirectement.
Que fournit surtout HTTPS ?|Le chiffrement de la connexion|La preuve que tout contenu est honnête|Un antivirus distant|Une sauvegarde du compte|HTTPS protège le transport ; un site trompeur peut aussi utiliser HTTPS.
Quel exemple combine deux facteurs d'authentification ?|Mot de passe et clé de sécurité|Deux mots de passe|Mot de passe et question secrète|Deux codes mémorisés|Un secret connu et une clé possédée relèvent de facteurs différents.
Quel principe limite les permissions au strict nécessaire ?|Le moindre privilège|L'accès administrateur pour tous|Le partage global des secrets|La suppression des contrôles|Le moindre privilège réduit les permissions à celles nécessaires aux tâches.
Que fait principalement un pare-feu réseau ?|Filtre les communications selon des règles|Déchiffre tous les mots de passe|Garantit des fichiers sans virus|Répare les disques|Un pare-feu autorise ou refuse des communications selon sa configuration.
Quel risque crée la réutilisation d'un mot de passe ?|Une fuite peut compromettre plusieurs comptes|Elle empêche toutes les attaques|Elle active automatiquement la MFA|Elle chiffre les sauvegardes|Un secret divulgué sur un service peut être essayé sur d'autres.
Que désigne l'ingénierie sociale ?|La manipulation de personnes|Uniquement un défaut matériel|Une méthode de sauvegarde|Une mesure de débit réseau|Elle exploite la confiance ou les comportements pour obtenir une action.
Quelle mesure protège des données sur un appareil volé éteint ?|Le chiffrement du disque|Un fond d'écran sombre|Un nom de fichier court|Une souris sans fil|Le chiffrement au repos protège le contenu si la clé reste inaccessible.
Quel est l'objectif d'une attaque DDoS ?|Rendre un service indisponible|Améliorer sa lisibilité|Réparer les comptes|Compresser ses journaux|Une attaque distribuée vise à saturer ou perturber un service.
Pourquoi tester la restauration des sauvegardes ?|Vérifier qu'elles sont réellement utilisables|Rendre leur contenu public|Désactiver les copies|Supprimer les droits d'accès|Une sauvegarde non restaurable ne permet pas une reprise fiable.
Quel choix illustre la confidentialité ?|Limiter la lecture aux personnes autorisées|Rendre toutes les données publiques|Garantir que le serveur ne s'arrête jamais|Augmenter le nombre de copies publiques|La confidentialité concerne la protection contre l'accès non autorisé.
Quel choix illustre l'intégrité des données ?|Prévenir les modifications non autorisées|Permettre toute modification anonyme|Augmenter la luminosité|Publier tous les comptes|L'intégrité vise à préserver l'exactitude et les modifications autorisées.
Quel choix illustre la disponibilité ?|Maintenir l'accès autorisé au service|Cacher le mot de passe dans une image|Changer le logo|Réduire le texte d'une page|La disponibilité concerne l'accès aux ressources quand elles sont nécessaires.
Que faire face à une demande MFA non initiée ?|La refuser et signaler l'activité|L'approuver pour arrêter l'alerte|Partager le code publiquement|Désactiver toutes les protections|Une demande inattendue peut indiquer une tentative de connexion hostile.
Dans https://banque.fr.portail.example/login, quel domaine contrôle l'hôte ?|portail.example|banque.fr|https|login|banque.fr est ici un préfixe de sous-domaines ; le domaine est portail.example.
Quelle propriété distingue surtout le hachage du chiffrement réversible ?|Il n'est pas conçu pour retrouver l'entrée|Il utilise toujours une clé publique|Il restitue automatiquement le texte|Il compresse toujours les fichiers|Une fonction de hachage cryptographique produit une empreinte à sens unique.
À quoi sert un sel pour le stockage des mots de passe ?|Différencier les empreintes de secrets identiques|Rendre le secret public|Remplacer toute fonction de dérivation|Réduire les mots de passe à un caractère|Un sel unique limite la réutilisation de calculs précalculés entre comptes.
Quelle méthode limite une injection SQL ?|Les requêtes paramétrées|Concaténer toute entrée utilisateur|Cacher le nom de la base|Mettre le texte en majuscules|Les paramètres séparent les données de la structure SQL exécutée.
Quel risque décrit principalement XSS ?|Exécuter du script injecté dans une page|Faire tomber un disque au sol|Modifier une adresse MAC physiquement|Supprimer un câble|XSS permet l'exécution de contenu scripté injecté dans un contexte web.
Quel mécanisme peut limiter CSRF ?|Un jeton anti-CSRF vérifié|Un logo plus grand|Une URL plus longue seule|Un bouton coloré|Un jeton lié au contexte légitime aide à rejeter des requêtes forgées.
Pourquoi une sauvegarde hors ligne aide face aux rançongiciels ?|Elle réduit l'accès direct du malware à la copie|Elle supprime tous les risques|Elle remplace l'authentification|Elle rend le disque plus rapide|Une copie déconnectée est moins accessible lors d'une compromission active.
Quelle propriété apporte une signature numérique valide ?|Vérifier l'origine liée à la clé et l'intégrité|Cacher obligatoirement tout le texte|Garantir que l'auteur est honnête|Empêcher toute copie du document|La signature permet une vérification cryptographique de l'origine et de l'intégrité.
Quel protocole permet normalement l'administration distante chiffrée d'un serveur ?|SSH|Telnet sans protection|HTTP seul|FTP sans TLS|SSH protège les échanges d'une session distante par chiffrement.
Qu'est-ce qu'une vulnérabilité zero-day ?|Une faille sans correctif disponible lors de son exploitation|Un fichier créé à minuit|Un mot de passe vide uniquement|Un virus effacé en un jour|Le terme souligne l'absence de délai de protection par un correctif connu disponible.
Quel est le but de la segmentation réseau ?|Limiter les déplacements et communications entre zones|Donner tous les accès à tous|Retirer les pare-feu|Partager chaque secret|La segmentation réduit les chemins possibles et l'étendue d'une compromission.
Pourquoi limiter les essais de connexion ?|Ralentir les attaques par essais répétés|Allonger chaque mot de passe automatiquement|Éviter les sauvegardes|Prouver qu'un site est officiel|La limitation de débit réduit le rythme des tentatives automatisées.
Quel facteur est utilisé par une reconnaissance d'empreinte digitale ?|Un élément biométrique|Un secret mémorisé|Un nom de domaine|Une adresse IP publique|La biométrie repose sur une caractéristique de la personne.
""";
  private static final String GENERAL = """
Quelle planète est surnommée la planète rouge ?|Mars|Vénus|Mercure|Neptune|Les oxydes de fer de sa surface contribuent à la couleur rouge de Mars.
Quel astre est au centre du Système solaire ?|Le Soleil|La Lune|Jupiter|Polaris|Les planètes du Système solaire orbitent autour du Soleil.
Quelle est la formule chimique de l'eau ?|H2O|CO2|O2|NaCl|Une molécule d'eau contient deux atomes d'hydrogène et un d'oxygène.
Combien de côtés possède un triangle ?|3|4|5|6|Un triangle est un polygone à trois côtés.
Quel organe pompe le sang dans le corps humain ?|Le cœur|Le foie|L'estomac|Le poumon|Le cœur fournit la force de pompage de la circulation sanguine.
Quel gaz les humains utilisent-ils pour la respiration cellulaire aérobie ?|Le dioxygène|L'hélium|Le néon|Le méthane|Le dioxygène est utilisé dans la respiration cellulaire aérobie.
Combien de minutes contient une heure ?|60|30|100|24|Une heure correspond à soixante minutes.
Quel animal est un mammifère ?|Le dauphin|Le requin|La truite|La sardine|Le dauphin respire de l'air et allaite ses petits.
Quel phénomène transforme l'eau liquide en vapeur ?|L'évaporation|La solidification|La condensation|La fusion|L'évaporation est le passage de l'état liquide à l'état gazeux.
Quel instrument mesure la température ?|Un thermomètre|Un baromètre|Un chronomètre|Un voltmètre|Un thermomètre sert à mesurer la température.
Combien de jours compte une semaine ?|7|5|10|12|Le cycle hebdomadaire compte sept jours.
Quel métal est attiré fortement par un aimant ordinaire ?|Le fer|L'or pur|L'argent pur|Le cuivre pur|Le fer est ferromagnétique aux températures ordinaires.
Quel sens est associé aux yeux ?|La vue|L'odorat|Le goût|L'ouïe|Les yeux permettent la perception visuelle.
Combien de planètes compte le Système solaire selon la classification actuelle ?|8|7|9|10|La classification adoptée en 2006 reconnaît huit planètes.
Quel est le symbole chimique de l'or ?|Au|Ag|Fe|O|Au vient du nom latin aurum.
Quelle est l'unité SI de force ?|Le newton|Le watt|Le joule|Le volt|Le newton est l'unité de force du Système international.
Quel scientifique a formulé la relativité générale ?|Albert Einstein|Charles Darwin|Louis Pasteur|Gregor Mendel|Einstein a présenté la théorie de la relativité générale en 1915.
Quelle est la plus grande planète du Système solaire ?|Jupiter|Mars|Vénus|Mercure|Jupiter est la plus grande planète en diamètre et en masse.
Quel processus permet aux plantes de convertir l'énergie lumineuse ?|La photosynthèse|La fermentation seule|La fossilisation|La distillation|La photosynthèse convertit l'énergie lumineuse en énergie chimique.
Quel instrument mesure la pression atmosphérique ?|Un baromètre|Un thermomètre|Un ampèremètre|Un microscope|Le baromètre mesure la pression de l'air.
Quelle molécule porte principalement l'information génétique humaine ?|L'ADN|Le glucose|L'eau|Le chlorure de sodium|L'ADN contient les séquences génétiques des cellules humaines.
Quelle est l'unité SI de puissance ?|Le watt|Le joule|Le pascal|Le mètre|La puissance se mesure en watts, soit des joules par seconde.
Quelle civilisation a construit les pyramides de Gizeh ?|L'Égypte antique|Les Vikings|Les Aztèques|Les Romains|Les pyramides de Gizeh sont des monuments de l'Égypte antique.
Quel satellite naturel orbite autour de la Terre ?|La Lune|Titan|Europe|Phobos|La Lune est le satellite naturel de la Terre.
Quel scientifique est associé à la sélection naturelle avec Alfred Russel Wallace ?|Charles Darwin|Isaac Newton|Nikola Tesla|Blaise Pascal|Darwin et Wallace ont formulé des travaux sur la sélection naturelle.
Quelle invention est associée à Gutenberg dans l'Europe du XVe siècle ?|L'imprimerie à caractères mobiles métalliques|Le téléphone|La machine à vapeur|La radio|Gutenberg a développé ce procédé d'impression en Europe au XVe siècle.
Combien de degrés mesure un angle droit ?|90|45|180|360|Un angle droit correspond au quart d'un tour complet.
Quelle est la valeur du pH d'une eau pure à 25 °C ?|7|1|10|14|À 25 °C, l'eau pure est neutre avec un pH égal à 7.
Quelle est la vitesse exacte de la lumière dans le vide en mètres par seconde ?|299792458|300000|343|150000000|La valeur 299792458 m/s est fixée par définition dans le SI.
Quel élément possède le numéro atomique 6 ?|Le carbone|L'azote|L'oxygène|Le bore|Le numéro atomique du carbone est 6, correspondant à six protons.
Quelle particule porte une charge électrique négative ?|L'électron|Le proton|Le neutron|Le photon|L'électron porte une charge négative, opposée à celle du proton.
Quel est le nom du changement d'état solide vers gaz sans phase liquide ?|La sublimation|La fusion|La condensation liquide|La solidification|La sublimation est un passage direct de l'état solide à l'état gazeux.
Quelle loi relie tension, résistance et intensité dans un conducteur ohmique ?|La loi d'Ohm|La loi de Boyle|La loi de Kepler|La loi de Mendel|La relation U = R × I est la loi d'Ohm.
Quel gaz est le plus abondant dans l'atmosphère terrestre sèche ?|Le diazote|Le dioxygène|Le dioxyde de carbone|L'argon|Le diazote représente environ 78 % de l'atmosphère sèche.
Quelle planète est la plus proche du Soleil ?|Mercure|Vénus|La Terre|Mars|Mercure occupe l'orbite planétaire la plus proche du Soleil.
Dans quelle galaxie se situe le Système solaire ?|La Voie lactée|Andromède|Le Grand Nuage de Magellan|La galaxie du Triangle|Le Système solaire appartient à la Voie lactée.
Quel est le nombre de chromosomes d'une cellule somatique humaine typique ?|46|23|44|48|Une cellule somatique humaine typique possède 23 paires, soit 46 chromosomes.
Quel scientifique a découvert la pénicilline en 1928 ?|Alexander Fleming|Marie Curie|Antoine Lavoisier|Galilée|Fleming a observé l'effet antibactérien d'une moisissure en 1928.
Quel nombre premier suit immédiatement 7 ?|11|8|9|10|8, 9 et 10 sont composés ; 11 est le nombre premier suivant.
Quelle est l'unité SI de fréquence ?|Le hertz|Le tesla|Le coulomb|Le kelvin|Un hertz correspond à un cycle par seconde.
""";
  private static final String FOOTBALL = """
Combien de joueurs une équipe aligne-t-elle au maximum au début d'un match de football à onze ?|11|9|10|12|Une équipe de football à onze comporte au maximum onze joueurs, dont un gardien.
Quelle est la durée réglementaire d'une mi-temps de football senior standard ?|45 minutes|30 minutes|40 minutes|60 minutes|Un match standard comporte deux périodes de quarante-cinq minutes.
Quelle carte entraîne une exclusion ?|La carte rouge|La carte verte|La carte bleue standard|La carte blanche|La carte rouge signifie qu'un joueur est exclu.
Quelle carte correspond à un avertissement disciplinaire ?|La carte jaune|La carte rouge|La carte noire|La carte violette|Une carte jaune matérialise un avertissement.
Quel joueur peut utiliser ses mains dans sa propre surface, sous conditions ?|Le gardien de but|Tous les défenseurs|Le capitaine seul|Tous les attaquants|Le gardien dispose de règles particulières dans sa surface de réparation.
Quel pays a gagné la Coupe du monde masculine de 2018 ?|La France|La Croatie|Le Brésil|L'Allemagne|La France a battu la Croatie en finale en 2018.
Quel pays a gagné la Coupe du monde masculine de 2022 ?|L'Argentine|La France|Le Maroc|Le Portugal|L'Argentine a remporté la finale de 2022 contre la France aux tirs au but.
Quelle équipe nationale représente Lionel Messi ?|L'Argentine|L'Espagne|Le Brésil|L'Italie|Lionel Messi joue en sélection argentine.
Quelle équipe nationale représente Cristiano Ronaldo ?|Le Portugal|L'Espagne|La France|L'Angleterre|Cristiano Ronaldo joue en sélection portugaise.
Dans quelle ville se trouve le FC Barcelone ?|Barcelone|Madrid|Séville|Valence|Le club porte le nom de la ville de Barcelone.
Dans quel pays joue le club Liverpool FC ?|L'Angleterre|L'Écosse|L'Irlande|Le pays de Galles|Liverpool est un club anglais.
Que désigne un triplé marqué par un joueur dans un match ?|Trois buts|Deux buts|Quatre buts|Trois passes uniquement|Un triplé correspond à trois buts du même joueur.
Quel club est connu sous le nom de Real Madrid ?|Un club de Madrid|Un club de Paris|Un club de Lisbonne|Un club de Milan|Le Real Madrid est basé dans la capitale espagnole.
Quel organisme organise la Coupe du monde de football ?|La FIFA|Le CIO uniquement|La NBA|La FIA|La FIFA organise la Coupe du monde de football.
Quel pays a accueilli la première Coupe du monde masculine en 1930 ?|L'Uruguay|Le Brésil|La France|L'Italie|La première édition s'est tenue en Uruguay en 1930.
Qui a gagné cette Coupe du monde masculine de 1930 ?|L'Uruguay|L'Argentine|Le Brésil|La Yougoslavie|L'Uruguay a battu l'Argentine lors de la finale de 1930.
Quel pays a gagné la Coupe du monde masculine de 2010 ?|L'Espagne|Les Pays-Bas|L'Allemagne|L'Italie|L'Espagne a remporté son premier titre mondial masculin en 2010.
Quel pays a gagné la Coupe du monde masculine de 2014 ?|L'Allemagne|L'Argentine|Le Brésil|La France|L'Allemagne a battu l'Argentine en finale en 2014.
Quel pays a gagné la Coupe du monde masculine de 2006 ?|L'Italie|La France|L'Allemagne|Le Portugal|L'Italie a gagné la finale de 2006 aux tirs au but.
Quel pays a gagné la Coupe du monde masculine de 1998 ?|La France|Le Brésil|La Croatie|Les Pays-Bas|La France a remporté la finale de 1998 contre le Brésil.
À quelle distance du but se situe le point de penalty standard ?|11 mètres|9 mètres|12 mètres|16 mètres|Le point de réparation se trouve à onze mètres du milieu de la ligne de but.
Quel pays a remporté l'Euro masculin 2016 ?|Le Portugal|La France|L'Allemagne|L'Espagne|Le Portugal a battu la France en finale de l'Euro 2016.
Quel pays a remporté l'Euro masculin 2004 ?|La Grèce|Le Portugal|L'Italie|La France|La Grèce a gagné la finale de 2004 contre le Portugal.
Quel joueur est surnommé le Roi et a gagné les Mondiaux 1958, 1962 et 1970 ?|Pelé|Maradona|Cruyff|Platini|Pelé a fait partie des sélections brésiliennes championnes de ces trois éditions.
Quelle sélection masculine est surnommée la Squadra Azzurra ?|L'Italie|La France|L'Espagne|L'Argentine|Azzurra fait référence au bleu du maillot italien.
Quel club reçoit ses adversaires à Anfield ?|Liverpool FC|Arsenal|Chelsea|Everton|Anfield est le stade de Liverpool FC.
Quel pays a accueilli seul la Coupe du monde masculine 2010 ?|L'Afrique du Sud|Le Maroc|L'Égypte|Le Nigeria|L'Afrique du Sud a organisé la première édition disputée en Afrique.
Qui a marqué le but espagnol en finale du Mondial masculin 2010 ?|Andrés Iniesta|Xavi|David Villa|Fernando Torres|Iniesta a marqué en prolongation contre les Pays-Bas.
Qui a marqué le but allemand en finale du Mondial masculin 2014 ?|Mario Götze|Miroslav Klose|Thomas Müller|Toni Kroos|Götze a inscrit l'unique but de la finale en prolongation.
Quel était le score de la finale masculine France-Brésil en 1998 ?|3-0|1-0|2-1|4-2|La France a gagné trois buts à zéro en 1998.
Quel était le score de la finale masculine France-Croatie en 2018 ?|4-2|3-0|2-1|1-0|La finale de 2018 s'est terminée sur le score de quatre à deux.
Qui a marqué trois buts pour la France en finale masculine de 2022 ?|Kylian Mbappé|Olivier Giroud|Antoine Griezmann|Karim Benzema|Mbappé a inscrit un triplé lors de cette finale.
Quels deux pays ont coorganisé la Coupe du monde masculine de 2002 ?|La Corée du Sud et le Japon|La Chine et le Japon|Le Japon et la Thaïlande|La Corée du Sud et le Vietnam|L'édition 2002 a été coorganisée par la Corée du Sud et le Japon.
Quel pays a battu le Brésil 7-1 en demi-finale masculine du Mondial 2014 ?|L'Allemagne|L'Argentine|Les Pays-Bas|La France|L'Allemagne s'est imposée sept à un contre le Brésil.
Quel club a gagné la Ligue des champions masculine 2005 après avoir été mené 3-0 à la pause ?|Liverpool FC|AC Milan|Real Madrid|FC Barcelone|Liverpool est revenu à 3-3 contre Milan puis a gagné aux tirs au but.
Quel joueur français a reçu le Ballon d'Or masculin 1998 ?|Zinédine Zidane|Thierry Henry|Didier Deschamps|Patrick Vieira|Zidane a remporté le Ballon d'Or en 1998.
Quelle sélection a éliminé l'Espagne aux tirs au but en huitième de finale masculine du Mondial 2022 ?|Le Maroc|La Croatie|Le Japon|Le Sénégal|Le Maroc a remporté cette séance de tirs au but.
Quel pays a terminé quatrième du Mondial masculin 2022 après sa demi-finale historique ?|Le Maroc|La Croatie|Le Portugal|L'Angleterre|Le Maroc a été demi-finaliste puis quatrième en 2022.
Quel pays a gagné la Coupe du monde masculine de 1966 ?|L'Angleterre|L'Allemagne de l'Ouest|Le Portugal|Le Brésil|L'Angleterre a gagné l'édition 1966 à domicile.
Quel pays a gagné la Coupe du monde masculine de 1986 ?|L'Argentine|L'Allemagne de l'Ouest|La France|L'Italie|L'Argentine de Maradona a gagné l'édition 1986.
""";
  private static final String COUNTRIES = """
Quelle est la capitale de la France ?|Paris|Lyon|Marseille|Nice|Paris est la capitale de la France.
Quelle est la capitale du Royaume-Uni ?|Londres|Manchester|Liverpool|Birmingham|Londres est la capitale du Royaume-Uni.
Quelle est la capitale de l'Espagne ?|Madrid|Barcelone|Séville|Valence|Madrid est la capitale de l'Espagne.
Quelle est la capitale de l'Italie ?|Rome|Milan|Naples|Turin|Rome est la capitale de l'Italie.
Quelle est la capitale de l'Allemagne ?|Berlin|Munich|Hambourg|Francfort|Berlin est la capitale de l'Allemagne.
Quelle est la capitale du Maroc ?|Rabat|Casablanca|Marrakech|Fès|Rabat est la capitale du Maroc, même si Casablanca est plus peuplée.
Dans quel pays se trouvent les pyramides de Gizeh ?|L'Égypte|Le Maroc|La Grèce|La Turquie|Les pyramides de Gizeh se trouvent près du Caire, en Égypte.
Quelle est la capitale du Japon ?|Tokyo|Kyoto|Osaka|Hiroshima|Tokyo est la capitale du Japon.
Quel drapeau national comporte un disque rouge sur fond blanc ?|Celui du Japon|Celui du Canada|Celui de l'Italie|Celui du Brésil|Le drapeau japonais représente un disque rouge sur un fond blanc.
Quel drapeau national comporte une étoile verte à cinq branches sur fond rouge ?|Celui du Maroc|Celui du Japon|Celui de la France|Celui de l'Allemagne|Le drapeau marocain porte une étoile verte sur un fond rouge.
Sur quel continent se trouve le Brésil ?|L'Amérique du Sud|L'Europe|L'Afrique|L'Asie|Le Brésil est un pays d'Amérique du Sud.
Dans quelle partie de l'Afrique se trouve principalement le Sahara ?|Le nord|Le sud|L'extrême sud-est uniquement|Uniquement les îles de l'océan Indien|Le Sahara couvre une vaste zone d'Afrique du Nord.
Dans quel pays se trouve la tour Eiffel ?|La France|L'Italie|La Belgique|L'Espagne|La tour Eiffel est située à Paris, en France.
Quel pays européen est souvent décrit comme ayant une forme de botte ?|L'Italie|Le Portugal|La Norvège|La Belgique|La péninsule italienne présente une forme rappelant une botte.
Quelle est la capitale de l'Australie ?|Canberra|Sydney|Melbourne|Perth|Canberra est la capitale de l'Australie ; Sydney est sa ville la plus peuplée.
Quelle est la capitale du Canada ?|Ottawa|Toronto|Montréal|Vancouver|Ottawa est la capitale du Canada.
Quelle est la capitale du Brésil ?|Brasília|Rio de Janeiro|São Paulo|Salvador|Brasília est la capitale du Brésil depuis 1960.
Quelle est la capitale de la Turquie ?|Ankara|Istanbul|Izmir|Antalya|Ankara est la capitale de la Turquie.
Quelle est la capitale de la Suisse ?|Berne, ville fédérale|Zurich|Genève|Lausanne|Berne est la ville fédérale, siège des autorités fédérales suisses.
Quelle est la capitale de la Nouvelle-Zélande ?|Wellington|Auckland|Christchurch|Dunedin|Wellington est la capitale de la Nouvelle-Zélande.
Quelle est la capitale de la Suède ?|Stockholm|Göteborg|Malmö|Uppsala|Stockholm est la capitale de la Suède.
Quelle est la capitale de la Norvège ?|Oslo|Bergen|Trondheim|Tromsø|Oslo est la capitale de la Norvège.
À quel continent est rattachée Madagascar ?|L'Afrique|L'Asie|L'Europe|L'Amérique du Sud|Madagascar est un pays insulaire africain dans l'océan Indien.
Dans quel pays se trouve le Machu Picchu ?|Le Pérou|Le Mexique|Le Chili|L'Argentine|Le Machu Picchu est un site inca situé au Pérou.
Quelle est la capitale du Kenya ?|Nairobi|Mombasa|Kisumu|Nakuru|Nairobi est la capitale du Kenya.
Quelle est la capitale du Pérou ?|Lima|Cusco|Arequipa|Trujillo|Lima est la capitale du Pérou.
Quelle est la capitale du Chili ?|Santiago|Valparaíso|Concepción|Antofagasta|Santiago est la capitale du Chili.
Entre quels deux pays se trouve le sommet de l'Everest ?|Le Népal et la Chine|L'Inde et le Pakistan|Le Bhoutan et l'Inde|La Chine et la Mongolie|Le sommet de l'Everest est sur la frontière entre le Népal et la Chine.
Quelle est la capitale du Bhoutan ?|Thimphou|Paro|Punakha|Phuntsholing|Thimphou est la capitale du Bhoutan.
Quelle est la capitale de la Slovénie ?|Ljubljana|Maribor|Celje|Koper|Ljubljana est la capitale de la Slovénie.
Quelle est la capitale de la Slovaquie ?|Bratislava|Košice|Nitra|Prešov|Bratislava est la capitale de la Slovaquie.
Quelle est la capitale de la Géorgie ?|Tbilissi|Batoumi|Koutaïssi|Roustavi|Tbilissi est la capitale de la Géorgie.
Quelle est la capitale de l'Arménie ?|Erevan|Gyumri|Vanadzor|Dilijan|Erevan est la capitale de l'Arménie.
Quelle est la capitale du Kirghizistan ?|Bichkek|Och|Karakol|Naryn|Bichkek est la capitale du Kirghizistan.
Quelle est la capitale du Tadjikistan ?|Douchanbé|Khodjent|Koulob|Khorog|Douchanbé est la capitale du Tadjikistan.
Quelle est la capitale du Laos ?|Vientiane|Luang Prabang|Paksé|Savannakhet|Vientiane est la capitale du Laos.
Quelle est la capitale du Cambodge ?|Phnom Penh|Siem Reap|Battambang|Kampot|Phnom Penh est la capitale du Cambodge.
Quelle est la capitale de la Namibie ?|Windhoek|Swakopmund|Walvis Bay|Lüderitz|Windhoek est la capitale de la Namibie.
Quelle est la capitale du Botswana ?|Gaborone|Francistown|Maun|Kasane|Gaborone est la capitale du Botswana.
Quelle est la capitale du Lesotho ?|Maseru|Leribe|Mafeteng|Quthing|Maseru est la capitale du Lesotho.
""";
  private static final String MOVIES = """
Quel personnage de Toy Story est un cow-boy jouet ?|Woody|Nemo|Remy|Shrek|Woody est le cow-boy jouet de Toy Story.
Quel personnage de Toy Story se présente comme un ranger de l'espace ?|Buzz l'Éclair|Woody|Rex|Zigzag|Buzz l'Éclair est le jouet ranger de l'espace.
Dans Le Monde de Nemo, quel type de poisson est Nemo ?|Un poisson-clown|Un requin|Un poisson-lune|Une raie|Nemo est un poisson-clown comme son père Marlin.
Quel film Pixar suit un rat passionné de cuisine ?|Ratatouille|Cars|Là-haut|Coco|Ratatouille raconte l'histoire de Remy, un rat qui cuisine.
Quel film Pixar met en scène Flash McQueen ?|Cars|Toy Story|Vice-Versa|WALL-E|Flash McQueen est une voiture de course dans Cars.
Quel film Pixar met en scène un robot compacteur sur Terre ?|WALL-E|Rebelle|Luca|Monstres et Cie|WALL-E est un robot qui compacte les déchets.
Dans quel univers cinématographique apparaît Dark Vador ?|Star Wars|Harry Potter|Le Seigneur des anneaux|Jurassic Park|Dark Vador est un personnage de Star Wars.
Quel personnage porte un anneau vers le Mordor dans la trilogie de Peter Jackson ?|Frodon|Harry Potter|Luke Skywalker|Indiana Jones|Frodon est chargé de porter l'Anneau dans Le Seigneur des anneaux.
Quelle école accueille Harry Potter ?|Poudlard|Narnia|Gotham|Asgard|Harry Potter étudie la magie à Poudlard.
Quel héros de cinéma est aussi connu sous le nom de Bruce Wayne ?|Batman|Superman|Spider-Man|Iron Man|Bruce Wayne est l'identité civile de Batman.
Quel héros Marvel est aussi connu sous le nom de Tony Stark ?|Iron Man|Thor|Hulk|Captain America|Tony Stark porte l'armure d'Iron Man.
Quel film Disney met en scène Elsa et Anna ?|La Reine des neiges|Mulan|Aladdin|Vaiana|Elsa et Anna sont les sœurs au cœur de La Reine des neiges.
Quel film Pixar explore les émotions de Riley ?|Vice-Versa|Cars|Ratatouille|Toy Story|Vice-Versa représente notamment Joie et Tristesse dans l'esprit de Riley.
Quel film Pixar suit Miguel, jeune passionné de musique ?|Coco|Là-haut|Rebelle|Les Indestructibles|Miguel est le jeune héros de Coco.
Qui a réalisé Titanic, sorti en 1997 ?|James Cameron|Steven Spielberg|Peter Jackson|Christopher Nolan|James Cameron a réalisé Titanic.
Qui a réalisé Jurassic Park, sorti en 1993 ?|Steven Spielberg|James Cameron|Ridley Scott|Tim Burton|Steven Spielberg a réalisé Jurassic Park.
Qui a réalisé Inception, sorti en 2010 ?|Christopher Nolan|Quentin Tarantino|Martin Scorsese|David Fincher|Christopher Nolan a écrit et réalisé Inception.
Qui a réalisé la trilogie du Seigneur des anneaux sortie de 2001 à 2003 ?|Peter Jackson|George Lucas|James Cameron|Ridley Scott|Peter Jackson a réalisé les trois films de cette trilogie.
Qui a réalisé Le Voyage de Chihiro ?|Hayao Miyazaki|Akira Kurosawa|Satoshi Kon|Isao Takahata|Hayao Miyazaki a réalisé ce long métrage du Studio Ghibli.
Qui a réalisé Pulp Fiction, sorti en 1994 ?|Quentin Tarantino|David Lynch|Stanley Kubrick|Alfred Hitchcock|Quentin Tarantino est le réalisateur de Pulp Fiction.
Qui a réalisé Gladiator, sorti en 2000 ?|Ridley Scott|Tony Scott|James Cameron|Steven Soderbergh|Ridley Scott a réalisé Gladiator.
Qui a réalisé Interstellar, sorti en 2014 ?|Christopher Nolan|Denis Villeneuve|Alfonso Cuarón|James Cameron|Interstellar est réalisé par Christopher Nolan.
Qui a réalisé Le Parrain, sorti en 1972 ?|Francis Ford Coppola|Martin Scorsese|Brian De Palma|Sergio Leone|Francis Ford Coppola a réalisé Le Parrain.
Dans Star Wars, quel était le nom de Dark Vador avant sa chute ?|Anakin Skywalker|Obi-Wan Kenobi|Han Solo|Mace Windu|Anakin Skywalker devient Dark Vador.
En quelle année le premier Toy Story est-il sorti ?|1995|1999|2001|1990|Le premier long métrage Toy Story est sorti en 1995.
En quelle année Le Monde de Nemo est-il sorti ?|2003|1998|2008|2013|Finding Nemo est sorti en 2003.
Quel film Pixar est sorti en 2009 et met en scène une maison portée par des ballons ?|Là-haut|Coco|Cars 2|Ratatouille|Là-haut, ou Up, est sorti en 2009.
Quel film a gagné l'Oscar du meilleur film à la cérémonie de 2020 ?|Parasite|1917|Joker|The Irishman|Parasite a remporté l'Oscar du meilleur film lors de la cérémonie de 2020.
Qui a reçu l'Oscar de la réalisation pour Parasite en 2020 ?|Bong Joon Ho|Sam Mendes|Todd Phillips|Martin Scorsese|Bong Joon Ho a remporté cet Oscar pour Parasite.
Quel acteur a reçu l'Oscar du meilleur acteur pour Joker à la cérémonie de 2020 ?|Joaquin Phoenix|Adam Driver|Leonardo DiCaprio|Antonio Banderas|Joaquin Phoenix a remporté cet Oscar pour son rôle dans Joker.
Quel film a gagné l'Oscar du meilleur film à la cérémonie de 1998 ?|Titanic|The Full Monty|Good Will Hunting|As Good as It Gets|Titanic a remporté cet Oscar à la cérémonie de 1998.
Quel film a gagné l'Oscar du meilleur film à la cérémonie de 2004 ?|Le Retour du roi|Lost in Translation|Mystic River|Master and Commander|Le troisième volet du Seigneur des anneaux a gagné le meilleur film en 2004.
Quel film Pixar a gagné l'Oscar du long métrage d'animation à la cérémonie de 2020 ?|Toy Story 4|Klaus|Dragons 3|J'ai perdu mon corps|Toy Story 4 a remporté cet Oscar en 2020.
Quel personnage est le père de Nemo ?|Marlin|Bruce|Gill|Crush|Marlin parcourt l'océan pour retrouver son fils Nemo.
Quel film Pixar est sorti en 2007 ?|Ratatouille|WALL-E|Là-haut|Cars|Ratatouille est sorti en 2007 ; les trois autres à des années différentes.
Quel film Pixar est sorti en 2008 ?|WALL-E|Coco|Vice-Versa|Rebelle|WALL-E est sorti en 2008.
Quel film Pixar est sorti en 2017 et explore le monde des ancêtres de Miguel ?|Coco|Soul|Luca|En avant|Coco est sorti en 2017.
Quel studio a produit Le Voyage de Chihiro ?|Studio Ghibli|Pixar|DreamWorks Animation|Illumination|Le Voyage de Chihiro est une production du Studio Ghibli.
Quelle saga met en scène le vaisseau Millennium Falcon ?|Star Wars|Star Trek|Alien|Avatar|Le Millennium Falcon appartient à l'univers Star Wars.
Quel film a valu à Brad Pitt l'Oscar du second rôle masculin à la cérémonie de 2020 ?|Once upon a Time... in Hollywood|Ad Astra|Fight Club|Troy|Brad Pitt a reçu cet Oscar pour le film de Quentin Tarantino.
""";
}
