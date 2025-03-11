# Le Guide des UEs

_Avant la rentrée A24, la refonte du SIEP et par la même occasion la création du nouveau site étudiant, les UEs à l'UTT correspondaient à tous les différents cours donnés à l'UTT et dans ses antennes à Reims et Nogent. Ainsi, MT03 et MT03A (algèbre linéaire et algèbre linéaire en anglais) étaient deux UEs différentes. Avec cette refonte, a été introduite une distinction entre les cours et leurs variantes. Par exemple MT03A est en réalité une variante de MT03 et un étudiant n'est pas *censé* faire les deux. \
Cette distinction entre les UEs (unité d'enseignement) et les UEOFs (offre de formation d'UE) permet ainsi de regrouper sous le même code d'UE deux cours différents sur la forme mais pas sur le fond. Pour s'adapter au mieux, le site étudiant a également adopté cette distinction, pour présenter au mieux les différentes opportunités en terme de cours disponibles tout en agrégeant les données utilisateur (commentaires, annales, notations, etc)_

## Glossaire : Les sigles made in UTT™

Avant tout, revenons rapidement sur les différentes abréviations qui figurent dans cette documentation et qui sont issues de l'admin de l'UTT :

- **UE _(anciennement UV)_ :** unité d'enseignement. Un cours qui, une fois validé, certifie l'acquisition de commpétences particulières. Le code d'une UE est généralement composé d'un panachage de 4 chiffres et lettres, mais cette longueur n'est pas fixe. \
  Exemples : `NF10`, `MT01`, `APPTC`
  > Certains codes d'UE ont changé pendant la refonte du SIEP, par exemple `PIX` est devenu `NF10`, `CTC1` est devenu `AST03`, ...
- **UEOF :** offre de formation d'UE. Il s'agit d'une version précise d'un cours avec un programme, une langue et un emplacement **fixes**. Ainsi en cas de modification de l'UE, de changement de programme ou encore de modification de la langue ou du lieu d'enseignement, une nouvelle UEOF sera crée. _Ces nouvelles considérations permettront au site étudiant d'évaluer l'ancienneté des programmes des UEs et de mieux pondérer les commentaires et notations._ Le code d'une UEOF est composé du code de l'UE, de la langue d'enseignement, du lieu d'enseignement ainsi que de son année de création.
  Exemples : `NF10_FR_TRO_U24`, `MT01_FR_TRO_U23`, `APPTC_FR_TRO_U23`
  > Attention, le concept d'UEOF n'existait pas avant 2023, donc les formations plus anciennes afficheront `U23` pour date de création !
- **UEOE :** offre d'enseignement d'UE. L'enseignement d'une UEOF pendant un semestre précis. Ces codes apparaissent principalement sur le dossier étudiant et les emplois du temps. Ils sont constitués du début du code des UEOF avec le code de la période d'enseignement. Dans le site étudiant, les `UserUeSubscription` joueront le même rôle que les UEOE à la différence près qu'ils sont également rattachés à l'étudiant. \
  Exemples :`A24_NF10_FR_TRO`, `P25_MT01_FR_TRO`, `A24_APPTC_FR_TRO`
- **SIEP :** système informatique de l'enseignement et de la pédagogie. Le nouvel ERP de l'administration pour gérer les étudiants, leurs études et leurs données personnelles. Permet de centraliser tous les différents services qui existaient jusqu'à présent. \
  Cette nouvelle plateforme remplace ainsi de manière non-exhaustive : le guide des ues, le dossier étudiant, le suivi des stages et des alternances, les inscriptions et réinscriptions, les certificats de langue
- **DFP :** direction de la formation et de la pédagogie. L'équipe de l'UTT en charge de la formation et des outils administratifs (dont le SIEP fait partie) qui sont liés à la formation des étudiants.
- **ERP :** _en anglais, enterprise resource planning_. [Logiciel de gestion](https://fr.wikipedia.org/wiki/Progiciel_de_gestion_int%C3%A9gr%C3%A9) des processus et des ressources d'une entreprise. On peut retenir que c'est avant tout un logiciel de gestion, qui se décline dans le cadre du SIEP en une version incluant des pages web (celles du site du siep). Il faut bien retenir que le siep est avant tout un outil interne avant d'être un site internet ! Ainsi il ne faut pas compter sur de belles APIs propres...

## Les UEs : La vision EtuUTT

Depuis 2013 et avant, EtuUTT centralise les informations du guide des UEs, _qui rappelons-le était papier à ses débuts,_ et les enrichit de données supplémentaires&nbsp;: des ressentis d'anciens étudiants qui ont déjà suivi l'UE et des anciens sujets d'exams. Cela permet aux étudiants, aussi bien de choisir au mieux leurs prochains cours que de s'entrainer et réviser pour leurs examens.

C'est dans cet état d'esprit que nous menons la refonte du site étudiant :

- les commentaires sont toujours présents et permettent aux étudiants de s'exprimer librement sur leurs cours passés.
  > Ces commentaires sont bien entendu **modérés** et ne sont visibles que par les étudiants (et anciens étudiants). \
  > ⚠️ Il faudra impérativement **avoir fait l'UE** pour pouvoir laisser un commentaire. Si un étudiant crée sont compte EtuUTT après le semestre où il a suivi l'UE<sup>1</sup>, il ne pourra pas s'exprimer sur cette UE.
- les utilisateurs peuvent désormais réagir à un commentaire d'UE en y répondant. Cela peut permettre de nuancer certains propos spécifiques ou au contraire de les développer par un argument supplémentaire !
- les étudiants peuvent désormais _upvote_ les commentaires qui leurs semblent les plus pertinents. Ils remonteront dans la liste des commentaires.
  > ❓ Les commentaires sont triés en fonction de leur nombre d'upvotes mais aussi de leur ancienneté et de l'UEOF à laquelle ils sont liés
- Pour que les étudiants donnent plus leur avis sur leurs cours, il est désormais possible de noter avec une note sur 5 les UEs déjà suivies<sup>1</sup> sur des critères prédéfinis par les administrateurs. Il s'agira principalement d'évaluer la qualité des contenus et de l'enseignement.
- la recherche d'une UE affichera toutes les différentes version de l'UE (dans toutes ses langues d'enseignement et les différents semestres où elle est disponible). Les UEs sont désormais rattachées à aux branches au profil desquelles elles comptent. Cela permettra d'identifier facilement les UEs hors profil.
- les étudiants pourront consulter les anciens examens des UEs et partager ceux des semestres qu'ils ont suivi<sup>1</sup>.

<sup>1</sup> : il est possible qu'une importation du profil étudiant soit ajoutée dans le futur et qu'il soit ainsi possible de donner son avis sur des UEs suivies avant la création du compte EtuUTT.

Les objectifs de la refonte du guide des UEs étant présentés, nous allons pouvoir aborder la partie technique.

## Les structures

Pour définir aux mieux les UEs, nous utilisons plusieurs structures de données. Passons-les en revue afin de comprendre l'usage de chacune d'elles :

- **`Ue`**, il s'agit d'une UE au sens de la refonte du SIEP. C'est à dire qu'elle ne contient elle même que peu d'informations : sa date de création et de dernière modification ainsi que les notes des utilisateurs. Ce sont les `Ueof` liées à cette UE qui contiendront la majorité des détails du guide des UEs.
- **`UeAlias`**. Certaines UEs n'existent plus. C'est le cas de `MATH03` ou de `EC01` par exemple. Il faut donc gérer les cas où certaines UEs auraient des prérequis qui n'existent plus ! Pour des UEs qui ont changé de nom comme `MT03` il suffit de mettre en place une "redirection" et pour les UEs qui n'existent plus du tout comme `EC01` il faut également le notifier pour faire disparaître la référence. C'est tout l'intérêt de cette table.
- **`Ueof`**, c'est la structure qui définit une UEOF. Elle va donc être liée à toutes les informations du guide des UEs la concernant : temps de travail, crédits, branche associée, prérequis, commentaires, annales... Pour un soucis de lisibilité, cette structure n'inclut pas les données telles que la langue d'enseignement, les mineurs, le programme et les objectifs. On utilisera `UeofInfo` à la place.
- **`UeAnnal`**, il s'agit de la structure qui représente un sujet d'examen. Fait référence à l'utilisateur qui a envoyé le sujet, à l'UEOF, au semestre ainsi qu'au type d'examen (médian, final, etc)
- **`UeAnnalType`**, c'est le type d'examen d'une annale. Ces valeurs sont rentrées par les administrateurs du site qui seront dans la possibilité d'ajouter de nouveaux types d'examens s'ils se rendent compte que les valeurs précédentes ne sont pas assez précises.
- **`UeComment`**. Le commentaire d'un étudiant au sujet du cours qu'il a suivi. Ce commentaire est rattaché à l'UEOF correspondante afin d'afficher quelle variante de l'UE a été suivie mais sera affiché pour toutes les UEOFs de l'UE. Le commentaire peut être posté en anonyme mais l'auteur sera tout de même visible pour la modération. Egalement, les commentaires ne sont pas supprimés directement lorsque l'utilisateur choisit de les supprimer. Il y aura un petit délai permettant d'annuler la suppression ou de procéder à des actions de modération si nécessaire.
- **`UeCommentReply`**, c'est la réponse d'un utilisateur à un commentaire d'une UE.
- **`UeCommentUpvote`** il s'agit d'un upvote donné par n'importe quel étudiant à un commentaire de n'importe quelle UE s'il l'a trouvé instructif et/ou pertinent.
- **`UeCredit`**. C'est le nombre de crédits obtenus par un étudiant qui réalise l'UE. C'est ici qu'apparaît les branches et filières auxquelles cette UE est liée. En effet, il arrive qu'une même UE donne des crédits d'un type différent selon si l'étudiant est en master ou en cycle ingénieur.
- **`UeCreditCategory`**. Il s'agit des différents types de crédits ECTS: `CS`, `TM`, etc
- **`UeofInfo`**. C'est ici que figurent toutes les informations détaillées des UEOFs : leur programme, les objectifs, la langue d'enseignement, les mineurs, etc. Cela permet de ne pas surcharger la structure des UEOFs.
- **`UeStarCriterion`**. Les critères sur lesquels les utilisateurs peuvent évaluer une UE. Ces critères ne sont pas fixes et pourront être modifiés par les administrateurs du site s'ils se rendent compte qu'ils sont mal définis.
- **`UeStarVote`**, c'est le vote d'un utilisateur pour une UE donnée et un critère donné. Il ne peut y avoir qu'un seul vote par Utilisateur & Ue & Critère.
- **`UeWorkTime`**. Cette structure rassemble les heures de travail estimé pour effectuer l'UE. Il n'y a plus de nombre d'heures pour la réalisation d'un projet éventuel mais l'indication porte désormais sur le fait qu'il y ait un projet ou non.

## Les Semestres

La DFP a intégré certaines formations au guide des UEs qui n'ont pas lieu sur les semestres classiques d'automne et de printemps. Il a donc fallu intégrer de nouveaux laps de temps au site étudiant. Voici une correspondance entre les codes et leur signification :

| Sigle | Signification                 |
| ----- | ----------------------------- |
| A24   | Semestre d'automne 2024       |
| P25   | Semestre de printemps 2025    |
| H25   | Intersemestre d'hiver 2025    |
| E25   | Intersemestre d'été 2025      |
| U24   | Année universitaire 2024-2025 |
