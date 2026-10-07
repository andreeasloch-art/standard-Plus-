/* ============================================================
   Standard Plus - Autovervollstaendigung
   ------------------------------------------------------------
   Eine wiederverwendbare Komponente fuer alle Suchfelder.
   - Vorschlaege kommen aus SP.db, nichts verlaesst den Browser
   - Ausgabe ueber textContent, kein innerHTML (kein XSS-Weg)
   - Tastaturbedienung und ARIA nach dem Combobox-Muster
   - umlaut- und akzenttolerant (Timisoara findet Timișoara)
   ============================================================ */
(function (w, d) {
  'use strict';
  var SP = w.SP;

  /* ---------- Vergleichsform: Kleinschreibung ohne Umlaute und Akzente ---------- */
  /* Vergleichsform: Kleinschreibung, keine Umlaute, keine Akzente.
     Die Umschreibungen ue/oe/ae werden ebenfalls aufgeloest - und zwar
     auf beiden Seiten des Vergleichs. So findet "Muenchen" auch
     "München", ohne dass die Trefferlogik doppelt gefuehrt werden muss. */
  function norm(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');
  }

  /* Fuer das Hervorheben muss die Vergleichsform genauso lang bleiben wie
     das Original, sonst sitzt die Markierung an der falschen Stelle.
     Deshalb hier nur 1:1-Ersetzungen, ohne ue/oe/ae aufzuloesen. */
  function normLage(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 's')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /* ---------- Treffer im Text hervorheben, ohne innerHTML ---------- */
  function mitTreffer(text, begriff) {
    var wrap = d.createDocumentFragment();
    var i = normLage(text).indexOf(normLage(begriff));
    if (!begriff || i < 0) {
      wrap.appendChild(d.createTextNode(text));
      return wrap;
    }
    var ende = i + begriff.length;
    wrap.appendChild(d.createTextNode(text.slice(0, i)));
    var mark = d.createElement('mark');
    mark.className = 'ac-treffer';
    mark.textContent = text.slice(i, ende);
    wrap.appendChild(mark);
    wrap.appendChild(d.createTextNode(text.slice(ende)));
    return wrap;
  }

  /* ============================================================
     SP.autocomplete(feld, einstellungen)
       quelle      Funktion, liefert [{typ, text, zusatz, ziel, icon}]
       min         ab wie vielen Zeichen gesucht wird (Standard 1)
       max         wie viele Vorschlaege hoechstens (Standard 8)
       aufAuswahl  Funktion(eintrag) - was beim Auswaehlen passiert
       liste       true bei Feldern mit mehreren Werten (Komma oder
                   Zeilenumbruch). Dann wird nur der zuletzt getippte
                   Abschnitt gesucht und ersetzt.
       trenner     Trennzeichen im Listenmodus, Standard ", "
       wort        true bei Freitextfeldern (ganze Saetze). Dann wird
                   nur das zuletzt getippte Wort gesucht und ersetzt.
     ============================================================ */
  SP.autocomplete = function (feld, einstellungen) {
    if (!feld) return;
    var opt = einstellungen || {};
    var min = opt.min == null ? 1 : opt.min;
    var max = opt.max || 8;
    var liste_modus = opt.liste === true;
    var wort_modus = opt.wort === true;
    var trenner = opt.trenner || ', ';
    /* Bei Zeilenlisten darf ein Komma im Text nicht als Trenner gelten. */
    var teilen = trenner.indexOf('\n') > -1 ? /\n/ : /[,\n]/;

    /* Im Listenmodus zaehlt nur der Abschnitt hinter dem letzten Trenner. */
    function abschnitt() {
      if (wort_modus) {
        var w = feld.value.split(/[\s]+/);
        return w[w.length - 1];
      }
      if (!liste_modus) return feld.value;
      var teile = feld.value.split(teilen);
      return teile[teile.length - 1];
    }
    function abschnittSetzen(wert) {
      if (wort_modus) {
        var w = feld.value.split(/[\s]+/);
        w[w.length - 1] = wert;
        feld.value = w.join(' ') + ' ';
        feld.focus();
        return;
      }
      if (!liste_modus) { feld.value = wert; return; }
      var teile = feld.value.split(teilen).map(function (t) { return t.trim(); });
      teile[teile.length - 1] = wert;
      feld.value = teile.filter(Boolean).join(trenner) + trenner;
      feld.focus();
    }

    /* Der umgebende Container muss positioniert sein */
    var huelle = feld.closest('.inp-wrap') || feld.closest('.searchbox') || feld.parentNode;
    huelle.classList.add('ac-wrap');

    var liste = d.createElement('ul');
    liste.className = 'ac-liste';
    liste.id = 'ac-' + (feld.id || Math.random().toString(36).slice(2, 7));
    liste.setAttribute('role', 'listbox');
    liste.hidden = true;
    huelle.appendChild(liste);

    var status = d.createElement('p');
    status.className = 'hp';
    status.setAttribute('aria-live', 'polite');
    huelle.appendChild(status);

    feld.setAttribute('role', 'combobox');
    feld.setAttribute('aria-autocomplete', 'list');
    feld.setAttribute('aria-expanded', 'false');
    feld.setAttribute('aria-controls', liste.id);
    feld.setAttribute('autocomplete', 'off');

    var treffer = [];
    var aktiv = -1;

    function schliessen() {
      liste.hidden = true;
      liste.replaceChildren();
      feld.setAttribute('aria-expanded', 'false');
      feld.removeAttribute('aria-activedescendant');
      aktiv = -1;
    }

    function markieren(i) {
      Array.prototype.forEach.call(liste.children, function (li, k) {
        li.classList.toggle('an', k === i);
        li.setAttribute('aria-selected', String(k === i));
      });
      if (i >= 0 && liste.children[i]) {
        feld.setAttribute('aria-activedescendant', liste.children[i].id);
        liste.children[i].scrollIntoView({ block: 'nearest' });
      } else {
        feld.removeAttribute('aria-activedescendant');
      }
      aktiv = i;
    }

    function auswaehlen(i) {
      var e = treffer[i];
      if (!e) return;
      abschnittSetzen(e.text);
      schliessen();
      SP.audit('Suchvorschlag gewählt', e.typ + ': ' + e.text);
      if (opt.aufAuswahl) opt.aufAuswahl(e);
      else if (e.ziel) w.location.href = e.ziel;
    }

    function zeichnen(begriff) {
      liste.replaceChildren();
      treffer.forEach(function (e, i) {
        var li = d.createElement('li');
        li.className = 'ac-eintrag';
        li.id = liste.id + '-' + i;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', 'false');

        if (e.icon) {
          var ic = SP.icon(e.icon, 'ic-sm');
          ic.classList.add('ac-icon');
          li.appendChild(ic);
        }

        var text = d.createElement('span');
        text.className = 'ac-text';
        var haupt = d.createElement('span');
        haupt.className = 'ac-haupt';
        haupt.appendChild(mitTreffer(e.text, begriff));
        text.appendChild(haupt);
        if (e.zusatz) {
          var zus = d.createElement('span');
          zus.className = 'ac-zusatz';
          zus.textContent = e.zusatz;
          text.appendChild(zus);
        }
        li.appendChild(text);

        if (e.typ) {
          var typ = d.createElement('span');
          typ.className = 'ac-typ';
          typ.textContent = SP.t(e.typ);   /* Art bleibt intern deutsch, Anzeige uebersetzt */
          li.appendChild(typ);
        }

        /* mousedown statt click: sonst schliesst das blur die Liste vorher */
        li.addEventListener('mousedown', function (ev) { ev.preventDefault(); auswaehlen(i); });
        liste.appendChild(li);
      });

      liste.hidden = false;
      feld.setAttribute('aria-expanded', 'true');
      status.textContent = treffer.length === 1
        ? SP.t('Ein Vorschlag verfügbar.')
        : SP.t('{n} Vorschläge verfügbar.', { n: treffer.length });
      markieren(-1);
    }

    function suchen() {
      var begriff = SP.clean(abschnitt(), 80).trim();
      if (begriff.length < min) { schliessen(); return; }

      var alle = opt.quelle ? opt.quelle() : [];
      var n = norm(begriff);

      /* Treffer am Wortanfang zuerst, dann Treffer im Wort */
      var anfang = [], drin = [];
      alle.forEach(function (e) {
        var nt = norm(e.text), nz = norm(e.zusatz || '');
        if (nt.indexOf(n) === 0) anfang.push(e);
        else if (nt.indexOf(n) > 0 || nz.indexOf(n) > -1) drin.push(e);
      });

      /* Doppelte Eintraege entfernen */
      var gesehen = {};
      treffer = anfang.concat(drin).filter(function (e) {
        var k = e.typ + '|' + e.text;
        if (gesehen[k]) return false;
        gesehen[k] = true;
        return true;
      }).slice(0, max);

      if (!treffer.length) { schliessen(); return; }
      zeichnen(begriff);
    }

    var warte = null;
    feld.addEventListener('input', function () {
      clearTimeout(warte);
      warte = setTimeout(suchen, 120);
    });
    feld.addEventListener('focus', function () { if (abschnitt().trim().length >= min) suchen(); });
    feld.addEventListener('blur', function () { setTimeout(schliessen, 120); });

    feld.addEventListener('keydown', function (ev) {
      if (liste.hidden) {
        if (ev.key === 'ArrowDown') { suchen(); ev.preventDefault(); }
        return;
      }
      if (ev.key === 'ArrowDown') { ev.preventDefault(); markieren((aktiv + 1) % treffer.length); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); markieren((aktiv - 1 + treffer.length) % treffer.length); }
      else if (ev.key === 'Enter') {
        if (aktiv >= 0) { ev.preventDefault(); auswaehlen(aktiv); }
      }
      else if (ev.key === 'Escape') { ev.preventDefault(); schliessen(); }
      else if (ev.key === 'Tab') { schliessen(); }
    });
  };

  /* ============================================================
     Vorschlagsquellen aus der Datenbank
     ============================================================ */
  var BRANCHEN_ICON = {
    pflege: 'health', bau: 'helmet', it: 'code', gastro: 'utensils',
    logistik: 'truck', produktion: 'factory', buero: 'office'
  };

  SP.suchquellen = {

    /* Berufe, Kenntnisse, Orte und Laender der Bewerberprofile */
    talente: function (betrachterId) {
      return function () {
        var v = [];
        SP.db.profile.arbeitnehmer(betrachterId).forEach(function (p) {
          if (p.beruf) v.push({ typ: 'Beruf', text: SP.tInhalt(p.beruf), icon: 'briefcase',
            zusatz: SP.db.BRANCHEN[p.branche] || '' });
          (p.faehigkeiten || []).forEach(function (f) {
            v.push({ typ: 'Kenntnis', text: SP.tInhalt(f), icon: 'check' });
          });
          if (p.ort) v.push({ typ: 'Ort', text: SP.tInhalt(p.ort), icon: 'pin',
            zusatz: p.land || '' });
        });
        Object.keys(SP.db.BRANCHEN).forEach(function (k) {
          v.push({ typ: 'Branche', text: SP.db.BRANCHEN[k], icon: BRANCHEN_ICON[k] || 'grid' });
        });
        return v;
      };
    },

    /* Firmen, Orte und Branchen der Unternehmensprofile */
    unternehmen: function (betrachterId) {
      return function () {
        var v = [];
        SP.db.profile.arbeitgeber(betrachterId).forEach(function (p) {
          if (p.firma) v.push({ typ: 'Unternehmen', text: p.firma, icon: 'building',
            zusatz: [SP.db.BRANCHEN[p.branche], SP.tInhalt(p.ort)].filter(Boolean).join(' · ') });
          if (p.ort) v.push({ typ: 'Ort', text: SP.tInhalt(p.ort), icon: 'pin' });
        });
        Object.keys(SP.db.BRANCHEN).forEach(function (k) {
          v.push({ typ: 'Branche', text: SP.db.BRANCHEN[k], icon: BRANCHEN_ICON[k] || 'grid' });
        });
        return v;
      };
    },

    /* Gesamtsuche im Arbeitsbereich: Profile, Stellen, Unternehmen, Berufe */
    global: function (betrachterId) {
      return function () {
        var v = [];

        SP.db.profile.arbeitnehmer(betrachterId).forEach(function (p) {
          v.push({
            typ: 'Profil', icon: 'user',
            text: SP.db.profile.anzeigename(p),
            zusatz: [SP.tInhalt(p.beruf), SP.tInhalt(p.ort)].filter(Boolean).join(' · '),
            ziel: 'standardplus-profil-ansicht.html?id=' + encodeURIComponent(p.kontoId)
          });
          if (p.beruf) v.push({ typ: 'Beruf', icon: 'briefcase', text: SP.tInhalt(p.beruf),
            ziel: 'standardplus-talente.html?q=' + encodeURIComponent(SP.tInhalt(p.beruf)) });
          (p.faehigkeiten || []).forEach(function (f) {
            v.push({ typ: 'Kenntnis', icon: 'check', text: SP.tInhalt(f),
              ziel: 'standardplus-talente.html?q=' + encodeURIComponent(SP.tInhalt(f)) });
          });
        });

        SP.db.profile.arbeitgeber(betrachterId).forEach(function (p) {
          v.push({
            typ: 'Unternehmen', icon: 'building', text: p.firma,
            zusatz: [SP.db.BRANCHEN[p.branche], SP.tInhalt(p.ort)].filter(Boolean).join(' · '),
            ziel: 'standardplus-profil-ansicht.html?id=' + encodeURIComponent(p.kontoId)
          });
        });

        SP.db.stellen.liste().forEach(function (s) {
          var ag = SP.db.profile.holen(s.arbeitgeberId);
          v.push({
            typ: 'Stelle', icon: 'briefcase', text: SP.tInhalt(s.titel),
            zusatz: [ag && ag.firma, SP.tInhalt(s.ort), SP.tInhalt(s.verguetung)].filter(Boolean).join(' · '),
            ziel: 'standardplus-profil-ansicht.html?id=' + encodeURIComponent(s.arbeitgeberId)
          });
        });

        Object.keys(SP.db.BRANCHEN).forEach(function (k) {
          v.push({ typ: 'Branche', icon: BRANCHEN_ICON[k] || 'grid', text: SP.db.BRANCHEN[k],
            ziel: 'standardplus-talente.html?q=' + encodeURIComponent(SP.db.BRANCHEN[k]) });
        });

        return v;
      };
    }
  };

})(window, document);
