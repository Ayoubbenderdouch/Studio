/* =========================================================
   be. Studio Pilates — Espace gérante (démo)

   Tout vit en mémoire : un rafraîchissement remet les données
   d'origine. C'est volontaire pour une démonstration — aucune
   base, aucun serveur, rien à installer.
   ========================================================= */
(function () {
  'use strict';

  var D = window.BE;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* =======================================================
     1. Formatage
     ======================================================= */
  var JOURS_FR = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
  var MOIS_FR  = ['janvier','février','mars','avril','mai','juin',
                  'juillet','août','septembre','octobre','novembre','décembre'];

  function fmtMontant(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' DA';
  }

  function fmtDateLongue(d) {
    d = (d instanceof Date) ? d : new Date(d);
    return JOURS_FR[d.getDay()] + ' ' + d.getDate() + ' ' + MOIS_FR[d.getMonth()];
  }

  function fmtDateCourte(d) {
    d = (d instanceof Date) ? d : new Date(d);
    return String(d.getDate()).padStart(2, '0') + '/' +
           String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }

  function fmtHeure(d) {
    d = (d instanceof Date) ? d : new Date(d);
    return String(d.getHours()).padStart(2, '0') + 'h' + String(d.getMinutes()).padStart(2, '0');
  }

  // "il y a 12 min", "il y a 3 h", "hier", "il y a 4 j"
  function fmtRelatif(iso) {
    var diff = Date.now() - new Date(iso).getTime();
    var min = Math.round(diff / 60000);
    if (min < 1)  return 'à l’instant';
    if (min < 60) return 'il y a ' + min + ' min';
    var h = Math.round(min / 60);
    if (h < 24)   return 'il y a ' + h + ' h';
    var j = Math.round(h / 24);
    if (j === 1)  return 'hier';
    if (j < 30)   return 'il y a ' + j + ' j';
    return fmtDateCourte(iso);
  }

  // "sam. 5 sept." — pour les séances à venir
  function fmtSeance(isoJour, heure) {
    var p = String(isoJour).split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    var jour = JOURS_FR[d.getDay()];
    return jour.slice(0, 3) + '. ' + d.getDate() + ' ' + MOIS_FR[d.getMonth()].slice(0, 4) + '. · ' + heure;
  }

  function classeStatut(s) {
    if (s === D.STATUTS.CONFIRME) return 'ok';
    if (s === D.STATUTS.ANNULE)   return 'off';
    return 'attente';
  }

  function telBrut(t)  { return String(t).replace(/[^\d+]/g, ''); }
  function telWhatsApp(t) {
    var b = telBrut(t);
    return '213' + b.replace(/^(\+213|00213|0)/, '');
  }

  function echapper(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function memeJour(a, b) {
    a = new Date(a); b = new Date(b);
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  /* =======================================================
     2. État de l'interface
     ======================================================= */
  var etat = {
    vue: 'dashboard',
    filtreStatut: 'toutes',
    recherche: '',
    filtreFormule: '',
    nonLues: 0,
    ouverte: null      // réf de la réservation affichée dans le tiroir
  };

  var VUES = {
    dashboard:    'Tableau de bord',
    reservations: 'Réservations',
    planning:     'Planning',
    membres:      'Membres',
    paiements:    'Paiements'
  };

  /* =======================================================
     3. Connexion (théâtre de démonstration, aucune vérification)
     ======================================================= */
  var elLogin = $('#login');
  var elApp   = $('#app');

  function ouvrirSession() {
    try { sessionStorage.setItem('beAdminAuth', '1'); } catch (e) {}
    elLogin.classList.add('hidden');
    elApp.hidden = false;
    demarrer();
  }

  function fermerSession() {
    try { sessionStorage.removeItem('beAdminAuth'); } catch (e) {}
    location.hash = '';
    elApp.hidden = true;
    elLogin.classList.remove('hidden');
  }

  $('#loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    ouvrirSession();
  });
  $('#logoutBtn').addEventListener('click', fermerSession);

  /* =======================================================
     4. Chiffres dérivés — toujours recalculés depuis l'état,
        jamais écrits en dur : ils ne peuvent pas contredire
        le contenu des tableaux.
     ======================================================= */
  function enAttente()  { return D.reservations.filter(function (r) { return r.statut === D.STATUTS.ATTENTE; }); }
  function confirmees() { return D.reservations.filter(function (r) { return r.statut === D.STATUTS.CONFIRME; }); }
  function annulees()   { return D.reservations.filter(function (r) { return r.statut === D.STATUTS.ANNULE; }); }

  function confirmeesAujourdhui() {
    return confirmees().filter(function (r) { return r.traiteLe && memeJour(r.traiteLe, new Date()); }).length;
  }

  function revenusMois(decalage) {
    var ref = new Date();
    ref.setMonth(ref.getMonth() - (decalage || 0));
    return D.paiements
      .filter(function (p) { return p.date.getMonth() === ref.getMonth() && p.date.getFullYear() === ref.getFullYear(); })
      .reduce(function (t, p) { return t + p.montant; }, 0);
  }

  /* =======================================================
     5. Rendu — tableau de bord
     ======================================================= */
  function icone(d, path) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="' + d[0] + '" cy="' + d[1] +
           '" r="2.2"/><path d="' + path + '"/></svg>';
  }

  function rendreKpis() {
    var attente = enAttente().length;
    var recuesAuj = D.reservations.filter(function (r) { return memeJour(r.recuLe, new Date()); }).length;
    var actives = D.membres.filter(function (m) { return m.active; }).length;
    var mois = revenusMois(0), moisPre = revenusMois(1);
    var evol = moisPre ? Math.round((mois - moisPre) / moisPre * 100) : 0;

    var cartes = [
      { cls: 'kpi-accent', label: 'À appeler', ic: icone([18, 6], 'M5 5 C 5 14, 10 19, 19 19'),
        val: attente, trend: recuesAuj + ' demande' + (recuesAuj > 1 ? 's' : '') + ' reçue' + (recuesAuj > 1 ? 's' : '') + ' aujourd’hui' },
      { label: 'Confirmées aujourd’hui', ic: icone([6, 7], 'M4 13 C 7 13, 8 18, 10 18 C 13 18, 15 8, 20 6'),
        val: confirmeesAujourdhui(), trend: 'sur ' + D.reservations.length + ' demandes suivies', up: true },
      { label: 'Membres actives', ic: icone([9, 5.5], 'M17 4 C 13 8, 15 12, 11 15 C 8 17, 6 19, 8 21'),
        val: actives, trend: 'sur ' + D.membres.length + ' inscrites' },
      { label: 'Revenus du mois', ic: icone([15, 9], 'M19 6 C 12 4, 5 8, 5 13 C 5 18, 12 20, 18 17'),
        val: fmtMontant(mois), trend: (evol >= 0 ? '+' : '') + evol + ' % vs mois dernier', up: evol >= 0 }
    ];

    $('#kpis').innerHTML = cartes.map(function (c, i) {
      return '<article class="kpi reveal ' + (c.cls || '') + '" style="animation-delay:' + (i * 60) + 'ms">' +
             '<div class="kpi-label">' + c.ic + c.label + '</div>' +
             '<div class="kpi-value">' + c.val + '</div>' +
             '<div class="kpi-trend' + (c.up ? ' up' : '') + '">' + c.trend + '</div>' +
             '</article>';
    }).join('');
  }

  function rendreGraphique() {
    var data = D.historique;
    var max = Math.max.apply(null, data.map(function (d) { return d.valeur; })).valueOf() || 1;
    var W = 300, H = 130, base = 100, haut = 88, n = data.length;
    var gap = 8, bw = (W - gap * (n - 1)) / n;

    var barres = data.map(function (d, i) {
      var h = Math.max(3, (d.valeur / max) * haut);
      var x = i * (bw + gap), y = base - h;
      var auj = i === n - 1;
      var lab = JOURS_FR[d.date.getDay()].slice(0, 2);
      lab = lab.charAt(0).toUpperCase() + lab.charAt(1);
      return '<g>' +
        '<rect class="bar' + (auj ? ' today' : '') + '" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) +
          '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="5"/>' +
        '<rect class="bar-hit" x="' + x.toFixed(1) + '" y="0" width="' + bw.toFixed(1) + '" height="' + base + '"/>' +
        '<text class="bar-value" x="' + (x + bw / 2).toFixed(1) + '" y="' + (y - 5).toFixed(1) + '">' + d.valeur + '</text>' +
        '<text class="bar-label" x="' + (x + bw / 2).toFixed(1) + '" y="118">' + lab + '</text>' +
        '</g>';
    }).join('');

    $('#chart').innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" ' +
      'aria-label="Réservations reçues sur les sept derniers jours">' + barres + '</svg>';
  }

  function barreOccupation(places, capacite) {
    var pct = Math.round(places / capacite * 100);
    var cls = pct >= 100 ? 'full' : (pct >= 75 ? 'warm' : '');
    return '<div class="occ">' +
      '<div class="occ-num">' + places + '/' + capacite + '</div>' +
      '<div class="occ-bar"><i class="occ-fill ' + cls + '" style="width:' + pct + '%"></i></div>' +
      '</div>';
  }

  function rendreAujourdhui() {
    var cours = D.coursDuJour();
    $('#todayCount').textContent = cours.length ? cours.length + ' séances' : '';

    if (!cours.length) {
      $('#todayClasses').innerHTML = vide('Pas de séance aujourd’hui.');
      return;
    }
    $('#todayClasses').innerHTML = '<div class="mini-list">' + cours.map(function (c) {
      return '<div class="mini-row">' +
        '<span class="mini-time">' + c.heure + '</span>' +
        '<span class="mini-main"><strong>' + echapper(c.cours) + '</strong><span>' + echapper(c.coach) + '</span></span>' +
        barreOccupation(c.places, c.capacite) +
        '</div>';
    }).join('') + '</div>';
  }

  function rendreDernieres() {
    var cinq = D.reservations.slice(0, 5);
    $('#latest').innerHTML = '<div class="mini-list">' + cinq.map(function (r) {
      return '<div class="mini-row">' +
        '<span class="mini-main"><strong>' + echapper(r.nom) + '</strong>' +
          '<span>' + echapper(r.cours) + ' · ' + fmtRelatif(r.recuLe) + '</span></span>' +
        '<span class="badge ' + classeStatut(r.statut) + '">' + echapper(r.statut) + '</span>' +
        '</div>';
    }).join('') + '</div>';
  }

  function vide(texte) {
    return '<div class="empty">' +
      '<svg viewBox="0 0 120 160" aria-hidden="true"><circle cx="44" cy="18" r="7"/>' +
      '<path d="M100 8 C 70 32, 88 60, 58 92 C 38 114, 24 126, 34 146 C 38 154, 47 156, 53 151"/></svg>' +
      texte + '</div>';
  }

  /* =======================================================
     6. Rendu — réservations
     ======================================================= */
  function reservationsFiltrees() {
    var q = etat.recherche.trim().toLowerCase();
    return D.reservations.filter(function (r) {
      if (etat.filtreStatut === 'attente'  && r.statut !== D.STATUTS.ATTENTE)  return false;
      if (etat.filtreStatut === 'confirme' && r.statut !== D.STATUTS.CONFIRME) return false;
      if (etat.filtreStatut === 'annule'   && r.statut !== D.STATUTS.ANNULE)   return false;
      if (!q) return true;
      return (r.nom + ' ' + r.tel + ' ' + r.ref).toLowerCase().indexOf(q) !== -1;
    });
  }

  function rendreChips() {
    var defs = [
      { cle: 'toutes',   label: 'Toutes',            n: D.reservations.length },
      { cle: 'attente',  label: 'En attente d’appel', n: enAttente().length },
      { cle: 'confirme', label: 'Confirmées',        n: confirmees().length },
      { cle: 'annule',   label: 'Annulées',          n: annulees().length }
    ];
    $('#statusChips').innerHTML = defs.map(function (d) {
      return '<button type="button" class="chip' + (etat.filtreStatut === d.cle ? ' active' : '') +
        '" data-statut="' + d.cle + '">' + d.label + ' <i>' + d.n + '</i></button>';
    }).join('');
  }

  function actionsPour(r) {
    if (r.statut !== D.STATUTS.ATTENTE) return '';
    return '<div class="actions">' +
      '<a class="btn btn-sm btn-call" href="tel:' + echapper(telBrut(r.tel)) + '" data-stop>📞 Appeler</a>' +
      '<button type="button" class="btn btn-sm btn-ok" data-action="confirmer" data-ref="' + r.ref + '">✓ Confirmer</button>' +
      '<button type="button" class="btn btn-sm btn-danger" data-action="annuler" data-ref="' + r.ref + '">✕ Annuler</button>' +
      '</div>';
  }

  function rendreReservations() {
    rendreChips();
    var liste = reservationsFiltrees();

    if (!liste.length) {
      $('#reservationsList').innerHTML = vide('Aucune réservation ici.');
      return;
    }

    var lignes = liste.map(function (r) {
      return '<tr class="clickable ' + (r.statut === D.STATUTS.ATTENTE ? 'pending' : '') +
             '" data-ref="' + r.ref + '">' +
        '<td data-label="Réf" class="ref">' + r.ref + '</td>' +
        '<td data-label="Nom" class="nom">' + echapper(r.nom) + '</td>' +
        '<td data-label="Téléphone" class="num">' + D.formatTel(r.tel) + '</td>' +
        '<td data-label="Cours">' + echapper(r.cours) + '</td>' +
        '<td data-label="Séance" class="num nowrap">' + fmtSeance(r.date, r.heure) + '</td>' +
        '<td data-label="Reçue" class="muted nowrap">' + fmtRelatif(r.recuLe) + '</td>' +
        '<td data-label="Statut"><span class="badge ' + classeStatut(r.statut) + '">' + echapper(r.statut) + '</span></td>' +
        '<td class="cell-actions">' + actionsPour(r) + '</td>' +
        '</tr>';
    }).join('');

    $('#reservationsList').innerHTML =
      '<table class="tbl"><thead><tr>' +
      '<th>Réf</th><th>Nom</th><th>Téléphone</th><th>Cours</th>' +
      '<th>Date &amp; créneau</th><th>Reçue</th><th>Statut</th><th></th>' +
      '</tr></thead><tbody>' + lignes + '</tbody></table>';
  }

  /* =======================================================
     7. Rendu — planning
     ======================================================= */
  function rendrePlanning() {
    var jours = D.JOURS;

    var entete = '<tr><th class="hcol"></th>' + jours.map(function (j) {
      return '<th class="' + (j.ferme ? 'closed' : '') + '">' + j.court + '</th>';
    }).join('') + '</tr>';

    var corps = D.CRENEAUX.map(function (h) {
      return '<tr><td class="hcol">' + h + '</td>' + jours.map(function (j) {
        if (j.ferme) return '<td class="closed">' + (h === D.CRENEAUX[0] ? 'Fermé' : '') + '</td>';
        var s = D.planning[j.cle][h];
        if (!s) return '<td></td>';

        var plein = s.places >= s.capacite;
        // l'intensité du fond suit le remplissage
        var alpha = 0.10 + (s.places / s.capacite) * 0.30;
        var style = plein ? '' : ' style="background:rgba(200,164,159,' + alpha.toFixed(2) + ')"';

        return '<td><button type="button" class="slot' + (plein ? ' full' : '') + '"' + style +
          ' data-jour="' + j.cle + '" data-heure="' + h + '">' +
          '<strong>' + echapper(s.cours) + '</strong>' +
          '<span>' + (plein ? 'Complet · 8/8' : s.places + '/' + s.capacite) + '</span>' +
          '</button></td>';
      }).join('') + '</tr>';
    }).join('');

    $('#planning').innerHTML = '<table class="planning">' +
      '<thead>' + entete + '</thead><tbody>' + corps + '</tbody></table>';

    $('#planningLegend').innerHTML =
      '<span><i style="background:rgba(200,164,159,.15)"></i> Places disponibles</span>' +
      '<span><i style="background:rgba(200,164,159,.40)"></i> Presque complet</span>' +
      '<span><i style="background:var(--bordeaux)"></i> Complet (8/8)</span>' +
      '<span><i style="background:rgba(154,147,139,.18)"></i> Studio fermé</span>';
  }

  /* =======================================================
     8. Rendu — membres
     ======================================================= */
  function classeFormule(f) {
    return f === 'Pack 10' ? 'f-pack' : (f === 'Illimité' ? 'f-illimite' : 'f-decouverte');
  }

  function rendreMembres() {
    var q = etat.recherche.trim().toLowerCase();
    var liste = D.membres.filter(function (m) {
      if (etat.filtreFormule && m.formule !== etat.filtreFormule) return false;
      if (!q) return true;
      return (m.nom + ' ' + m.tel).toLowerCase().indexOf(q) !== -1;
    });

    $('#membresCount').textContent = liste.length + ' membre' + (liste.length > 1 ? 's' : '');

    if (!liste.length) {
      $('#membresList').innerHTML = vide('Aucune membre ne correspond.');
      return;
    }

    var lignes = liste.map(function (m) {
      var seances;
      if (m.seancesRestantes === null) {
        seances = '<span class="muted">∞</span>';
      } else {
        var pct = m.seancesTotal ? Math.round(m.seancesRestantes / m.seancesTotal * 100) : 0;
        seances = '<div class="occ" style="min-width:70px">' +
          '<div class="occ-num">' + m.seancesRestantes + ' / ' + m.seancesTotal + '</div>' +
          '<div class="occ-bar"><i class="occ-fill" style="width:' + pct + '%"></i></div></div>';
      }
      return '<tr>' +
        '<td data-label="Nom" class="nom">' + echapper(m.nom) + '</td>' +
        '<td data-label="Téléphone" class="num">' + D.formatTel(m.tel) + '</td>' +
        '<td data-label="Formule"><span class="badge plain ' + classeFormule(m.formule) + '">' + m.formule + '</span></td>' +
        '<td data-label="Séances">' + seances + '</td>' +
        '<td data-label="Dernière visite" class="muted">' + fmtRelatif(m.derniereVisite) + '</td>' +
        '<td data-label="Statut"><span class="badge ' + (m.active ? 'ok' : 'off') + '">' +
          (m.active ? 'Active' : 'Inactive') + '</span></td>' +
        '</tr>';
    }).join('');

    $('#membresList').innerHTML =
      '<table class="tbl"><thead><tr>' +
      '<th>Nom</th><th>Téléphone</th><th>Formule</th><th>Séances restantes</th>' +
      '<th>Dernière visite</th><th>Statut</th>' +
      '</tr></thead><tbody>' + lignes + '</tbody></table>';
  }

  /* =======================================================
     9. Rendu — paiements
     ======================================================= */
  function rendrePaiements() {
    var mois = revenusMois(0), pre = revenusMois(1);
    var evol = pre ? Math.round((mois - pre) / pre * 100) : 0;

    $('#kpisPaiements').innerHTML =
      '<article class="kpi"><div class="kpi-label">Revenus du mois</div>' +
        '<div class="kpi-value">' + fmtMontant(mois) + '</div>' +
        '<div class="kpi-trend">mois en cours</div></article>' +
      '<article class="kpi"><div class="kpi-label">Vs mois dernier</div>' +
        '<div class="kpi-value">' + (evol >= 0 ? '+' : '') + evol + '<small>%</small></div>' +
        '<div class="kpi-trend' + (evol >= 0 ? ' up' : '') + '">' + fmtMontant(pre) + ' le mois dernier</div></article>';

    var q = etat.recherche.trim().toLowerCase();
    var liste = D.paiements.filter(function (p) {
      if (!q) return true;
      return (p.membre + ' ' + p.formule + ' ' + p.mode).toLowerCase().indexOf(q) !== -1;
    });

    if (!liste.length) {
      $('#paiementsList').innerHTML = vide('Aucun paiement ne correspond.');
      return;
    }

    var lignes = liste.map(function (p) {
      return '<tr>' +
        '<td data-label="Date" class="num">' + fmtDateCourte(p.date) + '</td>' +
        '<td data-label="Membre" class="nom">' + echapper(p.membre) + '</td>' +
        '<td data-label="Formule"><span class="badge plain ' + classeFormule(p.formule) + '">' + p.formule + '</span></td>' +
        '<td data-label="Montant" class="num">' + fmtMontant(p.montant) + '</td>' +
        '<td data-label="Mode"><span class="badge plain f-decouverte">' + p.mode + '</span></td>' +
        '</tr>';
    }).join('');

    $('#paiementsList').innerHTML =
      '<table class="tbl"><thead><tr>' +
      '<th>Date</th><th>Membre</th><th>Formule</th><th>Montant</th><th>Mode</th>' +
      '</tr></thead><tbody>' + lignes + '</tbody></table>';
  }

  /* =======================================================
     10. Tiroir de détail
     ======================================================= */
  var drawer = $('#drawer'), drawerOv = $('#drawerOverlay');

  function ouvrirTiroir(ref) {
    var r = D.reservations.filter(function (x) { return x.ref === ref; })[0];
    if (!r) return;
    etat.ouverte = ref;

    var etapes = '<div class="tl-item done"><strong>Demande reçue</strong><span>' +
      fmtDateLongue(r.recuLe) + ' à ' + fmtHeure(r.recuLe) + '</span></div>';

    if (r.statut === D.STATUTS.ATTENTE) {
      etapes += '<div class="tl-item"><strong>Appel à passer</strong><span>en attente</span></div>';
    } else {
      etapes += '<div class="tl-item done"><strong>Cliente appelée</strong><span>' +
        (r.traiteLe ? fmtHeure(r.traiteLe) : '—') + '</span></div>' +
        '<div class="tl-item ' + (r.statut === D.STATUTS.CONFIRME ? 'done' : 'off') + '"><strong>' +
        echapper(r.statut) + '</strong><span>' + (r.traiteLe ? fmtRelatif(r.traiteLe) : '') + '</span></div>';
    }

    var boutons = r.statut === D.STATUTS.ATTENTE
      ? '<div class="row">' +
          '<button type="button" class="btn btn-ok" data-action="confirmer" data-ref="' + r.ref + '">✓ Confirmer</button>' +
          '<button type="button" class="btn btn-danger" data-action="annuler" data-ref="' + r.ref + '">✕ Annuler</button>' +
        '</div>'
      : '';

    $('#drawerInner').innerHTML =
      '<div class="drawer-top">' +
        '<div><div class="drawer-ref">Demande n° ' + r.ref + '</div>' +
        '<div class="drawer-name">' + echapper(r.nom) + '</div></div>' +
        '<button type="button" class="drawer-close" id="drawerClose" aria-label="Fermer">✕</button>' +
      '</div>' +

      '<dl class="dl">' +
        '<dt>Téléphone</dt><dd><a href="tel:' + echapper(telBrut(r.tel)) + '">' + D.formatTel(r.tel) + '</a></dd>' +
        '<dt>Cours</dt><dd>' + echapper(r.cours) + '</dd>' +
        '<dt>Séance</dt><dd>' + fmtSeance(r.date, r.heure) + '</dd>' +
        '<dt>Reçue</dt><dd>' + fmtRelatif(r.recuLe) + '</dd>' +
        '<dt>Statut</dt><dd><span class="badge ' + classeStatut(r.statut) + '">' + echapper(r.statut) + '</span></dd>' +
      '</dl>' +

      (r.message ? '<blockquote class="quote">« ' + echapper(r.message) + ' »</blockquote>' : '') +

      '<div class="timeline">' + etapes + '</div>' +

      '<label class="field"><span>Note interne</span>' +
        '<textarea id="drawerNote" rows="3" placeholder="Rappeler après 17h…">' + echapper(r.note) + '</textarea>' +
      '</label>' +

      '<div class="drawer-actions">' +
        '<a class="btn btn-call btn-block" href="tel:' + echapper(telBrut(r.tel)) + '">📞 Appeler ' + echapper(D.prenom(r.nom)) + '</a>' +
        '<a class="btn btn-ghost btn-block" href="https://wa.me/' + telWhatsApp(r.tel) +
          '" target="_blank" rel="noopener">Écrire sur WhatsApp</a>' +
        boutons +
      '</div>';

    $('#drawerNote').addEventListener('input', function () { r.note = this.value; });
    $('#drawerClose').addEventListener('click', fermerTiroir);

    drawer.classList.add('open');
    drawerOv.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function fermerTiroir() {
    etat.ouverte = null;
    drawer.classList.remove('open');
    drawerOv.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }

  drawerOv.addEventListener('click', fermerTiroir);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && etat.ouverte) fermerTiroir();
  });

  /* =======================================================
     11. Notifications
     ======================================================= */
  function toast(titre, detail) {
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<strong>' + titre + '</strong>' + (detail ? '<em>' + detail + '</em>' : '');
    $('#toasts').appendChild(el);
    setTimeout(function () {
      el.classList.add('out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
    }, 4000);
  }

  /* =======================================================
     12. Actions sur une réservation
     ======================================================= */
  function changerStatut(ref, statut) {
    var r = D.reservations.filter(function (x) { return x.ref === ref; })[0];
    if (!r || r.statut === statut) return;

    r.statut = statut;
    r.traiteLe = new Date().toISOString();

    rafraichir();
    if (etat.ouverte === ref) ouvrirTiroir(ref);

    toast('Réservation ' + ref + ' ' +
          (statut === D.STATUTS.CONFIRME ? 'confirmée ✓' : 'annulée'),
          D.prenom(r.nom) + ' · ' + r.cours);
  }

  // Délégation : marche pour le tableau comme pour le tiroir
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (btn) {
      e.stopPropagation();
      changerStatut(btn.getAttribute('data-ref'),
        btn.getAttribute('data-action') === 'confirmer' ? D.STATUTS.CONFIRME : D.STATUTS.ANNULE);
      return;
    }
    if (e.target.closest('[data-stop]')) { e.stopPropagation(); return; }

    var slot = e.target.closest('.slot');
    if (slot) { ouvrirPopover(slot); return; }

    var ligne = e.target.closest('tr[data-ref]');
    if (ligne) { ouvrirTiroir(ligne.getAttribute('data-ref')); return; }

    var chip = e.target.closest('[data-statut]');
    if (chip) {
      etat.filtreStatut = chip.getAttribute('data-statut');
      rendreReservations();
      return;
    }

    if (!e.target.closest('.popover')) fermerPopover();
  });

  /* ---------- Popover du planning ---------- */
  var popover = null;
  function fermerPopover() {
    if (popover && popover.parentNode) popover.parentNode.removeChild(popover);
    popover = null;
  }
  function ouvrirPopover(slot) {
    fermerPopover();
    var s = D.planning[slot.getAttribute('data-jour')][slot.getAttribute('data-heure')];
    if (!s) return;

    popover = document.createElement('div');
    popover.className = 'popover';
    popover.innerHTML = '<h4>' + echapper(s.cours) + ' · ' + slot.getAttribute('data-heure') + '</h4>' +
      '<p class="muted" style="margin-bottom:8px;font-size:.8rem">Coach ' + echapper(s.coach) + '</p>' +
      '<ul>' + s.inscrites.map(function (p) { return '<li>' + echapper(p) + '</li>'; }).join('') + '</ul>';

    slot.parentNode.style.position = 'relative';
    slot.parentNode.appendChild(popover);
  }

  /* =======================================================
     13. Simulation d'arrivée — le moment fort de la démo
     ======================================================= */
  function arrivee(res) {
    D.reservations.unshift(res);
    D.enregistrerRef(res.ref);
    etat.nonLues++;

    // le graphique compte la journée en cours
    D.historique[D.historique.length - 1].valeur++;

    rafraichir();

    var badge = $('#navBadge');
    badge.classList.add('bump');
    setTimeout(function () { badge.classList.remove('bump'); }, 320);

    var bell = $('#bell');
    bell.classList.remove('shake');
    void bell.offsetWidth;
    bell.classList.add('shake');

    toast('📩 Nouvelle demande — ' + D.prenom(res.nom), res.cours + ' · ' + fmtSeance(res.date, res.heure));

    // la nouvelle ligne pulse deux secondes si la vue est ouverte
    if (etat.vue === 'reservations') {
      var tr = $('tr[data-ref="' + res.ref + '"]');
      if (tr) { tr.classList.add('flash'); setTimeout(function () { tr.classList.remove('flash'); }, 2100); }
    }
  }

  function simuler() { arrivee(D.nouvelleReservation()); }

  $('#simBtn').addEventListener('click', simuler);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'n' && e.key !== 'N') return;
    var t = e.target.tagName;
    if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
    if (elApp.hidden) return;
    simuler();
  });

  $('#bell').addEventListener('click', function () {
    etat.nonLues = 0;
    majBadges();
  });

  /* =======================================================
     14. Passerelle avec le formulaire du site
        Une réservation envoyée sur la page publique arrive ici
        en moins de deux secondes (même origine).
     ======================================================= */
  var CLE_FILE = 'be_reservations';

  function consommerFile(animer) {
    var file;
    try { file = JSON.parse(localStorage.getItem(CLE_FILE) || '[]'); }
    catch (e) { file = []; }
    if (!Array.isArray(file) || !file.length) return;

    var connues = {};
    D.reservations.forEach(function (r) { connues[r.ref] = true; });

    file.forEach(function (d) {
      if (!d || !d.ref || connues[d.ref]) return;
      var res = {
        ref: d.ref, nom: d.nom, tel: d.tel, cours: d.cours,
        date: d.date, heure: d.heure, message: d.message || '',
        statut: D.STATUTS.ATTENTE, recuLe: d.recuLe || new Date().toISOString(), note: ''
      };
      if (animer) {
        arrivee(res);
      } else {
        D.reservations.unshift(res);
        D.enregistrerRef(res.ref);
      }
    });

    try { localStorage.setItem(CLE_FILE, '[]'); } catch (e) {}
  }

  /* =======================================================
     15. Navigation
     ======================================================= */
  function majBadges() {
    var n = enAttente().length;
    var badge = $('#navBadge');
    badge.textContent = n;
    badge.classList.toggle('empty', n === 0);

    var bb = $('#bellBadge');
    bb.textContent = etat.nonLues;
    bb.classList.toggle('empty', etat.nonLues === 0);
  }

  function rendreVue() {
    if (etat.vue === 'dashboard') {
      rendreKpis(); rendreGraphique(); rendreAujourdhui(); rendreDernieres();
    } else if (etat.vue === 'reservations') {
      rendreReservations();
    } else if (etat.vue === 'planning') {
      rendrePlanning();
    } else if (etat.vue === 'membres') {
      rendreMembres();
    } else if (etat.vue === 'paiements') {
      rendrePaiements();
    }
  }

  function rafraichir() {
    majBadges();
    rendreVue();
  }

  function allerA(vue) {
    if (!VUES[vue]) vue = 'dashboard';
    etat.vue = vue;

    $$('.view').forEach(function (v) { v.hidden = v.id !== 'view-' + vue; });
    $$('.nav-item').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-view') === vue);
    });
    $('#pageTitle').textContent = VUES[vue];

    // la recherche est propre à chaque vue
    etat.recherche = '';
    $('#search').value = '';
    $('#search').placeholder = vue === 'membres' ? 'Rechercher une membre…'
      : vue === 'paiements' ? 'Rechercher un paiement…'
      : 'Nom, téléphone ou référence…';

    fermerPopover();
    rafraichir();
    fermerMenu();
  }

  window.addEventListener('hashchange', function () {
    allerA((location.hash || '#dashboard').slice(1));
  });

  $('#search').addEventListener('input', function () {
    etat.recherche = this.value;
    rendreVue();
  });

  $('#formuleFilter').addEventListener('change', function () {
    etat.filtreFormule = this.value;
    rendreMembres();
  });

  /* ---------- Menu mobile ---------- */
  var sidebar = $('#sidebar'), sbOverlay = $('#sidebarOverlay'), burger = $('#burger');

  function fermerMenu() {
    sidebar.classList.remove('open');
    sbOverlay.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }
  burger.addEventListener('click', function () {
    var ouvert = sidebar.classList.toggle('open');
    sbOverlay.classList.toggle('open', ouvert);
    burger.setAttribute('aria-expanded', String(ouvert));
  });
  sbOverlay.addEventListener('click', fermerMenu);

  /* =======================================================
     16. Démarrage
     ======================================================= */
  var demarre = false;
  function demarrer() {
    if (demarre) return;
    demarre = true;

    var d = new Date();
    $('#today').textContent = JOURS_FR[d.getDay()] + ' ' + d.getDate() + ' ' + MOIS_FR[d.getMonth()];

    consommerFile(false);                       // demandes déjà en file au chargement
    allerA((location.hash || '#dashboard').slice(1));

    // une demande arrive d'elle-même entre 25 et 40 secondes
    if (!reduced) setTimeout(simuler, 25000 + Math.random() * 15000);

    // les mentions « il y a … » restent justes
    setInterval(function () { if (!elApp.hidden) rendreVue(); }, 60000);

    // passerelle avec la page publique
    setInterval(function () { consommerFile(true); }, 2000);
  }

  // Session déjà ouverte : on saute la connexion
  var dejaConnectee = false;
  try { dejaConnectee = sessionStorage.getItem('beAdminAuth') === '1'; } catch (e) {}
  if (dejaConnectee) {
    elLogin.classList.add('hidden');
    elApp.hidden = false;
    demarrer();
  }

})();
