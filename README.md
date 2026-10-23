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

Die automatische KI-Fotoerkennung erfordert ein separates, gesichertes Backend. Niemals einen API-Schlüssel in die Webseite oder GitHub hochladen. Fotos liefern keine zuverlässigen Gramm- oder Kalorienmesswerte.
