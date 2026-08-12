be. Studio Pilates — dossier images
===================================

PHOTOS (§8) — livrées, en place
-------------------------------
Les 7 visuels sont chargés en CSS `background` (pas de balises <img>), avec
un dégradé de marque posé DESSOUS. Si un fichier disparaît, le dégradé prend
le relais et la page reste finie — aucune modification de code nécessaire.

  01-hero.png        arche du hero + poster de la vidéo   880 × 1320
  02-studio.png      arche « Le studio »                  880 × 1320
  03-reformer.png    carte cours 1                        760 × 507
  04-matwork.png     carte cours 2                        760 × 507
  05-prenatal.png    carte cours 3                        760 × 507
  06-stretching.png  carte cours 4                        760 × 507
  07-og-cover.png    aperçu réseaux sociaux              1536 × 1024

Déclarés dans css/style.css (.arch-hero, .arch-studio, .img-reformer,
.img-matwork, .img-prenatal, .img-stretching) et dans les balises
og:image / twitter:image de index.html.

Les fichiers ont été redimensionnés au double de leur taille d'affichage
réelle (écrans Retina) : 13 Mo → 7,9 Mo, sans perte visible. Un passage en
JPEG ou WebP ferait encore tomber l'ensemble sous 500 Ko, mais changerait
les noms de fichiers fixés au §8 du cahier des charges.

LOGO — extrait du PDF fourni par la cliente
-------------------------------------------
  logo.svg        verrouillage complet (be. + STUDIO PILATES) → pied de page
  logo-mark.svg   signe seul « be. »                          → barre de navigation

Vectoriel, fond transparent, aux couleurs exactes de la charte
(#D8C4AC sable, #C8A49F rose). Prévus pour les fonds bordeaux.
La ligne STUDIO PILATES de la barre de navigation est composée en Jost :
celle du fichier serait illisible à cette taille.

VIDÉO (§11)
-----------
  ../videos/hero-loop.mp4   fond de l'arche du hero, muette, en boucle

Poster = 01-hero.png, donc l'attente affiche déjà la bonne image.
Sous `prefers-reduced-motion: reduce`, la vidéo est masquée et arrêtée :
l'arche retombe sur l'image fixe.
