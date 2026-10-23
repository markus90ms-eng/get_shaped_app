# Get Shaped – mobile Ernährungs- und Bewegungs-App

Öffne die Web-App: https://markus90ms-eng.github.io/get_shaped_app/

## Tagesarten und Aktivitätsbilanz (Update)

- Ruhetag / Bürotag: **1.550–1.700 kcal**
- Moderater Tag: **1.650–1.850 kcal**
- Trainingstag: **1.800–2.000 kcal**
- Die App wählt die Tagesart anhand der erfassten Trainingseinheiten automatisch oder auf Wunsch manuell. Die Bereiche sind unter Einstellungen anpassbar.
- Getrennte Anzeige von **gegessenen kcal**, **grob geschätztem zusätzlichen Aktivitätsverbrauch** (über Ruhe) und der **rechnerischen Nettoaufnahme** (Essen minus Aktivitätskalorien). Diese Anzeige ist KEIN nachgewiesenes Kaloriendefizit.
- Der höhere Kalorienrahmen an Trainingstagen berücksichtigt typische Aktivität bereits; deshalb werden Aktivitätskalorien **nicht zusätzlich zum Tagesrahmen addiert**. Standard-Haushalt, Sauna und Schritte ohne Zeit erhalten keinen zusätzlichen Kalorienbonus.
- Mahlzeiten lassen sich mit einem Hauptfoto und optional einer Seitenansicht erfassen. **iPhone-LiDAR-Tiefendaten lassen sich in Safari nicht direkt auslesen.**

## Datenschutz und private Historie

Die öffentliche GitHub-Pages-App enthält keine privaten Tagebuchdaten. Diese bleiben im Browser (localStorage/IndexedDB). Nach einem Update bleiben bestehende Einträge im selben Browser erhalten. Die ursprüngliche private JSON-Datei **nicht erneut importieren**, wenn danach schon neue Einträge erfasst wurden: Ein Import ersetzt den aktuellen Verlauf! Regelmäßig unter **Verlauf → JSON-Backup** die aktuelle Historie einschließlich Fotos sichern.

## Installation

GitHub Pages: **Settings → Pages → Deploy from a branch → main → /(root)**. Auf dem iPhone die App in Safari öffnen und über **Teilen → Zum Home-Bildschirm** ablegen.

Die automatische Foto-Erkennung braucht ein eigenes, gesichertes Backend (Anleitung: `worker/README.md`). Niemals einen API-Schlüssel in die Webseite oder GitHub hochladen. Fotos liefern keine zuverlässigen Gramm- oder Kalorienmesswerte.

## Funktionen im Überblick

| Bereich | Was die App kann |
| --- | --- |
| Erfassen | Freitext/Diktat, Foto, **Barcode-Scan** (Kamera, Foto oder Nummer; Open Food Facts), Schnellvorlage mit allen Einzel-Lebensmitteln (⭐ häufig genutzt, ★ Favoriten), Mahlzeiten wiederverwenden (inkl. Favoriten) |
| Erkennung | Eigener Lebensmittelkatalog (JSON-Import), Verlauf, Presets, Tippfehler-Toleranz (`foodindex.js`) |
| Bilanz | Kalorien, Protein, Fett, KH, **Ballaststoffe (Schätzung)**, **Wasser** |
| Verlauf | **Wochenansicht**, **Gewicht/Taille/Oberschenkel** mit 7-Tage-Schnitt, Archiv |
| Bewegung | Standardarten plus **eigene Arten** (Kalorien-Richtwerte für gängige Sportarten) |
| Daten | JSON-Backup (zusammenführend), **verschlüsseltes Backup** (AES-GCM), CSV, Backup-Erinnerung |
| Komfort | Dunkelmodus, **Apple-Health-Import per Kurzbefehl** (`#health?weight=…&steps=…&sleep=…`) |

Alle Daten bleiben im Browser (localStorage/IndexedDB). Es gibt keinen Server und keine Synchronisierung.

## Entwicklung

- Jede Funktion liegt in einer eigenen Datei und hängt sich in die bestehende `index.html` ein; neue Dateien werden in `index.html` eingebunden und in `sw.js` (Offline-Cache, Cache-Version erhöhen) eingetragen.
- Tests: `npm test` (Lebensmittelerkennung, Ballaststoffe, Foto-Backend). Die Tests nutzen nur synthetische Daten.
- Der Barcode-Leser nutzt die mitgelieferte Bibliothek `vendor/zxing.min.js` (ZXing, Apache-2.0), damit die App ohne CDN auskommt.

## Bewusste Grenzen

- **LiDAR / Tiefendaten:** In Safari nicht auslesbar. Für echte Volumenmessung wäre eine native iOS-App (ARKit `sceneDepth`) nötig; auch dann sind Gewichte nur grobe Schätzungen (Dichte und versteckte Zutaten sind unsichtbar). Die Foto-Analyse nutzt stattdessen zwei Ansichten plus Referenzobjekt.
- **Push-Erinnerungen** brauchen einen Push-Server und sind in dieser reinen Offline-App nicht enthalten.
- Ballaststoffe sind Richtwerte aus Tabellen, keine Messwerte.
