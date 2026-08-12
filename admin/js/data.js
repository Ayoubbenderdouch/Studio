/* =========================================================
   be. Studio Pilates — données de démonstration
   Tout est fictif et généré en mémoire. Les dates sont
   calculées RELATIVEMENT à maintenant : la démo paraît
   fraîche quel que soit le jour où on l'ouvre.
   ========================================================= */
window.BE = (function () {
  'use strict';

  /* ---------- Référentiels ---------- */
  var COURS = [
    { nom: 'Reformer',               duree: 50 },
    { nom: 'Matwork',                duree: 45 },
    { nom: 'Prénatal & Postnatal',   duree: 45 },
    { nom: 'Stretching & Mobilité',  duree: 40 }
  ];

  var CRENEAUX = ['09:00', '10:30', '12:30', '17:00', '18:30', '20:00'];
  var COACHS   = ['Nadia B.', 'Samira K.', 'Lynda T.', 'Hayet M.'];
  var FORMULES = ['Découverte', 'Pack 10', 'Illimité'];

  // Prix identiques à ceux de la page publique
  var PRIX = { 'Découverte': 1200, 'Pack 10': 11000, 'Illimité': 13500 };
  var MODES = ['Espèces', 'CIB', 'Edahabia'];

  var NOMS = [
    'Amina Benali', 'Sarah Khelifi', 'Lydia Meziane', 'Yasmine Boudiaf',
    'Nour Hamdaoui', 'Rania Cherif', 'Imane Saadi', 'Hiba Rahmani',
    'Selma Aït Ahmed', 'Meriem Ziani', 'Kenza Belkacem', 'Asma Guettaf',
    'Feriel Mansouri', 'Douaa Benaissa', 'Ikram Zerrouki', 'Wissam Kaddour',
    'Lina Bouzid', 'Manel Haddad', 'Chaima Larbi', 'Soraya Medjahed'
  ];

  var MESSAGES = [
    "C'est ma première fois, je suis un peu stressée 😅",
    'Je peux venir avec ma sœur ?',
    'Douleur au bas du dos, est-ce que c’est adapté ?',
    'Je suis enceinte de 5 mois, un certificat est nécessaire ?',
    'Est-ce qu’il reste de la place le soir ?',
    'J’ai déjà fait du yoga, jamais du Pilates.',
    '', '', ''   // beaucoup de demandes arrivent sans message
  ];

  var STATUTS = {
    ATTENTE:  'En attente d’appel',
    CONFIRME: 'Confirmée',
    ANNULE:   'Annulée'
  };

  /* ---------- Petits utilitaires ---------- */
  function pick(arr)      { return arr[Math.floor(Math.random() * arr.length)]; }
  function entre(a, b)    { return a + Math.floor(Math.random() * (b - a + 1)); }
  function minutesAvant(n){ return new Date(Date.now() - n * 60000); }
  function jourPlus(n)    { var d = new Date(); d.setDate(d.getDate() + n); return d; }

  function isoJour(d) {
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0');
  }

  function telAleatoire() {
    var prefixe = pick(['05', '06', '07']);
    var reste = '';
    for (var i = 0; i < 8; i++) reste += entre(0, 9);
    return prefixe + reste;
  }

  // "0551234678" -> "05 51 23 46 78"
  function formatTel(tel) {
    var brut = String(tel).replace(/[^\d+]/g, '');
    if (brut.length !== 10) return tel;
    return brut.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  }

  function prenom(nomComplet) { return nomComplet.split(' ')[0]; }

  var refUtilisees = {};
  function nouvelleRef() {
    var r;
    do { r = 'BE-' + entre(1000, 9999); } while (refUtilisees[r]);
    refUtilisees[r] = true;
    return r;
  }

  /* ---------- Réservations ---------- */
  // 14 demandes : 5 à rappeler, 7 confirmées, 2 annulées.
  // Cinq d'entre elles sont arrivées aujourd'hui.
  function construireReservations() {
    // « traitée il y a » est toujours plus récent que « reçue il y a ».
    // Les deux premières confirmées sont volontairement traitées dans les
    // dernières heures : le compteur « Confirmées aujourd'hui » ne doit pas
    // afficher 0 quand on ouvre la démo tôt le matin.
    var minutesDepuisMinuit = new Date().getHours() * 60 + new Date().getMinutes();
    var aujourdhui = function (max) { return Math.min(max, Math.max(5, minutesDepuisMinuit - 10)); };

    var plan = [
      // statut,          reçue il y a (min),   traitée il y a (min),          séance dans (j)
      [STATUTS.ATTENTE,   entre(6, 25),         null,                          entre(1, 3)],
      [STATUTS.ATTENTE,   entre(40, 90),        null,                          entre(1, 4)],
      [STATUTS.ATTENTE,   entre(120, 240),      null,                          entre(2, 5)],
      [STATUTS.ATTENTE,   entre(300, 460),      null,                          entre(1, 2)],
      [STATUTS.ATTENTE,   entre(1500, 1900),    null,                          entre(3, 6)],
      [STATUTS.CONFIRME,  aujourdhui(200),      aujourdhui(60),                entre(1, 2)],
      [STATUTS.CONFIRME,  aujourdhui(320),      aujourdhui(140),               entre(2, 4)],
      [STATUTS.CONFIRME,  entre(1400, 2000),    entre(1250, 1380),             entre(1, 3)],
      [STATUTS.CONFIRME,  entre(2200, 2800),    entre(2050, 2180),             entre(4, 7)],
      [STATUTS.CONFIRME,  entre(3000, 4000),    entre(2860, 2980),             entre(2, 5)],
      [STATUTS.CONFIRME,  entre(4200, 5200),    entre(4050, 4180),             entre(5, 9)],
      [STATUTS.CONFIRME,  entre(5600, 6800),    entre(5450, 5580),             entre(6, 10)],
      [STATUTS.ANNULE,    entre(2600, 3400),    entre(2450, 2580),             entre(1, 4)],
      [STATUTS.ANNULE,    entre(6000, 7400),    entre(5860, 5980),             entre(3, 8)]
    ];

    var noms = NOMS.slice().sort(function () { return Math.random() - 0.5; });

    return plan.map(function (p, i) {
      var res = {
        ref:     nouvelleRef(),
        nom:     noms[i % noms.length],
        tel:     telAleatoire(),
        cours:   pick(COURS).nom,
        date:    isoJour(jourPlus(p[3])),
        heure:   pick(CRENEAUX),
        message: pick(MESSAGES),
        statut:  p[0],
        recuLe:  minutesAvant(p[1]).toISOString(),
        note:    ''
      };
      if (p[2] !== null) res.traiteLe = minutesAvant(p[2]).toISOString();
      return res;
    }).sort(function (a, b) { return new Date(b.recuLe) - new Date(a.recuLe); });
  }

  /* ---------- Membres ---------- */
  function construireMembres() {
    return NOMS.map(function (nom, i) {
      var formule = i < 4 ? 'Découverte' : (i < 14 ? 'Pack 10' : 'Illimité');
      var total   = formule === 'Pack 10' ? 10 : (formule === 'Découverte' ? 1 : null);
      var restant = total === null ? null : entre(formule === 'Pack 10' ? 1 : 0, total);
      var derniere = entre(0, 26); // jours

      return {
        id: 'M' + (100 + i),
        nom: nom,
        tel: telAleatoire(),
        formule: formule,
        seancesTotal: total,
        seancesRestantes: restant,
        derniereVisite: new Date(Date.now() - derniere * 86400000).toISOString(),
        // inactive = pas venue depuis plus de 3 semaines
        active: derniere <= 21
      };
    });
  }

  /* ---------- Paiements ---------- */
  // Dérivés des membres : la formule et le montant concordent toujours.
  function construirePaiements(membres) {
    var lignes = [];
    var maintenant = new Date();

    membres.forEach(function (m, i) {
      // ce mois-ci
      if (i % 10 !== 7) {
        var jour = entre(1, Math.max(1, maintenant.getDate()));
        lignes.push({
          date: new Date(maintenant.getFullYear(), maintenant.getMonth(), jour, entre(9, 19), entre(0, 59)),
          membre: m.nom,
          formule: m.formule,
          montant: PRIX[m.formule],
          mode: pick(MODES)
        });
      }
      // mois précédent : un peu moins de monde qu'aujourd'hui, pour que
      // l'évolution reste crédible (autour de +10 %) et non spectaculaire
      if (i % 5 !== 4) {
        var pre = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1);
        var dansMois = new Date(pre.getFullYear(), pre.getMonth() + 1, 0).getDate();
        lignes.push({
          date: new Date(pre.getFullYear(), pre.getMonth(), entre(1, dansMois), entre(9, 19), entre(0, 59)),
          membre: m.nom,
          formule: m.formule,
          montant: PRIX[m.formule],
          mode: pick(MODES)
        });
      }
    });

    return lignes.sort(function (a, b) { return b.date - a.date; });
  }

  /* ---------- Planning de la semaine ---------- */
  // Samedi → Jeudi. Vendredi : le studio est fermé.
  var JOURS = [
    { cle: 'sam', label: 'Samedi',   court: 'Sam' },
    { cle: 'dim', label: 'Dimanche', court: 'Dim' },
    { cle: 'lun', label: 'Lundi',    court: 'Lun' },
    { cle: 'mar', label: 'Mardi',    court: 'Mar' },
    { cle: 'mer', label: 'Mercredi', court: 'Mer' },
    { cle: 'jeu', label: 'Jeudi',    court: 'Jeu' },
    { cle: 'ven', label: 'Vendredi', court: 'Ven', ferme: true }
  ];

  function construirePlanning(membres) {
    var grille = {};
    JOURS.forEach(function (j) {
      grille[j.cle] = {};
      if (j.ferme) return;

      CRENEAUX.forEach(function (h) {
        // le studio ne tourne pas à plein régime toute la journée
        if (Math.random() < 0.18) return;

        var places = entre(2, 8);
        var inscrites = [];
        var copie = membres.slice().sort(function () { return Math.random() - 0.5; });
        for (var i = 0; i < places; i++) inscrites.push(prenom(copie[i].nom));

        grille[j.cle][h] = {
          cours: pick(COURS).nom,
          coach: pick(COACHS),
          places: places,
          capacite: 8,
          inscrites: inscrites
        };
      });
    });
    return grille;
  }

  /* ---------- Cours du jour ---------- */
  function coursDuJour(planning) {
    var cles = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
    var jour = cles[new Date().getDay()];
    var duJour = planning[jour] || {};
    return CRENEAUX.filter(function (h) { return duJour[h]; })
                   .map(function (h) {
                     return Object.assign({ heure: h }, duJour[h]);
                   });
  }

  /* ---------- Historique 7 jours (graphique) ---------- */
  function construireHistorique(reservations) {
    var jours = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      jours.push({ date: d, valeur: i === 0 ? 0 : entre(2, 9) });
    }
    // le jour même est compté à partir des vraies données, pour rester cohérent
    var minuit = new Date(); minuit.setHours(0, 0, 0, 0);
    jours[6].valeur = reservations.filter(function (r) {
      return new Date(r.recuLe) >= minuit;
    }).length;
    return jours;
  }

  /* ---------- Nouvelle demande (simulation) ---------- */
  function nouvelleReservation() {
    return {
      ref:     nouvelleRef(),
      nom:     pick(NOMS),
      tel:     telAleatoire(),
      cours:   pick(COURS).nom,
      date:    isoJour(jourPlus(entre(1, 6))),
      heure:   pick(CRENEAUX),
      message: pick(MESSAGES),
      statut:  STATUTS.ATTENTE,
      recuLe:  new Date().toISOString(),
      note:    ''
    };
  }

  /* ---------- Amorçage ---------- */
  var membres     = construireMembres();
  var reservations= construireReservations();
  var planning    = construirePlanning(membres);

  return {
    COURS: COURS, CRENEAUX: CRENEAUX, COACHS: COACHS,
    FORMULES: FORMULES, PRIX: PRIX, MODES: MODES,
    STATUTS: STATUTS, JOURS: JOURS,

    // état vivant, muté par app.js
    reservations: reservations,
    membres:      membres,
    paiements:    construirePaiements(membres),
    planning:     planning,
    historique:   construireHistorique(reservations),

    coursDuJour:        function () { return coursDuJour(planning); },
    nouvelleReservation: nouvelleReservation,
    enregistrerRef:     function (r) { refUtilisees[r] = true; },
    formatTel:          formatTel,
    prenom:             prenom
  };
})();
