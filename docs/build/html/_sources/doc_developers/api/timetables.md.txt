Les emplois du temps sont une fonctionnalité puissante sur le site étu, ils permettent de simuler le fonctionnement d’un
fichier .ical. Voici les grandes fonctionnalité des emplois du temps :

- Répétition d’événements, sur une durée déterminée ou pour toujours
- Suppression ou modification récurrente d’occurrences d’un événement
- Groupes d’utilisateurs entre qui un événement (ou une mise à jour d’événement) est partagé(e)

# Entry

Contient les données nécessaires à la génération des occurrences liées à un événement en particulier.

**Exemple ;** un TD de NF16 le mardi à 14h au semestre A23 sera un événement, commençant le 19 septembre 2023, se
répétant toutes les semaines, ayant lieu 16 fois, et durant à chaque fois 2h, pour tous les élèves du TD. Pour gérer les
vacances, jours fériés et journées banalisées, on utilisera des overrides. Cet événement ne changera pas, pas même son
nombre de répétitions.

# Occurrence

Une case dans le calendrier. Une occurrence a une date de début et une date de fin.

Ce concept n’a pas de table associée dans la base de données. Les routes renvoyant des événements renvoient des
occurrences, qui sont créées à la volée pendant le traitement de la requête.

**Exemple :** Mon TD de NF16 de la semaine prochaine est une occurrence, il commencera mardi 19 décembre 2023 14h et se
terminera mardi 19 décembre 2023 16h, et aura lieu en B202. Mon TD de la semaine dernière en est une autre.

# Override

Permet de mettre à jour une entry. Le fonctionnement est très similaire à l’entry.

Un override permet de modifier le lieu d’un événement.

On peut aussi override la date de début de l’événement ainsi que la durée de chacune de ses occurrences (et donc
indirectement leur date de fin). La modification du début de l’événement est relative au début de l’événement originel.
Par exemple, le début relatif d’un événement démarrant à 10h au lieu de 11h sera “-1h” (11h + (-1h) = 10h).

Pour supprimer un événement, on peut créer un Override avec le flag `delete`.

**Exemple :** si je décide de sécher mon TD de NF16 toutes les 2 semaines entre le 31 octobre et le 28 novembre (
inclus), on pourrait créer un override avec le flag `delete` commençant à la 7è occurrence et se terminant à la 11è
occurrence, se répétant toutes les 2 occurrences.

# Groupe d’événements

Les groupes d’événements permettent de regrouper les personnes qui sont concernées par un ou plusieurs même événements.

**Exemple :** il y aurait un groupe “TD-NF16-A23-mardi-14h-B202” pour tous les étudiants dans le groupe de TD de NF16 du
mardi à 14h en B202 (pour le semestre A23).

Chaque utilisateur peut aussi avoir son groupe personnel, dans lequel il sera seul, pour faire des modifications qui
n’affecteront que son emploi du temps.

# Priorité

Définit l’ordre d’importance des groupes d’événements pour un utilisateur.

**Exemple :** en reprenant l’exemple du groupe “TD-NF16-A23-mardi-14h-B202”, mon groupe personnel (avec uniquement moi
dedans) aura la priorité sur les modifications. Si le cours du 31 octobre se passe exceptionnellement en B206,
l’événement apparaîtra quand même supprimé, puisque mon groupe personnel l’aura supprimé (si je marque le cours comme
étant séché).

La priorité des groupes est reliée directement aux utilisateurs, et pas aux groupes : une personne A pourrait très bien
avoir un groupe C étant prioritaire sur un groupe D, et une autre personne B avoir le groupe D prioritaire sur le groupe
C.