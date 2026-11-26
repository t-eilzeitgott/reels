# reels

Tägliche Studio-Reels für @talfahrt.dev, Version 1.5.0. Quelle ist seit 26.11. Talfahrt Studio 3.9 (Artefakt 08f25725-c038-454b-a787-e3586eea441a; neu in 3.9: zähe Bänder, das goldene Band, das Duell Blau gegen Orange und der Serienrahmen mit Tag und Rekord; neu in 3.8: Kaleidoskop, Mond, Brennpunkt, Domino, Pendelwelle, Sortieren, Passt) mit ruhigem Klang: nur kleine Geräusche, eigenes Reiß-Geräusch bei den Bändern, auf Wunsch eine bekannte Melodie. Bis 26.11. war es Studio 3.3 (Artefakt e9925525-c709-464f-8de1-1c1ce1a1c3e0).

- `render.mjs` rendert headless ein Video aus dem Talfahrt Studio. Mit `VARIANT=<id>` eine feste Variante aus `variants.json`, sonst ein zufälliges Preset (gewichtet: Bänder, Presse und Klingen vor dem Rest). `PREVIEW=1` rendert schnell in 720p30.
- `variants.json` enthält die kuratierten Varianten (Studio-Preset plus Einstellungen, Szene und Hashtags für die Caption, Feiertags-Varianten). Seit 1.3.0 dazu die Bänder-Vorlagen aus Studio 3.3: Countdown, Ziel erreicht, Wucht, Riesenkugel, Neon.
- `plan.json` ist der Indien-Test ab 25.11.2026: vier Uhrzeiten (A 09:41, B 12:41, C 14:41, D 16:41 deutscher Zeit, in Indien 4,5 Stunden später) und wechselnde Varianten, ab 26.11. nur noch Bänder. Vom 27.11. bis 1.12. pausiert der Test für die Bänder-Serie (siehe unten), danach laufen die restlichen sieben Testtage vom 2.12. bis 8.12. Am 9.12. wählt die tägliche Aufgabe die beste Uhrzeit und die drei besten Varianten und schreibt sie nach `result`.
- `check.sh` prüft Länge, Format, Ton und Dekodierbarkeit und schreibt ein Kontaktbild.
- `serie.sh <Datum> <out.mp4>` (seit 1.5.0) holt das fertige Video eines Serientags vom Branch `serie-<Tag>`, prüft die Prüfsumme aus `plan.json` und gibt den Eintrag des Tages aus (Caption, Vorschaubild-Zeit, öffentliche URL). Kein Serientag: Exit 3.
- `drop.sh` legt das fertige Video als einzige Datei auf den Branch `drop`, von dem Instagram es abholt. Der Branch wird jeden Tag ersetzt, das Repo wächst also nicht.
- `history.jsonl` hält fest, was wann gepostet wurde (mit Uhrzeit, Slot und Variante).
- `extra.jsonl` (seit 1.3.1) hält Extra-Posts fest, die Jerome außer der Reihe wollte. Die tägliche Aufgabe liest diese Datei nicht: Ein Extra-Post zählt nicht als Tagespost (sie postet am selben Tag trotzdem) und fließt nicht in Messung und Auswertung ein.
- `stats.jsonl` sammelt bei jedem Lauf die Zahlen der Reels der letzten zehn Tage (Aufrufe, Reichweite, Wiedergabezeit, Absprungrate), daraus kommen die 24-Stunden-Werte für die Auswertung.
- `yt/` (seit 1.4.0): lange YouTube-Videos im Querformat, eine Stunde, zweimal pro Woche (siehe `yt/README.md`). Quelle ist dasselbe Studio 3.8.

## Bänder-Serie (27.11. bis 1.12.2026)

Die Bänder sind das Einzige, was auf Instagram wirklich zieht. Damit nicht jeden Tag dasselbe Video läuft, erzählen fünf Videos eine kleine Geschichte, jeden Tag um 09:41 eins (`plan.json` → `series`):

| Tag | Datum | Variante | Was passiert |
| --- | --- | --- | --- |
| 1 | 27.11. | `serie1` | Duell Blau gegen Orange, sechs Führungswechsel, Blau gewinnt: 1:0 |
| 2 | 28.11. | `serie2` | Goldenes Band vor dem letzten Block hält zwei Treffer aus, für den dritten läuft die Uhr ab |
| 3 | 29.11. | `serie3` | Duell, Orange gleicht aus: 1:1 |
| 4 | 30.11. | `serie4` | Das goldene Band reißt beim dritten Treffer, 2048 erreicht: NEW RECORD |
| 5 | 1.12. | `serie5` | Finale, bei beiden hängt ein goldenes Band, Orange gewinnt: 1:2 |

- Die Videos sind fertig gerendert (Studio 3.9, 1080p60, 32 s) und liegen einzeln auf den Branches `serie-1` bis `serie-5`. Die tägliche Aufgabe postet genau diese Dateien und rendert an Serientagen nicht neu, weil Sieger, Spielstand und Rekord aufeinander aufbauen.
- Jede Variante legt Seed und Einstellungen fest: `VARIANT=serie3 node render.mjs index.html out.mp4` ergibt wieder dasselbe Video.
- Captions bleiben beim einfachen Muster mit dem Tag davor, zum Beispiel „Day 1: Satisfying Slice Ball Race until 2048“.
- Serien-Reels werden wie alle anderen gemessen (`stats.jsonl`), zählen aber nicht in der Auswertung von Uhrzeit und Variante. In `history.jsonl` tragen sie das Feld `series` (Tag 1 bis 5). Am 2.12. schickt die Aufgabe eine kurze Bilanz der Serie.
- Im Studio: Vorlagen „Duell“, „Duell: goldenes Band“, „Bänder: Endgegner“, „Bänder: Endgegner hält“ und „Bänder: zähe Bänder“; die Einstellungen stehen unter „duell“ und „serie“.

