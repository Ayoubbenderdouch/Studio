/* =========================================================
   be. Studio Pilates — main.js
   Démo statique : aucune donnée ne quitte la page.
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Logo de la barre de navigation ---------- */
  // L'animation se joue au chargement via CSS. Ici on la rejoue simplement
  // quand on clique le logo — un petit clin d'oeil, rien de fonctionnel.
  var logoAnim = document.querySelector('.logo-anim');
  if (logoAnim && !reduced) {
    logoAnim.closest('a').addEventListener('click', function () {
      logoAnim.classList.add('replay');
      void logoAnim.offsetWidth;          // force le recalcul
      logoAnim.classList.remove('replay');
    });
  }

  /* ---------- 2. Nav : ombre au scroll ---------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- 3. Menu burger ---------- */
  var burger = document.getElementById('burger');
  var panel = document.getElementById('navPanel');

  function closeMenu() {
    panel.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Ouvrir le menu');
  }

  burger.addEventListener('click', function () {
    var open = panel.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  });

  panel.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      closeMenu();
      burger.focus();
    }
  });

  /* ---------- 4. Scroll-reveal ---------- */
  var revealables = document.querySelectorAll('.reveal');

  // délais échelonnés à l'intérieur des grilles
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    var i = 0;
    Array.prototype.forEach.call(group.children, function (child) {
      if (child.classList.contains('reveal')) {
        child.style.transitionDelay = (i * 90) + 'ms';
        i++;
      }
    });
  });

  if (reduced || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 5. Ruban défilant ---------- */
  // Deux copies suffisent tant que l'écran est plus étroit qu'un motif.
  // Au-delà, un vide apparaît en fin de cycle : on clone jusqu'à couvrir
  // l'écran, et on ne décale que d'une longueur de motif.
  var track = document.querySelector('.marquee-track');
  if (track && track.children.length) {
    var unit = track.children[0];
    var unitW = unit.getBoundingClientRect().width;

    if (unitW > 0) {
      var needed = Math.max(window.innerWidth, screen.width || 0) + unitW;
      var guard = 24; // garde-fou contre toute boucle infinie
      while (track.scrollWidth < needed && guard--) {
        track.appendChild(unit.cloneNode(true));
      }
      track.style.setProperty('--marquee-shift', unitW + 'px');
      track.style.animationDuration = (unitW / 27) + 's'; // ~27 px/s, vitesse constante
    }
  }

  /* ---------- 6. Vidéo du hero ---------- */
  var heroVideo = document.querySelector('.arch-video');

  // Connexion lente ou mode économie de données : on garde le poster.
  // 2,4 Mo en 3G coûteraient plus que la vidéo n'apporte.
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var frugal = !!(conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '')));

  if (heroVideo) {
    if (reduced || frugal) {
      heroVideo.removeAttribute('autoplay');
      heroVideo.pause();
      heroVideo.removeAttribute('src');
      heroVideo.load();
      if (frugal) heroVideo.style.display = 'none'; // l'arche retombe sur 01-hero.png
    } else {
      // iOS refuse la lecture auto en mode économie d'énergie : on tente,
      // et en cas de refus le poster reste affiché. Jamais d'erreur console.
      var heroVisible = true;
      var tryPlay = function () {
        var p = heroVideo.play();
        if (p && p.catch) p.catch(function () {});
      };
      tryPlay();

      // Ouverte dans un onglet d'arrière-plan, la lecture est refusée par le
      // navigateur : on retente dès que l'onglet revient au premier plan.
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden && heroVisible) tryPlay();
      });

      // Hors écran, on met en pause : batterie et données préservées sur mobile.
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            heroVisible = entry.isIntersecting;
            if (heroVisible) tryPlay();
            else heroVideo.pause();
          });
        }, { threshold: 0.1 }).observe(heroVideo);
      }
    }
  }

  /* ---------- 7. Formulaire de réservation ---------- */
  var form = document.getElementById('rdvForm');
  var success = document.getElementById('rdvSuccess');
  var resetBtn = document.getElementById('resetBtn');

  // Les champs sont préfixés « f- » : sans cela, l'id « cours » entrerait
  // en collision avec l'ancre <section id="cours">.
  var fields = {
    nom:   document.getElementById('f-nom'),
    tel:   document.getElementById('f-tel'),
    cours: document.getElementById('f-cours'),
    date:  document.getElementById('f-date'),
    heure: document.getElementById('f-heure'),
    message: document.getElementById('f-message')
  };

  // Date minimale = aujourd'hui
  function todayISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var j = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + j;
  }
  fields.date.min = todayISO();

  var PHONE_RE = /^(\+213|00213|0)(5|6|7)\d{8}$/;

  function setError(key, message) {
    var input = fields[key];
    var box = document.getElementById('err-' + key);
    if (message) {
      input.classList.add('invalid');
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', 'err-' + key);
      box.textContent = message;
      box.classList.add('show');
    } else {
      input.classList.remove('invalid');
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
      box.textContent = '';
      box.classList.remove('show');
    }
  }

  function clearErrors() {
    ['nom', 'tel', 'cours', 'date', 'heure'].forEach(function (k) { setError(k, ''); });
  }

  // On efface l'erreur dès que la cliente corrige le champ
  ['nom', 'tel', 'cours', 'date', 'heure'].forEach(function (k) {
    fields[k].addEventListener('input', function () {
      if (fields[k].classList.contains('invalid')) setError(k, '');
    });
    fields[k].addEventListener('change', function () {
      if (fields[k].classList.contains('invalid')) setError(k, '');
    });
  });

  function validate() {
    var errors = [];
    clearErrors();

    var nom = fields.nom.value.trim();
    if (nom.length < 3) {
      setError('nom', 'Merci d’indiquer votre nom complet (3 caractères minimum).');
      errors.push('nom');
    }

    var tel = fields.tel.value.replace(/[\s.\-]/g, '');
    if (!tel) {
      setError('tel', 'Merci d’indiquer votre numéro de téléphone.');
      errors.push('tel');
    } else if (!PHONE_RE.test(tel)) {
      setError('tel', 'Numéro algérien invalide — exemple : 05 50 12 34 56.');
      errors.push('tel');
    }

    if (!fields.cours.value) {
      setError('cours', 'Merci de choisir un cours.');
      errors.push('cours');
    }

    if (!fields.date.value) {
      setError('date', 'Merci de choisir une date.');
      errors.push('date');
    } else if (fields.date.value < todayISO()) {
      setError('date', 'Merci de choisir une date à partir d’aujourd’hui.');
      errors.push('date');
    }

    if (!fields.heure.value) {
      setError('heure', 'Merci de choisir un créneau.');
      errors.push('heure');
    }

    return errors;
  }

  function formatDateFR(value) {
    var parts = value.split('-');
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  function replay(el) {
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
  }

  window.__demoReservations = window.__demoReservations || [];

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var errors = validate();
    if (errors.length) {
      fields[errors[0]].focus();
      return;
    }

    var demande = {
      ref: 'BE-' + Math.floor(1000 + Math.random() * 9000),
      nom: fields.nom.value.trim(),
      tel: fields.tel.value.trim(),
      cours: fields.cours.value,
      date: fields.date.value,
      heure: fields.heure.value,
      message: fields.message.value.trim(),
      statut: 'En attente d’appel',
      recuLe: new Date().toISOString()
    };

    window.__demoReservations.push(demande);
    console.info('[DÉMO] Nouvelle demande de RDV → dashboard admin :', demande);

    // Passerelle vers /admin : la demande est déposée dans une petite file
    // que le tableau de bord relève toutes les deux secondes. C'est ce qui
    // permet de montrer la demande arriver en direct pendant une réunion.
    try {
      var file = JSON.parse(localStorage.getItem('be_reservations') || '[]');
      if (!Array.isArray(file)) file = [];
      file.push(demande);
      localStorage.setItem('be_reservations', JSON.stringify(file));
    } catch (e) { /* stockage indisponible : la démo reste utilisable */ }

    // Panneau de confirmation
    var prenom = demande.nom.split(/\s+/)[0];
    document.getElementById('successRef').textContent = 'Demande n° ' + demande.ref;
    document.getElementById('successTitle').textContent = 'Merci, ' + prenom + ' !';

    var recap = document.getElementById('successRecap');
    recap.textContent = '';
    [
      ['Cours', demande.cours],
      ['Date', formatDateFR(demande.date)],
      ['Créneau', demande.heure],
      ['Téléphone', demande.tel]
    ].forEach(function (row) {
      var dt = document.createElement('dt');
      var dd = document.createElement('dd');
      dt.textContent = row[0];
      dd.textContent = row[1];
      recap.appendChild(dt);
      recap.appendChild(dd);
    });

    form.hidden = true;
    success.hidden = false;

    if (!reduced) {
      success.querySelectorAll('.check circle, .check path').forEach(replay);
    }

    success.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start'
    });
  });

  resetBtn.addEventListener('click', function () {
    form.reset();
    clearErrors();
    fields.date.min = todayISO();
    success.hidden = true;
    form.hidden = false;
    fields.nom.focus({ preventScroll: true });
  });

})();
