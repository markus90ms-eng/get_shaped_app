# Foto-Analyse-Backend (Cloudflare Worker)

Die App schickt 1–2 Mahlzeitenfotos an diesen Worker. Der Worker fragt ein Vision-Modell der Anthropic-API nach den erkannten Lebensmitteln und geschätzten Gramm-Mengen und gibt nur diese Liste zurück. **Die Nährwerte berechnet die App danach selbst** aus deiner Lebensmitteltabelle – das Modell erfindet keine Kalorien.

## Einrichtung (einmalig, ca. 10 Minuten)

1. Kostenloses Cloudflare-Konto anlegen und einen Anthropic-API-Schlüssel erstellen (console.anthropic.com).
2. Im Ordner `worker/`:
   ```
   npx wrangler login
   npx wrangler secret put ANTHROPIC_API_KEY     # deinen API-Schlüssel einfügen
   npx wrangler secret put APP_TOKEN             # eine lange zufällige Zeichenfolge, z. B. aus einem Passwortmanager
   npx wrangler deploy
   ```
   Die ausgegebene Adresse (`https://get-shaped-photo.<name>.workers.dev`) brauchst du gleich.
3. In der App unter **Einstellungen**:
   - „Optionale Foto-KI“ → **Zugangscode** = dein `APP_TOKEN`
   - „Foto-Analyse (Backend)“ → **Backend-Adresse** = die Worker-Adresse

## Sicherheit
- Der API-Schlüssel liegt nur als Worker-Secret. Er steht nie im Repo, in der App oder im Browser.
- Der Worker akzeptiert nur Anfragen von `ALLOWED_ORIGIN` (in `wrangler.toml`) mit gültigem `X-App-Token`.
- Bilder werden nicht gespeichert oder protokolliert. Sie gehen an die Anthropic-API.
- Pro Analyse entstehen API-Kosten. Setze in der Anthropic-Console ein Monatslimit.

## Test
`node worker/test.mjs` prüft Zugriffsschutz, Eingabeprüfung und Antwortformat gegen einen simulierten Upstream (kein Netzwerk, kein Schlüssel nötig).
