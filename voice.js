/* Get Shaped – Spracheingabe: nativer iPhone-Diktatpfad plus optional Web Speech */
(() => {
  'use strict';
  const box = document.getElementById('quickSpeech');
  const primary = document.getElementById('startVoice');
  const browserBtn = document.getElementById('voiceBrowser');
  const keyboardBtn = document.getElementById('voiceKeyboard');
  const status = document.getElementById('voiceStatus');
  const help = document.getElementById('speechHelp');
  if (!box || !primary || !browserBtn || !keyboardBtn || !status) return;

  const ua = navigator.userAgent || '';
  const ios = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const constructor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supportsBrowser = typeof constructor === 'function';
  const keyboardInstructions = 'Tippe auf das Mikrofon unten auf deiner iPhone-Tastatur, sprich deine Mahlzeit und wähle anschließend „Angaben übernehmen“. Wenn das Tastatur-Mikrofon fehlt: iPhone-Einstellungen → Allgemein → Tastatur → Diktierfunktion aktivieren.';

  let recognizer = null;
  let watchdog = 0;
  let hasResult = false;
  let started = false;
  let errorSeen = false;
  let initialText = '';
  function update(message, warning = false) {
    status.textContent = message;
    status.className = warning ? 'warnline' : 'hint';
  }
  function resetButton() {
    primary.disabled = false;
    browserBtn.disabled = false;
    if (!ios) primary.textContent = supportsBrowser ? '🎙 Browser-Diktat starten' : '⌨️ Eingabefeld öffnen';
    browserBtn.textContent = '🎙 Browser-Mikro testen';
  }
  function focusKeyboard() {
    if (recognizer) {
      try { recognizer.abort(); } catch (_) {}
      recognizer = null;
    }
    clearTimeout(watchdog);
    resetButton();
    box.focus();
    try { box.setSelectionRange(box.value.length, box.value.length); } catch (_) {}
    if (ios) update(keyboardInstructions);
    else update('Textfeld geöffnet. Nutze das Mikrofon deiner Bildschirmtastatur oder tippe deine Mahlzeit und danach auf „Angaben übernehmen“.');
  }
  function resetRecognition(rec) {
    if (recognizer !== rec) return;
    recognizer = null;
    clearTimeout(watchdog);
    resetButton();
  }
  function addText(transcript) {
    const t = String(transcript || '').trim();
    if (!t) return;
    box.value = (initialText ? initialText.replace(/\s+$/, '') + ' ' : '') + t;
    box.dispatchEvent(new Event('input', { bubbles: true }));
  }
  function browserDictation() {
    if (!supportsBrowser) return focusKeyboard();
    if (recognizer) {
      const old = recognizer;
      try { old.stop(); } catch (_) { resetRecognition(old); }
      update('Diktat wird beendet. Überprüfe den Text und tippe auf „Angaben übernehmen“.');
      return;
    }
    try {
      const rec = new constructor();
      recognizer = rec;
      hasResult = false;
      started = false;
      errorSeen = false;
      initialText = box.value.trim();
      rec.lang = 'de-DE';
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onstart = () => {
        if (recognizer !== rec) return;
        started = true;
        primary.textContent = '⏹ Diktat beenden';
        browserBtn.textContent = '⏹ Diktat beenden';
        update('Mikrofon wurde gestartet. Sprich jetzt deutlich deine Mahlzeit mit Mengenangabe.');
      };
      rec.onaudiostart = () => {
        if (recognizer === rec) update('Mikrofon aktiv – bitte jetzt sprechen.');
      };
      rec.onspeechstart = () => {
        if (recognizer === rec) update('Sprache erkannt – ich übernehme den Text …');
      };
      rec.onresult = event => {
        if (recognizer !== rec) return;
        let final = '', interim = '';
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const phrase = result?.[0]?.transcript || '';
          if (result.isFinal) final += phrase + ' ';
          else interim += phrase + ' ';
        }
        const speech = (final + interim).trim();
        if (speech) {
          hasResult = true;
          addText(speech);
          update('Text erkannt: „' + speech.slice(0,130) + (speech.length>130?'…':'') + '“. Danach „Angaben übernehmen“ tippen.');
        }
      };
      rec.onerror = event => {
        if (recognizer !== rec) return;
        errorSeen = true;
        const code = event?.error || 'unbekannt';
        const known = {
          'not-allowed':'Der Browser hat die Spracherkennung nicht freigegeben. Die normale Mikrofonfreigabe allein genügt nicht immer.',
          'service-not-allowed':'Der Spracherkennungsdienst wurde vom Browser blockiert.',
          'audio-capture':'Das Mikrofon konnte nicht verwendet werden.',
          'network':'Der Spracherkennungsdienst konnte nicht erreicht werden.',
          'no-speech':'Es wurde keine Sprache erkannt.',
          'aborted':'Die Erkennung wurde abgebrochen.',
          'language-not-supported':'Deutsch wird hier nicht unterstützt.'
        };
        update((known[code] || ('Spracherkennung fehlgeschlagen: ' + code)) + (ios ? ' Alternativ die iPhone-Tastatur-Diktierfunktion nutzen.' : ' Alternativ das Texteingabefeld verwenden.'), true);
      };
      rec.onend = () => {
        if (recognizer !== rec) return;
        if (!errorSeen) update(hasResult ? 'Diktat übernommen. Jetzt auf „Angaben übernehmen“ tippen.' : 'Keine Wörter erkannt. Versuche es erneut oder verwende das Tastatur-Mikrofon.', !hasResult);
        resetRecognition(rec);
      };
      update('Spracherkennung wird gestartet … Wenn Safari nicht antwortet, erscheint eine Alternative.');
      rec.start();
      // Safari kann nach Mikrofonfreigabe hängen: Status + kontrollierter Abbruch.
      watchdog = window.setTimeout(() => {
        if (recognizer !== rec || hasResult) return;
        update('Safari hat keine Sprache geliefert. Nutze bitte „Tastatur-Diktat öffnen“ und dort das Mikrofon der iPhone-Tastatur.', true);
        try { rec.abort(); } catch (_) {}
        resetRecognition(rec);
      }, 13000);
    } catch (error) {
      if (recognizer) { try { recognizer.abort(); } catch (_) {} }
      recognizer = null;
      resetButton();
      update('Browser-Diktat konnte nicht starten. ' + (error?.message || '') + ' Nutze die Diktierfunktion der Tastatur.', true);
    }
  }

  if (ios) {
    primary.textContent = '⌨️ iPhone-Diktat öffnen';
    browserBtn.classList.toggle('hidden', !supportsBrowser);
    keyboardBtn.classList.add('hidden');
    help.textContent = 'Die iPhone-Diktierfunktion befindet sich auf der Bildschirmtastatur. Das Browser-Mikro kann trotz Freigabe in Safari ausfallen.';
    update('Tippe auf „iPhone-Diktat öffnen“ und anschließend auf das Mikrofon der eingeblendeten Tastatur.');
    primary.onclick = focusKeyboard;
    browserBtn.onclick = browserDictation;
  } else {
    primary.textContent = supportsBrowser ? '🎙 Browser-Diktat starten' : '⌨️ Eingabefeld öffnen';
    browserBtn.classList.add('hidden');
    keyboardBtn.classList.remove('hidden');
    primary.onclick = supportsBrowser ? browserDictation : focusKeyboard;
    keyboardBtn.onclick = focusKeyboard;
    update(supportsBrowser ? 'Direktes Browser-Diktat verfügbar. Tippe auf Start und sprich deine Zutaten und Mengen.' : 'Browser-Diktat nicht verfügbar. Öffne das Eingabefeld und nutze gegebenenfalls die Tastatur-Diktierfunktion.');
  }
  box.addEventListener('input', () => {
    if (!recognizer && box.value.trim()) update('Text ist im Feld. Tippe jetzt auf „Angaben übernehmen“; die App versucht das Gericht und die Menge zu erkennen.');
  });
})();
