# Get Shaped – iPhone-freundliche Web-App (GitHub Pages)

Eine responsive Progressive Web App für Ernährung, Fotos, Makros, Bewegung, Maße und Tagesberichte.

## Installation auf GitHub Pages

1. Den **Inhalt** des bereitgestellten ZIP-Archivs in das öffentliche GitHub-Repository `markus90ms-eng/get_shaped_app` in den Root von `main` hochladen (oder per Git committen). `index.html` muss auf oberster Ebene liegen.
2. Im GitHub-Repository **Settings → Pages → Build and deployment** öffnen und **Deploy from a branch** auswählen. Branch **main**, Ordner **/(root)** und **Save**.
3. Nach dem Deployment sollte die App unter `https://markus90ms-eng.github.io/get_shaped_app/` erreichbar sein. Bei einem Fehler unter **Actions** den Deploy-Status prüfen.
4. Auf dem iPhone den Link mit **Safari** öffnen → **Teilen** → **Zum Home-Bildschirm**.

## Deine bisherigen Daten ohne erneute Eingabe

**Die Datei `Get_Shaped_PRIVATE_Tracking_Import.json` NICHT ins GitHub-Repository hochladen!** Sie enthält persönliche Ernährungs- und Körperdaten und wird nur privat aus dem Chat heruntergeladen.

Auf dem iPhone:

1. Private Importdatei in der iPhone-App **Dateien** speichern.
2. In Get Shaped **Verlauf → Backup wiederherstellen** auswählen.
3. Die private JSON-Datei auswählen und den Import bestätigen. Danach stehen die erfassten Tage, Maße und weiteren vorhandenen Informationen zur Verfügung.
4. Nicht erneut importieren, wenn du inzwischen neue Einträge angelegt hast: Der Import **ersetzt** die gespeicherten Tage. Sichere vorher ein JSON-Backup.

**Datenschutz:** GitHub Pages hostet ausschließlich den öffentlichen App-Code ohne deinen persönlichen Verlauf. Dein Tagebuch wird lokal im jeweiligen Browser gespeichert (localStorage und Fotos in IndexedDB). Ohne Benutzerkonto erfolgt keine Synchronisierung zwischen iPhone und anderen Geräten; mit Safari-/Browserdatenlöschung können Daten verschwinden. Nutze regelmäßig den JSON-Export (einschließlich gespeicherter Fotos), besonders vor Gerätewechseln. Das Repository ist öffentlich – keine privaten Dateien und keine API-Schlüssel hochladen.

## Funktionsumfang

- Lebensmittel, Portion, kcal, Protein, KH und Fett erfassen.
- Über Kamera oder Galerie Bilder zu Mahlzeiten speichern.
- Bewegungen, Training, Schritte und Körpermaße dokumentieren.
- Tagesberichte kopieren/teilen und in den bestehenden ChatGPT-Chat senden.
- Häufige Lebensmittel als öffentliche Nährwertvorlagen (Schätzwerte).
- Mobile PWA mit Offline-Cache; Daten lokal.

**Wichtig:** Automatische KI-Fotoanalyse ist in GitHub Pages allein **nicht** verfügbar. Dazu wäre ein getrennter, sicher betriebener Server nötig, der einen API-Schlüssel hält. Keinen API-Schlüssel in GitHub oder im Browser hinterlegen! Fotos allein können Portionsgrößen und versteckte Zutaten nicht zuverlässig bestimmen.

Die App ist ein Prototyp und keine medizinische Software. Ihr Kalorienziel ist eine Orientierungsgröße, kein Nachweis für ein physiologisches Defizit.