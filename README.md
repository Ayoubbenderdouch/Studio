# be. Studio Pilates — landing page (démo)

Page de présentation pour **be. Studio Pilates**, studio de Pilates 100 % féminin
à Chlef (Algérie). Démo client : **données fictives, aucun back-end, aucune
dépendance**. Ouvrir `index.html` dans un navigateur suffit.

## Lancer

```bash
open index.html
```

Ou, pour être au plus près d'un vrai serveur (chemins relatifs, vidéo) :

```bash
python3 -m http.server 8765   # puis http://localhost:8765
```

## Structure

```
index.html          page complète (11 sections)
css/style.css       styles, jetons de marque, animations
js/main.js          menu, révélations au défilement, ruban, vidéo, formulaire
images/             7 photos + logo vectoriel — voir images/README.txt
videos/             hero-loop.mp4 (fond de l'arche du hero)
```

HTML, CSS et JavaScript natifs. Pas de framework, pas de npm, pas d'étape de
compilation. Polices : Fraunces + Jost (Google Fonts).

## Le formulaire de réservation

Il simule le produit réel : demande sur le site → tableau de bord → **le studio
rappelle la cliente pour confirmer**. Rien ne quitte la page.

- Validation en français : nom, numéro algérien (`+213` / `00213` / `0` puis 5, 6
  ou 7), cours, date (jamais dans le passé), créneau.
- À l'envoi, la demande est empilée dans `window.__demoReservations` et écrite en
  console sous `[DÉMO] Nouvelle demande de RDV → dashboard admin :` — c'est ce
  que recevra le tableau de bord.
- Le panneau de confirmation affiche une référence `BE-XXXX`, le récapitulatif et
  le statut `En attente d'appel`.

Ouvrez la console du navigateur pendant la démo pour le montrer.

## Détails d'intégration

- **Logo** — vectoriel, extrait du PDF de la cliente. Le signe « be. » de la barre
  de navigation se compose au chargement (~1,6 s) ; un clic le rejoue.
- **Images** — chargées en `background` CSS avec un dégradé de marque **dessous** :
  si un fichier manque, la page reste finie.
- **Vidéo du hero** — muette, en boucle, `playsinline`. Poster `01-hero.png`. Mise
  en pause hors écran, ignorée en mode économie de données ou sur 2G.
- **Mobile d'abord** — testé de 320 px à 430 px et en paysage. Champs à 16 px
  (sinon iOS zoome), zones tactiles ≥ 44 px, survols neutralisés au toucher,
  marges de sécurité pour les encoches.
- **`prefers-reduced-motion`** — animations coupées, vidéo remplacée par l'image
  fixe, tout le contenu reste visible.

## Poids

Environ 10 Mo (7,9 Mo d'images, 2,4 Mo de vidéo). Les noms de fichiers `.png`
sont fixés par le cahier des charges ; un passage en JPEG ou WebP ramènerait les
images sous 500 Ko.

---

Conçu par **Thinkxie**.
